import type { ReactNode } from "react";
import {
  Ban,
  CheckCircle2,
  Minus,
  Plus,
  QrCode,
  Sparkles,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  ALL_TABLE_STATUSES,
  statusShowsElapsed,
  TABLE_STATUS_DOT,
  TABLE_STATUS_LABELS,
} from "../../constants/tableStatus";
import type { TableNodeData, TableStatus } from "../../types/table";
import {
  elapsedSecondsSince,
  formatStatusElapsed,
} from "../../utils/tableTime";
import { Badge } from "../ui/Badge";

type ReceptionSidePanelProps = {
  tables: TableNodeData[];
  selectedTable: TableNodeData | null;
  editMode: boolean;
  nowMs: number;
  onClearSelection: () => void;
  onAddGuest: (tableId: string) => void;
  onChangeStatus: (tableId: string, status: TableStatus) => void;
  onChangeCapacity: (tableId: string, capacity: number) => void;
};

type PanelAction = {
  key: string;
  label: string;
  icon: ReactNode;
  className: string;
};

function actionsForStatus(status: TableStatus): PanelAction[] {
  const base =
    "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors active:scale-[0.98]";

  switch (status) {
    case "libre":
      return [
        {
          key: "seat",
          label: "Sentar comensales",
          icon: <Users className="size-4" />,
          className: `${base} bg-table-libre text-white hover:bg-table-libre/90`,
        },
        {
          key: "reserve",
          label: "Reservar mesa",
          icon: <CheckCircle2 className="size-4" />,
          className: `${base} bg-canvas-white text-text-main ring-1 ring-slate-50 hover:bg-surface-hover`,
        },
      ];
    case "reservada":
      return [
        {
          key: "arrive",
          label: "Confirmar llegada",
          icon: <Users className="size-4" />,
          className: `${base} bg-table-reservada text-text-main hover:bg-table-reservada/90`,
        },
        {
          key: "cancel-res",
          label: "Cancelar reserva",
          icon: <Ban className="size-4" />,
          className: `${base} bg-canvas-white text-text-muted ring-1 ring-slate-50 hover:bg-surface-hover`,
        },
      ];
    case "decidiendo":
    case "esperando":
    case "servido":
      return [
        {
          key: "bill",
          label: "Solicitar cuenta",
          icon: <UtensilsCrossed className="size-4" />,
          className: `${base} bg-table-cuenta text-white hover:bg-table-cuenta/90`,
        },
      ];
    case "cuenta":
      return [
        {
          key: "paid",
          label: "Marcar como pagada",
          icon: <CheckCircle2 className="size-4" />,
          className: `${base} bg-table-servido text-white hover:bg-table-servido/90`,
        },
      ];
    case "limpiando":
      return [
        {
          key: "ready",
          label: "Mesa lista",
          icon: <Sparkles className="size-4" />,
          className: `${base} bg-table-libre text-white hover:bg-table-libre/90`,
        },
      ];
    default:
      return [];
  }
}

const GlobalOverview = ({ tables }: { tables: TableNodeData[] }) => {
  const counts = ALL_TABLE_STATUSES.map((status) => ({
    status,
    count: tables.filter((t) => t.status === status).length,
  })).filter((c) => c.count > 0);

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
        <p className="mb-1 text-[11px] font-semibold tracking-wide text-text-muted uppercase">
          Acciones globales
        </p>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-cacao-300 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cacao-400 active:scale-[0.98]"
        >
          <QrCode className="size-4" />
          Generar QR (lote)
        </button>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-canvas-white px-3 py-2.5 text-sm font-semibold text-text-main ring-1 ring-slate-50 transition-colors hover:bg-surface-hover active:scale-[0.98]"
        >
          <Sparkles className="size-4" />
          Liberar mesas limpias
        </button>
      </div>
    </div>
  );
};

