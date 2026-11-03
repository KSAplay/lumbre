import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import { HttpError } from "../utils/httpError.js";

const UPLOADS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../uploads",
);

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

/**
 * Raíz de archivos públicos servidos en `/uploads`.
 */
export function uploadsDir(): string {
  return UPLOADS_DIR;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function extensionOf(file: Express.Multer.File): string {
  const fromName = path.extname(file.originalname).toLowerCase();
  if (fromName === ".png" || fromName === ".jpg" || fromName === ".jpeg" || fromName === ".webp") {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }
  return MIME_EXT[file.mimetype] ?? ".png";
}

function makeStorage(subdir: string) {
  const dest = path.join(UPLOADS_DIR, subdir);
  ensureDir(dest);
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      cb(null, `${stamp}${extensionOf(file)}`);
    },
  });
}

function imageFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new HttpError(400, "Formato de imagen no válido. Usa PNG, JPEG o WebP."));
    return;
  }
  cb(null, true);
}

const limits = { fileSize: MAX_FILE_BYTES };

export const uploadDishImage = multer({
  storage: makeStorage("dishes"),
  fileFilter: imageFilter,
  limits,
}).single("image");

export const uploadStaffImage = multer({
  storage: makeStorage("staff"),
  fileFilter: imageFilter,
  limits,
}).single("image");

/**
 * Borra un archivo de `/uploads` si la ruta apunta a esa carpeta.
 *
 * @param imageUrl - Ruta pública (`/uploads/dishes/...`); se ignora si está vacía o es externa.
 */
export async function removeUploadedFile(
  imageUrl: string | null | undefined,
): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const relative = imageUrl.replace(/^\/uploads\//, "");
  const abs = path.join(UPLOADS_DIR, relative);
  try {
    await fs.promises.unlink(abs);
  } catch {
    /* el archivo puede no existir */
  }
}
