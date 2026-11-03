/**
 * Nombres de eventos. Deben coincidir con `backend/src/sockets/events.ts`.
 * El payload no se usa: cada vista vuelve a pedir sus datos.
 */
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
