/**
 * Contrato de eventos Socket.io.
 *
 * La mutación persiste por HTTP. Estos nombres solo notifican a otras pantallas
 * para que vuelvan a pedir el recurso.
 *
 * Salas:
 * - `staff:recepcion` | `staff:camarero` | `staff:cocina` | `staff:backoffice`
 * - `mesa:{tableId}` — clientes de esa mesa (`tableId` es el `_id` del plano)
 * - `carta` — quien muestra la carta (cliente, camarero, backoffice)
 */

export const SOCKET_ROOMS = {
  reception: "staff:recepcion",
  waiter: "staff:camarero",
  kitchen: "staff:cocina",
  backoffice: "staff:backoffice",
  menu: "carta",
} as const;

/** Sala de una mesa concreta. */
export function tableRoom(tableId: string): string {
  return `mesa:${tableId}`;
}

/** Recepción y camarero, que comparten el plano. */
export const FLOOR_ROOMS = [
  SOCKET_ROOMS.reception,
  SOCKET_ROOMS.waiter,
] as const;

/** Quien pinta la carta. */
export const MENU_ROOMS = [
  SOCKET_ROOMS.menu,
  SOCKET_ROOMS.waiter,
  SOCKET_ROOMS.backoffice,
] as const;

/**
 * Cocina, camarero y la mesa de la ronda.
 *
 * @param tableId - `_id` de la mesa.
 */
export function orderRooms(tableId: string): readonly string[] {
  return [SOCKET_ROOMS.kitchen, SOCKET_ROOMS.waiter, tableRoom(tableId)];
}

export const SOCKET_EVENTS = {
  FLOOR_UPDATED: "floor:updated",
  TABLE_STATUS: "table:status",
  TABLES_RELEASED: "tables:released",
  ORDER_NEW: "order:new",
  ORDER_STATUS: "order:status",
  ORDER_ITEM_DONE: "order:item:done",
  ORDER_ALERT: "order:alert",
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
  MENU_UPDATED: "menu:updated",
  STAFF_UPDATED: "staff:updated",
  SETTINGS_UPDATED: "settings:updated",
  SHIFT_CLOSED: "shift:closed",
  STATS_UPDATED: "stats:updated",
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/** Aviso sin datos: la vista recarga el recurso entero. */
export type AckPayload = {
  ok: true;
};

export type TableStatusPayload = {
  tableId: string;
  status: string;
};

export type OrderPayload = {
  orderId: string;
  tableId: string;
  status: string;
};

export type OrderItemPayload = {
  orderId: string;
  itemId: string;
  done: boolean;
};

export type OrderAlertPayload = {
  orderId: string;
  tableId: string;
  alert: string | null;
};

export type NotificationPayload = {
  tableId: string;
  type: string;
};

export type NotificationReadPayload = {
  notificationId: string;
};

export type ShiftClosedPayload = {
  shiftId: string;
};
