import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Lock, LogOut, User } from "lucide-react";

type ReceptionUserMenuProps = {
  /** Si false, oculta "Finalizar Turno" (p. ej. en móvil) */
  showEndShift?: boolean;
};

/** Menú de sesión del recepcionista (bloquear / finalizar turno) */
export const ReceptionUserMenu = ({
  showEndShift = true,
}: ReceptionUserMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const goToLogin = () => {
    setOpen(false);
    navigate("/login");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/35 transition-transform hover:bg-white/30 active:scale-90 md:size-12"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menú de usuario"
      >
        <User className="size-5 md:size-6" strokeWidth={2.25} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 min-w-52 overflow-hidden rounded-lg bg-canvas-white py-1 shadow-lg ring-1 ring-slate-50"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-text-main transition-colors hover:bg-canvas-muted active:scale-[0.98]"
            onClick={goToLogin}
          >
            <Lock className="size-4 shrink-0 text-text-muted" />
            Bloquear Pantalla
          </button>
          {showEndShift && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-text-main transition-colors hover:bg-canvas-muted active:scale-[0.98]"
              onClick={goToLogin}
            >
              <LogOut className="size-4 shrink-0 text-text-muted" />
              Finalizar Turno
            </button>
          )}
        </div>
      )}
    </div>
  );
};
