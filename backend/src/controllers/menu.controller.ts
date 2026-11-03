import fs from "node:fs/promises";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Category } from "../models/Category.js";
import { MenuItem } from "../models/MenuItem.js";
import { Order } from "../models/Order.js";
import { removeUploadedFile } from "../middleware/upload.middleware.js";
import { HttpError } from "../utils/httpError.js";
import { slugifyCategory } from "../utils/slugify.js";
import { SOCKET_EVENTS, SOCKET_ROOMS, MENU_ROOMS } from "../sockets/events.js";
import { emitTo } from "../sockets/io.js";

type CategoryLean = {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  sortOrder: number;
  active?: boolean;
};

type DishLean = {
  code: number;
  name: string;
  price: number;
  category: CategoryLean | mongoose.Types.ObjectId | null;
  description: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
  options?: { name: string; choices: string[] }[];
};

function mapDish(item: DishLean) {
  const cat =
    item.category && typeof item.category === "object" && "slug" in item.category
      ? item.category
      : null;
  return {
    id: item.code,
    name: item.name,
    price: item.price,
    category: cat?.slug ?? "",
    description: item.description,
    imageUrl: item.imageUrl ?? "",
    isAvailable: item.isAvailable !== false,
    ...(item.options?.length ? { options: item.options } : {}),
  };
}

function mapCategory(c: CategoryLean) {
  return {
    id: c.slug,
    label: c.name,
    sortOrder: c.sortOrder,
    active: c.active !== false,
  };
}

function parseName(value: unknown, label: string): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) throw new HttpError(400, `${label} es obligatorio`);
  return name;
}

function parsePrice(value: unknown): number {
  const price = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new HttpError(400, "El precio no es válido");
  }
  return Math.round(price * 100) / 100;
}

function parseCode(value: string): number {
  const code = Number(value);
  if (!Number.isInteger(code) || code < 1) {
    throw new HttpError(400, "Código de plato no válido");
  }
  return code;
}

async function findCategoryBySlug(slug: unknown) {
  if (typeof slug !== "string" || !slug.trim()) {
    throw new HttpError(400, "La categoría es obligatoria");
  }
  const category = await Category.findOne({ slug: slug.trim() });
  if (!category) {
    throw new HttpError(400, "Categoría no encontrada");
  }
  return category;
}

/**
 * Marca o limpia `soldOut` en las líneas de tickets que siguen en cocina.
 */
async function syncKitchenSoldOut(
  dishCode: number,
  soldOut: boolean,
): Promise<void> {
  await Order.updateMany(
    { status: "en_cocina", "items.dishCode": dishCode },
    { $set: { "items.$[line].soldOut": soldOut } },
    { arrayFilters: [{ "line.dishCode": dishCode }] },
  );
  emitTo([SOCKET_ROOMS.kitchen], SOCKET_EVENTS.ORDER_STATUS, {
    orderId: "",
    tableId: "",
    status: "en_cocina",
  });
}

async function nextDishCode(): Promise<number> {
  const last = await MenuItem.findOne().sort({ code: -1 }).select("code").lean();
  return (last?.code ?? 0) + 1;
}

/**
 * Lista categorías activas y platos para la carta.
 * Respuesta alineada al frontend: `{ categories, dishes }`.
 */
export async function getMenu(_req: Request, res: Response): Promise<void> {
  const [categories, items] = await Promise.all([
    Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    MenuItem.find().sort({ code: 1 }).populate("category").lean(),
  ]);

  res.json({
    categories: categories.map((c) => ({
      id: c.slug,
      label: c.name,
    })),
    dishes: items.map((item) => mapDish(item as DishLean)),
  });
}

/**
 * Lista todas las categorías (incluidas inactivas) para el backoffice.
 */
export async function listCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  const categories = await Category.find()
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  res.json({ categories: categories.map(mapCategory) });
}

/**
 * Crea una categoría de carta.
 */
export async function createCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const name = parseName(req.body?.name, "El nombre de la categoría");
  const slug = slugifyCategory(name);
  if (!slug) {
    throw new HttpError(400, "El nombre de la categoría no es válido");
  }

  const exists = await Category.exists({ slug });
  if (exists) {
    throw new HttpError(409, "Ya existe una categoría con ese nombre");
  }

  const last = await Category.findOne()
    .sort({ sortOrder: -1 })
    .select("sortOrder")
    .lean();

  const category = await Category.create({
    slug,
    name,
    sortOrder: (last?.sortOrder ?? 0) + 1,
    active: true,
  });

  emitTo(MENU_ROOMS, SOCKET_EVENTS.MENU_UPDATED, { ok: true });
  res.status(201).json({ category: mapCategory(category) });
}

