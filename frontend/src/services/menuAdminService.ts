import { apiFormRequest, apiRequest } from "../config/api";
import type { AdminCategory } from "../types/admin";
import type { Dish } from "../types/menu";

export type DishPayload = {
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable?: boolean;
};

/**
 * Lista todas las categorías (activas e inactivas) para el backoffice.
 *
 * @throws Error si falla la red.
 */
export async function listAdminCategories(): Promise<AdminCategory[]> {
  const data = await apiRequest<{ categories: AdminCategory[] }>(
    "/menu/categorias",
  );
  return data.categories;
}

/**
 * Crea una categoría de carta.
 *
 * @throws Error si el nombre choca o falla la red.
 */
export async function createCategory(name: string): Promise<AdminCategory> {
  const data = await apiRequest<{ category: AdminCategory }>(
    "/menu/categorias",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
  );
  return data.category;
}

/**
 * Actualiza nombre, orden o visibilidad de una categoría.
 *
 * @throws Error si no existe o falla la red.
 */
export async function updateCategory(
  slug: string,
  payload: Partial<Pick<AdminCategory, "label" | "sortOrder" | "active">>,
): Promise<AdminCategory> {
  const body: { name?: string; sortOrder?: number; active?: boolean } = {};
  if (payload.label !== undefined) body.name = payload.label;
  if (payload.sortOrder !== undefined) body.sortOrder = payload.sortOrder;
  if (payload.active !== undefined) body.active = payload.active;
  const data = await apiRequest<{ category: AdminCategory }>(
    `/menu/categorias/${slug}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return data.category;
}

/**
 * Crea un plato en la carta.
 *
 * @throws Error si el body es inválido o falla la red.
 */
export async function createDish(payload: DishPayload): Promise<Dish> {
  const data = await apiRequest<{ dish: Dish }>("/menu/platos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.dish;
}

/**
 * Actualiza ficha o disponibilidad de un plato.
 *
 * @throws Error si no existe o falla la red.
 */
export async function updateDish(
  code: number,
  payload: Partial<DishPayload>,
): Promise<Dish> {
  const data = await apiRequest<{ dish: Dish }>(`/menu/platos/${code}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.dish;
}

/**
 * Sube o sustituye la foto de un plato.
 *
 * @returns Ruta pública de la imagen.
 * @throws Error si el archivo no es válido o falla la red.
 */
export async function uploadDishImage(
  code: number,
  file: File,
): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const data = await apiFormRequest<{ imageUrl: string }>(
    `/menu/platos/${code}/imagen`,
    form,
  );
  return data.imageUrl;
}
