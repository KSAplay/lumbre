import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  ChefHat,
  CookingPot,
  LayoutDashboard,
  Receipt,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { LoadErrorState } from "../ui/LoadErrorState";
import { getDaySummary } from "../../services/adminStatsService";
import { SOCKET_EVENTS } from "../../services/socketEvents";
import { useSocketRefresh } from "../../hooks/useSocketRefresh";
import type { DaySummary } from "../../types/admin";
import { formatEuro } from "../../utils/money";

type Card = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent: string;
};

/**
 * Panel de resumen del día: recaudación, ticket medio y ocupación en vivo.
 */
export const AdminDashboardPanel = () => {
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getDaySummary();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      const data = await getDaySummary();
      setSummary(data);
      setError(false);
    } catch {
      /* el siguiente evento reintenta */
    }
  }, []);

  useSocketRefresh([SOCKET_EVENTS.STATS_UPDATED], () => {
    void refreshSummary();
  });

  if (loading) {
    return (
      <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg bg-canvas-white shadow-sm ring-1 ring-slate-50"
          />
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <LoadErrorState
        icon={LayoutDashboard}
        title="No se pudo cargar el resumen"
      />
    );
  }

  const products = summary.topProducts ?? [];
  const maxQuantity = products.reduce(
    (max, product) => Math.max(max, product.quantity),
    0,
  );

  const pulse: Card[] = [
    {
      label: "Plato más vendido",
      value: summary.topDish
        ? `${summary.topDish.quantity}× ${summary.topDish.name}`
        : "Sin ventas aún",
      icon: ChefHat,
      accent: "text-latte-500 bg-latte-100",
    },
    {
      label: "Mesas ocupadas ahora",
      value: String(summary.occupiedTables),
      icon: UsersRound,
      accent: "text-status-pendiente bg-toast-blue-soft",
    },
    {
      label: "Tickets en cocina",
      value: String(summary.kitchenTickets),
      icon: CookingPot,
      accent: "text-status-urgente bg-toast-red-soft",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-xl font-bold text-text-main">Resumen del día</h1>
        <p className="mt-1 text-sm text-text-muted">
          Recaudación de hoy y estado operativo de sala y cocina.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <article className="flex items-center gap-4 rounded-lg bg-canvas-white p-5 shadow-sm ring-1 ring-slate-50 lg:col-span-2">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-terracotta-100 text-terracotta-400">
            <Banknote className="size-7" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
              Total recaudado hoy
            </p>
            <p className="mt-1 text-3xl font-black text-terracotta-400 tabular-nums">
              {formatEuro(summary.totalRevenue)}
            </p>
          </div>
        </article>
        <MetricCard
          label="Ticket medio"
          value={formatEuro(summary.averageTicket)}
          icon={Receipt}
          accent="text-cacao-300 bg-cacao-100"
        />
        <MetricCard
          label="Mesas cobradas"
          value={String(summary.tablesPaid)}
          hint={
            summary.guestsServed > 0
              ? `${summary.guestsServed} comensales`
              : undefined
          }
          icon={UsersRound}
          accent="text-toast-green bg-toast-green-soft"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {pulse.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <section className="rounded-lg bg-canvas-white p-5 shadow-sm ring-1 ring-slate-50">
        <h2 className="text-sm font-bold text-text-main">Ventas del día</h2>
        <p className="mt-1 text-sm text-text-muted">
          Los cinco productos con más unidades cobradas hoy.
        </p>
        {products.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-muted">
            Sin ventas aún
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {products.map((product) => {
              const width =
                maxQuantity > 0
                  ? Math.max(8, (product.quantity / maxQuantity) * 100)
                  : 0;
              return (
                <li key={product.name} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
                  <span className="truncate text-sm font-semibold text-text-main">
                    {product.name}
                  </span>
                  <span className="h-3 overflow-hidden rounded-full bg-canvas-muted">
                    <span
                      className="block h-full rounded-full bg-terracotta-300"
                      style={{ width: `${width}%` }}
                    />
                  </span>
                  <span className="w-10 text-right text-sm font-bold text-text-main tabular-nums">
                    {product.quantity}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

const MetricCard = ({ label, value, hint, icon: Icon, accent }: Card) => (
  <article className="flex items-start gap-3 rounded-lg bg-canvas-white p-5 shadow-sm ring-1 ring-slate-50">
    <span
      className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${accent}`}
    >
      <Icon className="size-5" strokeWidth={2.2} />
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-bold text-text-main tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
    </div>
  </article>
);
