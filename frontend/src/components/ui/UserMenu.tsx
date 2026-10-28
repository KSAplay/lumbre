import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { User } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

export type UserMenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** "danger" pinta la opción en rojo (p. ej. finalizar turno) */
  tone?: "default" | "danger";
  /** Si existe, se pide confirmación antes de ejecutar `onSelect` */
  confirm?: {
    title: string;
    description: string;
    confirmLabel: string;
  };
};

type UserMenuProps = {
  items: UserMenuItem[];
};

const itemToneStyles = {
  default: "text-text-main hover:bg-canvas-muted",
  danger: "bg-toast-red-soft text-toast-red hover:bg-toast-red/15",
};

/** Botón de usuario del personal con menú desplegable configurable por vista */
export const UserMenu = ({ items }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<UserMenuItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (item: UserMenuItem) => {
    setOpen(false);
    if (item.confirm) {
      setPendingItem(item);
      setConfirmOpen(true);
      return;
    }
    item.onSelect();
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    pendingItem?.onSelect();
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
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors active:scale-[0.98] ${
                itemToneStyles[item.tone ?? "default"]
              }`}
              onClick={() => handleSelect(item)}
            >
              <item.icon
                className={`size-4 shrink-0 ${
                  item.tone === "danger" ? "" : "text-text-muted"
                }`}
              />
              {item.label}
            </button>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        tone="terracotta"
        icon={
          pendingItem ? (
            <pendingItem.icon className="size-8" strokeWidth={2} />
          ) : undefined
        }
        title={pendingItem?.confirm?.title ?? ""}
        description={pendingItem?.confirm?.description ?? ""}
        confirmLabel={pendingItem?.confirm?.confirmLabel ?? ""}
        cancelLabel="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
};
