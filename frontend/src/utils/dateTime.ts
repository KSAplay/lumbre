/**
 * Indica si se debe usar el formato de 12 horas.
 */
export const USE_12_HOUR_CLOCK = true;

/**
 * Formatea una fecha a un formato de fecha global.
 * @param date - La fecha a formatear
 * @returns La fecha formateada
 */
export const formatAppDate = (date: Date) =>
  date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/**
 * Formatea una fecha a un formato horario global.
 * @param date - La fecha a formatear
 * @param options - Las opciones de formateo (opcional) - showSeconds: indica si se deben mostrar los segundos
 * @returns La hora formateada (12 o 24 horas)
 */
export const formatAppTime = (
  date: Date,
  options: { showSeconds?: boolean } = {},
) => {
  const { showSeconds = false } = options;

  if (USE_12_HOUR_CLOCK) {
    return date.toLocaleTimeString("es-ES", {
      hour: "numeric",
      minute: "2-digit",
      second: showSeconds ? "2-digit" : undefined,
      hour12: true,
    });
  }

  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: false,
  });
};
