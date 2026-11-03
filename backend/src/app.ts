import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middleware/error.middleware.js";
import apiRouter from "./routes/index.js";

/** Directorio de las imágenes de platos. */
const UPLOADS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../uploads",
);

/** Crea la aplicación Express (sin escuchar el puerto). */
export function createApp() {
  const app = express();

  /** Permite peticiones desde el frontend. */
  app.use(cors());

  /** Parsea el body JSON de POST/PUT/PATCH (req.body). */
  app.use(express.json());

  /** Imágenes de platos: /uploads/dishes/<archivo> → backend/uploads/dishes. */
  app.use("/uploads", express.static(UPLOADS_DIR));

  /** Todas las rutas de la API cuelgan de /api. */
  app.use("/api", apiRouter);

  // Captura errores de controladores/rutas y responde en JSON.
  app.use(errorMiddleware);

  return app;
}
