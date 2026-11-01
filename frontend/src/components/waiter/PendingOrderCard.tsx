import { useState, type AnimationEvent } from "react";
import {
  Check,
  LoaderCircle,
  Minus,
  PencilLine,
  Plus,
  SendHorizontal,
  SquareText,
  Trash2,
  X,
} from "lucide-react";
import type { PendingOrder } from "../../types/waiter";
import { formatAppTime } from "../../utils/dateTime";
import { formatStatusElapsed } from "../../utils/tableTime";

type PendingOrderCardProps = {
  order: PendingOrder;
  nowMs: number;
  busy: boolean;
  /** Activa la animación de salida; al terminar se llama a `onExited` */
  leaving: boolean;
  onIncrease: (orderId: string, dishId: number) => void;
  onDecrease: (orderId: string, dishId: number) => void;
  onReject: (orderId: string) => void;
  onConfirm: (orderId: string) => void;
  onExited: (orderId: string) => void;
};

/** El camarero debería revisar las rondas en pocos minutos */
const WARNING_MINUTES = 3;
const CRITICAL_MINUTES = 6;

const formatPrice = (price: number) =>
  price.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });

const waitTone = (minutes: number) => {
  if (minutes < WARNING_MINUTES) return "bg-status-listo text-white";
  if (minutes < CRITICAL_MINUTES) return "bg-status-preparando text-text-main";
  return "bg-status-urgente text-white";
};

export const PendingOrderCard = ({
  order,
  nowMs,
  busy,
  leaving,
  onIncrease,
  onDecrease,
  onReject,
  onConfirm,
  onExited,
}: PendingOrderCardProps) => {
  const [editing, setEditing] = useState(false);

  const elapsedSeconds = (nowMs - order.sentAt.getTime()) / 1000;
  const total = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const unitCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const isEmpty = order.items.length === 0;
  const isLate = elapsedSeconds / 60 >= CRITICAL_MINUTES;

  const handleAnimationEnd = (event: AnimationEvent<HTMLLIElement>) => {
    if (event.target !== event.currentTarget || !leaving) return;
    onExited(order.id);
  };

  return (
    <li
      onAnimationEnd={handleAnimationEnd}
      className={`overflow-hidden rounded-[14px] bg-canvas-white shadow-sm ${
        leaving
          ? "animate-kds-ticket-out"
          : isLate
            ? "animate-kds-late-pulse"
            : "animate-kds-ticket-in"
      }`}
    >
      {/* Cabecera: mesa, número, hora y espera */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-full bg-cacao-300 px-3 py-1 text-[13px] font-bold text-white">
            {order.tableLabel}
          </span>
          <span className="text-sm font-bold text-text-muted tabular-nums">
            #{order.number}
          </span>
          <span className="text-xs font-medium text-slate-100">
            {formatAppTime(order.sentAt)}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${waitTone(
            elapsedSeconds / 60,
          )}`}
          aria-label="Tiempo esperando confirmación"
        >
          {formatStatusElapsed(elapsedSeconds)}
        </span>
      </div>

      {/* Líneas */}
      <ul className="px-4">
        {order.items.map((item) => (
          <li
            key={item.dishId}
            className="flex items-center justify-between gap-3 border-b border-slate-50 py-2.5 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {!editing && (
                <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-latte-200 px-1 text-[13px] font-black text-text-main tabular-nums">
                  {item.quantity}
                </span>
              )}
              <span className="truncate text-[13px] font-bold text-text-main">
                {item.name}
              </span>
            </div>

            {editing ? (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label={
                    item.quantity === 1
                      ? `Eliminar ${item.name}`
                      : `Quitar ${item.name}`
                  }
                  onClick={() => onDecrease(order.id, item.dishId)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-terracotta-400 text-white shadow-sm transition-transform active:scale-90"
                >
                  {item.quantity === 1 ? (
                    <Trash2 className="size-4" strokeWidth={2.5} />
                  ) : (
                    <Minus className="size-4" strokeWidth={3} />
                  )}
                </button>
                <span className="min-w-6 text-center text-sm font-bold text-text-main tabular-nums">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Añadir ${item.name}`}
                  onClick={() => onIncrease(order.id, item.dishId)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-terracotta-300 text-white shadow-sm transition-transform active:scale-90"
                >
                  <Plus className="size-4" strokeWidth={3} />
                </button>
              </div>
            ) : (
              <span className="shrink-0 text-[13px] font-black text-text-main">
                {formatPrice(item.price * item.quantity)}
              </span>
            )}
          </li>
        ))}
        {isEmpty && (
          <li className="py-4 text-center text-sm text-text-muted">
            Ronda sin platos. Recházala o avisa a la mesa.
          </li>
        )}
      </ul>

      {order.note && (
        <div className="mx-4 mb-3 flex gap-2 rounded-[9px] bg-latte-200 px-3 py-2 text-[13px] text-text-main">
          <SquareText className="mt-0.5 size-4 shrink-0 text-latte-500" />
          <p className="leading-relaxed">{order.note}</p>
        </div>
      )}

      {/* Pie: total y acciones */}
      <div className="border-t border-slate-50 px-4 pt-3 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-muted">
            {unitCount} {unitCount === 1 ? "plato" : "platos"}
          </span>
          <span className="text-lg font-black text-text-main">
            {formatPrice(total)}
          </span>
        </div>

        <div className="grid grid-cols-[auto_auto_1fr] gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onReject(order.id)}
            aria-label="Rechazar ronda"
            className="flex size-11 cursor-pointer items-center justify-center rounded-[9px] bg-terracotta-100 text-toast-red transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditing((prev) => !prev)}
            aria-label={editing ? "Terminar ajuste" : "Ajustar cantidades"}
            aria-pressed={editing}
            className={`flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] px-3 text-[13px] font-bold transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              editing
                ? "bg-latte-400 text-white"
                : "bg-latte-100 text-latte-500 ring-1 ring-latte-300"
            }`}
          >
            {editing ? (
              <Check className="size-4" strokeWidth={2.5} />
            ) : (
              <PencilLine className="size-4" />
            )}
            {editing ? "Listo" : "Ajustar"}
          </button>
          <button
            type="button"
            disabled={busy || isEmpty || editing}
            onClick={() => onConfirm(order.id)}
            className={`flex h-11 items-center justify-center gap-2 rounded-[9px] px-3 text-[13px] font-bold shadow-sm ${
              busy
                ? "cursor-wait bg-terracotta-200 text-white"
                : isEmpty || editing
                  ? "cursor-not-allowed bg-btn-disabled-bg text-btn-disabled-text"
                  : "cursor-pointer bg-terracotta-400 text-white transition-transform active:scale-[0.98]"
            }`}
          >
            {busy ? (
              <LoaderCircle
                className="size-5 animate-spin"
                strokeWidth={2.5}
                aria-label="Enviando"
              />
            ) : (
              <>
                <SendHorizontal className="size-4" />
                Confirmar a cocina
              </>
            )}
          </button>
        </div>
      </div>
    </li>
  );
};
