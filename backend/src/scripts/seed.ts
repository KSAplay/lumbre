import { connectDB, disconnectDB } from "../config/db.js";
import {
  categoriesMock,
  dishesMock,
  notificationsMock,
  roundsMock,
  staffMock,
  tablesMock,
  zonesMock,
} from "../data/mock.js";
import { Category } from "../models/Category.js";
import { MenuItem } from "../models/MenuItem.js";
import { Notification } from "../models/Notification.js";
import { Order } from "../models/Order.js";
import { Staff } from "../models/Staff.js";
import { Table } from "../models/Table.js";
import { Zone } from "../models/Zone.js";
import { formatTableLabel } from "../utils/formatTableLabel.js";
import { hashPin } from "../utils/password.js";

function minutesAgoToDate(minutesAgo: number, now: number): Date {
  return new Date(now - minutesAgo * 60_000);
}

/**
 * Vacía todas las colecciones y vuelca el snapshot de `src/data/mock.ts`.
 *
 * @throws Error si el mock referencia una categoría, plato, mesa o ronda inexistente.
 */
async function seed(): Promise<void> {
  await connectDB();
  const now = Date.now();

  console.log("[seed] Limpiando colecciones…");
  await Promise.all([
    Notification.deleteMany({}),
    Order.deleteMany({}),
    Table.deleteMany({}),
    Zone.deleteMany({}),
    MenuItem.deleteMany({}),
    Category.deleteMany({}),
    Staff.deleteMany({}),
  ]);

  console.log("[seed] Staff…");
  for (const s of staffMock) {
    await Staff.create({
      name: s.name,
      pinHash: await hashPin(s.pin),
      role: s.role,
      active: true,
    });
  }

  console.log("[seed] Carta…");
  const categoryIdBySlug = new Map<string, string>();
  for (const [index, cat] of categoriesMock.entries()) {
    const doc = await Category.create({
      slug: cat.slug,
      name: cat.name,
      sortOrder: index,
      active: true,
    });
    categoryIdBySlug.set(cat.slug, String(doc._id));
  }

  const dishByCode = new Map<
    number,
    { _id: string; name: string; price: number }
  >();
  for (const dish of dishesMock) {
    const categoryId = categoryIdBySlug.get(dish.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoría no encontrada: ${dish.categorySlug}`);
    }
    const doc = await MenuItem.create({
      code: dish.code,
      name: dish.name,
      price: dish.price,
      category: categoryId,
      description: dish.description,
      imageUrl: dish.imageUrl,
      isAvailable: dish.isAvailable,
      ...(dish.options ? { options: dish.options } : {}),
    });
    dishByCode.set(dish.code, {
      _id: String(doc._id),
      name: dish.name,
      price: dish.price,
    });
  }

  console.log("[seed] Zonas y muros…");
  for (const [index, zone] of zonesMock.entries()) {
    await Zone.create({
      slug: zone.slug,
      name: zone.name,
      sortOrder: index,
      walls: zone.walls,
    });
  }

  console.log("[seed] Mesas…");
  for (const t of tablesMock) {
    await Table.create({
      _id: t.id,
      number: t.number,
      capacity: t.capacity,
      shape: t.shape,
      zone: t.zone,
      position: t.position,
      ...(t.orientation ? { orientation: t.orientation } : {}),
      status: t.state?.status ?? "libre",
      guestCount: t.state?.guestCount ?? 0,
      statusChangedAt: minutesAgoToDate(t.state?.minutesAgo ?? 0, now),
      ...(t.state?.reservation ? { reservation: t.state.reservation } : {}),
    });
  }

  console.log("[seed] Rondas…");
  const orderIdByNumber = new Map<number, string>();
  for (const round of roundsMock) {
    const items = round.items.map((item) => {
      const dish = dishByCode.get(item.dishCode);
      if (!dish) {
        throw new Error(
          `Plato ${item.dishCode} no encontrado en la ronda ${round.number}`,
        );
      }
      return {
        menuItem: dish._id,
        dishCode: item.dishCode,
        name: dish.name,
        price: dish.price,
        quantity: item.quantity,
        done: Boolean(item.done),
      };
    });

    const doc = await Order.create({
      number: round.number,
      tableId: round.tableId,
      tableLabel: formatTableLabel(round.tableNumber),
      tableNumber: round.tableNumber,
      status: round.status,
      ...(round.note ? { note: round.note } : {}),
      alert: round.alert ?? null,
      sentAt: minutesAgoToDate(round.minutesAgo, now),
      ...(round.status === "servido"
        ? {
            completedAt: minutesAgoToDate(
              Math.max(0, round.minutesAgo - 1),
              now,
            ),
          }
        : {}),
      items,
    });
    orderIdByNumber.set(round.number, String(doc._id));
  }

  console.log("[seed] Avisos…");
  const tableNumberById = new Map(tablesMock.map((t) => [t.id, t.number]));
  for (const n of notificationsMock) {
    const tableNumber = tableNumberById.get(n.tableId);
    if (tableNumber === undefined) {
      throw new Error(`Mesa no encontrada en aviso: ${n.tableId}`);
    }
    const roundId =
      n.roundNumber !== undefined
        ? orderIdByNumber.get(n.roundNumber)
        : undefined;
    if (n.roundNumber !== undefined && !roundId) {
      throw new Error(`Ronda no encontrada en aviso: ${n.roundNumber}`);
    }

    await Notification.create({
      type: n.type,
      tableId: n.tableId,
      tableLabel: formatTableLabel(tableNumber),
      message: n.message,
      read: n.read,
      ...(n.kitchenAlert ? { kitchenAlert: n.kitchenAlert } : {}),
      ...(roundId ? { roundId } : {}),
      createdAt: minutesAgoToDate(n.minutesAgo, now),
    });
  }

  console.log("[seed] Completado.");
  console.log(
    `  Staff: ${staffMock.length} | Categorías: ${categoriesMock.length} | Platos: ${dishesMock.length}`,
  );
  console.log(
    `  Mesas: ${tablesMock.length} | Rondas: ${roundsMock.length} | Avisos: ${notificationsMock.length}`,
  );

  await disconnectDB();
}

seed().catch(async (err: unknown) => {
  console.error("[seed] Error:", err);
  try {
    await disconnectDB();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
