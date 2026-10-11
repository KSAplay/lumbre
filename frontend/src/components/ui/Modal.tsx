import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string; // Para pasar clases personalizadas (ej. bordes de ticket)
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  showCloseButton = true,
}) => {
  // Cerrar con la tecla Escape y bloquear el scroll de fondo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop oscuro con blur */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Contenedor del Modal */}
      <div
        className={`relative z-10 w-full max-w-lg bg-canvas-white rounded-2xl shadow-2xl p-6 overflow-hidden animate-scale-up ${className}`}
      >
        {/* Encabezado si se proporciona un título o botón de cierre */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            {title && (
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Contenido libre pasado como children */}
        <div>{children}</div>
      </div>
    </div>
  );
};
