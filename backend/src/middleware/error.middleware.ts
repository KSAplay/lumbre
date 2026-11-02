import type { ErrorRequestHandler } from "express";

/**
 * Middleware final de Express: convierte errores no capturados en JSON.
 * Debe registrarse después de las rutas en `app.ts`.
 */
export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  /** Imprime el error en la consola. */
  console.error("[error]", err);
  /** Obtiene el estado del error. */
  const status =
    typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;

  /** Obtiene el mensaje del error. */
  const message =
    err instanceof Error ? err.message : "Error interno del servidor";

  /** Responde con el error. */
  res.status(status).json({
    ok: false,
    message,
  });
};
