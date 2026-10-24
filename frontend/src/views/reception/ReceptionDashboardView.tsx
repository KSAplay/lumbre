import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Monitor, Pencil, Plus } from "lucide-react";
import { FloorTable } from "../../components/reception/FloorTable";
import { ReceptionSidePanel } from "../../components/reception/ReceptionSidePanel";
import { ReceptionUserMenu } from "../../components/reception/ReceptionUserMenu";
import { LiveDateTime } from "../../components/ui/LiveDateTime";
import { StaffShell } from "../../components/ui/StaffShell";
import { MOCK_TABLES } from "../../data/mockTables";
import type {
  TableNodeData,
  TableStatus,
  ZoneId,
} from "../../types/table";

const ZONE_TABS: { id: ZoneId; label: string }[] = [
  { id: "interior", label: "Interior" },
  { id: "terraza", label: "Terraza" },
];

export const ReceptionDashboardView = () => {
  const [tables, setTables] = useState<TableNodeData[]>(MOCK_TABLES);
  const [zone, setZone] = useState<ZoneId>("interior");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const mapRef = useRef<HTMLDivElement>(null);
  const zoneIndex = ZONE_TABS.findIndex((t) => t.id === zone);

  const zoneTables = useMemo(
    () => tables.filter((t) => t.zone === zone),
    [tables, zone],
  );

  const selectedTable =
    tables.find((t) => t.id === selectedId) ?? null;

  // Tick de reloj para contadores de estado (solo frontend)
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleSelect = (id: string) => {
    if (editMode) {
      setSelectedId(id);
      return;
    }
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handlePositionChange = (id: string, x: number, y: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, position: { x, y } } : t,
      ),
    );
  };

  const handleAddGuest = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        if (t.status !== "libre" || t.guestCount >= t.capacity) return t;
        return { ...t, guestCount: t.guestCount + 1 };
      }),
    );
  };

  // TODO: eliminar/sustituir cuando el backend gestione transiciones de estado
  const handleChangeStatus = (tableId: string, status: TableStatus) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId || t.status === status) return t;
        return {
          ...t,
          status,
          statusChangedAt: Date.now(),
          guestCount:
            status === "libre" || status === "limpiando" ? 0 : t.guestCount,
        };
      }),
    );
  };

  const handleChangeCapacity = (tableId: string, capacity: number) => {
    const next = Math.min(12, Math.max(1, capacity));
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          capacity: next,
          guestCount: Math.min(t.guestCount, next),
          shape:
            t.zone === "terraza"
              ? "circle"
              : next >= 6
                ? "rectangle"
                : "square",
        };
      }),
    );
  };

  const handleAddTable = () => {
    const nextNumber =
      tables.reduce((max, t) => Math.max(max, t.number), 0) + 1;
    const isTerraza = zone === "terraza";
    const newTable: TableNodeData = {
      id: `${isTerraza ? "T" : "I"}${String(nextNumber).padStart(2, "0")}`,
      number: nextNumber,
      capacity: 4,
      shape: isTerraza ? "circle" : "square",
      zone,
      position: { x: 50, y: 50 },
      status: "libre",
      guestCount: 0,
      statusChangedAt: Date.now(),
    };
    setTables((prev) => [...prev, newTable]);
    setSelectedId(newTable.id);
  };

  const toggleEditMode = () => {
    setEditMode((prev) => {
      if (!prev) setSelectedId(null);
      return !prev;
    });
  };

  return (
    <StaffShell
      headerCenter={
        <>
          <LiveDateTime
            layout="time"
            showSeconds={false}
            className="text-base font-bold tracking-wide text-white tabular-nums md:hidden"
          />
          <LiveDateTime
            layout="stacked"
            showSeconds
            className="hidden items-center gap-0.5 text-center text-[11px] font-medium text-white/85 md:flex md:text-sm [&>span:last-child]:text-2xl [&>span:last-child]:font-bold [&>span:last-child]:tracking-wide [&>span:last-child]:text-white md:[&>span:last-child]:text-3xl"
          />
        </>
      }
      headerRight={
        <>
          <div className="md:hidden">
            <ReceptionUserMenu showEndShift={false} />
          </div>
          <div className="hidden md:block">
            <ReceptionUserMenu showEndShift />
          </div>
        </>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-12 text-center md:hidden">
        <div className="flex size-16 items-center justify-center rounded-full bg-canvas-muted text-text-muted">
          <Monitor className="size-8" strokeWidth={1.75} />
        </div>
        <div className="max-w-xs">
          <h2 className="text-lg font-bold text-text-main">
            Pantalla demasiado pequeña
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            El mapa de mesas de recepción necesita una tablet o un ordenador.
            Abre Lumbre en un dispositivo más grande.
          </p>
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 md:flex">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-5 lg:p-6">
          <div className="mb-4 flex justify-center">
            <div
              className="relative grid grid-cols-2 rounded-lg bg-canvas-dim/40 p-1"
              role="tablist"
              aria-label="Zona del plano"
            >
              <span
                aria-hidden
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-md bg-canvas-white shadow-sm transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(${zoneIndex * 100}%)`,
                }}
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
                      setSelectedId(null);
                    }}
                    className={`relative z-10 min-w-36 cursor-pointer rounded-md px-8 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                      active
                        ? "text-text-main"
                        : "text-text-muted hover:text-text-main"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-canvas-muted ring-1 ring-slate-50/80">
            <div
              ref={mapRef}
              className="relative h-full min-h-80 w-full"
              onClick={() => setSelectedId(null)}
              role="application"
              aria-label={`Plano de mesas — ${zone === "interior" ? "Interior" : "Terraza"}`}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--color-canvas-dim) 1px, transparent 1px), linear-gradient(to bottom, var(--color-canvas-dim) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />

              {zoneTables.map((table) => (
                <FloorTable
                  key={table.id}
                  table={table}
                  selected={selectedId === table.id}
                  editMode={editMode}
                  nowMs={nowMs}
                  onSelect={handleSelect}
                  onPositionChange={handlePositionChange}
                  mapRef={mapRef}
                />
              ))}
            </div>

            <div className="absolute right-5 bottom-5 z-30 flex flex-col items-center gap-3">
              {editMode && (
                <button
                  type="button"
                  onClick={handleAddTable}
                  className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-canvas-white text-text-main shadow-lg ring-1 ring-slate-50 transition-transform active:scale-90"
                  aria-label="Añadir mesa"
                  title="Añadir mesa"
                >
                  <Plus className="size-6" strokeWidth={2.5} />
                </button>
              )}

              <button
                type="button"
                onClick={toggleEditMode}
                className={`flex size-16 cursor-pointer items-center justify-center rounded-full shadow-lg ring-1 transition-transform active:scale-90 ${
                  editMode
                    ? "bg-table-libre text-white ring-table-libre/30"
                    : "bg-canvas-white text-text-main ring-slate-50"
                }`}
                aria-label={
                  editMode ? "Guardar posiciones" : "Editar posiciones"
                }
                title={editMode ? "Guardar" : "Editar plano"}
              >
                {editMode ? (
                  <Check className="size-7" strokeWidth={2.5} />
                ) : (
                  <Pencil className="size-6" />
                )}
              </button>
            </div>

            {editMode && (
              <p className="pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-cacao-300/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                Arrastra las mesas · se alinean a la rejilla
              </p>
            )}
          </div>
        </div>

        <ReceptionSidePanel
          tables={zoneTables}
          selectedTable={
            selectedTable && selectedTable.zone === zone
              ? selectedTable
              : null
          }
          editMode={editMode}
          nowMs={nowMs}
          onClearSelection={() => setSelectedId(null)}
          onAddGuest={handleAddGuest}
          onChangeStatus={handleChangeStatus}
          onChangeCapacity={handleChangeCapacity}
        />
      </div>
    </StaffShell>
  );
};
