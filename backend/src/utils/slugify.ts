/**
 * Convierte un nombre visible en slug de categoría (`ENTRADAS`, `PRINCIPALES`).
 *
 * @param name - Texto de origen.
 * @returns Slug en mayúsculas, o cadena vacía si no queda ningún carácter útil.
 */
export function slugifyCategory(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return slug;
}
