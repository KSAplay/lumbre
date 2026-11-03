import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { STAFF_ROLES, type StaffRole } from "../models/Staff.js";
import { Table } from "../models/Table.js";
import { verifyStaffToken } from "../utils/jwt.js";
import { SOCKET_ROOMS } from "./events.js";
import { setIO } from "./io.js";

/**
 * Engancha Socket.io al mismo puerto que Express.
 *
 * Staff entra con el JWT del login. El cliente de mesa entra con el id de la
 * URL (`/mesa/:tableId`), que puede ser el `_id` del plano o el número visible.
 *
 * @param httpServer - Servidor creado con `createServer(app)`.
 */
export function registerSockets(httpServer: HttpServer): void {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use((socket, next) => {
    void authorizeSocket(socket)
      .then(() => next())
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "No autorizado";
        next(new Error(message));
      });
  });

  io.on("connection", (socket) => {
    const role = socket.data.role as string | undefined;
    if (role === "cliente") {
      const tableId = socket.data.tableId as string;
      void socket.join(`mesa:${tableId}`);
      void socket.join(SOCKET_ROOMS.menu);
      return;
    }

    if (!role || !isStaffRole(role)) return;

    void socket.join(`staff:${role}`);
    if (role === "camarero" || role === "backoffice") {
      void socket.join(SOCKET_ROOMS.menu);
    }
  });

  setIO(io);
}

/**
 * Admite JWT de personal o el identificador de mesa del cliente.
 *
 * @throws Error si no hay credencial válida o la mesa no existe.
 */
async function authorizeSocket(socket: {
  handshake: { auth?: unknown };
  data: { role?: string; tableId?: string; staffId?: string };
}): Promise<void> {
  const auth = socket.handshake.auth;
  const token =
    auth && typeof auth === "object" && "token" in auth
      ? (auth as { token?: unknown }).token
      : undefined;
  const tableKey =
    auth && typeof auth === "object" && "tableId" in auth
      ? (auth as { tableId?: unknown }).tableId
      : undefined;

  if (typeof token === "string" && token.trim()) {
    const payload = verifyStaffToken(token.trim());
    if (!isStaffRole(payload.role)) {
      throw new Error("Rol de personal no válido");
    }
    socket.data.role = payload.role;
    socket.data.staffId = payload.sub;
    return;
  }

  if (typeof tableKey === "string" && tableKey.trim()) {
    const table = await findCustomerTable(tableKey.trim());
    if (!table) {
      throw new Error("Mesa no válida");
    }
    socket.data.role = "cliente";
    socket.data.tableId = table._id;
    return;
  }

  throw new Error("No autorizado");
}

/**
 * Busca la mesa por `_id` o, si el QR trae el número visible, por `number`.
 */
async function findCustomerTable(raw: string) {
  const byId = await Table.findById(raw);
  if (byId) return byId;

  const asNumber = Number(raw);
  if (!Number.isInteger(asNumber) || asNumber <= 0) return null;
  return Table.findOne({ number: asNumber });
}

function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}
