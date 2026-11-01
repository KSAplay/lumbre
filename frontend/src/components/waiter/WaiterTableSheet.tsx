import {
  useEffect,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react";
import {
  CalendarClock,
  CheckCircle2,
  HandPlatter,
  Info,
  NotebookPen,
  ReceiptEuro,
  Sparkles,
  X,
} from "lucide-react";
import {
  statusShowsElapsed,
  TABLE_STATUS_HEX,
  TABLE_STATUS_LABELS,
} from "../../constants/tableStatus";
import type { TableNodeData, TableStatus } from "../../types/table";
import { darkenColor } from "../../utils/color";
import { formatStoredTime } from "../../utils/dateTime";
import {
  elapsedSecondsSince,
  formatStatusElapsed,
} from "../../utils/tableTime";
import type { WaiterTableAction } from "../../types/waiter";
import { Badge } from "../ui/Badge";

type ActionConfig = {
  key: WaiterTableAction;
  label: string;
  icon: ReactNode;
  className: string;
};

const ACTION_BTN =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] px-4 py-3 text-sm font-bold shadow-sm transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const TAKE_ORDER: ActionConfig = {
  key: "take-order",
  label: "Tomar comanda",
  icon: <NotebookPen className="size-4.5" />,
  className: `${ACTION_BTN} bg-terracotta-400 text-white`,
};

function actionsForStatus(status: TableStatus): ActionConfig[] {
  switch (status) {
    case "decidiendo":
      return [TAKE_ORDER];
    case "esperando":
      return [
        {
          key: "served",
          label: "Marcar como servida",
          icon: <HandPlatter className="size-4.5" />,
          className: `${ACTION_BTN} bg-table-servido text-white`,
        },
        {
          ...TAKE_ORDER,
          label: "Añadir otra ronda",
          className: `${ACTION_BTN} bg-canvas-white text-text-main ring-1 ring-slate-50`,
        },
      ];
    case "servido":
      return [
        { ...TAKE_ORDER, label: "Tomar otra ronda" },
        {
          key: "bill",
          label: "Solicitar cuenta",
          icon: <ReceiptEuro className="size-4.5" />,
          className: `${ACTION_BTN} bg-table-cuenta text-white`,
        },
      ];
    case "cuenta":
      return [
        {
          key: "paid",
          label: "Marcar como pagada",
          icon: <CheckCircle2 className="size-4.5" />,
          className: `${ACTION_BTN} bg-table-servido text-white`,
        },
      ];
    case "limpiando":
      return [
        {
          key: "ready",
          label: "Mesa lista",
          icon: <Sparkles className="size-4.5" />,
          className: `${ACTION_BTN} bg-table-libre text-white`,
        },
      ];
    default:
      return [];
  }
}

type WaiterTableSheetProps = {
  table: TableNodeData | null;
  nowMs: number;
  busy: boolean;
  onClose: () => void;
  onAction: (tableId: string, action: WaiterTableAction) => void;
};

const ANIMATION_MS = 260;

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
    {children}
  </p>
);

export const WaiterTableSheet = ({
  table,
  nowMs,
  busy,
  onClose,
  onAction,
}: WaiterTableSheetProps) => {
  const open = table !== null;
  const [shownTable, setShownTable] = useState<TableNodeData | null>(table);
  const [entered, setEntered] = useState(false);

  // Conserva la última mesa para poder animar el cierre con su contenido
  if (table && table !== shownTable) {
    setShownTable(table);
  }
  if (!open && entered) {
    setEntered(false);
  }

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!shownTable) return null;

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "transform") return;
    if (!open) setShownTable(null);
  };

  const actions = actionsForStatus(shownTable.status);
  const showElapsed = statusShowsElapsed(shownTable.status);
  const guests =
    shownTable.guestCount > 0 ? shownTable.guestCount : shownTable.capacity;
  const titleAccent = darkenColor(TABLE_STATUS_HEX[shownTable.status], 0.32);

  return (
    <div
      className={`absolute inset-0 z-40 flex flex-col justify-end ${
        open ? "" : "pointer-events-none"
      }`}
    >
      <button
        type="button"
        aria-label="Cerrar detalle de mesa"
        className={`absolute inset-0 bg-text-main/45 transition-opacity ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${ANIMATION_MS}ms` }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waiter-table-title"
        className="relative mx-3 flex max-h-[85%] flex-col overflow-y-auto rounded-t-[20px] bg-canvas-white px-5 pt-3 pb-6 shadow-lg transition-transform ease-out md:mx-auto md:w-full md:max-w-lg"
        style={{
          transform: entered ? "translateY(0)" : "translateY(100%)",
          transitionDuration: `${ANIMATION_MS}ms`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        <div
          className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-50"
          aria-hidden
        />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="waiter-table-title"
              className="text-lg font-black tracking-tight uppercase tabular-nums"
              style={{ color: titleAccent }}
            >
              Mesa {String(shownTable.number).padStart(2, "0")}
            </h2>
            <p className="text-xs font-semibold text-text-muted capitalize">
              {shownTable.zone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-canvas-muted hover:text-text-main active:scale-90"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <SectionLabel>Estado</SectionLabel>
          <Badge
            variant={shownTable.status}
            className="w-full justify-center px-4 py-2 text-sm"
          >
            {TABLE_STATUS_LABELS[shownTable.status]}
          </Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Comensales</SectionLabel>
            <div className="rounded-lg bg-canvas-muted px-3 py-2.5 text-center text-lg font-bold tabular-nums text-text-main">
              {shownTable.status === "libre" || shownTable.status === "limpiando"
                ? "—"
                : guests}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Tiempo</SectionLabel>
            <div className="rounded-lg bg-canvas-muted px-3 py-2.5 text-center text-lg font-bold tabular-nums text-text-main">
              {showElapsed
                ? formatStatusElapsed(
                    elapsedSecondsSince(shownTable.statusChangedAt, nowMs),
                  )
                : "—"}
            </div>
          </div>
        </div>

        {shownTable.status === "reservada" && shownTable.reservation && (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-latte-100 px-3 py-2.5 text-sm text-text-main ring-1 ring-latte-300">
            <CalendarClock className="size-4.5 shrink-0 text-latte-500" />
            <span className="font-semibold">
              {shownTable.reservation.guestName}
            </span>
            <span className="ml-auto font-bold tabular-nums">
              {formatStoredTime(shownTable.reservation.time)}
            </span>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {actions.length > 0 ? (
            <>
              <SectionLabel>Acciones</SectionLabel>
              {actions.map((action) => (
                <button
                  key={`${action.key}-${action.label}`}
                  type="button"
                  disabled={busy}
                  onClick={() => onAction(shownTable.id, action.key)}
                  className={action.className}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </>
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg bg-canvas-muted px-3 py-3 text-[13px] text-text-muted">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                Gestionada por recepción. Cuando sienten a los comensales podrás
                tomar su comanda desde aquí.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
