import { useEffect, type ReactNode } from "react";
import { useCenterModalMotion } from "./useCenterModalMotion";

export type ConfirmModalTone = "cacao" | "terracotta" | "purple";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  icon?: ReactNode;
  tone?: ConfirmModalTone;
  onConfirm: () => void;
  onCancel: () => void;
};

const toneStyles: Record<
  ConfirmModalTone,
  { confirm: string; cancel: string; icon: string }
> = {
  cacao: {
    confirm: "bg-cacao-300 text-white",
    cancel: "bg-cacao-100 text-cacao-300",
    icon: "text-cacao-300",
  },
  terracotta: {
    confirm: "bg-terracotta-400 text-white",
    cancel: "bg-terracotta-100 text-terracotta-400",
    icon: "text-terracotta-400",
  },
  purple: {
    confirm: "bg-table-cuenta text-white",
    cancel: "bg-toast-purple-soft text-toast-purple",
    icon: "text-toast-purple",
  },
};

export const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  icon,
  tone = "terracotta",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const { mounted, entering, handleAnimationEnd } = useCenterModalMotion(open);

  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, onCancel]);

  if (!mounted) return null;

  const styles = toneStyles[tone];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar confirmación"
        className={`absolute inset-0 bg-text-main/45 ${
          entering ? "animate-admin-backdrop-in" : "animate-admin-backdrop-out"
        }`}
        onClick={onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-[14px] bg-canvas-white shadow-lg ${
          entering ? "animate-admin-dialog-in" : "animate-admin-dialog-out"
        }`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
          {icon && (
            <div className={`mb-3 flex justify-center ${styles.icon}`}>
              {icon}
            </div>
          )}
          <h2
            id="confirm-modal-title"
            className="text-center text-lg font-bold text-text-main"
          >
            {title}
          </h2>
          <p
            id="confirm-modal-description"
            className="mt-2 text-center text-sm leading-relaxed text-text-muted"
          >
            {description}
          </p>
        </div>

        <div className="flex">
          <button
            type="button"
            onClick={onCancel}
            className={`flex flex-1 cursor-pointer items-center justify-center border-0 px-4 py-3.5 text-sm font-bold ${styles.cancel}`}
          >
            <span className="inline-block transition-transform active:scale-95">
              {cancelLabel}
            </span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex flex-1 cursor-pointer items-center justify-center border-0 px-4 py-3.5 text-sm font-bold ${styles.confirm}`}
          >
            <span className="inline-block transition-transform active:scale-95">
              {confirmLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
