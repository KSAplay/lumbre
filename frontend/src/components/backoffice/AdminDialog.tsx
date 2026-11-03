import { type ReactNode } from "react";
import { X } from "lucide-react";
import { useCenterModalMotion } from "../ui/useCenterModalMotion";

type AdminDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  /** Clase de ancho máximo; por defecto `max-w-lg`. */
  maxWidthClass?: string;
};

/**
 * Modal centrado del backoffice.
 * Entrada y salida son una sola animación; el nodo se desmonta al terminar la salida.
 */
export const AdminDialog = ({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidthClass = "max-w-lg",
}: AdminDialogProps) => {
  const { mounted, entering, handleAnimationEnd } = useCenterModalMotion(open);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className={`absolute inset-0 bg-text-main/45 ${
          entering ? "animate-admin-backdrop-in" : "animate-admin-backdrop-out"
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        className={`relative z-10 flex max-h-[min(90dvh,720px)] w-full flex-col overflow-hidden rounded-[14px] bg-canvas-white shadow-lg ${maxWidthClass} ${
          entering ? "animate-admin-dialog-in" : "animate-admin-dialog-out"
        }`}
        onAnimationEnd={handleAnimationEnd}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-50 px-5 py-4">
          <h2
            id="admin-dialog-title"
            className="text-base font-bold text-text-main"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted hover:bg-canvas-muted hover:text-text-main"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-50 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
