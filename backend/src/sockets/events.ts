/**
 * Catálogo de eventos Socket.io de Lumbre (contrato previsto).
 *
 * Este archivo NO emite ni escucha todavía: documenta nombres, payloads
 * orientativos y quién debe reaccionar. Al implementar, tipar payloads reales
 * y reutilizar estos nombres desde controladores + frontend.
 *
 * Convención de salas (rooms):
 * - `staff:recepcion` | `staff:camarero` | `staff:cocina` | `staff:backoffice`
 * - `mesa:{tableId}` — clientes de esa mesa (tras escanear QR / unirse)
 * - opcional: `session:{sessionId}` si se acota por visita abierta
 *
 * Regla: la mutación persiste siempre por HTTP (REST). El socket solo notifica
 * para que otras pantallas actualicen sin recargar.
 */

// ---------------------------------------------------------------------------
// Autenticación / handshake (al conectar)
// ---------------------------------------------------------------------------
// TODO(sockets):
// - Cliente mesa: query/auth `{ role: "cliente", tableId }` → join `mesa:{tableId}`
// - Staff: JWT del login PIN → join `staff:{role}` (+ validar rol en middleware)
// - Rechazar conexiones sin mesa válida o token inválido

/** Eventos de dominio previstos. */
export const SOCKET_EVENTS = {
  // --- Plano / mesas (origen: recepción; consumidores: recepción + camarero) ---
  /** Recepción guardó el plano (altas/bajas/mover mesas y muros). */
  FLOOR_UPDATED: "floor:updated",
  /** Cambio de estado operativo de una mesa (libre, esperando, cuenta…). */
  TABLE_STATUS: "table:status",
  /** Lote: mesas en `limpiando` pasaron a `libre`. */
  TABLES_RELEASED: "tables:released",

  // --- Comandas / rondas ---
  /** Cliente envió ronda → `por_confirmar` (+ aviso nuevo_pedido). */
  ORDER_NEW: "order:new",
  /** Cambio de status de ronda (en_cocina, cancelado, servido…). */
  ORDER_STATUS: "order:status",
  /** Cocina marcó un ítem done/pendiente. */
  ORDER_ITEM_DONE: "order:item:done",
  /** Cocina asignó/limpió incidencia (falta_producto, etc.). */
  ORDER_ALERT: "order:alert",

  // --- Avisos de sala (camarero; a veces recepción) ---
  /** Alta de Notification (ayuda, cuenta, nuevo_pedido, plato_listo, incidencia). */
  NOTIFICATION_NEW: "notification:new",
  /** Aviso marcado como leído (sincronizar listas abiertas). */
  NOTIFICATION_READ: "notification:read",

  // --- Carta / backoffice (NO incluye mesas: eso es recepción) ---
  /**
   * Carta mutada: alta/edición/baja de plato, imagen, disponibilidad,
   * categorías, etc. Consumidores: cliente, camarero (comanda manual),
   * y el propio backoffice si hay varias sesiones.
   */
  MENU_UPDATED: "menu:updated",
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/**
 * Mapa emit → rooms / listeners (guía de implementación).
 *
 * | Evento              | Emite tras (controller)              | Rooms destino                         | UI que reacciona                          |
 * |---------------------|--------------------------------------|---------------------------------------|-------------------------------------------|
 * | floor:updated       | putFloorPlan                         | staff:recepcion, staff:camarero       | ReceptionDashboard, WaiterTablesPanel     |
 * | table:status        | updateTableStatus (+ efectos laterales de pedidos/ayuda/cuenta) | staff:recepcion, staff:camarero (+ mesa:{id} si afecta al cliente) | Recepción, Camarero, Cliente (opcional) |
 * | tables:released     | releaseCleaningTables                | staff:recepcion, staff:camarero       | Recepción, Camarero                       |
 * | order:new           | sendRound                            | staff:camarero (+ notification:new)   | WaiterView pendientes + avisos            |
 * | order:status        | confirmRound, rejectRound, sendManualRound, completeRound, restoreRound | staff:cocina, staff:camarero, mesa:{tableId} | KDS, Waiter, CustomerOrdersHistory |
 * | order:item:done     | patchOrderItem                       | staff:cocina                          | KitchenKDSView (otras pantallas cocina)   |
 * | order:alert         | patchOrderAlert                      | staff:camarero (+ notification:new)   | Waiter notifications + badge mesa         |
 * | notification:new    | requestHelp, requestBill, sendRound, completeRound, patchOrderAlert | staff:camarero (¿recepción en cuenta/ayuda?) | WaiterView avisos              |
 * | notification:read   | markNotificationRead                 | staff:camarero                        | Otras pestañas camarero                   |
 * | menu:updated        | futuros CRUD menu/upload backoffice  | staff:backoffice, broadcast carta o rooms cliente/camarero | CustomerMenuView, ManualOrderPanel, Admin |
 */
void SOCKET_EVENTS;
