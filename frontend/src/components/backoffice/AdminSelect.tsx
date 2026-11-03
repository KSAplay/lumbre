import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CategoryPill } from "./CategoryPill";

/** Opción para el selector. */
export type AdminSelectOption = {
  value: string;
  /** Texto para el atributo `aria-label` de la opción. */
  label: string;
  /** Slug de la categoría para pintar como etiqueta. */
  pillSlug?: string;
};

/** Props para el componente `AdminSelect`. */
type AdminSelectProps = {
  /** Valor seleccionado. */
  value: string;
  /** Función callback para cambiar el valor seleccionado. */
  onChange: (value: string) => void;
  /** Opciones disponibles para el selector. */
  options: AdminSelectOption[];
  /** Pinta el control en terracota cuando el filtro no es el valor por defecto. */
  active?: boolean;
  /** Texto para el atributo `aria-label` del botón. */
  ariaLabel?: string;
  /** Clase CSS adicional para el contenedor. */
  className?: string;
};

/** Posición y dimensiones del menú desplegable. */
type MenuBox = {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
};

/** Listbox del backoffice. */
export const AdminSelect = ({
  value,
  onChange,
  options,
  active = false,
  ariaLabel,
  className = "",
}: AdminSelectProps) => {
  /** Estado para controlar la visibilidad del menú desplegable. */
  const [open, setOpen] = useState(false);
  /** Estado para controlar la posición y dimensiones del menú desplegable. */
  const [box, setBox] = useState<MenuBox | null>(null);
  /** Referencia al contenedor del componente. */
  const rootRef = useRef<HTMLDivElement>(null);
  /** Referencia al botón del componente. */
  const buttonRef = useRef<HTMLButtonElement>(null);
  /** Opción seleccionada. */
  const selected = options.find((option) => option.value === value) ?? null;

  /** Efecto para controlar la posición y dimensiones del menú desplegable. */
  useEffect(() => {
    if (!open) return;

    /** Función para calcular la posición y dimensiones del menú desplegable. */
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const openUp = window.innerHeight - rect.bottom < 200 && rect.top > 200;
      setBox({
        left: rect.left,
        width: Math.max(rect.width, 180),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    };

    place();

    /** Función para cerrar el menú desplegable al hacer clic fuera de él. */
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        const menu = document.getElementById("admin-select-menu");
        if (menu?.contains(event.target as Node)) return;
        setOpen(false);
      }
    };
    /** Función para cerrar el menú desplegable al presionar la tecla Esc. */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    /** Event listeners para controlar la posición y dimensiones del menú desplegable. */
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  /** Renderiza el componente. */
  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/** Botón para abrir el menú desplegable. */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-canvas-white py-2 pr-2.5 pl-3 text-left text-sm font-semibold shadow-sm ring-1 outline-none ${
          active
            ? "text-terracotta-400 ring-terracotta-200"
            : "text-text-main ring-slate-50"
        }`}
      >
        <span className="min-w-0">
          {selected ? <OptionFace option={selected} /> : null}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 ${
            active ? "text-terracotta-400" : "text-text-muted"
          }`}
          strokeWidth={2.2}
          aria-hidden
        />
      </button>

      {/** Menú desplegable. */}
      {open && box && (
        <div
          id="admin-select-menu"
          role="listbox"
          aria-label={ariaLabel}
          style={{
            left: box.left,
            width: box.width,
            top: box.top,
            bottom: box.bottom,
          }}
          className="fixed z-60 max-h-60 overflow-y-auto rounded-lg bg-canvas-white py-1 shadow-lg ring-1 ring-slate-50"
        >
          {/** Opciones disponibles para el selector. */}
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm font-semibold ${
                  isSelected
                    ? "bg-terracotta-100 text-text-main"
                    : "text-text-main hover:bg-canvas-muted"
                }`}
              >
                {/** Renderiza la opción seleccionada. */}
                <OptionFace option={option} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** Componente para renderizar la opción seleccionada. */
const OptionFace = ({ option }: { option: AdminSelectOption }) => {
  if (option.pillSlug) {
    return <CategoryPill slug={option.pillSlug} label={option.label} />;
  }
  return <span className="truncate">{option.label}</span>;
};
