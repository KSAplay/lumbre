import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Abre la conexión de Mongoose con la URI de `.env`.
 *
 * Conviene llamarla una sola vez al arrancar (`index.ts`), antes de aceptar peticiones.
 * Los modelos (`Staff`, `Table`, etc.) reutilizan esta misma conexión.
 *
 * @throws Error si Atlas/red rechazan la URI o no hay conectividad.
 */
export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI);

  const dbName = mongoose.connection.name;
  console.log(`[db] MongoDB conectado (base: ${dbName || "por defecto"})`);
}

/**
 * Cierra la conexión de forma limpia (útil al apagar el proceso o en scripts).
 */
export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log("[db] MongoDB desconectado");
}
