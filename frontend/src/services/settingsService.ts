import { apiRequest } from "../config/api";
import type { RestaurantSettings } from "../types/admin";

/**
 * Lee los ajustes generales del restaurante.
 *
 * @throws Error si falla la red.
 */
export async function getSettings(): Promise<RestaurantSettings> {
  return apiRequest<RestaurantSettings>("/settings");
}

/**
 * Actualiza el nombre del restaurante.
 *
 * @param restaurantName - Nombre visible.
 * @throws Error si el nombre es inválido o falla la red.
 */
export async function updateSettings(
  restaurantName: string,
): Promise<RestaurantSettings> {
  return apiRequest<RestaurantSettings>("/settings", {
    method: "PATCH",
    body: JSON.stringify({ restaurantName }),
  });
}
