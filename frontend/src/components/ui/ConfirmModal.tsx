import {
  useEffect,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react";

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

const ANIMATION_MS = 200;

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
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  if (open && !visible) {
    setVisible(true);
  }

  if (!open && entered) {
    setEntered(false);
  }

  useEffect(() => {
    if (!open || !visible) return;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });

    return () => cancelAnimationFrame(id);
  }, [open, visible]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onCancel]);

  if (!visible) return null;

  const styles = toneStyles[tone];

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "opacity") return;
    if (!open && !entered) {
      setVisible(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar confirmación"
        className={`absolute inset-0 bg-text-main/45 transition-opacity ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${ANIMATION_MS}ms` }}
        onClick={onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className={`relative z-10 w-full max-w-xs overflow-hidden rounded-[14px] bg-canvas-white shadow-lg transition-[opacity,transform] ease-out ${
          entered ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        style={{ transitionDuration: `${ANIMATION_MS}ms` }}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className="px-5 pt-5 pb-4">
          {icon && (
            <div className={`mb-3 flex justify-center ${styles.icon}`}>
              {icon}
            </div>
          )}
          <h2
            id="confirm-modal-title"
            className="text-center text-[16px] font-bold text-text-main"
          >
            {title}
          </h2>
          <p
            id="confirm-modal-description"
            className="mt-2 text-center text-[13px] leading-relaxed text-text-muted"
          >
            {description}
          </p>
        </div>

        <div className="flex">
          <button
            type="button"
            onClick={onCancel}
            className={`flex flex-1 items-center justify-center border-0 px-3 py-3 text-[13px] font-bold ${styles.cancel}`}
          >
            <span className="inline-block transition-transform active:scale-95">
              {cancelLabel}
            </span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex flex-1 items-center justify-center border-0 px-3 py-3 text-[13px] font-bold ${styles.confirm}`}
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
