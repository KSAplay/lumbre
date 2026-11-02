import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  BrickWall,
  Check,
  Eraser,
  Lock,
  LogOut,
  MapPinOff,
  Monitor,
  Pencil,
  X,
} from "lucide-react";
import { FloorTable } from "../../components/reception/FloorTable";
import { FloorWall } from "../../components/reception/FloorWall";
import {
  ReceptionSidePanel,
  type TablePanelActionKey,
} from "../../components/reception/ReceptionSidePanel";
import { ReceptionFloorSkeleton } from "../../components/reception/ReceptionSkeletons";
import { TablePlusIcon } from "../../components/reception/TablePlusIcon";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { LiveDateTime } from "../../components/ui/LiveDateTime";
import { LoadErrorState } from "../../components/ui/LoadErrorState";
import { StaffShell } from "../../components/ui/StaffShell";
import { UserMenu, type UserMenuItem } from "../../components/ui/UserMenu";
import { useToast } from "../../components/ui/useToast";
import { clearStaffToken } from "../../config/api";
import { maxGuestsForShape, VIEW_GRID_PX } from "../../constants/floorPlan";
import {
  getFloorPlan,
  releaseCleaningTables,
  saveFloorPlan,
  updateTableStatus,
} from "../../services/tableService";
import type {
  FloorSelection,
  FloorWallData,
  TableNodeData,
  TableOrientation,
  TableStatus,
  ZoneId,
} from "../../types/table";

/** Mapa acción del panel → estado destino */
const ACTION_NEXT_STATUS: Record<TablePanelActionKey, TableStatus> = {
  seat: "decidiendo",
  reserve: "reservada",
  arrive: "decidiendo",
  "cancel-res": "libre",
  bill: "cuenta",
  paid: "limpiando",
  ready: "libre",
};

const ZONE_TABS: { id: ZoneId; label: string }[] = [
  { id: "interior", label: "Interior" },
  { id: "terraza", label: "Terraza" },
];

function shapeForGuests(zone: ZoneId, guests: number) {
  if (zone === "terraza") return "circle" as const;
  return guests >= 5 ? ("rectangle" as const) : ("square" as const);
}

