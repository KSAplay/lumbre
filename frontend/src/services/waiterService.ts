import type { KitchenAlertType } from "../types/kitchen";
import type {
  PendingOrder,
  WaiterNotification,
  WaiterOrderLine,
} from "../types/waiter";
import { apiRequest } from "../config/api";

export type ConfirmOrderBody = {
  tableId: string;
  items: WaiterOrderLine[];
  note?: string;
};

export type ConfirmOrderResponse = {
  ok: boolean;
  status: "en_cocina";
  message: string;
};

export type RejectOrderBody = {
  tableId: string;
  reason?: string;
};

export type RejectOrderResponse = {
  ok: boolean;
  status: "cancelado";
  message: string;
};

export type ManualOrderBody = {
  tableId: string;
  tableLabel: string;
  note?: string;
  items: WaiterOrderLine[];
  sentAt: string;
};

export type ManualOrderResponse = {
  ok: boolean;
  id: string;
  number: number;
  status: "en_cocina";
  message: string;
};

export type PendingOrdersResponse = {
  orders: PendingOrder[];
};

export type WaiterNotificationsResponse = {
  notifications: WaiterNotification[];
};

type PendingOrderApi = {
  id: string;
  number: number;
  tableId: string;
  tableLabel: string;
  sentAt: string;
  note?: string;
  items: WaiterOrderLine[];
};

type NotificationApi = {
  id: string;
  type: WaiterNotification["type"];
  tableId: string;
  tableLabel: string;
  message: string;
  createdAt: string;
  read: boolean;
  kitchenAlert?: KitchenAlertType;
  roundId?: string;
};

/**
 * Carga las rondas por confirmar.
 */
export async function getPendingOrders(): Promise<PendingOrdersResponse> {
  const data = await apiRequest<{ orders: PendingOrderApi[] }>(
    "/rondas/pendientes",
  );

  const orders = data.orders
    .map((order) => ({
      id: order.id,
      number: order.number,
      tableId: order.tableId,
      tableLabel: order.tableLabel,
      sentAt: new Date(order.sentAt),
      note: order.note,
      items: order.items.map((item) => ({ ...item })),
    }))
    .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());

  return { orders };
}

/**
 * Carga los avisos de sala.
 */
export async function getWaiterNotifications(): Promise<WaiterNotificationsResponse> {
  const data = await apiRequest<{ notifications: NotificationApi[] }>(
    "/avisos",
  );

  const notifications = data.notifications
    .map((n) => ({
      id: n.id,
      type: n.type,
      tableId: n.tableId,
      tableLabel: n.tableLabel,
      message: n.message,
      createdAt: new Date(n.createdAt),
      read: n.read,
      kitchenAlert: n.kitchenAlert,
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return { notifications };
}

/** Marca un aviso como leído en el servidor. */
export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await apiRequest(`/avisos/${notificationId}/leer`, { method: "PATCH" });
}

/**
 * Confirma una ronda enviada por el cliente para que pase a cocina.
 */
export async function confirmOrder(
  orderId: string,
  body: ConfirmOrderBody,
): Promise<ConfirmOrderResponse> {
  return apiRequest<ConfirmOrderResponse>(`/rondas/${orderId}/confirmar`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Rechaza una ronda enviada por el cliente.
 */
export async function rejectOrder(
  orderId: string,
  body: RejectOrderBody,
): Promise<RejectOrderResponse> {
  return apiRequest<RejectOrderResponse>(`/rondas/${orderId}/rechazar`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Envía una comanda manual directo a cocina.
 */
export async function sendManualOrder(
  tableId: string,
  body: ManualOrderBody,
): Promise<ManualOrderResponse> {
  return apiRequest<ManualOrderResponse>(`/mesas/${tableId}/rondas/manual`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
