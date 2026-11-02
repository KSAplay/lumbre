import type { Request, Response } from "express";
import mongoose from "mongoose";
import { MenuItem } from "../models/MenuItem.js";
import {
  KITCHEN_ALERT_TYPES,
  Order,
  type KitchenAlertType,
  type OrderStatus,
} from "../models/Order.js";
import { Notification } from "../models/Notification.js";
import { Table } from "../models/Table.js";
import { formatTableLabel } from "../utils/formatTableLabel.js";
import { HttpError } from "../utils/httpError.js";

type LineBody = {
  dishId: number;
  name: string;
  quantity: number;
  price: number;
};

function mapOrderItem(item: {
  _id: mongoose.Types.ObjectId;
  dishCode: number;
  name: string;
  price: number;
  quantity: number;
  done?: boolean;
}) {
  return {
    id: String(item._id),
    dishId: item.dishCode,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    done: Boolean(item.done),
  };
}

function mapRound(doc: {
  _id: mongoose.Types.ObjectId;
  number: number;
  tableId: string;
  tableLabel: string;
  tableNumber: number;
  status: OrderStatus;
  sentAt: Date;
  note?: string | null;
  alert?: KitchenAlertType | null;
  completedAt?: Date | null;
  items: {
    _id: mongoose.Types.ObjectId;
    dishCode: number;
    name: string;
    price: number;
    quantity: number;
    done?: boolean;
  }[];
}) {
  return {
    id: String(doc._id),
    number: doc.number,
    tableId: doc.tableId,
    tableLabel: doc.tableLabel,
    tableNumber: doc.tableNumber,
    status: doc.status,
    sentAt: doc.sentAt.toISOString(),
    ...(doc.note ? { note: doc.note } : {}),
    alert: doc.alert ?? null,
    ...(doc.completedAt
      ? { completedAt: doc.completedAt.toISOString() }
      : {}),
    items: doc.items.map(mapOrderItem),
  };
}

async function nextOrderNumber(): Promise<number> {
  const last = await Order.findOne().sort({ number: -1 }).select("number").lean();
  return (last?.number ?? 0) + 1;
}

/**
 * Resuelve mesa por `_id` de plano (`I04`) o por número visible de la URL (`/mesa/4`).
 */
async function resolveTable(tableParam: string) {
  let table = await Table.findById(tableParam);
  if (!table && /^\d+$/.test(tableParam)) {
    table = await Table.findOne({ number: Number(tableParam) });
  }
  if (!table) {
    throw new HttpError(404, "Mesa no encontrada");
  }
  return table;
}

async function buildItems(lines: LineBody[]) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new HttpError(400, "La ronda debe incluir al menos un plato");
  }

  const codes = lines.map((l) => l.dishId);
  const menuItems = await MenuItem.find({ code: { $in: codes } }).lean();
  const byCode = new Map(menuItems.map((m) => [m.code, m]));

  return lines.map((line) => {
    const menu = byCode.get(line.dishId);
    return {
      menuItem: menu?._id,
      dishCode: line.dishId,
      name: line.name || menu?.name || `Plato ${line.dishId}`,
      price: typeof line.price === "number" ? line.price : (menu?.price ?? 0),
      quantity: line.quantity,
      done: false,
    };
  });
}

/**
 * Historial de rondas de una mesa por número visible (`?tableNumber=`).
 */
