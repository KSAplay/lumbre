import {
  History,
  LayoutDashboard,
  Settings,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type AdminSection =
  | "dashboard"
  | "menu"
  | "staff"
  | "history"
  | "settings";

const ITEMS: { id: AdminSection; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
  { id: "menu", label: "Carta", icon: UtensilsCrossed },
  { id: "staff", label: "Personal", icon: Users },
  { id: "history", label: "Historial", icon: History },
  { id: "settings", label: "Configuración", icon: Settings },
];

type AdminSidebarProps = {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
};

/**
 * Navegación lateral del backoffice.
 */
export const AdminSidebar = ({ active, onChange }: AdminSidebarProps) => (
  <nav
    aria-label="Secciones del backoffice"
    className="flex w-52 shrink-0 flex-col gap-1 border-r border-slate-50 bg-canvas-white p-3 lg:w-60"
  >
    {ITEMS.map((item) => {
      const isActive = item.id === active;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors active:scale-[0.98] ${
            isActive
              ? "bg-terracotta-100 text-terracotta-400"
              : "text-text-muted hover:bg-canvas-muted hover:text-text-main"
          }`}
        >
          <item.icon className="size-4 shrink-0" strokeWidth={2.2} />
          {item.label}
        </button>
      );
    })}
  </nav>
);
