const euroFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

/**
 * Formatea un importe en euros con locale `es-ES`.
 *
 * @param value - Cantidad en euros.
 */
export function formatEuro(value: number): string {
  return euroFormatter.format(value);
}
