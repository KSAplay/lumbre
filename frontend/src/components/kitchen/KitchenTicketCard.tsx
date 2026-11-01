import { useEffect, useRef, useState, type AnimationEvent } from "react";
import { BellRing, Check, CheckCheck, SquareText, Undo2 } from "lucide-react";
import { KITCHEN_ALERTS } from "../../constants/kitchenAlerts";
import type { KitchenTicket } from "../../types/kitchen";
import { formatAppTime } from "../../utils/dateTime";

type KitchenTicketCardProps = {
  ticket: KitchenTicket;
  nowMs: number;
  mode: "pending" | "completed";
  enterDelayMs?: number;
  onToggleItem: (ticketId: string, itemId: string) => void;
  onOpenAlerts: (ticketId: string) => void;
  /** Se llama cuando termina la animación de salida */
  onComplete: (ticketId: string) => void;
  onRestore: (ticketId: string) => void;
};

type Phase = "idle" | "confirming" | "leaving";

const WARNING_MINUTES = 10;
const CRITICAL_MINUTES = 20;

/**
 * Formatea segundos como cronómetro `MM:SS` (o `H:MM:SS` a partir de una hora).
 *
 * @param totalSeconds - Segundos transcurridos; los negativos se tratan como 0.
 */
const formatElapsedClock = (totalSeconds: number) => {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
};

const elapsedTone = (minutes: number) => {
  if (minutes < WARNING_MINUTES) return "bg-status-listo text-white";
  if (minutes < CRITICAL_MINUTES) return "bg-status-preparando text-text-main";
  return "bg-status-urgente text-white";
};

/** Separa "9:41 p. m." en hora y sufijo para darles tamaños distintos */
const splitTime = (date: Date) => {
  const label = formatAppTime(date);
  const match = /^(\d{1,2}:\d{2})\s*(.*)$/.exec(label);
  return match
    ? { clock: match[1], suffix: match[2] }
    : { clock: label, suffix: "" };
};

