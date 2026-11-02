import type { Request, Response } from "express";
import { Category } from "../models/Category.js";
import { MenuItem } from "../models/MenuItem.js";

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
    dishes: items.map((item) => {
      const cat = item.category as { slug?: string } | null;
      return {
        id: item.code,
        name: item.name,
        price: item.price,
        category: cat?.slug ?? "",
        description: item.description,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        ...(item.options?.length ? { options: item.options } : {}),
      };
    }),
  });
}
