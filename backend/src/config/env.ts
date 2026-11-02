import dotenv from "dotenv";

/**
 * Carga el archivo `.env` de la carpeta `backend/` hacia `process.env`.
 */
dotenv.config();

/**
 * Lee una variable de entorno obligatoria.
 *
 * @param name - Nombre de la clave en `.env`.
 * @returns El valor no vacío de esa variable.
 * @throws Error si falta o está vacía.
 */
function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Falta la variable de entorno "${name}". Revisa backend/.env (usa .env.example como plantilla).`,
    );
  }
  return value;
}

/** Puerto HTTP donde Express escuchará (por defecto 3000). */
const portRaw = process.env.PORT?.trim() || "3000";
const PORT = Number(portRaw);

/** Verifica que el puerto sea un número entero positivo. */
if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error(`PORT inválido: "${portRaw}". Usa un número entero positivo.`);
}

/**
 * Variables de entorno validadas para el backend.
 * Importa `{ env }` desde aquí en lugar de usar `process.env`.
 */
export const env = {
  /** Puerto del servidor HTTP (ej. 3000). */
  PORT,
  /** Cadena de conexión a MongoDB Atlas. */
  MONGODB_URI: requireEnv("MONGODB_URI"),
  /** Secreto para firmar y verificar JWT del staff. */
  JWT_SECRET: requireEnv("JWT_SECRET"),
} as const;
