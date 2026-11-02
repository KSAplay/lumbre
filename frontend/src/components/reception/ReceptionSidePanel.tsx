import type { ReactNode } from "react";
import {
  Ban,
  BrickWall,
  CheckCircle2,
  Circle,
  ClipboardList,
  Minus,
  Plus,
  QrCode,
  RectangleHorizontal,
  RectangleVertical,
  RotateCw,
  Sparkles,
  Square,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { maxGuestsForShape } from "../../constants/floorPlan";
import {
  ALL_TABLE_STATUSES,
  statusShowsElapsed,
  TABLE_STATUS_DOT,
  TABLE_STATUS_HEX,
  TABLE_STATUS_LABELS,
} from "../../constants/tableStatus";
import type {
  FloorWallData,
  TableNodeData,
  TableOrientation,
  TableStatus,
  WallCornerKind,
  WallCorners,
  WallRotation,
  WallShape,
} from "../../types/table";
import { darkenColor } from "../../utils/color";
import {
  elapsedSecondsSince,
  formatStatusElapsed,
} from "../../utils/tableTime";
import { Badge } from "../ui/Badge";
import { LoadErrorState } from "../ui/LoadErrorState";
import { ReceptionPanelSkeleton } from "./ReceptionSkeletons";

type ReceptionSidePanelProps = {
  loading?: boolean;
  error?: boolean;
  tables: TableNodeData[];
  selectedTable: TableNodeData | null;
  selectedWall: FloorWallData | null;
  editMode: boolean;
  nowMs: number;
  actionBusy?: boolean;
  onClearSelection: () => void;
  onAddGuest: (tableId: string) => void;
  onRemoveGuest: (tableId: string) => void;
  onTableAction: (tableId: string, action: TablePanelActionKey) => void;
  onChangeOrientation: (tableId: string, orientation: TableOrientation) => void;
  onChangeWall: (wallId: string, next: Partial<FloorWallData>) => void;
  onRemoveTable: (tableId: string) => void;
  onRemoveWall: (wallId: string) => void;
  onReleaseCleaningTables?: () => void;
  releaseCleaningBusy?: boolean;
};

export type TablePanelActionKey =
  | "seat"
  | "reserve"
  | "arrive"
  | "cancel-res"
  | "bill"
  | "paid"
  | "ready";

type PanelAction = {
  key: TablePanelActionKey;
  label: string;
  icon: ReactNode;
  className: string;
};

const ACTION_BTN =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const REMOVE_BTN = `${ACTION_BTN} bg-terracotta-100 text-toast-red hover:bg-terracotta-200`;

const DEFAULT_CORNERS: WallCorners = {
  nw: "square",
  ne: "square",
  se: "square",
  sw: "square",
};

function actionsForStatus(status: TableStatus): PanelAction[] {
  switch (status) {
    case "libre":
      return [
        {
          key: "seat",
          label: "Sentar comensales",
          icon: <Users className="size-4" />,
          className: `${ACTION_BTN} bg-table-libre text-white hover:bg-table-libre/90`,
        },
        {
          key: "reserve",
          label: "Reservar mesa",
          icon: <CheckCircle2 className="size-4" />,
          className: `${ACTION_BTN} bg-canvas-white text-text-main ring-1 ring-slate-50 hover:bg-surface-hover`,
        },
      ];
    case "reservada":
      return [
        {
          key: "arrive",
          label: "Confirmar llegada",
          icon: <Users className="size-4" />,
          className: `${ACTION_BTN} bg-table-reservada text-text-main hover:bg-table-reservada/90`,
        },
        {
          key: "cancel-res",
          label: "Cancelar reserva",
          icon: <Ban className="size-4" />,
          className: `${ACTION_BTN} bg-canvas-white text-text-muted ring-1 ring-slate-50 hover:bg-surface-hover`,
        },
      ];
    case "esperando":
    case "servido":
      return [
        {
          key: "bill",
          label: "Solicitar cuenta",
          icon: <UtensilsCrossed className="size-4" />,
          className: `${ACTION_BTN} bg-table-cuenta text-white hover:bg-table-cuenta/90`,
        },
      ];
    case "cuenta":
      return [
        {
          key: "paid",
          label: "Marcar como pagada",
          icon: <CheckCircle2 className="size-4" />,
          className: `${ACTION_BTN} bg-table-servido text-white hover:bg-table-servido/90`,
        },
      ];
    case "limpiando":
      return [
        {
          key: "ready",
          label: "Mesa lista",
          icon: <Sparkles className="size-4" />,
          className: `${ACTION_BTN} bg-table-libre text-white hover:bg-table-libre/90`,
        },
      ];
    case "decidiendo":
    default:
      return [];
  }
}

function canEditGuests(status: TableStatus): boolean {
  return status === "libre" || status === "reservada";
}

function nextCorner(kind: WallCornerKind): WallCornerKind {
  if (kind === "square") return "round";
  if (kind === "round") return "cut";
  return "square";
}

type CornerKey = keyof WallCorners;

/** Iconos de esquina (dibujados para NW; se rotan por esquina) */
const CornerKindIcon = ({
  kind,
  corner,
  className = "",
}: {
  kind: WallCornerKind;
  corner: CornerKey;
  className?: string;
}) => {
  const rot = { nw: 0, ne: 90, se: 180, sw: 270 }[corner];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ transform: `rotate(${rot}deg)` }}
      aria-hidden
    >
      {kind === "square" && (
        // L de esquina recta
        <path
          d="M6 6V18H8.5V8.5H18V6H6Z"
          fill="currentColor"
        />
      )}
      {kind === "round" && (
        // Cuarto de círculo sin relleno
        <path
          d="M7 17V10.5A6.5 6.5 0 0 1 13.5 4H17"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {kind === "cut" && (
        // Chaflán 45°
        <path
          d="M6 16L16 6"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
    {children}
  </p>
);

const ShapeGlyph = ({
  shape,
  color,
}: {
  shape: TableNodeData["shape"];
  color: string;
}) => {
  const Icon = shape === "circle" ? Circle : Square;
  return (
    <Icon
      className="size-5 shrink-0"
      strokeWidth={2.75}
      style={{ color }}
      aria-hidden
    />
  );
};

/** Contador +/- horizontal, tamaño táctil (mínimo 1) */
const GuestStepper = ({
  count,
  max,
  disabled,
  onAdd,
  onRemove,
}: {
  count: number;
  max: number;
  disabled?: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) => {
  const atMin = count <= 1;
  const atMax = count >= max;

  return (
    <div className="flex h-14 overflow-hidden rounded-lg bg-canvas-muted">
      <button
        type="button"
        aria-label="Quitar comensal"
        disabled={disabled || atMin}
        onClick={onRemove}
        className="group flex h-full w-16 shrink-0 cursor-pointer items-center justify-center bg-terracotta-400 text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-7 stroke-3 transition-transform group-active:scale-75" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center px-3">
        <span className="text-2xl font-black tabular-nums text-text-main">
          {count}
        </span>
      </div>

      <button
        type="button"
        aria-label="Añadir comensal"
        disabled={disabled || atMax}
        onClick={onAdd}
        className="group flex h-full w-16 shrink-0 cursor-pointer items-center justify-center bg-terracotta-300 text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-7 stroke-3 transition-transform group-active:scale-75" />
      </button>
    </div>
  );
};

const GlobalOverview = ({
  tables,
  onReleaseCleaningTables,
  releaseCleaningBusy,
}: {
  tables: TableNodeData[];
  onReleaseCleaningTables?: () => void;
  releaseCleaningBusy?: boolean;
}) => {
  const counts = ALL_TABLE_STATUSES.map((status) => ({
    status,
    count: tables.filter((t) => t.status === status).length,
  })).filter((c) => c.count > 0);
  const cleaningCount = tables.filter((t) => t.status === "limpiando").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-text-main">Resumen de sala</h2>
        <p className="mt-1 text-sm text-text-muted">
          {tables.length} mesas en el plano actual
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {counts.map(({ status, count }) => (
          <li
            key={status}
            className="flex items-center justify-between rounded-lg bg-canvas-muted px-3 py-2.5"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-text-main">
              <span
                className={`size-2.5 rounded-full ${TABLE_STATUS_DOT[status]}`}
              />
              {TABLE_STATUS_LABELS[status]}
            </span>
            <span className="text-sm font-bold tabular-nums text-text-main">
              {count}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2 border-t border-slate-50 pt-4">
        <SectionLabel>Acciones globales</SectionLabel>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-cacao-300 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cacao-400 active:scale-[0.98]"
        >
          <QrCode className="size-4" />
          Generar QR (lote)
        </button>
        <button
          type="button"
          disabled={!onReleaseCleaningTables || cleaningCount === 0 || releaseCleaningBusy}
          onClick={() => onReleaseCleaningTables?.()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-canvas-white px-3 py-2.5 text-sm font-semibold text-text-main ring-1 ring-slate-50 transition-colors hover:bg-surface-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          <Sparkles className="size-4" />
          Liberar mesas limpias
          {cleaningCount > 0 ? ` (${cleaningCount})` : ""}
        </button>
      </div>
    </div>
  );
};

const WallDetail = ({
  wall,
  onClearSelection,
  onChangeWall,
  onRemoveWall,
}: {
  wall: FloorWallData;
  onClearSelection: () => void;
  onChangeWall: (wallId: string, next: Partial<FloorWallData>) => void;
  onRemoveWall: (wallId: string) => void;
}) => {
  const shape: WallShape = wall.shape ?? "rectangle";
  const corners = wall.corners ?? DEFAULT_CORNERS;
  const rotation: WallRotation = wall.rotation ?? 0;

  const setShape = (next: WallShape) => {
    if (next === "circle") {
      const size = Math.min(wall.width, wall.height);
      onChangeWall(wall.id, { shape: next, width: size, height: size });
      return;
    }
    onChangeWall(wall.id, { shape: next });
  };

  const setAllCorners = (kind: WallCornerKind) =>
    onChangeWall(wall.id, {
      corners: { nw: kind, ne: kind, se: kind, sw: kind },
    });

  const cycleCorner = (key: keyof WallCorners) =>
    onChangeWall(wall.id, {
      corners: { ...corners, [key]: nextCorner(corners[key]) },
    });

  const rotate90 = () => {
    const next = ((rotation + 90) % 360) as WallRotation;
    onChangeWall(wall.id, { rotation: next });
  };

  const shapeBtn = (id: WallShape, label: string, icon: ReactNode) => (
    <button
      key={id}
      type="button"
      onClick={() => setShape(id)}
      className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-semibold transition-transform active:scale-[0.98] ${
        shape === id
          ? "bg-cacao-300 text-white"
          : "bg-canvas-white text-text-main ring-1 ring-slate-50 hover:bg-surface-hover"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrickWall className="size-5 shrink-0 text-text-muted" strokeWidth={1.75} />
          <h2 className="truncate text-base font-bold text-text-main">
            {wall.name?.trim() || "Muro"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClearSelection}
          className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-canvas-muted hover:text-text-main active:scale-90"
          aria-label="Cerrar detalle"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Nombre</SectionLabel>
        <input
          type="text"
          value={wall.name ?? ""}
          onChange={(e) =>
            onChangeWall(wall.id, { name: e.target.value.toUpperCase() })
          }
          placeholder="SIN NOMBRE"
          className="w-full rounded-lg border-0 bg-canvas-muted px-3 py-3 text-[13px] font-black tracking-tight text-slate-400 uppercase outline-none ring-1 ring-transparent placeholder:font-bold placeholder:text-slate-100 focus:ring-cacao-200"
        />
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Forma</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {shapeBtn(
            "rectangle",
            "Rectángulo",
            <Square className="size-5" strokeWidth={2} />,
          )}
          {shapeBtn(
            "circle",
            "Círculo",
            <Circle className="size-5" strokeWidth={2} />,
          )}
        </div>
      </div>

      {shape === "rectangle" && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Esquinas</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["square", "Rectas"],
                ["round", "Redondas"],
                ["cut", "Chaflán"],
              ] as const
            ).map(([kind, label]) => {
              const active = Object.values(corners).every((c) => c === kind);
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setAllCorners(kind)}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-transform active:scale-[0.98] ${
                    active
                      ? "bg-cacao-300 text-white"
                      : "bg-canvas-muted text-text-main hover:bg-surface-hover"
                  }`}
                >
                  <CornerKindIcon kind={kind} corner="nw" className="size-5" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Vista tipo cuadrado: cada esquina es un botón con icono */}
          <div className="relative mx-auto mt-1 aspect-square w-36 rounded-lg bg-canvas-muted">
            {(
              [
                ["nw", "top-2 left-2"],
                ["ne", "top-2 right-2"],
                ["sw", "bottom-2 left-2"],
                ["se", "right-2 bottom-2"],
              ] as const
            ).map(([key, pos]) => (
              <button
                key={key}
                type="button"
                aria-label={`Esquina ${key}`}
                onClick={() => cycleCorner(key)}
                className={`absolute ${pos} flex size-11 cursor-pointer items-center justify-center rounded-lg bg-canvas-white text-text-main shadow-sm ring-1 ring-slate-50 transition-transform active:scale-90`}
              >
                <CornerKindIcon
                  kind={corners[key]}
                  corner={key}
                  className="size-7"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {shape === "rectangle" && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Rotación</SectionLabel>
          <button
            type="button"
            onClick={rotate90}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-canvas-muted px-3 py-3 text-sm font-semibold text-text-main transition-transform active:scale-[0.98] hover:bg-surface-hover"
          >
            <RotateCw className="size-5" strokeWidth={2} />
            Girar 90°
            <span className="ml-1 tabular-nums text-text-muted">{rotation}°</span>
          </button>
        </div>
      )}

      <div className="mt-auto border-t border-slate-50 pt-4">
        <button
          type="button"
          onClick={() => onRemoveWall(wall.id)}
          className={REMOVE_BTN}
        >
          <Trash2 className="size-4" />
          Quitar muro
        </button>
      </div>
    </div>
  );
};

const TableDetail = ({
  table,
  editMode,
  nowMs,
  actionBusy = false,
  onClearSelection,
  onAddGuest,
  onRemoveGuest,
  onTableAction,
  onChangeOrientation,
  onRemoveTable,
}: {
  table: TableNodeData;
  editMode: boolean;
  nowMs: number;
  actionBusy?: boolean;
  onClearSelection: () => void;
  onAddGuest: (tableId: string) => void;
  onRemoveGuest: (tableId: string) => void;
  onTableAction: (tableId: string, action: TablePanelActionKey) => void;
  onChangeOrientation: (tableId: string, orientation: TableOrientation) => void;
  onRemoveTable: (tableId: string) => void;
}) => {
  const actions = actionsForStatus(table.status);
  const guestsEditable = canEditGuests(table.status);
  const showElapsed = statusShowsElapsed(table.status);
  const elapsed = elapsedSecondsSince(table.statusChangedAt, nowMs);
  const orientation = table.orientation ?? "horizontal";
  const canOrient = table.shape !== "circle";
  const guestLabel =
    table.guestCount > 0 ? table.guestCount : table.capacity;
  const titleAccent = darkenColor(TABLE_STATUS_HEX[table.status], 0.32);

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <ShapeGlyph shape={table.shape} color={titleAccent} />
          <h2
            className="text-[13px] font-black tracking-tight uppercase tabular-nums"
            style={{ color: titleAccent }}
          >
            Mesa {String(table.number).padStart(2, "0")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClearSelection}
          className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-canvas-muted hover:text-text-main active:scale-90"
          aria-label="Cerrar detalle"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Estado</SectionLabel>
        <Badge
          variant={table.status}
          className="w-full justify-center px-4 py-2 text-sm"
        >
          {TABLE_STATUS_LABELS[table.status]}
        </Badge>
      </div>

      {showElapsed && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Tiempo</SectionLabel>
          <div className="rounded-lg bg-canvas-muted px-3 py-2.5 text-center text-lg font-bold tabular-nums text-text-main">
            {formatStatusElapsed(elapsed)}
          </div>
        </div>
      )}

      {editMode && canOrient && (
        <div className="rounded-lg bg-canvas-muted p-3">
          <SectionLabel>Orientación</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangeOrientation(table.id, "horizontal")}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-transform active:scale-[0.98] ${
                orientation === "horizontal"
                  ? "bg-cacao-300 text-white"
                  : "bg-canvas-white text-text-main ring-1 ring-slate-50 hover:bg-surface-hover"
              }`}
            >
              <RectangleHorizontal className="size-5" strokeWidth={2} />
              Horizontal
            </button>
            <button
              type="button"
              onClick={() => onChangeOrientation(table.id, "vertical")}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-transform active:scale-[0.98] ${
                orientation === "vertical"
                  ? "bg-cacao-300 text-white"
                  : "bg-canvas-white text-text-main ring-1 ring-slate-50 hover:bg-surface-hover"
              }`}
            >
              <RectangleVertical className="size-5" strokeWidth={2} />
              Vertical
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <SectionLabel>Comensales</SectionLabel>
        {guestsEditable ? (
          <GuestStepper
            count={guestLabel}
            max={maxGuestsForShape(table.shape)}
            disabled={actionBusy}
            onAdd={() => onAddGuest(table.id)}
            onRemove={() => onRemoveGuest(table.id)}
          />
        ) : (
          <div className="rounded-lg bg-canvas-muted px-3 py-2.5 text-center text-lg font-bold tabular-nums text-text-main">
            {guestLabel}
          </div>
        )}
      </div>

      {!editMode && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Acciones</SectionLabel>

          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              disabled={actionBusy}
              onClick={() => onTableAction(table.id, action.key)}
              className={action.className}
            >
              {action.icon}
              {action.label}
            </button>
          ))}

          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-cacao-300 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cacao-400 active:scale-[0.98]"
          >
            <QrCode className="size-4" />
            Generar QR
          </button>
        </div>
      )}

      {editMode && (
        <div className="mt-auto border-t border-slate-50 pt-4">
          <button
            type="button"
            onClick={() => onRemoveTable(table.id)}
            className={REMOVE_BTN}
          >
            <Trash2 className="size-4" />
            Quitar mesa
          </button>
        </div>
      )}
    </div>
  );
};

export const ReceptionSidePanel = ({
  loading = false,
  error = false,
  tables,
  selectedTable,
  selectedWall,
  editMode,
  nowMs,
  actionBusy,
  onClearSelection,
  onAddGuest,
  onRemoveGuest,
  onTableAction,
  onChangeOrientation,
  onChangeWall,
  onRemoveTable,
  onRemoveWall,
  onReleaseCleaningTables,
  releaseCleaningBusy,
}: ReceptionSidePanelProps) => {
  return (
    <aside className="flex min-h-0 w-72 shrink-0 flex-col overflow-y-auto border-l border-slate-50 bg-canvas-white p-4 lg:w-80 lg:p-5">
      {loading ? (
        <ReceptionPanelSkeleton />
      ) : error ? (
        <LoadErrorState
          icon={ClipboardList}
          title="Resumen no disponible"
          description="No se pudieron cargar las mesas de la sala."
        />
      ) : selectedWall && editMode ? (
        <WallDetail
          wall={selectedWall}
          onClearSelection={onClearSelection}
          onChangeWall={onChangeWall}
          onRemoveWall={onRemoveWall}
        />
      ) : selectedTable ? (
        <TableDetail
          table={selectedTable}
          editMode={editMode}
          nowMs={nowMs}
          actionBusy={actionBusy}
          onClearSelection={onClearSelection}
          onAddGuest={onAddGuest}
          onRemoveGuest={onRemoveGuest}
          onTableAction={onTableAction}
          onChangeOrientation={onChangeOrientation}
          onRemoveTable={onRemoveTable}
        />
      ) : (
        <GlobalOverview
          tables={tables}
          onReleaseCleaningTables={onReleaseCleaningTables}
          releaseCleaningBusy={releaseCleaningBusy}
        />
      )}
    </aside>
  );
};
