import { io, type Socket } from "socket.io-client";
import { API_ORIGIN, getStaffToken } from "../config/api";

type Listener = () => void;

let socket: Socket | null = null;
let socketKey = "";
let sawConnect = false;
const listeners = new Map<string, Set<Listener>>();
const reconnectListeners = new Set<Listener>();
const boundEvents = new Set<string>();

/**
 * Abre el socket de personal con el JWT de la sesión.
 * Si ya está conectado con el mismo token, no hace nada.
 */
export function connectStaff(): void {
  const token = getStaffToken();
  if (!token) return;
  openSocket({ token }, `staff:${token}`);
}

/**
 * Abre el socket de una mesa. `tableId` es el parámetro de `/mesa/:tableId`
 * (número visible o id del plano).
 *
 * @param tableId - Identificador que trae la URL de la carta.
 */
export function connectTable(tableId: string): void {
  if (!tableId) return;
  openSocket({ tableId }, `table:${tableId}`);
}

/** Cierra el socket y olvida la sesión de tiempo real. */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  socketKey = "";
  sawConnect = false;
  boundEvents.clear();
}

/**
 * Se suscribe a un evento. Devuelve la función que anula la suscripción.
 *
 * @param event - Nombre del contrato.
 * @param handler - Se llama sin payload: la vista recarga por HTTP.
 */
export function onSocketEvent(event: string, handler: Listener): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(handler);
  bind(event);
  return () => {
    set?.delete(handler);
  };
}

/**
 * Avisa cuando el socket vuelve a conectar, no en la primera conexión.
 * Sirve para recuperar eventos perdidos durante un corte.
 */
export function onSocketReconnect(handler: Listener): () => void {
  reconnectListeners.add(handler);
  return () => {
    reconnectListeners.delete(handler);
  };
}

function openSocket(
  auth: { token: string } | { tableId: string },
  key: string,
): void {
  if (socket && socketKey === key) return;

  socket?.disconnect();
  sawConnect = false;
  boundEvents.clear();
  socketKey = key;
  socket = io(API_ORIGIN, {
    auth,
    autoConnect: true,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    if (sawConnect) {
      for (const handler of reconnectListeners) handler();
    }
    sawConnect = true;
  });

  for (const event of listeners.keys()) bind(event);
}

function bind(event: string): void {
  if (!socket || boundEvents.has(event)) return;
  boundEvents.add(event);
  socket.on(event, () => {
    const set = listeners.get(event);
    if (!set) return;
    for (const handler of set) handler();
  });
}