/**
 * Actualiza nombre, orden o visibilidad de una categoría.
 */
export async function patchCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const slug = String(req.params.slug ?? "").trim();
  const category = await Category.findOne({ slug });
  if (!category) {
    throw new HttpError(404, "Categoría no encontrada");
  }

  if (typeof req.body?.name === "string") {
    category.name = parseName(req.body.name, "El nombre de la categoría");
  }

  if (typeof req.body?.sortOrder === "number") {
    if (!Number.isFinite(req.body.sortOrder) || req.body.sortOrder < 0) {
      throw new HttpError(400, "El orden no es válido");
    }
    category.sortOrder = req.body.sortOrder;
  }

  if (typeof req.body?.active === "boolean") {
    category.active = req.body.active;
  }

  await category.save();
  emitTo(MENU_ROOMS, SOCKET_EVENTS.MENU_UPDATED, { ok: true });
  res.json({ category: mapCategory(category) });
}

/**
 * Crea un plato. La foto se sube después a `/menu/platos/:code/imagen`.
 */
export async function createDish(req: Request, res: Response): Promise<void> {
  const name = parseName(req.body?.name, "El nombre");
  const description = parseName(req.body?.description, "La descripción");
  const price = parsePrice(req.body?.price);
  const category = await findCategoryBySlug(req.body?.category);
  const isAvailable =
    typeof req.body?.isAvailable === "boolean" ? req.body.isAvailable : true;

  const dish = await MenuItem.create({
    code: await nextDishCode(),
    name,
    description,
    price,
    category: category._id,
    imageUrl: "",
    isAvailable,
  });

  emitTo(MENU_ROOMS, SOCKET_EVENTS.MENU_UPDATED, { ok: true });

  res.status(201).json({
    dish: mapDish({
      code: dish.code,
      name: dish.name,
      price: dish.price,
      description: dish.description,
      imageUrl: dish.imageUrl ?? "",
      isAvailable: dish.isAvailable,
      category: {
        _id: category._id,
        slug: category.slug,
        name: category.name,
        sortOrder: category.sortOrder,
        active: category.active,
      },
    }),
  });
}

/**
 * Actualiza ficha de un plato y, si cambia la disponibilidad, avisa al KDS.
 */
export async function patchDish(req: Request, res: Response): Promise<void> {
  const code = parseCode(String(req.params.code ?? ""));
  const dish = await MenuItem.findOne({ code });
  if (!dish) {
    throw new HttpError(404, "Plato no encontrado");
  }

  const prevAvailable = dish.isAvailable !== false;

  if (typeof req.body?.name === "string") {
    dish.name = parseName(req.body.name, "El nombre");
  }
  if (typeof req.body?.description === "string") {
    dish.description = parseName(req.body.description, "La descripción");
  }
  if (req.body?.price !== undefined) {
    dish.price = parsePrice(req.body.price);
  }
  if (req.body?.category !== undefined) {
    const category = await findCategoryBySlug(req.body.category);
    dish.category = category._id;
  }
  if (typeof req.body?.isAvailable === "boolean") {
    dish.isAvailable = req.body.isAvailable;
  }

  await dish.save();

  if (dish.isAvailable !== prevAvailable) {
    await syncKitchenSoldOut(dish.code, !dish.isAvailable);
  }

  await dish.populate("category");
  emitTo(MENU_ROOMS, SOCKET_EVENTS.MENU_UPDATED, { ok: true });
  res.json({ dish: mapDish(dish.toObject() as DishLean) });
}

/**
 * Sube o sustituye la foto de un plato.
 */
export async function uploadDishImageHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const code = parseCode(String(req.params.code ?? ""));
  if (!req.file) {
    throw new HttpError(400, "Selecciona una imagen");
  }

  const dish = await MenuItem.findOne({ code });
  if (!dish) {
    await fs.unlink(req.file.path).catch(() => undefined);
    throw new HttpError(404, "Plato no encontrado");
  }

  const imageUrl = `/uploads/dishes/${req.file.filename}`;
  const previous = dish.imageUrl;
  dish.imageUrl = imageUrl;

  try {
    await dish.save();
  } catch (err) {
    await fs.unlink(req.file.path).catch(() => undefined);
    throw err;
  }

  if (previous && previous !== imageUrl) {
    await removeUploadedFile(previous);
  }

  emitTo(MENU_ROOMS, SOCKET_EVENTS.MENU_UPDATED, { ok: true });
  res.json({ ok: true, imageUrl });
}
