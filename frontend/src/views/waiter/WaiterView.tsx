import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  BellOff,
  BellRing,
  CheckCheck,
  CircleCheck,
  ClipboardCheck,
  Lock,
  LogOut,
  Plus,
  X,
} from "lucide-react";
import { ManualOrderPanel } from "../../components/waiter/ManualOrderPanel";
import { PendingOrderCard } from "../../components/waiter/PendingOrderCard";
import { WaiterNotificationItem } from "../../components/waiter/WaiterNotificationItem";
import { WaiterTabBar } from "../../components/waiter/WaiterTabBar";
import { WaiterTableSheet } from "../../components/waiter/WaiterTableSheet";
import { WaiterTablesPanel } from "../../components/waiter/WaiterTablesPanel";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { LiveDateTime } from "../../components/ui/LiveDateTime";
import { StaffShell } from "../../components/ui/StaffShell";
import { UserMenu, type UserMenuItem } from "../../components/ui/UserMenu";
import { useToast } from "../../components/ui/useToast";
import { WAITER_NOTIFICATIONS } from "../../constants/waiterNotifications";
import { WAITER_ACTION_NEXT_STATUS } from "../../constants/waiterTableActions";
import { createWaiterDemoTables } from "../../data/mockTables";
import {
  INITIAL_PENDING_ORDER_COUNT,
  createInitialPendingOrders,
  createInitialWaiterNotifications,
  createRandomPendingOrder,
  createRandomWaiterNotification,
} from "../../data/mockWaiterOrders";
import { updateTableStatus } from "../../services/tableService";
import { confirmOrder, rejectOrder } from "../../services/waiterService";
import type { TableNodeData, TableStatus } from "../../types/table";
import type {
  PendingOrder,
  WaiterNotification,
  WaiterTab,
  WaiterTableAction,
} from "../../types/waiter";

type NotificationFilter = "all" | "unread";

/** Estados en los que el camarero puede tomar comanda */
const ORDERABLE_STATUSES: ReadonlySet<TableStatus> = new Set([
  "decidiendo",
  "esperando",
  "servido",
]);

const PANEL_SCROLL =
  "min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6 md:px-6 md:pt-5 [-ms-overflow-style:none] [scrollbar-none] [&::-webkit-scrollbar]:hidden";

