import { useCallback, useEffect, useState } from "react";
import { BellRing, ChefHat, ClipboardCheck } from "lucide-react";
import { KitchenAlertModal } from "../../components/kitchen/KitchenAlertModal";
import { KitchenTicketBoard } from "../../components/kitchen/KitchenTicketBoard";
import { KitchenTicketCard } from "../../components/kitchen/KitchenTicketCard";
import { StaffShell } from "../../components/ui/StaffShell";
import { useToast } from "../../components/ui/useToast";
import { KITCHEN_ALERTS } from "../../constants/kitchenAlerts";
import {
  INITIAL_KITCHEN_TICKET_COUNT,
  MOCK_INCOMING_TICKETS,
  createInitialKitchenTickets,
  createKitchenTicket,
} from "../../data/mockKitchenTickets";
import type { KitchenAlertType, KitchenTicket } from "../../types/kitchen";

type KdsTab = "pending" | "completed";

const TABS: { id: KdsTab; label: string }[] = [
  { id: "pending", label: "En cocina" },
  { id: "completed", label: "Terminadas" },
];

// TODO: sustituir por el evento de Socket.io de nueva ronda
const MOCK_ARRIVAL_INTERVAL_MS = 40_000;

export const KitchenKDSView = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<KdsTab>("pending");
  const [tickets, setTickets] = useState(createInitialKitchenTickets);
  const [completed, setCompleted] = useState<KitchenTicket[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertTicketId, setAlertTicketId] = useState<string | null>(null);
  const [incomingIndex, setIncomingIndex] = useState(0);

  const tabIndex = TABS.findIndex((item) => item.id === tab);
  const alertTicket = tickets.find((ticket) => ticket.id === alertTicketId);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (incomingIndex >= MOCK_INCOMING_TICKETS.length) return;

    const id = window.setTimeout(() => {
      const template = MOCK_INCOMING_TICKETS[incomingIndex];
      const number = INITIAL_KITCHEN_TICKET_COUNT + incomingIndex + 1;
      setTickets((prev) => [...prev, createKitchenTicket(template, number)]);
      setIncomingIndex((index) => index + 1);
      showToast({
        message: `Nueva comanda · ${template.tableLabel}`,
        icon: <ChefHat className="size-4" strokeWidth={2.5} />,
        tone: "terracotta",
      });
    }, MOCK_ARRIVAL_INTERVAL_MS);

    return () => window.clearTimeout(id);
  }, [incomingIndex, showToast]);

  const handleToggleItem = useCallback((ticketId: string, itemId: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id !== ticketId
          ? ticket
          : {
              ...ticket,
              items: ticket.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item,
              ),
            },
      ),
    );
  }, []);

  const handleOpenAlerts = useCallback((ticketId: string) => {
    setAlertTicketId(ticketId);
    setAlertModalOpen(true);
  }, []);

  const handleComplete = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((item) => item.id === ticketId);
      if (!ticket) return;

      setTickets((prev) => prev.filter((item) => item.id !== ticketId));
      setCompleted((prev) => [
        {
          ...ticket,
          alert: null,
          items: ticket.items.map((item) => ({ ...item, done: true })),
          completedAt: new Date(),
        },
        ...prev,
      ]);
    },
    [tickets],
  );

  const handleRestore = useCallback(
    (ticketId: string) => {
      const ticket = completed.find((item) => item.id === ticketId);
      if (!ticket) return;

      setCompleted((prev) => prev.filter((item) => item.id !== ticketId));
      // Vuelve a su sitio FIFO según la hora del pedido
      setTickets((prev) =>
        [...prev, { ...ticket, completedAt: undefined }].sort(
          (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
        ),
      );
    },
    [completed],
  );

  const setTicketAlert = (alert: KitchenAlertType | null) => {
    if (!alertTicketId) return;
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === alertTicketId ? { ...ticket, alert } : ticket,
      ),
    );
    setAlertModalOpen(false);
  };

  const handleSelectAlert = (alert: KitchenAlertType) => {
    const config = KITCHEN_ALERTS[alert];
    setTicketAlert(alert);
    // TODO: emitir la incidencia a sala por Socket.io
    showToast({
      message: `${config.label} · ${alertTicket?.tableLabel ?? ""}`,
      icon: <BellRing className="size-4" strokeWidth={2.5} />,
      tone: config.toastTone,
    });
  };

  const handleCloseAlerts = useCallback(() => setAlertModalOpen(false), []);

  const visibleTickets = tab === "pending" ? tickets : completed;

  return (
    <StaffShell emphasizeClock>
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Barra superior: pestañas y leyenda de tiempos */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 px-5 pt-5 md:px-6 lg:px-8">
          <div
            className="relative grid grid-cols-2 rounded-lg bg-canvas-dim/40 p-1"
            role="tablist"
            aria-label="Comandas"
          >
            <span
              aria-hidden
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-md bg-canvas-white shadow-sm transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${tabIndex * 100}%)` }}
            />
            {TABS.map((item) => {
              const active = tab === item.id;
              const count =
                item.id === "pending" ? tickets.length : completed.length;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`relative z-10 flex min-w-44 cursor-pointer items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold transition-colors duration-200 ${
                    active ? "text-text-main" : "text-text-muted hover:text-text-main"
                  }`}
                >
                  {item.label}
                  <span
                    className={`min-w-7 rounded-full px-2 py-0.5 text-sm font-bold tabular-nums transition-colors duration-200 ${
                      active
                        ? "bg-terracotta-300 text-white"
                        : "bg-canvas-white/70 text-text-muted"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <ul
            className="flex items-center gap-4 text-sm font-semibold text-text-muted"
            aria-label="Leyenda de tiempos"
          >
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-status-listo" />
              &lt; 10 min
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-status-preparando" />
              10–20 min
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-status-urgente" />
              &gt; 20 min
            </li>
          </ul>
        </div>

        <KitchenTicketBoard
          key={tab}
          tickets={visibleTickets}
          renderTicket={(ticket, enterDelayMs) => (
            <KitchenTicketCard
              ticket={ticket}
              nowMs={nowMs}
              mode={tab}
              enterDelayMs={enterDelayMs}
              onToggleItem={handleToggleItem}
              onOpenAlerts={handleOpenAlerts}
              onComplete={handleComplete}
              onRestore={handleRestore}
            />
          )}
          emptyState={
            <div className="flex flex-col items-center text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-canvas-muted text-text-muted">
                {tab === "pending" ? (
                  <ChefHat className="size-10" strokeWidth={1.75} />
                ) : (
                  <ClipboardCheck className="size-10" strokeWidth={1.75} />
                )}
              </div>
              <p className="mt-4 text-xl font-bold text-text-main">
                {tab === "pending"
                  ? "No hay comandas pendientes"
                  : "Aún no hay comandas terminadas"}
              </p>
              <p className="mt-1.5 max-w-sm text-base text-text-muted">
                {tab === "pending"
                  ? "Las nuevas rondas aparecerán aquí en orden de llegada."
                  : "Las comandas confirmadas se guardan en esta pestaña."}
              </p>
            </div>
          }
        />
      </div>

      <KitchenAlertModal
        open={alertModalOpen}
        subtitle={
          alertTicket ? `${alertTicket.tableLabel} · #${alertTicket.number}` : ""
        }
        activeAlert={alertTicket?.alert ?? null}
        onSelect={handleSelectAlert}
        onClear={() => setTicketAlert(null)}
        onClose={handleCloseAlerts}
      />
    </StaffShell>
  );
};
