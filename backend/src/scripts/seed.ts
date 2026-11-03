import { connectDB, disconnectDB } from "../config/db.js";
import {
  categoriesMock,
  dishesMock,
  notificationsMock,
  roundsMock,
  staffMock,
  tablesMock,
  todaySalesMock,
  yesterdaySalesMock,
  zonesMock,
  type MockClosedSale,
} from "../data/mock.js";
import { Category } from "../models/Category.js";
import { MenuItem } from "../models/MenuItem.js";
import { Notification } from "../models/Notification.js";
import { Order } from "../models/Order.js";
import { SETTINGS_KEY, Settings } from "../models/Settings.js";
import { Shift } from "../models/Shift.js";
import { Staff } from "../models/Staff.js";
import { Table } from "../models/Table.js";
import { TablePayment } from "../models/TablePayment.js";
import { Zone } from "../models/Zone.js";
import { formatTableLabel } from "../utils/formatTableLabel.js";
import { hashPin } from "../utils/password.js";
import { computeSalesSummary } from "../utils/salesStats.js";

/**
 * Convierte minutos a fecha.
 *
 * @param minutesAgo - Número de minutos atrás.
 * @param now - Fecha actual.
 * @returns Fecha resultante.
 */
function minutesAgoToDate(minutesAgo: number, now: number): Date {
  return new Date(now - minutesAgo * 60_000);
}

/** Referencia a un plato. */
type DishRef = { _id: string; name: string; price: number };

/**
 * Inserta rondas ya cobradas y su `TablePayment`.
 *
 * @param paidAtFor - Fecha de cobro de cada mesa.
 * @param firstNumber - Primer número de comanda libre.
 * @returns El siguiente número de comanda libre.
 */
async function insertClosedSales(
  sales: MockClosedSale[],
  dishByCode: Map<number, DishRef>,
  paidAtFor: (sale: MockClosedSale, index: number) => Date,
  firstNumber: number,
): Promise<number> {
  let number = firstNumber;

  /** Inserta las ventas cerradas. */
  for (const [index, sale] of sales.entries()) {
    const paidAt = paidAtFor(sale, index);
    const items = sale.items.map((item) => {
      const dish = dishByCode.get(item.dishCode);
      if (!dish) {
        throw new Error(`Plato ${item.dishCode} no encontrado en un cobro de demo`);
      }
      return {
        menuItem: dish._id,
        dishCode: item.dishCode,
        name: dish.name,
        price: dish.price,
        quantity: item.quantity,
        done: true,
      };
    });
    /** Calcula el total de la venta. */
    const total =
      Math.round(
        items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
      ) / 100;
    const tableId = `C${sale.tableNumber}`;

    /** Crea la orden. */
    const order = await Order.create({
      number,
      tableId,
      tableLabel: formatTableLabel(sale.tableNumber),
      tableNumber: sale.tableNumber,
      status: "pagado",
      sentAt: new Date(paidAt.getTime() - 45 * 60_000),
      completedAt: new Date(paidAt.getTime() - 8 * 60_000),
      paidAt,
      items,
    });
    number += 1;

    /** Crea el pago de la mesa. */
    await TablePayment.create({
      tableId,
      tableNumber: sale.tableNumber,
      guestCount: sale.guestCount,
      total,
      orders: [order._id],
      paidAt,
    });
  }

  /** Devuelve el siguiente número de comanda libre. */
  return number;
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
    Shift.deleteMany({}),
    TablePayment.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  console.log("[seed] Ajustes…");
  await Settings.create({ key: SETTINGS_KEY, restaurantName: "Lumbre" });

  console.log("[seed] Staff…");
  let receptionId: string | undefined;
  let receptionName = "Recepción";
  for (const s of staffMock) {
    const doc = await Staff.create({
      name: s.name,
      pinHash: await hashPin(s.pin),
      pin: s.pin,
      role: s.role,
      gender: s.gender,
      active: true,
    });
    if (s.role === "recepcion" && !receptionId) {
      receptionId = String(doc._id);
      receptionName = doc.name;
    }
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

  console.log("[seed] Cobros de demostración…");
  const nextAfterRounds =
    roundsMock.reduce((max, round) => Math.max(max, round.number), 0) + 1;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = new Date(yesterday);
  yesterdayStart.setHours(13, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 30, 0, 0);

  await insertClosedSales(
    yesterdaySalesMock,
    dishByCode,
    (sale) => {
      const at = new Date(yesterdayStart);
      const span = yesterdayEnd.getTime() - yesterdayStart.getTime();
      at.setTime(yesterdayStart.getTime() + span * sale.dayFraction);
      return at;
    },
    nextAfterRounds,
  );

  const yesterdaySummary = await computeSalesSummary(
    yesterdayStart,
    yesterdayEnd,
  );
  await Shift.create({
    startedAt: yesterdayStart,
    endedAt: yesterdayEnd,
    ...(receptionId ? { closedBy: receptionId } : {}),
    closedByName: receptionName,
    totalRevenue: yesterdaySummary.totalRevenue,
    tablesPaid: yesterdaySummary.tablesPaid,
    guestsServed: yesterdaySummary.guestsServed,
    averageTicket: yesterdaySummary.averageTicket,
    products: yesterdaySummary.products,
  });

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  await insertClosedSales(
    todaySalesMock,
    dishByCode,
    (sale) =>
      new Date(
        todayStart.getTime() + (now - todayStart.getTime()) * sale.dayFraction,
      ),
    nextAfterRounds + yesterdaySalesMock.length,
  );

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
