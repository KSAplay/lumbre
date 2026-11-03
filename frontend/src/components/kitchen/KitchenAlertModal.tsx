import { useEffect } from "react";
import { Check, TriangleAlert } from "lucide-react";
import {
  KITCHEN_ALERT_ORDER,
  KITCHEN_ALERTS,
} from "../../constants/kitchenAlerts";
import type { KitchenAlertType } from "../../types/kitchen";
import { useCenterModalMotion } from "../ui/useCenterModalMotion";

type KitchenAlertModalProps = {
  open: boolean;
  /** Subtítulo con la comanda afectada, p. ej. "Mesa 01 · #3" */
  subtitle: string;
  activeAlert: KitchenAlertType | null;
  onSelect: (alert: KitchenAlertType) => void;
  onClear: () => void;
  onClose: () => void;
};

export const KitchenAlertModal = ({
  open,
  subtitle,
  activeAlert,
  onSelect,
  onClear,
  onClose,
}: KitchenAlertModalProps) => {
  const { mounted, entering, handleAnimationEnd } = useCenterModalMotion(open);

  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar incidencias"
        className={`absolute inset-0 bg-text-main/45 ${
          entering ? "animate-admin-backdrop-in" : "animate-admin-backdrop-out"
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kitchen-alert-title"
        className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-[18px] bg-canvas-white shadow-lg ${
          entering ? "animate-admin-dialog-in" : "animate-admin-dialog-out"
        }`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="px-8 pt-7 pb-8">
          <div className="mb-3 flex justify-center text-latte-400">
            <TriangleAlert className="size-10" strokeWidth={2} />
          </div>
          <h2
            id="kitchen-alert-title"
            className="text-center text-2xl font-bold text-text-main"
          >
            Avisar incidencia
          </h2>
          <p className="mt-1.5 text-center text-base text-text-muted">
            {subtitle}
          </p>

          <div className="mt-7 grid grid-cols-3 gap-6">
            {KITCHEN_ALERT_ORDER.map((type) => {
              const config = KITCHEN_ALERTS[type];
              const isActive = activeAlert === type;

              return (
                <div key={type} className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    aria-label={config.label}
                    onClick={() => onSelect(type)}
                    className={`relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-[18px] text-white shadow-md transition-[transform,box-shadow] duration-150 active:scale-95 ${config.bg} ${
                      isActive
                        ? `ring-4 ring-offset-4 ring-offset-canvas-white ${config.ring}`
                        : ""
                    }`}
                  >
                    <config.icon className="size-16" strokeWidth={2} />
                    {isActive && (
                      <span className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-canvas-white">
                        <Check
                          className={`size-4 ${config.text}`}
                          strokeWidth={3.5}
                        />
                      </span>
                    )}
                  </button>
                  <span className="text-center text-lg font-bold text-text-main">
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex">
          <button
            type="button"
            onClick={onClose}
            className="group flex flex-1 cursor-pointer items-center justify-center border-0 bg-latte-100 px-3 py-4 text-lg font-bold text-latte-500"
          >
            <span className="inline-block transition-transform group-active:scale-95">
              Cerrar
            </span>
          </button>
          {activeAlert && (
            <button
              type="button"
              onClick={onClear}
              className="group flex flex-1 cursor-pointer items-center justify-center border-0 bg-latte-400 px-3 py-4 text-lg font-bold text-white"
            >
              <span className="inline-block transition-transform group-active:scale-95">
                Incidencia resuelta
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