export async function getTableRounds(
  req: Request,
  res: Response,
): Promise<void> {
  const tableNumber = Number(req.query.tableNumber);
  if (!Number.isFinite(tableNumber)) {
    res.json({ rounds: [] });
    return;
  }

  const rounds = await Order.find({ tableNumber })
    .sort({ sentAt: 1 })
    .lean();

  res.json({
    rounds: rounds.map((r) => ({
      id: String(r._id),
      number: r.number,
      tableId: r.tableId,
      tableLabel: r.tableLabel,
      tableNumber: r.tableNumber,
      status: r.status,
      sentAt: r.sentAt.toISOString(),
      ...(r.note ? { note: r.note } : {}),
      items: r.items.map((item) => ({
        dishId: item.dishCode,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    })),
  });
}

/**
 * Rondas pendientes de confirmar (camarero).
 */
export async function getPendingOrders(
  _req: Request,
  res: Response,
): Promise<void> {
  const orders = await Order.find({ status: "por_confirmar" })
    .sort({ sentAt: 1 })
    .lean();

  res.json({
    orders: orders.map((o) => ({
      id: String(o._id),
      number: o.number,
      tableId: o.tableId,
      tableLabel: o.tableLabel,
      sentAt: o.sentAt.toISOString(),
      ...(o.note ? { note: o.note } : {}),
      items: o.items.map((item) => ({
        dishId: item.dishCode,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    })),
  });
}

/**
 * Tickets de cocina: en curso + terminadas.
 */
export async function getKitchenTickets(
  _req: Request,
  res: Response,
): Promise<void> {
  const [tickets, completed] = await Promise.all([
    Order.find({ status: "en_cocina" }).sort({ sentAt: 1 }).lean(),
    Order.find({ status: "servido" }).sort({ completedAt: -1 }).limit(50).lean(),
  ]);

  const toTicket = (o: (typeof tickets)[number]) => ({
    id: String(o._id),
    number: o.number,
    tableId: o.tableId,
    tableLabel: o.tableLabel,
    sentAt: o.sentAt.toISOString(),
    ...(o.note ? { note: o.note } : {}),
    alert: o.alert ?? null,
    ...(o.completedAt ? { completedAt: o.completedAt.toISOString() } : {}),
    items: o.items.map((item) => ({
      id: String(item._id),
      name: item.name,
      quantity: item.quantity,
      done: Boolean(item.done),
    })),
  });

  res.json({
    tickets: tickets.map(toTicket),
    completed: completed.map(toTicket),
  });
}

/**
 * Cliente solicita ayuda.
 */
export async function requestHelp(req: Request, res: Response): Promise<void> {
  const tableId = String(req.params.id ?? "");
  const table = await resolveTable(tableId);
  table.helpRequestedAt = new Date();
  await table.save();

  await Notification.create({
    type: "ayuda",
    tableId: table._id,
    tableLabel: formatTableLabel(table.number),
    message: "La mesa solicita atención.",
    read: false,
  });

  // TODO: emitir evento Socket.io (ayuda)
  res.json({ ok: true, message: "Hemos avisado a sala. Enseguida te atendemos." });
}

/**
 * Cliente solicita la cuenta.
 */
export async function requestBill(req: Request, res: Response): Promise<void> {
  const tableId = String(req.params.id ?? "");
  const table = await resolveTable(tableId);
  table.billRequestedAt = new Date();
  table.status = "cuenta";
  table.statusChangedAt = new Date();
  await table.save();

  await Notification.create({
    type: "cuenta",
    tableId: table._id,
    tableLabel: formatTableLabel(table.number),
    message: "La mesa ha pedido la cuenta.",
    read: false,
  });

  // TODO: emitir evento Socket.io (cuenta)
  res.json({ ok: true, message: "Cuenta solicitada. Enseguida te atendemos." });
}

/**
 * Cliente envía una ronda (varios platos en un pedido).
 */
export async function sendRound(req: Request, res: Response): Promise<void> {
  const tableId = String(req.params.id ?? "");
  const table = await resolveTable(tableId);
  const note =
    typeof req.body?.note === "string" && req.body.note.trim()
      ? req.body.note.trim()
      : undefined;
  const items = await buildItems(req.body?.items as LineBody[]);
  const number = await nextOrderNumber();
  const tableLabel =
    typeof req.body?.tableLabel === "string" && req.body.tableLabel.trim()
      ? req.body.tableLabel.trim()
      : formatTableLabel(table.number);

  const orderDoc = {
    number,
    tableId: table._id,
    tableLabel,
    tableNumber: table.number,
    ...(table.currentSessionId
      ? { sessionId: table.currentSessionId }
      : {}),
    status: "por_confirmar" as const,
    ...(note ? { note } : {}),
    alert: null,
    sentAt: new Date(),
    items,
  };

  const order = await Order.create(orderDoc);

  if (table.status === "libre" || table.status === "decidiendo") {
    table.status = "esperando";
    table.statusChangedAt = new Date();
    await table.save();
  }

  await Notification.create({
    type: "nuevo_pedido",
    tableId: table._id,
    tableLabel,
    message: "Nueva ronda pendiente de confirmar.",
    read: false,
    roundId: String(order._id),
  });

  // TODO: emitir evento Socket.io (order:new / order:status)
  res.status(201).json({
    ok: true,
    id: String(order._id),
    number: order.number,
    status: order.status,
    message: "Pedido enviado. El camarero lo confirmará en breve.",
  });
}

/**
 * Camarero envía comanda manual directo a cocina.
 */
export async function sendManualRound(
  req: Request,
  res: Response,
): Promise<void> {
  const tableId = String(req.params.id ?? "");
  const table = await resolveTable(tableId);
  const note =
    typeof req.body?.note === "string" && req.body.note.trim()
      ? req.body.note.trim()
      : undefined;
  const items = await buildItems(req.body?.items as LineBody[]);
  const number = await nextOrderNumber();
  const tableLabel =
    typeof req.body?.tableLabel === "string" && req.body.tableLabel.trim()
      ? req.body.tableLabel.trim()
      : formatTableLabel(table.number);

  const orderDoc = {
    number,
    tableId: table._id,
    tableLabel,
    tableNumber: table.number,
    ...(table.currentSessionId
      ? { sessionId: table.currentSessionId }
      : {}),
    status: "en_cocina" as const,
    ...(note ? { note } : {}),
    alert: null,
    sentAt: new Date(),
    items,
  };

  const order = await Order.create(orderDoc);

  table.status = "esperando";
  table.statusChangedAt = new Date();
  await table.save();

  // TODO: emitir evento Socket.io (order:en_cocina)
  res.status(201).json({
    ok: true,
    id: String(order._id),
    number: order.number,
    status: "en_cocina" as const,
    message: "Comanda enviada a cocina.",
  });
}

/**
 * Camarero confirma ronda → cocina.
 */
export async function confirmRound(
  req: Request,
  res: Response,
): Promise<void> {
  const orderId = String(req.params.id ?? "");
  const order = await Order.findById(orderId);
  if (!order) {
    throw new HttpError(404, "Ronda no encontrada");
  }
  if (order.status !== "por_confirmar") {
    throw new HttpError(409, "La ronda no está pendiente de confirmar");
  }

  if (Array.isArray(req.body?.items) && req.body.items.length > 0) {
    const built = await buildItems(req.body.items as LineBody[]);
    order.set("items", built);
  }

  if (typeof req.body?.note === "string") {
    const trimmed = req.body.note.trim();
    order.note = trimmed.length > 0 ? trimmed : undefined;
  }

  order.status = "en_cocina";
  order.alert = null;
  await order.save();

  // TODO: emitir evento Socket.io (order:status en_cocina)
  res.json({
    ok: true,
    status: "en_cocina",
    message: "Pedido confirmado y enviado a cocina.",
  });
}

/**
 * Camarero rechaza ronda.
 */
export async function rejectRound(req: Request, res: Response): Promise<void> {
  const orderId = String(req.params.id ?? "");
  const order = await Order.findById(orderId);
  if (!order) {
    throw new HttpError(404, "Ronda no encontrada");
  }
  if (order.status !== "por_confirmar") {
    throw new HttpError(409, "La ronda no está pendiente de confirmar");
  }

  order.status = "cancelado";
  await order.save();

  // TODO: emitir evento Socket.io (order:status cancelado)
  res.json({
    ok: true,
    status: "cancelado",
    message: "Pedido rechazado.",
  });
}

/**
 * Cocina marca un plato como hecho / pendiente.
 */
export async function patchOrderItem(
  req: Request,
  res: Response,
): Promise<void> {
  const orderId = String(req.params.id ?? "");
  const itemId = String(req.params.itemId ?? "");
  const done = req.body?.done;

  if (typeof done !== "boolean") {
    throw new HttpError(400, "Body inválido: se requiere done boolean");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new HttpError(404, "Ronda no encontrada");
  }

  const item = order.items.id(itemId);
  if (!item) {
    throw new HttpError(404, "Ítem no encontrado");
  }

  item.done = done;
  await order.save();

  // TODO: emitir evento Socket.io (item:done)
  res.json({ ok: true, message: "Ítem actualizado" });
}

/**
 * Cocina asigna o limpia alerta de incidencia.
 */
export async function patchOrderAlert(
  req: Request,
  res: Response,
): Promise<void> {
  const orderId = String(req.params.id ?? "");
  const alertRaw = req.body?.alert;

  let alert: KitchenAlertType | null = null;
  if (alertRaw !== null && alertRaw !== undefined && alertRaw !== "") {
    if (!KITCHEN_ALERT_TYPES.includes(alertRaw as KitchenAlertType)) {
      throw new HttpError(400, "Tipo de alerta inválido");
    }
    alert = alertRaw as KitchenAlertType;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new HttpError(404, "Ronda no encontrada");
  }

  order.alert = alert;
  await order.save();

  if (alert) {
    await Notification.create({
      type: "incidencia_cocina",
      tableId: order.tableId,
      tableLabel: order.tableLabel,
      message: `Incidencia de cocina: ${alert}.`,
      read: false,
      kitchenAlert: alert,
      roundId: String(order._id),
    });
  }

  // TODO: emitir evento Socket.io (order:alert)
  res.json({ ok: true, message: "Alerta actualizada", alert });
}

/**
 * Cocina marca la ronda como servida / terminada.
 */
export async function completeRound(
  req: Request,
  res: Response,
): Promise<void> {
  const orderId = String(req.params.id ?? "");
  const order = await Order.findById(orderId);
  if (!order) {
    throw new HttpError(404, "Ronda no encontrada");
  }

  order.status = "servido";
  order.completedAt = new Date();
  order.alert = null;
  await order.save();

  await Notification.create({
    type: "plato_listo",
    tableId: order.tableId,
    tableLabel: order.tableLabel,
    message: "La comanda está lista para servir.",
    read: false,
    roundId: String(order._id),
  });

  // TODO: emitir evento Socket.io (order:status servido)
  res.json({ ok: true, status: "servido", message: "Comanda terminada" });
}

/**
 * Cocina restaura una terminada a en cocina.
 */
export async function restoreRound(
  req: Request,
  res: Response,
): Promise<void> {
  const orderId = String(req.params.id ?? "");
  const order = await Order.findById(orderId);
  if (!order) {
    throw new HttpError(404, "Ronda no encontrada");
  }

  order.status = "en_cocina";
  order.set("completedAt", null);
  await order.save();

  // TODO: emitir evento Socket.io (order:status en_cocina)
  res.json({ ok: true, status: "en_cocina", message: "Comanda restaurada" });
}

export { mapRound };
