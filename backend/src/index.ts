import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { registerSockets } from "./sockets/index.js";

/**
 * Arranca el backend: conecta a MongoDB, asocia Express a un servidor HTTP
 * nativo y escucha en el puerto configurado.
 *
 * Se usa `createServer(app)` en lugar de `app.listen` para compartir el mismo
 * puerto HTTP con Socket.io.
 *
 * @throws Error si falla la conexión a MongoDB o faltan variables de entorno.
 */
async function main(): Promise<void> {
  /** Conecta a MongoDB. */
  await connectDB();

  /** Crea la aplicación Express. */
  const app = createApp();
  /** Crea el servidor HTTP. */
  const httpServer = createServer(app);
  /** Asocia Socket.io al servidor HTTP. */
  registerSockets(httpServer);

  /** Escucha en el puerto configurado. */
  httpServer.listen(env.PORT, () => {
    /** Muestra el mensaje de inicio del servidor. */
    console.log(`[server] Escuchando en http://localhost:${env.PORT}`);
    /** Muestra la URL de salud del servidor. */
    console.log(`[server] Health: http://localhost:${env.PORT}/api/health`);
  });
}

/** Arranca el backend. */
main().catch((err: unknown) => {
  /** Muestra el mensaje de error si no se puede arrancar. */
  console.error("[server] No se pudo arrancar:", err);
  /** Sale con código de error 1. */
  process.exit(1);
});
