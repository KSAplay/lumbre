import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import type { ToastPosition } from "./toastContext";

/** Tono fuerte: barra, texto e iconos. El fondo suave usa el token *-soft. */
export type ToastTone =
  | "cacao"
  | "terracotta"
  | "latte"
  | "red"
  | "green"
  | "blue"
  | "purple";

const toneStyles: Record<
  ToastTone,
  { soft: string; strong: string; bar: string }
> = {
  cacao: {
    soft: "bg-toast-cacao-soft",
    strong: "text-toast-cacao",
    bar: "bg-toast-cacao",
  },
  terracotta: {
    soft: "bg-toast-terracotta-soft",
    strong: "text-toast-terracotta",
    bar: "bg-toast-terracotta",
  },
  latte: {
    soft: "bg-toast-latte-soft",
    strong: "text-toast-latte",
    bar: "bg-toast-latte",
  },
  red: {
    soft: "bg-toast-red-soft",
    strong: "text-toast-red",
    bar: "bg-toast-red",
  },
  green: {
    soft: "bg-toast-green-soft",
    strong: "text-toast-green",
    bar: "bg-toast-green",
  },
  blue: {
    soft: "bg-toast-blue-soft",
    strong: "text-toast-blue",
    bar: "bg-toast-blue",
  },
  purple: {
    soft: "bg-toast-purple-soft",
    strong: "text-toast-purple",
    bar: "bg-toast-purple",
  },
};

type ExitMode = "auto" | "dismiss";

type ToastProps = {
  message: string;
  icon?: ReactNode;
  tone: ToastTone;
  durationMs: number;
  position: ToastPosition;
  onClose: () => void;
};

export const Toast = ({
  message,
  icon,
  tone,
  durationMs,
  position,
  onClose,
}: ToastProps) => {
  const [exitMode, setExitMode] = useState<ExitMode | null>(null);
  const onCloseRef = useRef(onClose);
  const styles = toneStyles[tone];
  const fromTop = position.startsWith("top");

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setExitMode("auto"), durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [durationMs]);

  useEffect(() => {
    if (!exitMode) return;
    const fallbackId = window.setTimeout(() => onCloseRef.current(), 400);
    return () => window.clearTimeout(fallbackId);
  }, [exitMode]);

  const motionClass = exitMode
    ? exitMode === "dismiss"
      ? fromTop
        ? "animate-toast-dismiss-top"
        : "animate-toast-dismiss-bottom"
      : fromTop
        ? "animate-toast-out-top"
        : "animate-toast-out-bottom"
    : fromTop
      ? "animate-toast-in-top"
      : "animate-toast-in-bottom";

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (exitMode) onCloseRef.current();
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto relative flex overflow-hidden rounded-[10px] shadow-md ${styles.soft} ${styles.strong} ${motionClass}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className={`w-1.5 shrink-0 self-stretch ${styles.bar}`}
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
        {icon && <span className="shrink-0">{icon}</span>}
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug">
          {message}
        </p>
        <button
          type="button"
          aria-label="Cerrar notificación"
          onClick={() => setExitMode("dismiss")}
          className="shrink-0 rounded-md p-0.5 transition-transform active:scale-90"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
