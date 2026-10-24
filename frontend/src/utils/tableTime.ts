/**
 * Formatea el tiempo transcurrido en estado de mesa:
 * 0–59 s → "Ns"; 1–59 min → "N min"; ≥ 60 min → "N h"
 * @param totalSeconds - Los segundos transcurridos
 * @returns El tiempo transcurrido formateado
 */
export function formatStatusElapsed(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));

  if (sec < 60) {
    return `${sec}s`;
  }

  const minutes = Math.floor(sec / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }

  return `${Math.floor(minutes / 60)} h`;
}

/**
 * Calcula los segundos transcurridos desde statusChangedAt
 * @param statusChangedAt - La fecha de cambio de estado
 * @param nowMs - La fecha actual en milisegundos
 * @returns Los segundos transcurridos desde statusChangedAt
 */
export function elapsedSecondsSince(
  statusChangedAt: number,
  nowMs: number,
): number {
  return Math.max(0, Math.floor((nowMs - statusChangedAt) / 1000));
}
