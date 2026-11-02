import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

/**
 * Arranca el backend: conecta a MongoDB, asocia Express a un servidor HTTP
 * nativo y escucha en el puerto configurado.
 *
 * Se usa `createServer(app)` en lugar de `app.listen` para compartir el mismo
 * puerto HTTP con Socket.io cuando se registre el módulo de tiempo real.
 *
 * @throws Error si falla la conexión a MongoDB o faltan variables de entorno.
 */
async function main(): Promise<void> {
  await connectDB();

  const app = createApp();
  const httpServer = createServer(app);

  /**
   * TODO(sockets): Registrar Socket.io sobre `httpServer`.
   * Checklist de eventos/rooms/emisores: `src/sockets/index.ts` + `events.ts`.
   */
  // import { registerSockets } from "./sockets/index.js";
  // registerSockets(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`[server] Escuchando en http://localhost:${env.PORT}`);
    console.log(`[server] Health: http://localhost:${env.PORT}/api/health`);
  });
}

main().catch((err: unknown) => {
  console.error("[server] No se pudo arrancar:", err);
  process.exit(1);
});