export const KitchenTicketCard = ({
  ticket,
  nowMs,
  mode,
  enterDelayMs = 0,
  onToggleItem,
  onOpenAlerts,
  onComplete,
  onRestore,
}: KitchenTicketCardProps) => {
  const [phase, setPhase] = useState<Phase>("idle");
  // Se activa tras el primer paint para que la animación CSS también dispare en altas dinámicas
  const [enterActive, setEnterActive] = useState(false);
  // Conserva la última incidencia para que la pestaña pueda esconderse con su texto
  const [shownAlert, setShownAlert] = useState(ticket.alert);
  const finishRef = useRef<(() => void) | null>(null);

  // Si se cambia de pestaña a mitad de la animación, la acción se completa igualmente
  useEffect(() => () => finishRef.current?.(), []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setEnterActive(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  if (ticket.alert && ticket.alert !== shownAlert) {
    setShownAlert(ticket.alert);
  }

  const isPending = mode === "pending";
  const isBusy = phase !== "idle";
  const alertConfig = ticket.alert ? KITCHEN_ALERTS[ticket.alert] : null;
  const tabConfig = shownAlert ? KITCHEN_ALERTS[shownAlert] : null;
  const showAlertTab = Boolean(ticket.alert) && phase === "idle";

  const endMs = ticket.completedAt?.getTime() ?? nowMs;
  const elapsedSeconds = (endMs - ticket.sentAt.getTime()) / 1000;
  const elapsedMinutes = elapsedSeconds / 60;
  const isLate = isPending && elapsedMinutes >= CRITICAL_MINUTES;

  const doneCount = ticket.items.filter((item) => item.done).length;
  const allDone = doneCount === ticket.items.length;
  const { clock, suffix } = splitTime(ticket.sentAt);

  const handlePrimary = () => {
    if (isBusy) return;
    const ticketId = ticket.id;
    finishRef.current = isPending
      ? () => onComplete(ticketId)
      : () => onRestore(ticketId);
    setPhase(isPending ? "confirming" : "leaving");
  };

  const handleWrapperAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || phase !== "leaving") return;
    const finish = finishRef.current;
    finishRef.current = null;
    finish?.();
  };

  const enterClass = enterActive
    ? "animate-kds-ticket-in"
    : "opacity-0 translate-y-6 scale-[0.94]";

  return (
    <div
      className={`relative isolate h-full ${
        phase === "leaving" ? "animate-kds-ticket-out" : enterClass
      }`}
      style={{
        animationDelay: phase === "leaving" ? "0ms" : `${enterDelayMs}ms`,
      }}
      onAnimationEnd={handleWrapperAnimationEnd}
    >
      {/* Pestaña de incidencia: sale desde detrás del ticket sin desplazarlo */}
      {tabConfig && (
        <div
          aria-hidden={!showAlertTab}
          className={`absolute bottom-full left-1/2 z-0 flex max-w-[85%] -translate-x-1/2 items-center gap-2 rounded-t-xl px-4 pt-1.5 pb-3.5 text-sm font-black tracking-wide text-white uppercase shadow-md transition-transform duration-300 ease-out ${tabConfig.bg} ${
            showAlertTab ? "translate-y-2.5" : "translate-y-full"
          }`}
        >
          <tabConfig.icon className="size-4 shrink-0" strokeWidth={2.6} />
          <span className="truncate">{tabConfig.tabLabel}</span>
        </div>
      )}

      <article
        aria-label={`${ticket.tableLabel}, comanda ${ticket.number}`}
        className={`relative z-10 flex h-full flex-col overflow-hidden rounded-2xl bg-canvas-white shadow-[0_10px_28px_rgba(43,44,52,0.14)] ring-4 transition-shadow duration-300 ${
          alertConfig && phase === "idle"
            ? alertConfig.ring
            : "ring-transparent"
        }`}
      >
        <div
          className={`flex min-h-0 flex-1 flex-col transition-[opacity,transform] duration-150 ease-out ${
            isBusy ? "scale-[0.97] opacity-0" : "opacity-100"
          }`}
        >
          {/* Cabecera: mesa, nº de comanda, hora y tiempo transcurrido */}
          <header className="shrink-0 px-5 pt-4 pb-3">
            <div className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span className="justify-self-start text-xl font-black text-text-muted">
                #{ticket.number}
              </span>

              <span className="rounded-full bg-terracotta-500 px-3 py-0.5 text-sm font-bold text-white">
                {ticket.tableLabel}
              </span>

              {isPending && (
                <button
                  type="button"
                  aria-label="Avisar incidencia"
                  disabled={isBusy}
                  onClick={() => onOpenAlerts(ticket.id)}
                  className={`flex size-11 shrink-0 cursor-pointer items-center justify-center justify-self-end rounded-full transition-[transform,background-color] active:scale-90 ${
                    alertConfig
                      ? `${alertConfig.bg} text-white shadow-sm`
                      : "bg-canvas-muted text-text-muted"
                  }`}
                >
                  <BellRing className="size-5" strokeWidth={2.4} />
                </button>
              )}
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="flex items-baseline gap-1.5 leading-none text-text-main">
                <span className="text-3xl font-extrabold tabular-nums">
                  {clock}
                </span>
                {suffix && (
                  <span className="text-base font-bold text-text-muted">
                    {suffix}
                  </span>
                )}
              </p>
              <span
                title={
                  isPending ? "Tiempo en cocina" : "Tiempo total de preparación"
                }
                className={`shrink-0 rounded-full px-3.5 py-1 text-base font-bold tabular-nums transition-colors duration-500 ${elapsedTone(
                  elapsedMinutes,
                )} ${isLate ? "animate-kds-late-pulse" : ""}`}
              >
                {formatElapsedClock(elapsedSeconds)}
              </span>
            </div>
          </header>

          <div className="mx-5 border-t border-slate-50" />

          {/* Contenido: nota del cliente y platos */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3 scrollbar-thin">
            {ticket.note && (
              <div className="mb-3 rounded-[10px] border border-latte-300 bg-latte-100 px-3.5 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-latte-500 uppercase">
                  <SquareText className="size-4" strokeWidth={2.4} />
                  Nota del cliente
                </p>
                <p className="mt-1 text-[15px] leading-snug font-medium whitespace-pre-line text-text-main">
                  {ticket.note}
                </p>
              </div>
            )}

            <div className="mb-1 flex items-center justify-between text-xs font-bold tracking-wide text-text-muted uppercase">
              <span>Platos</span>
              <span className="tabular-nums">
                {isPending
                  ? `${doneCount}/${ticket.items.length}`
                  : ticket.items.length}
              </span>
            </div>

            <ul className="flex flex-col">
              {ticket.items.map((item) => {
                // En terminadas se muestra limpio para poder revisar lo cocinado
                const struck = isPending && item.done;

                return (
                  <li
                    key={item.id}
                    className="border-b border-slate-50 last:border-b-0"
                  >
                    <button
                      type="button"
                      disabled={!isPending || isBusy}
                      aria-pressed={isPending ? item.done : undefined}
                      onClick={() => onToggleItem(ticket.id, item.id)}
                      className="flex w-full cursor-pointer items-start gap-3 py-2.5 text-left disabled:cursor-default"
                    >
                      {isPending && (
                        <span
                          aria-hidden
                          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                            struck
                              ? "border-toast-green bg-toast-green text-white"
                              : "border-slate-50 bg-canvas-white text-transparent"
                          }`}
                        >
                          <Check
                            className={`size-4 transition-transform duration-200 ${
                              struck ? "scale-100" : "scale-0"
                            }`}
                            strokeWidth={3.5}
                          />
                        </span>
                      )}
                      <span
                        className={`text-lg leading-snug font-semibold transition-colors duration-300 ${
                          struck ? "text-text-muted" : "text-text-main"
                        }`}
                      >
                        <span
                          className={`font-black ${
                            struck ? "text-text-muted" : "text-terracotta-400"
                          }`}
                        >
                          {item.quantity}x
                        </span>{" "}
                        {/* Tachado animado: el fondo crece de 0 % a 100 % y respeta los saltos de línea */}
                        <span
                          className={`bg-linear-to-r from-text-main to-text-main bg-no-repeat bg-position-[0_55%] transition-[background-size] duration-300 ease-out ${
                            struck ? "bg-size-[100%_3px]" : "bg-size-[0%_3px]"
                          }`}
                        >
                          {item.name}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Botón principal pegado a los bordes del ticket */}
        <button
          type="button"
          disabled={isBusy}
          onClick={handlePrimary}
          className={`group flex w-full shrink-0 cursor-pointer items-center justify-center border-0 px-4 py-4 text-lg font-bold text-white transition-opacity duration-150 ${
            isPending ? "bg-toast-green" : "bg-latte-400"
          } ${isBusy ? "opacity-0" : ""} ${
            isPending && allDone && !isBusy ? "animate-kds-ready-pulse" : ""
          }`}
        >
          <span className="inline-flex items-center gap-2.5 transition-transform duration-150 group-active:scale-95">
            {isPending ? (
              <>
                <CheckCheck className="size-6" strokeWidth={2.6} />
                {allDone ? "Mesa lista" : "Confirmar comanda"}
              </>
            ) : (
              <>
                <Undo2 className="size-5" strokeWidth={2.6} />
                Devolver a cocina
              </>
            )}
          </span>
        </button>

        {/* Confirmación: check verde centrado antes de salir */}
        {phase !== "idle" && isPending && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex size-28 animate-kds-check-pop items-center justify-center rounded-full bg-toast-green-soft">
              <svg
                viewBox="0 0 24 24"
                className="size-16 text-toast-green"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  pathLength={1}
                  strokeDasharray={1}
                  className="animate-kds-check-draw"
                  onAnimationEnd={() => setPhase("leaving")}
                />
              </svg>
            </div>
          </div>
        )}
      </article>
    </div>
  );
};
