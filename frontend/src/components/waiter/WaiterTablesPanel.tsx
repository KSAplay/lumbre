import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import {
  ALL_TABLE_STATUSES,
  TABLE_STATUS_DOT,
  TABLE_STATUS_LABELS,
} from "../../constants/tableStatus";
import type { TableNodeData, TableStatus, ZoneId } from "../../types/table";
import { WaiterTableCard } from "./WaiterTableCard";

type ZoneFilter = ZoneId | "all";

const ZONE_TABS: { id: ZoneFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "interior", label: "Interior" },
  { id: "terraza", label: "Terraza" },
];

type WaiterTablesPanelProps = {
  tables: TableNodeData[];
  nowMs: number;
  /** Ids de mesa con avisos sin leer */
  alertTableIds: ReadonlySet<string>;
  onSelectTable: (tableId: string) => void;
};

export const WaiterTablesPanel = ({
  tables,
  nowMs,
  alertTableIds,
  onSelectTable,
}: WaiterTablesPanelProps) => {
  const [zone, setZone] = useState<ZoneFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TableStatus | null>(null);
  const zoneIndex = ZONE_TABS.findIndex((tab) => tab.id === zone);

  const zoneTables =
    zone === "all" ? tables : tables.filter((table) => table.zone === zone);
  const visibleTables = statusFilter
    ? zoneTables.filter((table) => table.status === statusFilter)
    : zoneTables;
  const statusCounts = ALL_TABLE_STATUSES.map((status) => ({
    status,
    count: zoneTables.filter((table) => table.status === status).length,
  })).filter(({ count }) => count > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4 md:px-6 md:pt-5">
      <div
        className="relative grid shrink-0 grid-cols-3 rounded-lg bg-canvas-dim/40 p-1"
        role="tablist"
        aria-label="Zona"
      >
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-md bg-canvas-white shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${zoneIndex * 100}%)` }}
        />
        {ZONE_TABS.map((tab) => {
          const active = zone === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setZone(tab.id);
                setStatusFilter(null);
              }}
              className={`relative z-10 cursor-pointer rounded-md py-2 text-sm font-semibold transition-colors duration-200 ${
                active ? "text-text-main" : "text-text-muted"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        className="flex shrink-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-none] [&::-webkit-scrollbar]:hidden"
        aria-label="Filtrar por estado"
      >
        {statusCounts.map(({ status, count }) => {
          const active = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => setStatusFilter(active ? null : status)}
              className={`flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap shadow-sm transition-transform active:scale-95 ${
                active
                  ? "bg-text-main text-white"
                  : "bg-canvas-white text-text-main"
              }`}
            >
              <span
                className={`size-2.5 rounded-full ${TABLE_STATUS_DOT[status]}`}
              />
              {TABLE_STATUS_LABELS[status]}
              <span className={active ? "text-white/70" : "text-text-muted"}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4 [-ms-overflow-style:none] [scrollbar-none] [&::-webkit-scrollbar]:hidden">
        {visibleTables.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center">
            <LayoutGrid className="size-14 text-text-muted" strokeWidth={1.4} />
            <p className="text-base font-bold text-text-main">
              No hay mesas con este filtro
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {visibleTables.map((table) => (
              <WaiterTableCard
                key={table.id}
                table={table}
                nowMs={nowMs}
                hasAlert={alertTableIds.has(table.id)}
                onSelect={onSelectTable}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
