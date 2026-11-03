import type { ErrorRequestHandler } from "express";
import multer from "multer";

/**
 * Middleware final de Express: convierte errores no capturados en JSON.
 * Debe registrarse después de las rutas en `app.ts`.
 */
export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[error]", err);

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "La imagen no puede superar 2 MB"
        : "No se pudo subir la imagen";
    res.status(400).json({ ok: false, message });
    return;
  }

  const status =
    typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;

  const message =
    err instanceof Error ? err.message : "Error interno del servidor";

  res.status(status).json({
    ok: false,
    message,
  });
};