const TableDetail = ({
  table,
  editMode,
  nowMs,
  onClearSelection,
  onAddGuest,
  onChangeStatus,
  onChangeCapacity,
}: {
  table: TableNodeData;
  editMode: boolean;
  nowMs: number;
  onClearSelection: () => void;
  onAddGuest: (tableId: string) => void;
  onChangeStatus: (tableId: string, status: TableStatus) => void;
  onChangeCapacity: (tableId: string, capacity: number) => void;
}) => {
  const actions = actionsForStatus(table.status);
  const canAddGuest =
    table.status === "libre" && table.guestCount < table.capacity;
  const elapsed = elapsedSecondsSince(table.statusChangedAt, nowMs);

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-text-main">
            Mesa {String(table.number).padStart(2, "0")}
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">{table.id}</p>
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
        <p className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
          Estado
          {/* TODO: eliminar el cambio manual de estado cuando el backend/Socket.io gestione el ciclo de mesa */}
          <span className="ml-1 font-normal normal-case">(clic para cambiar)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TABLE_STATUSES.map((status) => {
            const active = table.status === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onChangeStatus(table.id, status)}
                className={`cursor-pointer rounded-full transition-transform active:scale-95 ${
                  active ? "ring-2 ring-cacao-300 ring-offset-1" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Badge variant={status}>{TABLE_STATUS_LABELS[status]}</Badge>
              </button>
            );
          })}
        </div>
        {statusShowsElapsed(table.status) && (
          <span className="text-sm font-bold tabular-nums text-text-muted">
            {formatStatusElapsed(elapsed)}
          </span>
        )}
      </div>

      {editMode ? (
        <div className="rounded-lg bg-canvas-muted p-3">
          <p className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            Comensales máximos
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={table.capacity <= 1}
              onClick={() => onChangeCapacity(table.id, table.capacity - 1)}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-canvas-white text-text-main ring-1 ring-slate-50 transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Reducir capacidad"
            >
              <Minus className="size-4" />
            </button>
            <span className="text-2xl font-black tabular-nums text-text-main">
              {table.capacity}
            </span>
            <button
              type="button"
              disabled={table.capacity >= 12}
              onClick={() => onChangeCapacity(table.id, table.capacity + 1)}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-canvas-white text-text-main ring-1 ring-slate-50 transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Aumentar capacidad"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Forma:{" "}
            {table.shape === "circle"
              ? "Circular"
              : table.shape === "rectangle"
                ? "Rectangular"
                : "Cuadrada"}
          </p>
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-canvas-muted p-3 text-sm">
          <div>
            <dt className="text-[11px] text-text-muted">Comensales</dt>
            <dd className="font-bold tabular-nums text-text-main">
              {table.guestCount} / {table.capacity}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-text-muted">Forma</dt>
            <dd className="font-semibold capitalize text-text-main">
              {table.shape === "circle"
                ? "Circular"
                : table.shape === "rectangle"
                  ? "Rectangular"
                  : "Cuadrada"}
            </dd>
          </div>
        </dl>
      )}

      {!editMode && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            Acciones
          </p>

          <button
            type="button"
            disabled={!canAddGuest}
            onClick={() => onAddGuest(table.id)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-canvas-white px-3 py-2.5 text-sm font-semibold text-text-main ring-1 ring-slate-50 transition-colors hover:bg-surface-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-btn-disabled-bg disabled:text-btn-disabled-text disabled:ring-0 disabled:active:scale-100"
          >
            <Plus className="size-4" />
            Añadir comensal
          </button>

          {actions.map((action) => (
            <button key={action.key} type="button" className={action.className}>
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
    </div>
  );
};

export const ReceptionSidePanel = ({
  tables,
  selectedTable,
  editMode,
  nowMs,
  onClearSelection,
  onAddGuest,
  onChangeStatus,
  onChangeCapacity,
}: ReceptionSidePanelProps) => {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-slate-50 bg-canvas-white p-4 lg:w-80 lg:p-5">
      {selectedTable ? (
        <TableDetail
          table={selectedTable}
          editMode={editMode}
          nowMs={nowMs}
          onClearSelection={onClearSelection}
          onAddGuest={onAddGuest}
          onChangeStatus={onChangeStatus}
          onChangeCapacity={onChangeCapacity}
        />
      ) : (
        <GlobalOverview tables={tables} />
      )}
    </aside>
  );
};
