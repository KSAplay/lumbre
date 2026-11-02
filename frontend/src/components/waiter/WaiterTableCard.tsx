import { Clock, Users } from "lucide-react";
import {
  statusShowsElapsed,
  TABLE_STATUS_DOT,
  TABLE_STATUS_ICONS,
  TABLE_STATUS_LABELS,
} from "../../constants/tableStatus";
import type { TableNodeData } from "../../types/table";
import { formatStoredTime } from "../../utils/dateTime";
import {
  elapsedSecondsSince,
  formatStatusElapsed,
} from "../../utils/tableTime";
import { Badge } from "../ui/Badge";

type WaiterTableCardProps = {
  table: TableNodeData;
  nowMs: number;
  /** Hay avisos sin leer de esta mesa */
  hasAlert?: boolean;
  onSelect: (tableId: string) => void;
};

export const WaiterTableCard = ({
  table,
  nowMs,
  hasAlert = false,
  onSelect,
}: WaiterTableCardProps) => {
  const StatusIcon = TABLE_STATUS_ICONS[table.status];
  const showElapsed = statusShowsElapsed(table.status);
  const guests = table.guestCount > 0 ? table.guestCount : table.capacity;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(table.id)}
        className="relative flex h-full w-full cursor-pointer overflow-hidden rounded-xl bg-canvas-white text-left shadow-sm transition-transform active:scale-[0.97]"
      >
        <span
          aria-hidden
          className={`w-1.5 shrink-0 ${TABLE_STATUS_DOT[table.status]}`}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[15px] font-black tracking-tight text-text-main tabular-nums">
              Mesa {String(table.number).padStart(2, "0")}
              {hasAlert && (
                <span
                  className="relative flex size-2.5"
                  aria-label="Aviso sin leer"
                >
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-urgente opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-status-urgente" />
                </span>
              )}
            </span>
            <StatusIcon
              className="size-4.5 shrink-0 text-text-muted"
              strokeWidth={2.25}
            />
          </div>

          <Badge variant={table.status} className="self-start">
            {TABLE_STATUS_LABELS[table.status]}
          </Badge>

          <div className="mt-auto flex items-center justify-between gap-2 text-xs font-semibold text-text-muted">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {table.status === "libre" || table.status === "limpiando"
                ? "—"
                : guests}
            </span>
            {showElapsed ? (
              <span className="flex items-center gap-1 tabular-nums text-text-main">
                <Clock className="size-3.5" />
                {formatStatusElapsed(
                  elapsedSecondsSince(table.statusChangedAt, nowMs),
                )}
              </span>
            ) : table.status === "reservada" && table.reservation ? (
              <span className="tabular-nums">
                {formatStoredTime(table.reservation.time)}
              </span>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
};
