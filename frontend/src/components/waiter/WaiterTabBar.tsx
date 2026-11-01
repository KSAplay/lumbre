import type { LucideIcon } from "lucide-react";
import { Bell, ClipboardClock, LayoutGrid, NotebookPen } from "lucide-react";
import type { WaiterTab } from "../../types/waiter";

type WaiterTabBarProps = {
  active: WaiterTab;
  pendingCount: number;
  unreadCount: number;
  onChange: (tab: WaiterTab) => void;
};

const TABS: { id: WaiterTab; label: string; icon: LucideIcon }[] = [
  { id: "orders", label: "Pedidos", icon: ClipboardClock },
  { id: "tables", label: "Mesas", icon: LayoutGrid },
  { id: "manual", label: "Comanda", icon: NotebookPen },
  { id: "notifications", label: "Avisos", icon: Bell },
];

export const WaiterTabBar = ({
  active,
  pendingCount,
  unreadCount,
  onChange,
}: WaiterTabBarProps) => {
  return (
    <nav
      className="grid shrink-0 grid-cols-4 border-t border-slate-50 bg-canvas-white px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Secciones del camarero"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const count =
          tab.id === "orders"
            ? pendingCount
            : tab.id === "notifications"
              ? unreadCount
              : 0;

        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab.id)}
            className={`group flex cursor-pointer flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition-colors md:text-xs ${
              isActive ? "text-terracotta-400" : "text-slate-100"
            }`}
          >
            <span
              className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200 ${
                isActive ? "bg-terracotta-100" : "bg-transparent"
              }`}
            >
              <tab.icon
                className="size-5.5 transition-transform group-active:scale-90"
                strokeWidth={isActive ? 2.4 : 2}
              />
              {count > 0 && (
                // La key fuerza a repetir la animación cada vez que cambia el número
                <span
                  key={count}
                  className={`absolute -top-1 right-1 flex h-5 min-w-5 animate-badge-pop items-center justify-center rounded-full px-1 text-[11px] font-black text-white ring-2 ring-canvas-white ${
                    tab.id === "notifications"
                      ? "bg-status-urgente"
                      : "bg-terracotta-300"
                  }`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
