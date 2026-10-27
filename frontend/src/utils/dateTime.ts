/**
 * Indica si se debe usar el formato de 12 horas.
 * Cambiar esta constante actualiza la hora en todo el proyecto (reloj, reservas, etc.).
 *
 * TODO: sustituir por el valor cargado desde la configuración del restaurante en BBDD
 * (p. ej. al hidratar el store / contexto de settings al arrancar la app).
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

/**
 * Formatea una hora almacenada en 24h ("HH:mm" o "H:mm") con el formato global.
 */
export const formatStoredTime = (hhmm: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return hhmm;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return hhmm;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return formatAppTime(date);
};
