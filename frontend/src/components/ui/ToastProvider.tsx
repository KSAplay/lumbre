import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Toast, type ToastTone } from "./Toast";
import {
  ToastContext,
  type ToastInput,
  type ToastPosition,
} from "./toastContext";

type ToastItem = ToastInput & {
  id: number;
  tone: ToastTone;
  position: ToastPosition;
  durationMs: number;
};

const DEFAULT_DURATION_MS = 3500;
const DEFAULT_POSITION: ToastPosition = "top-center";
const DEFAULT_TONE: ToastTone = "cacao";

const positionClasses: Record<ToastPosition, string> = {
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
};

let toastId = 0;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = ++toastId;
    setToasts((prev) => [
      ...prev,
      {
        id,
        message: toast.message,
        icon: toast.icon,
        tone: toast.tone ?? DEFAULT_TONE,
        position: toast.position ?? DEFAULT_POSITION,
        durationMs: toast.durationMs ?? DEFAULT_DURATION_MS,
      },
    ]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const grouped = useMemo(() => {
    const map = new Map<ToastPosition, ToastItem[]>();
    for (const toast of toasts) {
      const list = map.get(toast.position) ?? [];
      list.push(toast);
      map.set(toast.position, list);
    }
    return map;
  }, [toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {[...grouped.entries()].map(([position, items]) => (
        <div
          key={position}
          className={`pointer-events-none fixed z-60 flex w-[min(100%-2rem,22rem)] flex-col gap-2 ${positionClasses[position]}`}
        >
          {items.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              icon={toast.icon}
              tone={toast.tone}
              durationMs={toast.durationMs}
              position={position}
              onClose={() => dismissToast(toast.id)}
            />
          ))}
        </div>
      ))}
    </ToastContext.Provider>
  );
};