export const ReceptionDashboardView = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tables, setTables] = useState<TableNodeData[]>([]);
  const [walls, setWalls] = useState<FloorWallData[]>([]);
  const [floorLoading, setFloorLoading] = useState(true);
  const [floorError, setFloorError] = useState(false);
  const [zone, setZone] = useState<ZoneId>("interior");
  const [selection, setSelection] = useState<FloorSelection | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [appearingIds, setAppearingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [actionBusy, setActionBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [releaseBusy, setReleaseBusy] = useState(false);
  const [clearZoneOpen, setClearZoneOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const mapRef = useRef<HTMLDivElement>(null);
  const baselineRef = useRef<{
    tables: TableNodeData[];
    walls: FloorWallData[];
  } | null>(null);
  const zoneIndex = ZONE_TABS.findIndex((t) => t.id === zone);

  const zoneTables = useMemo(
    () => tables.filter((t) => t.zone === zone),
    [tables, zone],
  );

  const zoneWalls = useMemo(
    () => walls.filter((w) => w.zone === zone),
    [walls, zone],
  );

  const selectedTable =
    selection?.kind === "table"
      ? (tables.find((t) => t.id === selection.id) ?? null)
      : null;

  const selectedWall =
    selection?.kind === "wall"
      ? (walls.find((w) => w.id === selection.id) ?? null)
      : null;

  useEffect(() => {
    let cancelled = false;

    const loadFloor = async () => {
      setFloorLoading(true);
      setFloorError(false);
      try {
        const data = await getFloorPlan();
        if (cancelled) return;
        setTables(data.tables);
        setWalls(data.walls);
      } catch {
        if (!cancelled) setFloorError(true);
      } finally {
        if (!cancelled) setFloorLoading(false);
      }
    };

    void loadFloor();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const clearSelection = () => setSelection(null);

  const handleSelectTable = (id: string) => {
    if (editMode) {
      setSelection({ kind: "table", id });
      return;
    }
    setSelection((prev) =>
      prev?.kind === "table" && prev.id === id ? null : { kind: "table", id },
    );
  };

  const handleSelectWall = (id: string) => {
    if (!editMode) return;
    setSelection({ kind: "wall", id });
  };

  const handlePositionChange = (id: string, x: number, y: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, position: { x, y } } : t)),
    );
  };

  const handleWallChange = (id: string, next: Partial<FloorWallData>) => {
    setWalls((prev) => prev.map((w) => (w.id === id ? { ...w, ...next } : w)));
  };

  const handleAddGuest = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        if (t.status !== "libre" && t.status !== "reservada") return t;
        const current = t.guestCount > 0 ? t.guestCount : t.capacity;
        if (current >= maxGuestsForShape(t.shape)) return t;
        const guestCount = current + 1;
        return {
          ...t,
          guestCount,
          capacity: guestCount,
          shape: shapeForGuests(t.zone, guestCount),
        };
      }),
    );
  };

  const handleRemoveGuest = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        if (t.status !== "libre" && t.status !== "reservada") return t;
        const current = t.guestCount > 0 ? t.guestCount : t.capacity;
        if (current <= 1) return t;
        const guestCount = current - 1;
        return {
          ...t,
          guestCount,
          capacity: guestCount,
          shape: shapeForGuests(t.zone, guestCount),
        };
      }),
    );
  };

  const applyLocalStatus = (
    tableId: string,
    status: TableStatus,
    guestCount?: number,
  ) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId || t.status === status) return t;
        const nextGuests =
          guestCount ??
          (status === "libre" || status === "limpiando" ? 0 : t.guestCount);
        return {
          ...t,
          status,
          statusChangedAt: Date.now(),
          guestCount: nextGuests,
          reservation: status === "reservada" ? t.reservation : undefined,
        };
      }),
    );
  };

  const handleTableAction = async (
    tableId: string,
    action: TablePanelActionKey,
  ) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table || actionBusy) return;

    const nextStatus = ACTION_NEXT_STATUS[action];
    let nextGuests = table.guestCount;

    if (action === "seat" || action === "arrive") {
      nextGuests = table.guestCount > 0 ? table.guestCount : table.capacity;
    }
    if (action === "cancel-res" || action === "ready" || action === "paid") {
      nextGuests = 0;
    }
    if (action === "reserve" && nextGuests <= 0) {
      nextGuests = Math.min(2, table.capacity);
    }

    setActionBusy(true);
    try {
      await updateTableStatus(tableId, {
        status: nextStatus,
        guestCount: nextGuests,
      });
      applyLocalStatus(tableId, nextStatus, nextGuests);
    } catch (err) {
      console.error("No se pudo actualizar el estado de la mesa", err);
    } finally {
      setActionBusy(false);
    }
  };

  const handleChangeOrientation = (
    tableId: string,
    orientation: TableOrientation,
  ) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId || t.shape === "circle") return t;
        return { ...t, orientation };
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
      orientation: "horizontal",
      status: "libre",
      guestCount: 0,
      statusChangedAt: Date.now(),
    };
    setTables((prev) => [...prev, newTable]);
    setSelection({ kind: "table", id: newTable.id });
    setAppearingIds((prev) => new Set(prev).add(newTable.id));
    window.setTimeout(() => {
      setAppearingIds((prev) => {
        const next = new Set(prev);
        next.delete(newTable.id);
        return next;
      });
    }, 400);
  };

  const handleRemoveTable = (tableId: string) => {
    setTables((prev) => prev.filter((table) => table.id !== tableId));
    setSelection((prev) =>
      prev?.kind === "table" && prev.id === tableId ? null : prev,
    );
  };

  const handleRemoveWall = (wallId: string) => {
    setWalls((prev) => prev.filter((wall) => wall.id !== wallId));
    setSelection((prev) =>
      prev?.kind === "wall" && prev.id === wallId ? null : prev,
    );
  };

  const handleConfirmClearZone = () => {
    setTables((prev) => prev.filter((table) => table.zone !== zone));
    setWalls((prev) => prev.filter((wall) => wall.zone !== zone));
    clearSelection();
    setClearZoneOpen(false);
  };

  const handleAddWall = () => {
    const newWall: FloorWallData = {
      id: `W-${zone === "terraza" ? "T" : "I"}${Date.now().toString(36)}`,
      zone,
      x: 40,
      y: 35,
      width: 18,
      height: 6,
      shape: "rectangle",
      rotation: 0,
      corners: { nw: "square", ne: "square", se: "square", sw: "square" },
    };
    setWalls((prev) => [...prev, newWall]);
    setSelection({ kind: "wall", id: newWall.id });
  };

  const enterEditMode = () => {
    baselineRef.current = {
      tables: structuredClone(tables),
      walls: structuredClone(walls),
    };
    clearSelection();
    setEditMode(true);
  };

  const cancelEditMode = () => {
    const baseline = baselineRef.current;
    if (baseline) {
      setTables(baseline.tables);
      setWalls(baseline.walls);
    }
    baselineRef.current = null;
    clearSelection();
    setEditMode(false);
  };

  const saveEditMode = async () => {
    if (saveBusy) return;
    setSaveBusy(true);
    try {
      await saveFloorPlan(tables, walls);
      baselineRef.current = null;
      clearSelection();
      setEditMode(false);
      showToast({
        message: "Plano guardado correctamente.",
        tone: "green",
      });
    } catch {
      showToast({
        message: "No se pudo guardar el plano. Inténtalo de nuevo.",
        tone: "red",
      });
    } finally {
      setSaveBusy(false);
    }
  };

  const handleReleaseCleaning = async () => {
    if (releaseBusy) return;
    setReleaseBusy(true);
    try {
      await releaseCleaningTables();
      setTables((prev) =>
        prev.map((t) =>
          t.status === "limpiando"
            ? {
                ...t,
                status: "libre",
                guestCount: 0,
                statusChangedAt: Date.now(),
                reservation: undefined,
              }
            : t,
        ),
      );
      showToast({
        message: "Mesas en limpieza liberadas.",
        tone: "green",
      });
    } catch {
      showToast({
        message: "No se pudieron liberar las mesas.",
        tone: "red",
      });
    } finally {
      setReleaseBusy(false);
    }
  };

  const lockItem: UserMenuItem = {
    id: "lock",
    label: "Bloquear Pantalla",
    icon: Lock,
    onSelect: () => {
      clearStaffToken();
      navigate("/login");
    },
  };

  const endShiftItem: UserMenuItem = {
    id: "end-shift",
    label: "Finalizar Turno",
    icon: LogOut,
    tone: "danger",
    confirm: {
      title: "¿Finalizar turno?",
      description:
        "Se cerrará el turno de recepción y volverás al inicio de sesión.",
      confirmLabel: "Finalizar",
    },
    // TODO: cerrar turno en el backend antes de volver al login
    onSelect: () => {
      clearStaffToken();
      navigate("/login");
    },
  };

  return (
    <>
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
            <UserMenu items={[lockItem]} />
          </div>
          <div className="hidden md:block">
            <UserMenu items={[lockItem, endShiftItem]} />
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
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col p-5 transition-colors duration-300 lg:p-6 ${
            editMode ? "bg-canvas-dim/40" : "bg-transparent"
          }`}
        >
          {/* Pestañas centradas; en edición se desplazan a la izquierda y aparece el título */}
          <div className="relative mb-4 h-12">
            <div
              className="absolute top-0 grid grid-cols-2 rounded-lg bg-canvas-dim/40 p-1 transition-[left,transform] duration-300 ease-out"
              style={{
                left: editMode ? "0%" : "50%",
                transform: editMode ? "translateX(0)" : "translateX(-50%)",
              }}
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
                      clearSelection();
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

            <h2
              aria-hidden={!editMode}
              className={`pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-2xl font-black tracking-wide text-slate-300 uppercase transition-opacity duration-300 ease-out ${
                editMode ? "opacity-100" : "opacity-0"
              }`}
            >
              Modo edición
            </h2>
          </div>

          <div
            className={`relative min-h-0 flex-1 overflow-hidden rounded-lg ring-1 ring-slate-50/80 transition-colors duration-300 ${
              editMode ? "bg-canvas" : "bg-canvas-muted"
            }`}
          >
            <div
              ref={mapRef}
              className="relative h-full min-h-80 w-full"
              onClick={clearSelection}
              role="application"
              aria-label={`Plano de mesas — ${zone === "interior" ? "Interior" : "Terraza"}`}
            >
              {editMode && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.35]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--color-canvas-dim) 1px, transparent 1px), linear-gradient(to bottom, var(--color-canvas-dim) 1px, transparent 1px)",
                    backgroundSize: `${VIEW_GRID_PX}px ${VIEW_GRID_PX}px`,
                  }}
                />
              )}

              {floorLoading && <ReceptionFloorSkeleton zone={zone} />}

              {floorError && (
                <LoadErrorState
                  icon={MapPinOff}
                  title="No se pudo cargar el plano de sala"
                />
              )}

              {zoneWalls.map((wall) => (
                <FloorWall
                  key={wall.id}
                  wall={wall}
                  selected={
                    selection?.kind === "wall" && selection.id === wall.id
                  }
                  editMode={editMode}
                  onSelect={handleSelectWall}
                  onChange={handleWallChange}
                  mapRef={mapRef}
                />
              ))}

              {zoneTables.map((table) => (
                <FloorTable
                  key={table.id}
                  table={table}
                  selected={
                    selection?.kind === "table" && selection.id === table.id
                  }
                  editMode={editMode}
                  nowMs={nowMs}
                  appearing={appearingIds.has(table.id)}
                  onSelect={handleSelectTable}
                  onPositionChange={handlePositionChange}
                  mapRef={mapRef}
                />
              ))}
            </div>

            {editMode && (
              <div className="absolute bottom-5 left-5 z-30">
                <button
                  type="button"
                  onClick={cancelEditMode}
                  disabled={saveBusy}
                  className="flex size-16 cursor-pointer items-center justify-center rounded-full bg-toast-red text-white shadow-lg ring-1 ring-toast-red/30 transition-transform active:scale-90 disabled:opacity-50"
                  aria-label="Cancelar edición"
                  title="Cancelar"
                >
                  <X className="size-7" strokeWidth={2.5} />
                </button>
              </div>
            )}

            <div className="absolute right-5 bottom-5 z-30 flex flex-col items-center gap-3">
              {editMode && (
                <>
                  <button
                    type="button"
                    onClick={() => setClearZoneOpen(true)}
                    disabled={zoneTables.length === 0 && zoneWalls.length === 0}
                    className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-terracotta-100 text-toast-red shadow-lg ring-1 ring-terracotta-200 transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                    aria-label="Limpiar zona"
                    title="Limpiar zona"
                  >
                    <Eraser className="size-6" strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={handleAddWall}
                    className="relative flex size-14 cursor-pointer items-center justify-center rounded-full bg-canvas-white text-text-main shadow-lg ring-1 ring-slate-50 transition-transform active:scale-90"
                    aria-label="Añadir muro"
                    title="Añadir muro"
                  >
                    <BrickWall className="size-7" strokeWidth={1.75} />
                    <span className="absolute -top-0.5 -right-0.5 flex size-5.5 items-center justify-center rounded-full bg-terracotta-400 text-sm leading-none font-black text-white">
                      +
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddTable}
                    className="relative flex size-14 cursor-pointer items-center justify-center rounded-full bg-canvas-white text-text-main shadow-lg ring-1 ring-slate-50 transition-transform active:scale-90"
                    aria-label="Añadir mesa"
                    title="Añadir mesa"
                  >
                    <TablePlusIcon className="size-7" />
                    <span className="absolute -top-0.5 -right-0.5 flex size-5.5 items-center justify-center rounded-full bg-terracotta-400 text-sm leading-none font-black text-white">
                      +
                    </span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  if (editMode) {
                    void saveEditMode();
                  } else {
                    enterEditMode();
                  }
                }}
                disabled={saveBusy || floorLoading || floorError}
                className={`flex size-16 cursor-pointer items-center justify-center rounded-full shadow-lg ring-1 transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${
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
          </div>
        </div>

        <ReceptionSidePanel
          loading={floorLoading}
          error={floorError}
          tables={zoneTables}
          selectedTable={
            selectedTable && selectedTable.zone === zone ? selectedTable : null
          }
          selectedWall={
            selectedWall && selectedWall.zone === zone ? selectedWall : null
          }
          editMode={editMode}
          nowMs={nowMs}
          actionBusy={actionBusy}
          onClearSelection={clearSelection}
          onAddGuest={handleAddGuest}
          onRemoveGuest={handleRemoveGuest}
          onTableAction={handleTableAction}
          onChangeOrientation={handleChangeOrientation}
          onChangeWall={handleWallChange}
          onRemoveTable={handleRemoveTable}
          onRemoveWall={handleRemoveWall}
          onReleaseCleaningTables={handleReleaseCleaning}
          releaseCleaningBusy={releaseBusy}
        />
      </div>
    </StaffShell>

    <ConfirmModal
      open={clearZoneOpen}
      tone="terracotta"
      icon={<Eraser className="size-8" strokeWidth={2} />}
      title="¿Limpiar la zona?"
      description={`Se borrarán todas las mesas y todos los muros de ${zone === "interior" ? "Interior" : "Terraza"}.`}
      confirmLabel="Limpiar"
      cancelLabel="Cancelar"
      onCancel={() => setClearZoneOpen(false)}
      onConfirm={handleConfirmClearZone}
    />
    </>
  );
};