export const WaiterView = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tab, setTab] = useState<WaiterTab>("orders");
  const [tables, setTables] = useState<TableNodeData[]>(createWaiterDemoTables);
  const [orders, setOrders] = useState<PendingOrder[]>(
    createInitialPendingOrders,
  );
  const [notifications, setNotifications] = useState<WaiterNotification[]>(
    createInitialWaiterNotifications,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [leavingOrderIds, setLeavingOrderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [sheetTableId, setSheetTableId] = useState<string | null>(null);
  const [tableBusy, setTableBusy] = useState(false);
  const [manualTableId, setManualTableId] = useState<string | null>(null);
  const [notificationFilter, setNotificationFilter] =
    useState<NotificationFilter>("all");
  // TODO: borrar junto con el botón flotante de demo
  const nextOrderNumberRef = useRef(INITIAL_PENDING_ORDER_COUNT + 1);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const pendingCount = orders.length - leavingOrderIds.size;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const sheetTable = tables.find((t) => t.id === sheetTableId) ?? null;
  const rejectTarget = orders.find((o) => o.id === rejectOrderId) ?? null;

  const orderableTables = useMemo(
    () =>
      tables
        .filter((t) => ORDERABLE_STATUSES.has(t.status))
        .sort((a, b) => a.number - b.number),
    [tables],
  );
  const effectiveManualTableId = orderableTables.some(
    (t) => t.id === manualTableId,
  )
    ? manualTableId
    : null;

  const alertTableIds = useMemo(
    () => new Set(notifications.filter((n) => !n.read).map((n) => n.tableId)),
    [notifications],
  );

  const visibleNotifications =
    notificationFilter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const applyTableStatus = useCallback(
    (tableId: string, status: TableStatus) => {
      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== tableId || t.status === status) return t;
          const clearsGuests = status === "libre" || status === "limpiando";
          return {
            ...t,
            status,
            statusChangedAt: Date.now(),
            guestCount: clearsGuests ? 0 : t.guestCount,
          };
        }),
      );
    },
    [],
  );

  const pushNotification = useCallback(
    (notification: WaiterNotification) => {
      const config = WAITER_NOTIFICATIONS[notification.type];
      setNotifications((prev) => [notification, ...prev]);
      showToast({
        message: `${config.label} · ${notification.tableLabel}`,
        icon: <BellRing className="size-4" strokeWidth={2.5} />,
        tone: config.toastTone,
      });
      if ("vibrate" in navigator) navigator.vibrate([120, 60, 120]);
    },
    [showToast],
  );

  // TODO: borrar este handler junto con el botón flotante; los pedidos y avisos llegarán por Socket.io
  const handleSimulateIncoming = () => {
    if (Math.random() < 0.5) {
      const order = createRandomPendingOrder(nextOrderNumberRef.current);
      nextOrderNumberRef.current += 1;
      setOrders((prev) => [...prev, order]);
      pushNotification({
        id: `notif-${order.id}`,
        type: "nuevo_pedido",
        tableId: order.tableId,
        tableLabel: order.tableLabel,
        message: "Nueva ronda pendiente de confirmar.",
        createdAt: new Date(),
        read: false,
      });
      return;
    }
    pushNotification(createRandomWaiterNotification());
  };

  const markTableOrderNotificationsRead = (tableId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.type === "nuevo_pedido" && n.tableId === tableId && !n.read
          ? { ...n, read: true }
          : n,
      ),
    );
  };

  const updateOrderLine = (orderId: string, dishId: number, delta: number) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id !== orderId
          ? order
          : {
              ...order,
              items: order.items
                .map((item) =>
                  item.dishId === dishId
                    ? { ...item, quantity: item.quantity + delta }
                    : item,
                )
                .filter((item) => item.quantity > 0),
            },
      ),
    );
  };

  const startLeaving = (orderId: string) => {
    setLeavingOrderIds((prev) => new Set(prev).add(orderId));
  };

  const handleOrderExited = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setLeavingOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }, []);

  const handleConfirmOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || busyOrderId) return;
    setBusyOrderId(orderId);
    try {
      await confirmOrder(orderId, {
        tableId: order.tableId,
        items: order.items,
        note: order.note,
      });
      // TODO: emitir ronda confirmada a cocina por Socket.io (llegará al KDS como ticket)
      startLeaving(orderId);
      applyTableStatus(order.tableId, "esperando");
      markTableOrderNotificationsRead(order.tableId);
      showToast({
        message: `Ronda enviada a cocina · ${order.tableLabel}`,
        icon: <CircleCheck className="size-4" strokeWidth={2.5} />,
        tone: "green",
      });
    } catch {
      showToast({
        message: "No se pudo confirmar la ronda. Inténtalo otra vez.",
        tone: "red",
      });
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleRejectOrder = async () => {
    const order = rejectTarget;
    setRejectOrderId(null);
    if (!order || busyOrderId) return;
    setBusyOrderId(order.id);
    try {
      await rejectOrder(order.id, { tableId: order.tableId });
      // TODO: notificar al cliente por Socket.io que su ronda se ha cancelado
      startLeaving(order.id);
      markTableOrderNotificationsRead(order.tableId);
      showToast({
        message: `Ronda rechazada · ${order.tableLabel}`,
        icon: <X className="size-4" strokeWidth={2.5} />,
        tone: "terracotta",
      });
    } catch {
      showToast({
        message: "No se pudo rechazar la ronda. Inténtalo otra vez.",
        tone: "red",
      });
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleTableAction = async (
    tableId: string,
    action: WaiterTableAction,
  ) => {
    if (action === "take-order") {
      setManualTableId(tableId);
      setSheetTableId(null);
      setTab("manual");
      return;
    }

    const table = tables.find((t) => t.id === tableId);
    if (!table || tableBusy) return;
    const nextStatus = WAITER_ACTION_NEXT_STATUS[action];
    const clearsGuests = nextStatus === "libre" || nextStatus === "limpiando";

    setTableBusy(true);
    try {
      await updateTableStatus(tableId, {
        status: nextStatus,
        guestCount: clearsGuests ? 0 : table.guestCount,
      });
      applyTableStatus(tableId, nextStatus);
    } catch (err) {
      console.error("No se pudo actualizar el estado de la mesa", err);
      showToast({
        message: "No se pudo cambiar el estado de la mesa.",
        tone: "red",
      });
    } finally {
      setTableBusy(false);
    }
  };

  const handleCloseSheet = useCallback(() => setSheetTableId(null), []);

  const handleManualOrderSent = (tableId: string) => {
    applyTableStatus(tableId, "esperando");
  };

  const handleOpenNotification = (notification: WaiterNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );
    if (notification.type === "nuevo_pedido") {
      setTab("orders");
      return;
    }
    setTab("tables");
    setSheetTableId(notification.tableId);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.some((n) => !n.read) ? prev.map((n) => ({ ...n, read: true })) : prev,
    );
  };

  const userMenuItems: UserMenuItem[] = [
    {
      id: "lock",
      label: "Bloquear Pantalla",
      icon: Lock,
      onSelect: () => navigate("/login"),
    },
    {
      id: "end-shift",
      label: "Finalizar Turno",
      icon: LogOut,
      tone: "danger",
      confirm: {
        title: "¿Finalizar turno?",
        description:
          "Se cerrará tu turno de sala y volverás al inicio de sesión.",
        confirmLabel: "Finalizar",
      },
      // TODO: cerrar el turno del camarero en el backend antes de volver al login
      onSelect: () => navigate("/login"),
    },
  ];

  return (
    <StaffShell
      framed
      headerCenter={
        <LiveDateTime
          layout="time"
          showSeconds={false}
          className="text-base font-bold tracking-wide text-white tabular-nums md:text-lg"
        />
      }
      headerRight={<UserMenu items={userMenuItems} />}
    >
      {/* Pedidos por confirmar */}
      <section
        className={tab === "orders" ? PANEL_SCROLL : "hidden"}
        aria-label="Pedidos por confirmar"
      >
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-text-main">Por confirmar</h1>
            <p className="text-[13px] text-text-muted">
              Revisa cada ronda antes de mandarla a cocina.
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="flex size-18 items-center justify-center rounded-full bg-canvas-muted text-text-muted">
              <ClipboardCheck className="size-9" strokeWidth={1.75} />
            </div>
            <p className="mt-4 text-base font-bold text-text-main">
              Todo confirmado
            </p>
            <p className="mt-1 max-w-64 text-sm text-text-muted">
              Las rondas que envíen las mesas desde la carta aparecerán aquí.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 md:grid md:grid-cols-2 md:items-start">
            {orders.map((order) => (
              <PendingOrderCard
                key={order.id}
                order={order}
                nowMs={nowMs}
                busy={busyOrderId === order.id}
                leaving={leavingOrderIds.has(order.id)}
                onIncrease={(orderId, dishId) =>
                  updateOrderLine(orderId, dishId, 1)
                }
                onDecrease={(orderId, dishId) =>
                  updateOrderLine(orderId, dishId, -1)
                }
                onReject={setRejectOrderId}
                onConfirm={(orderId) => void handleConfirmOrder(orderId)}
                onExited={handleOrderExited}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Mesas */}
      <div
        className={tab === "tables" ? "flex min-h-0 flex-1 flex-col" : "hidden"}
      >
        <WaiterTablesPanel
          tables={tables}
          nowMs={nowMs}
          alertTableIds={alertTableIds}
          onSelectTable={setSheetTableId}
        />
      </div>

      {/* Comanda manual: se mantiene montada para no perder la selección al cambiar de pestaña */}
      <div
        className={tab === "manual" ? "flex min-h-0 flex-1 flex-col" : "hidden"}
      >
        <ManualOrderPanel
          tables={orderableTables}
          selectedTableId={effectiveManualTableId}
          onSelectTable={setManualTableId}
          onOrderSent={handleManualOrderSent}
        />
      </div>

      {/* Avisos */}
      <section
        className={tab === "notifications" ? PANEL_SCROLL : "hidden"}
        aria-label="Avisos"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="grid grid-cols-2 rounded-lg bg-canvas-dim/40 p-1">
            {(
              [
                ["all", "Todos"],
                ["unread", `No leídos (${unreadCount})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={notificationFilter === id}
                onClick={() => setNotificationFilter(id)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  notificationFilter === id
                    ? "bg-canvas-white text-text-main shadow-sm"
                    : "text-text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={unreadCount === 0}
            onClick={handleMarkAllRead}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-bold text-terracotta-400 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:text-slate-100 disabled:active:scale-100"
          >
            <CheckCheck className="size-4" />
            <span className="hidden sm:inline">Marcar todo como leído</span>
            <span className="sm:hidden">Leer todo</span>
          </button>
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="flex size-18 items-center justify-center rounded-full bg-canvas-muted text-text-muted">
              <BellOff className="size-9" strokeWidth={1.75} />
            </div>
            <p className="mt-4 text-base font-bold text-text-main">
              {notificationFilter === "unread"
                ? "Estás al día"
                : "Sin avisos todavía"}
            </p>
            <p className="mt-1 max-w-64 text-sm text-text-muted">
              Aquí verás pedidos nuevos, llamadas de mesa y avisos de cocina.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibleNotifications.map((notification) => (
              <WaiterNotificationItem
                key={notification.id}
                notification={notification}
                nowMs={nowMs}
                onOpen={handleOpenNotification}
              />
            ))}
          </ul>
        )}
      </section>

      <WaiterTabBar
        active={tab}
        pendingCount={pendingCount}
        unreadCount={unreadCount}
        onChange={setTab}
      />

      {/* TODO: borrar este botón flotante de demo; pedidos y avisos llegarán por Socket.io */}
      {tab !== "manual" && !sheetTable && (
        <button
          type="button"
          onClick={handleSimulateIncoming}
          aria-label="Simular pedido o aviso entrante"
          className="absolute right-4 bottom-24 z-30 flex size-13 cursor-pointer items-center justify-center rounded-full bg-terracotta-300 text-white shadow-lg transition-colors hover:bg-terracotta-400 active:scale-95 md:right-6"
        >
          <Plus className="size-6" strokeWidth={2.5} />
        </button>
      )}

      <WaiterTableSheet
        table={sheetTable}
        nowMs={nowMs}
        busy={tableBusy}
        onClose={handleCloseSheet}
        onAction={(tableId, action) => void handleTableAction(tableId, action)}
      />

      <ConfirmModal
        open={rejectTarget !== null}
        tone="terracotta"
        icon={<X className="size-8" strokeWidth={2} />}
        title="¿Rechazar la ronda?"
        description={`La ronda de ${
          rejectTarget?.tableLabel ?? "la mesa"
        } no llegará a cocina y el cliente la verá como cancelada.`}
        confirmLabel="Rechazar"
        cancelLabel="Volver"
        onCancel={() => setRejectOrderId(null)}
        onConfirm={() => void handleRejectOrder()}
      />
    </StaffShell>
  );
};
