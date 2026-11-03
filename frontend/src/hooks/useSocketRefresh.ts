import { useEffect, useRef } from "react";
import { onSocketEvent, onSocketReconnect } from "../services/socketClient";

const REFRESH_DELAY_MS = 120;

/**
 * Recarga datos cuando llega cualquiera de los eventos, o al reconectar.
 * Varios eventos seguidos se agrupan en una sola llamada.
 *
 * @param events - Nombres a escuchar. La lista debe ser estable.
 * @param reload - Petición HTTP que ya usa la vista. No debe activar el esqueleto.
 * @param enabled - Si es false, no se suscribe (por ejemplo, sin mesa).
 */
export function useSocketRefresh(
  events: readonly string[],
  reload: () => void,
  enabled = true,
): void {
  const reloadRef = useRef(reload);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  const key = events.join("\0");

  useEffect(() => {
    if (!enabled) return;

    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        reloadRef.current();
      }, REFRESH_DELAY_MS);
    };

    const names = key ? key.split("\0") : [];
    const offs = names.map((event) => onSocketEvent(event, schedule));
    const offReconnect = onSocketReconnect(schedule);

    return () => {
      window.clearTimeout(timer);
      for (const off of offs) off();
      offReconnect();
    };
  }, [enabled, key]);
}
