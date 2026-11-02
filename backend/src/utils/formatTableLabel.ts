/** Etiqueta de sala a partir del número visible de mesa. */
export function formatTableLabel(number: number): string {
  return `Mesa ${String(number).padStart(2, "0")}`;
}
