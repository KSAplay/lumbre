/**
 * Parsea hexadecimal a { r, g, b }
 * @param hex - El color en formato hexadecimal
 * @returns El color en formato { r: number, g: number, b: number }
 */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return {
      r: parseInt(raw[0]! + raw[0]!, 16),
      g: parseInt(raw[1]! + raw[1]!, 16),
      b: parseInt(raw[2]! + raw[2]!, 16),
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  return null;
}

/**
 * Convierte { r, g, b } a hexadecimal
 * @param r - El valor rojo (0-255)
 * @param g - El valor verde (0-255)
 * @param b - El valor azul (0-255)
 * @returns El color en formato hexadecimal
 */
function toHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * Oscurece un color hexadecimal.
 * @param hex - El color en formato hexadecimal
 * @param amount 0–1 (p. ej. 0.25 = 25% más oscuro hacia negro)
 * @returns El color oscurecido en formato hexadecimal
 */
export function darkenColor(hex: string, amount = 0.25): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const t = Math.max(0, Math.min(1, amount));
  return toHex(rgb.r * (1 - t), rgb.g * (1 - t), rgb.b * (1 - t));
}

/**
 * Aclara un color hexadecimal.
 * @param hex - El color en formato hexadecimal
 * @param amount 0–1 (p. ej. 0.35 = 35% más claro hacia blanco)
 * @returns El color aclarado en formato hexadecimal
 */
export function lightenColor(hex: string, amount = 0.35): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const t = Math.max(0, Math.min(1, amount));
  return toHex(
    rgb.r + (255 - rgb.r) * t,
    rgb.g + (255 - rgb.g) * t,
    rgb.b + (255 - rgb.b) * t,
  );
}
