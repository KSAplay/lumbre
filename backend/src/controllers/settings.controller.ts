import type { Request, Response } from "express";
import { getOrCreateSettings } from "../models/Settings.js";
import { HttpError } from "../utils/httpError.js";
import { SOCKET_EVENTS, SOCKET_ROOMS } from "../sockets/events.js";
import { emitTo } from "../sockets/io.js";

/**
 * Devuelve los ajustes generales del restaurante.
 */
export async function getSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getOrCreateSettings();
  res.json({ restaurantName: settings.restaurantName });
}

/**
 * Actualiza el nombre del restaurante.
 */
export async function patchSettings(req: Request, res: Response): Promise<void> {
  const raw = req.body?.restaurantName;
  if (typeof raw !== "string") {
    throw new HttpError(400, "El nombre del restaurante es obligatorio");
  }
  const restaurantName = raw.trim();
  if (!restaurantName) {
    throw new HttpError(400, "El nombre del restaurante no puede estar vacío");
  }
  if (restaurantName.length > 60) {
    throw new HttpError(400, "El nombre no puede superar 60 caracteres");
  }

  const settings = await getOrCreateSettings();
  settings.restaurantName = restaurantName;
  await settings.save();

  emitTo([SOCKET_ROOMS.backoffice], SOCKET_EVENTS.SETTINGS_UPDATED, {
    ok: true,
  });
  res.json({ restaurantName: settings.restaurantName });
}
