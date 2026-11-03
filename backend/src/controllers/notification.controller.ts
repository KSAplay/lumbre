import type { Request, Response } from "express";
import { Notification } from "../models/Notification.js";
import { HttpError } from "../utils/httpError.js";
import { SOCKET_EVENTS, SOCKET_ROOMS } from "../sockets/events.js";
import { emitTo } from "../sockets/io.js";

/**
 * Lista avisos del camarero (más recientes primero).
 */
export async function listNotifications(
  _req: Request,
  res: Response,
): Promise<void> {
  const notifications = await Notification.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({
    notifications: notifications.map((n) => ({
      id: String(n._id),
      type: n.type,
      tableId: n.tableId,
      tableLabel: n.tableLabel,
      message: n.message,
      createdAt: new Date(
        (n as { createdAt?: Date }).createdAt ?? Date.now(),
      ).toISOString(),
      read: Boolean(n.read),
      ...(n.kitchenAlert ? { kitchenAlert: n.kitchenAlert } : {}),
      ...(n.roundId ? { roundId: n.roundId } : {}),
    })),
  });
}

/**
 * Marca un aviso como leído.
 */
export async function markNotificationRead(
  req: Request,
  res: Response,
): Promise<void> {
  const id = String(req.params.id ?? "");
  const notification = await Notification.findByIdAndUpdate(
    id,
    { read: true },
    { returnDocument: "after" },
  );

  if (!notification) {
    throw new HttpError(404, "Aviso no encontrado");
  }

  emitTo([SOCKET_ROOMS.waiter], SOCKET_EVENTS.NOTIFICATION_READ, {
    notificationId: String(notification._id),
  });

  res.json({ ok: true, message: "Aviso marcado como leído" });
}
