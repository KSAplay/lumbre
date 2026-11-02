import type { Server as HttpServer } from "node:http";
import { SOCKET_EVENTS } from "./events.js";

/**
 * Registro de Socket.io sobre el HTTP server de Express.
 *
 * Hoy: stub. Cuando se implemente, llamar desde `src/index.ts`:
 *   registerSockets(httpServer);
 *
 * Dependencia ya instalada: `socket.io` ^4.x.
 * Frontend pendiente: añadir `socket.io-client` y un hook/servicio compartido
 * (p. ej. `frontend/src/services/socketService.ts` + `useStaffSocket` /
 * `useTableSocket`) que haga join a rooms y reaccione a {@link SOCKET_EVENTS}.
 *
 * ---------------------------------------------------------------------------
 * TODO(sockets) — CHECKLIST DE CABLEADO EN VIVO
 * ---------------------------------------------------------------------------
 *
 * A) BOOTSTRAP
 * 1. Crear `Server` de socket.io sobre `httpServer` (CORS = origen Vite).
 * 2. Middleware de auth en `connection` (JWT staff o tableId cliente).
 * 3. Al conectar: `socket.join(room)` según rol / mesa (ver `events.ts`).
 * 4. Exportar `getIO()` para que los controladores emitan tras persistir.
 * 5. Descomentar registro en `src/index.ts`.
 *
 * B) EMISORES (backend REST → socket). Tras el `save`/`create` exitoso:
 *
 *    table.controller.ts
 *    - putFloorPlan          → floor:updated
 *      (recepción añade/edita/borra mesas y muros; NO backoffice)
 *    - updateTableStatus     → table:status
 *    - releaseCleaningTables → tables:released
 *
 *    order.controller.ts
 *    - requestHelp           → notification:new (+ table:status si aplica)
 *    - requestBill           → notification:new + table:status (cuenta)
 *    - sendRound             → order:new + notification:new (+ table:status)
 *    - sendManualRound       → order:status (en_cocina) → KDS
 *    - confirmRound          → order:status (en_cocina) → KDS + mesa:{id}
 *    - rejectRound           → order:status (cancelado) → mesa:{id}
 *    - patchOrderItem        → order:item:done → cocina
 *    - patchOrderAlert       → order:alert + notification:new → camarero
 *    - completeRound         → order:status (servido) + notification:new (plato_listo)
 *    - restoreRound          → order:status (en_cocina) → KDS
 *
 *    notification.controller.ts
 *    - markNotificationRead  → notification:read (sync multi-dispositivo camarero)
 *
 *    menu / upload (cuando existan CRUD de backoffice)
 *    - create/update/delete plato, categoría, imagen, isAvailable
 *      → menu:updated
 *      Destino: backoffice + quien muestra carta (cliente, comanda manual).
 *      NO emitir floor/table desde aquí: el plano vive en recepción.
 *
 * C) RECEPTORES (frontend — hoy solo cargan al montar / HTTP)
 *
 *    Cliente (`CustomerMenuView`, `OrdersHistorySheet`)
 *    - Escuchar order:status / order:new de su `mesa:{tableId}`
 *      (sustituir TODOs de estado mock / sin recargar).
 *    - Escuchar menu:updated → refetch `getMenu()` o patch local.
 *
 *    Camarero (`WaiterView`, `ManualOrderPanel`)
 *    - order:new / notification:new → pendientes + avisos.
 *    - order:status (servido/alerta) → avisos plato_listo / incidencias.
 *    - table:status / floor:updated / tables:released → plano mesas.
 *    - menu:updated → refrescar carta en comanda manual.
 *    - Tras confirm/reject/manual: el backend emite; no hace falta que el
 *      propio emisor “emita desde el front” (los TODOs del front son recordatorios).
 *
 *    Cocina (`KitchenKDSView`)
 *    - order:status en_cocina → insertar ticket (caso que hoy no aparece en vivo).
 *    - order:item:done / order:alert / order:status servido|restaurar → sync KDS.
 *    - El TODO de “emitir incidencia a sala” se resuelve en backend
 *      (patchOrderAlert), no emitiendo desde el navegador.
 *
 *    Recepción (`ReceptionDashboardView`)
 *    - floor:updated / table:status / tables:released → plano en vivo
 *      (otra tablet/PC de recepción o camarero concurrente).
 *    - QR: generación en UI de recepción (lote / por mesa); si el token/URL
 *      de mesa cambia, valorar evento dedicado o incluir en floor:updated.
 *      Las mesas NUNCA se administran desde backoffice.
 *
 *    Backoffice (`AdminDashboardView` — aún placeholder)
 *    - CRUD carta, imágenes (multer), categorías, datos del restaurante.
 *    - Tras mutar → menu:updated (y futuros eventos `restaurant:*` si hay
 *      ajustes globales: nombre, horarios, etc.).
 *    - Suscribirse a menu:updated si hay varias sesiones admin.
 *    - Fuera de alcance socket de mesas/plano (eso es recepción).
 *
 * D) ORDEN DE IMPLEMENTACIÓN SUGERIDO
 * 1. Bootstrap + getIO + rooms staff/mesa.
 * 2. Flujo crítico comanda: sendRound → confirmRound → KDS (order:*).
 * 3. Avisos sala: ayuda, cuenta, plato_listo, alertas cocina.
 * 4. Plano: floor:updated + table:status + liberar limpias.
 * 5. Carta en vivo: CRUD backoffice + menu:updated → cliente/camarero.
 *
 * E) FUERA DE SOCKET (sigue siendo HTTP)
 * - Login PIN / JWT.
 * - Carga inicial de plano, menú, tickets, pendientes (socket complementa).
 * - Subida binaria de imágenes (multipart); el socket solo avisa el cambio.
 */

/**
 * Engancha Socket.io al servidor HTTP compartido con Express.
 *
 * @param _httpServer - Servidor creado con `createServer(app)` en `src/index.ts`.
 */
export function registerSockets(_httpServer: HttpServer): void {
  // TODO(sockets): const io = new Server(_httpServer, { cors: { ... } });
  // TODO(sockets): auth middleware + join rooms + handlers de conexión.
  // TODO(sockets): guardar instancia para getIO() y emitir desde controllers.
  void SOCKET_EVENTS;
  void _httpServer;
}

/**
 * Acceso a la instancia IO desde controladores (tras registerSockets).
 *
 * @throws Error si se llama antes de registrar sockets.
 */
export function getIO(): never {
  // TODO(sockets): devolver la instancia real de Server.
  throw new Error(
    "Socket.io aún no está registrado. Implementar registerSockets + getIO.",
  );
}
