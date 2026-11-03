import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Shift, type ShiftDocument } from "../models/Shift.js";
import { Staff } from "../models/Staff.js";
import { HttpError } from "../utils/httpError.js";
import { computeSalesSummary, currentShiftStart } from "../utils/salesStats.js";
import { SOCKET_EVENTS, SOCKET_ROOMS } from "../sockets/events.js";
import { emitTo } from "../sockets/io.js";

/** Número de productos que se muestran como «Top ventas» en el listado. */
const TOP_PRODUCTS_IN_LIST = 3;

function mapShift(doc: ShiftDocument, withAllProducts: boolean) {
  return {
    id: String(doc._id),
    startedAt: doc.startedAt.toISOString(),
    endedAt: doc.endedAt.toISOString(),
    closedByName: doc.closedByName,
    totalRevenue: doc.totalRevenue,
    tablesPaid: doc.tablesPaid,
    guestsServed: doc.guestsServed ?? 0,
    averageTicket: doc.averageTicket,
    products: (withAllProducts
      ? doc.products
      : doc.products.slice(0, TOP_PRODUCTS_IN_LIST)
    ).map((p) => ({
      dishCode: p.dishCode,
      name: p.name,
      quantity: p.quantity,
      revenue: p.revenue,
    })),
  };
}

/**
 * Cierra el turno en curso y guarda el snapshot de recaudación y productos.
 * Lo ejecuta recepción desde «Finalizar Turno».
 */
export async function closeShift(req: Request, res: Response): Promise<void> {
  const staffId = req.staff?.id;
  const staff =
    staffId && mongoose.isValidObjectId(staffId)
      ? await Staff.findById(staffId).lean()
      : null;

  const endedAt = new Date();
  const startedAt = await currentShiftStart(endedAt);
  const summary = await computeSalesSummary(startedAt, endedAt);

  const shift = await Shift.create({
    startedAt,
    endedAt,
    ...(staff ? { closedBy: staff._id } : {}),
    closedByName: staff?.name ?? "Recepción",
    totalRevenue: summary.totalRevenue,
    tablesPaid: summary.tablesPaid,
    guestsServed: summary.guestsServed,
    averageTicket: summary.averageTicket,
    products: summary.products,
  });

  emitTo([SOCKET_ROOMS.backoffice], SOCKET_EVENTS.SHIFT_CLOSED, {
    shiftId: String(shift._id),
  });
  emitTo([SOCKET_ROOMS.backoffice], SOCKET_EVENTS.STATS_UPDATED, { ok: true });

  res.status(201).json({
    ok: true,
    message: "Turno cerrado",
    shift: mapShift(shift.toObject() as ShiftDocument, true),
  });
}

/**
 * Historial de cierres de turno, del más reciente al más antiguo.
 */
export async function listShifts(_req: Request, res: Response): Promise<void> {
  const shifts = await Shift.find().sort({ endedAt: -1 }).lean();
  res.json({ shifts: shifts.map((s) => mapShift(s, false)) });
}

/**
 * Detalle completo de un cierre (todos los productos servidos).
 */
export async function getShift(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(404, "Turno no encontrado");
  }
  const shift = await Shift.findById(id).lean();
  if (!shift) {
    throw new HttpError(404, "Turno no encontrado");
  }
  res.json({ shift: mapShift(shift, true) });
}
