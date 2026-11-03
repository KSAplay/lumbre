import { useState, type AnimationEvent } from "react";

type Phase = "in" | "out";

/**
 * Mantiene montado un modal centrado durante la animación de salida.
 *
 * Misma curva que el diálogo del backoffice (`admin-dialog-in` / `out`).
 *
 * @param open - El padre pide mostrarlo. Al pasar a false empieza la salida.
 * @returns `mounted` mientras debe pintarse, `entering` para elegir la clase,
 * y el listener que desmonta al terminar la salida.
 */
export function useCenterModalMotion(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState<Phase>(open ? "in" : "out");

  if (open && !mounted) {
    setMounted(true);
    setPhase("in");
  } else if (open && phase === "out") {
    setPhase("in");
  } else if (!open && mounted && phase === "in") {
    setPhase("out");
  }

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (!event.animationName.includes("admin-dialog-out")) return;
    if (!open) setMounted(false);
  };

  return {
    mounted,
    entering: phase === "in",
    handleAnimationEnd,
  };
}
