import type { Server } from "socket.io";
import type { SocketEventName } from "./events.js";

let io: Server | null = null;

/**
 * Guarda la instancia creada en {@link registerSockets}.
 *
 * @param server - Servidor Socket.io ya enganchado al HTTP server.
 */
export function setIO(server: Server): void {
  io = server;
}

/**
 * Instancia compartida para emitir desde los controladores.
 *
 * @throws Error si se llama antes de `registerSockets`.
 */
export function getIO(): Server {
  if (!io) {
    throw new Error(
      "Socket.io aún no está registrado. Llama a registerSockets al arrancar.",
    );
  }
  return io;
}

/**
 * Emite un evento a la unión de varias salas.
 * Un cliente que esté en más de una sala lo recibe una sola vez.
 *
 * @param rooms - Salas destino.
 * @param event - Nombre del contrato en `events.ts`.
 * @param payload - Datos mínimos para que la vista decida qué recargar.
 */
export function emitTo(
  rooms: readonly string[],
  event: SocketEventName,
  payload: object,
): void {
  const [first, ...rest] = rooms;
  if (!first) return;

  const server = getIO();
  let target = server.to(first);
  for (const room of rest) {
    target = target.to(room);
  }
  target.emit(event, payload);
}
