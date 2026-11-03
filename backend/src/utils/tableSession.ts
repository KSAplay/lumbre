import { randomUUID } from "node:crypto";
import type { HydratedDocument } from "mongoose";
import { Order } from "../models/Order.js";
import type { TableDocument } from "../models/Table.js";
import { TablePayment } from "../models/TablePayment.js";

type TableDoc = HydratedDocument<TableDocument>;

/** Estados en los que la mesa tiene una visita abierta. */
export const OCCUPIED_STATUSES = [
  "decidiendo",
  "esperando",
  "servido",
  "cuenta",
] as const;

/**
 * Asigna un identificador de visita a la mesa si aún no tiene uno.
 * No guarda el documento: el llamador decide cuándo persistir.
 *
 * @returns El `sessionId` vigente de la mesa.
 */
export function ensureTableSession(table: TableDoc): string {
  if (table.currentSessionId) return table.currentSessionId;
  const sessionId = randomUUID();
  table.set("currentSessionId", sessionId);
  return sessionId;
}

/**
 * Cierra económicamente la visita de una mesa.
 *
 * Las rondas sin confirmar se cancelan; las confirmadas reciben `paidAt` y,
 * si ya estaban servidas, pasan a `pagado`. Las que siguen en cocina mantienen
 * su estado para que el KDS pueda terminarlas. Se guarda un {@link TablePayment}
 * con el importe total aunque la visita no tenga rondas.
 *
 * @param staffId - Empleado que marca la mesa como pagada; opcional.
 * @returns Importe total cobrado en euros.
 */
export async function registerTablePayment(
  table: TableDoc,
  staffId?: string,
): Promise<number> {
  const paidAt = new Date();
  const openFilter = {
    tableId: table._id,
    paidAt: { $exists: false },
  };

  await Order.updateMany(
    { ...openFilter, status: "por_confirmar" },
    { $set: { status: "cancelado" } },
  );

  const orders = await Order.find({
    ...openFilter,
    status: { $in: ["en_cocina", "servido"] },
  }).lean();

  const total = orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    0,
  );

  if (orders.length > 0) {
    const ids = orders.map((o) => o._id);
    await Order.updateMany({ _id: { $in: ids } }, { $set: { paidAt } });
    await Order.updateMany(
      { _id: { $in: ids }, status: "servido" },
      { $set: { status: "pagado" } },
    );
  }

  await TablePayment.create({
    tableId: table._id,
    tableNumber: table.number,
    ...(table.currentSessionId ? { sessionId: table.currentSessionId } : {}),
    guestCount: table.guestCount,
    total: Math.round(total * 100) / 100,
    orders: orders.map((o) => o._id),
    ...(staffId ? { paidBy: staffId } : {}),
    paidAt,
  });

  return total;
}
