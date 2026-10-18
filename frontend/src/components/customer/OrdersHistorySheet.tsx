import { useEffect, useRef, useState, type TransitionEvent } from "react";
import {
  CircleAlert,
  ClipboardClock,
  ConciergeBell,
  CookingPot,
  HandCoins,
  HandPlatter,
  ReceiptEuro,
  X,
} from "lucide-react";
import { ConfirmModal } from "../ui/ConfirmModal";
import { useToast } from "../ui/useToast";
import { requestTableBill } from "../../services/orderService";
import type { CartLine } from "./CartSheet";

export type OrderStatus =
  | "por_confirmar"
  | "en_cocina"
  | "servido"
  | "pagado"
  | "cancelado";

export type SentOrder = {
  id: string;
  number: number;
  sentAt: Date;
  status: OrderStatus;
  items: CartLine[];
  note?: string;
};

type OrdersHistorySheetProps = {
  open: boolean;
  onClose: () => void;
  orders: SentOrder[];
  tableId: string;
  tableLabel: string;
  registerBackHandler?: (handler: (() => boolean) | null) => void;
};

const ANIMATION_MS = 220;

// true = 12h (8:42 PM) · false = 24h (20:42)
const USE_12H_FORMAT = false;

const formatPrice = (price: number) =>
  price.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });

const formatOrderTime = (date: Date) => {
  // Formato 12h — activar con USE_12H_FORMAT = true
  // return date.toLocaleTimeString("en-US", {
  //   hour: "numeric",
  //   minute: "2-digit",
  //   hour12: true,
  // });

  if (USE_12H_FORMAT) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    icon: typeof ClipboardClock;
    colorClass: string;
  }
> = {
  por_confirmar: {
    label: "Por confirmar",
    icon: ClipboardClock,
    colorClass: "text-status-pendiente",
  },
  en_cocina: {
    label: "En cocina",
    icon: CookingPot,
    colorClass: "text-status-preparando",
  },
  servido: {
    label: "Servido",
    icon: HandPlatter,
    colorClass: "text-status-listo",
  },
  pagado: {
    label: "Pagado",
    icon: HandCoins,
    colorClass: "text-table-cuenta",
  },
  cancelado: {
    label: "Cancelado",
    icon: CircleAlert,
    colorClass: "text-status-urgente",
  },
};

const STATUS_CYCLE: OrderStatus[] = [
  "por_confirmar",
  "en_cocina",
  "servido",
  "pagado",
  "cancelado",
];

export const OrdersHistorySheet = ({
  open,
  onClose,
  orders,
  tableId,
  tableLabel,
  registerBackHandler,
}: OrdersHistorySheetProps) => {
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [confirmBillOpen, setConfirmBillOpen] = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  // TODO: eliminar cuando el servidor actualice el estado del pedido en tiempo real
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, OrderStatus>
  >({});

  const displayOrders = orders.map((order) => ({
    ...order,
    status: statusOverrides[order.id] ?? order.status,
  }));

  const totalAcumulado = displayOrders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (lineSum, item) => lineSum + item.price * item.quantity,
        0,
      ),
    0,
  );

  const allServed =
    displayOrders.length > 0 &&
    displayOrders.every((order) => order.status === "servido");
  const canRequestBill = allServed && !billRequested && !billLoading;

  const confirmBillOpenRef = useRef(confirmBillOpen);
  const beginCloseRef = useRef<() => void>(() => undefined);

  const beginClose = () => {
    setConfirmBillOpen(false);
    setEntered(false);
  };

  // TODO: temporal para probar UI de estados; eliminar al integrar el servidor
  const cycleOrderStatus = (orderId: string, current: OrderStatus) => {
    const next =
      STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    setStatusOverrides((prev) => ({ ...prev, [orderId]: next }));
  };

  if (open && !visible) {
    setVisible(true);
  }

  // Cierre externo (atrás del navegador): ajusta estado al render, sin effect
  if (!open && visible && entered) {
    setEntered(false);
  }

  if (!open && confirmBillOpen) {
    setConfirmBillOpen(false);
  }

  useEffect(() => {
    if (!open || !visible) return;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });

    return () => cancelAnimationFrame(id);
  }, [open, visible]);

  useEffect(() => {
    confirmBillOpenRef.current = confirmBillOpen;
  }, [confirmBillOpen]);

  useEffect(() => {
    beginCloseRef.current = beginClose;
  });

  // El atrás cierra primero la confirmación, igual que en el carrito
  useEffect(() => {
    if (!registerBackHandler) return;

    if (!open) {
      registerBackHandler(null);
      return;
    }

    registerBackHandler(() => {
      if (confirmBillOpenRef.current) {
        setConfirmBillOpen(false);
        return true;
      }
      beginCloseRef.current();
      return true;
    });

    return () => registerBackHandler(null);
  }, [open, registerBackHandler]);

  if (!visible) return null;

  const finishClose = () => {
    setVisible(false);
    if (open) onClose();
  };

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "opacity") return;
    if (!entered) finishClose();
  };

  const handleConfirmBill = async () => {
    setConfirmBillOpen(false);
    if (!canRequestBill) return;
    setBillLoading(true);

    try {
      await requestTableBill(tableId, { tableId, tableLabel });

      setBillRequested(true);
      showToast({
        message: "Cuenta solicitada. Enseguida te atendemos.",
        icon: <ConciergeBell className="size-4" strokeWidth={2.5} />,
        tone: "purple",
      });
    } catch {
      showToast({
        message: "No se pudo solicitar la cuenta. Inténtalo de nuevo.",
        tone: "red",
      });
    } finally {
      setBillLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="Cerrar historial de pedidos"
        className={`absolute inset-0 bg-text-main/45 transition-opacity ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${ANIMATION_MS}ms` }}
        onClick={beginClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-history-title"
        className={`relative z-10 flex w-full max-w-md flex-col drop-shadow-lg transition-[opacity,transform] ease-out ${
          entered
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.96] opacity-0"
        }`}
        style={{ transitionDuration: `${ANIMATION_MS}ms` }}
        onTransitionEnd={handleTransitionEnd}
      >
        <ReceiptEdge position="top" />

        <div className="flex max-h-[min(65dvh,520px)] flex-col overflow-hidden bg-canvas-white">
          {/* Cabecera */}
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-3">
            <h2
              id="orders-history-title"
              className="text-[15px] font-bold text-text-main"
            >
              Pedidos realizados
            </h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={beginClose}
              className="shrink-0 rounded-md p-0.5 text-text-muted transition-transform active:scale-90"
            >
              <X className="size-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="mx-5 border-t border-slate-50" />

          {/* Lista de pedidos */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
            {displayOrders.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-text-muted">
                Aún no has enviado ningún pedido.
              </p>
            ) : (
              <ul className="flex flex-col">
                {displayOrders.map((order, index) => {
                  const meta = STATUS_META[order.status];
                  const StatusIcon = meta.icon;
                  const isLast = index === displayOrders.length - 1;

                  return (
                    <li
                      key={order.id}
                      className={
                        isLast ? "pb-1" : "border-b border-slate-50 pb-3 mb-3"
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="min-w-0 text-[13px] font-semibold text-text-main">
                          Pedido {order.number} -{" "}
                          {formatOrderTime(order.sentAt)}
                        </h3>
                        {/* TODO: temporal — quitar onClick al recibir estados del servidor */}
                        <button
                          type="button"
                          onClick={() =>
                            cycleOrderStatus(order.id, order.status)
                          }
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-50 bg-canvas-muted px-2.5 py-0.5 text-[11px] font-bold text-text-main transition-transform active:scale-95"
                        >
                          <StatusIcon
                            className={`size-3.5 ${meta.colorClass}`}
                            strokeWidth={2.4}
                          />
                          {meta.label}
                        </button>
                      </div>

                      <ul className="mt-2 flex flex-col gap-1">
                        {order.items.map((item) => (
                          <li
                            key={`${order.id}-${item.dishId}`}
                            className="flex items-baseline justify-between gap-3 text-[13px] text-text-main"
                          >
                            <span className="min-w-0">
                              • {item.quantity}x {item.name}
                            </span>
                            <span className="shrink-0 font-semibold">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pie: total y solicitar cuenta */}
          <div className="shrink-0 border-t border-slate-50 px-5 pt-3 pb-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-text-main">
                Total acumulado
              </span>
              <span className="text-base font-black text-text-main">
                {formatPrice(totalAcumulado)}
              </span>
            </div>

            <button
              type="button"
              disabled={!canRequestBill}
              onClick={() => {
                if (!canRequestBill) return;
                setConfirmBillOpen(true);
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-[13px] font-bold shadow-sm ${
                billRequested
                  ? "cursor-not-allowed bg-table-cuenta-soft text-white"
                  : billLoading
                    ? "cursor-wait bg-table-cuenta-soft text-white"
                    : allServed
                      ? "bg-table-cuenta text-white transition-transform active:scale-[0.98]"
                      : "cursor-not-allowed bg-btn-disabled-bg text-btn-disabled-text"
              }`}
            >
              <ReceiptEuro className="size-4" strokeWidth={2.4} />
              {billRequested
                ? "Cuenta solicitada"
                : billLoading
                  ? "Solicitando..."
                  : "Solicitar cuenta"}
            </button>
          </div>
        </div>

        <ReceiptEdge position="bottom" />
      </div>

      <ConfirmModal
        open={confirmBillOpen}
        tone="purple"
        icon={<ReceiptEuro className="size-8" strokeWidth={2} />}
        title="¿Solicitar la cuenta?"
        description="Avisaremos a sala para que te traiga la cuenta."
        confirmLabel="Solicitar"
        cancelLabel="Volver"
        onCancel={() => setConfirmBillOpen(false)}
        onConfirm={handleConfirmBill}
      />
    </div>
  );
};

const ReceiptEdge = ({ position }: { position: "top" | "bottom" }) => {
  const isTop = position === "top";

  return (
    <svg
      className="block h-3 w-full shrink-0 text-canvas-white"
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon
        fill="currentColor"
        points={
          isTop
            ? "0,8 2.5,0 5,8 7.5,0 10,8 12.5,0 15,8 17.5,0 20,8 22.5,0 25,8 27.5,0 30,8 32.5,0 35,8 37.5,0 40,8 42.5,0 45,8 47.5,0 50,8 52.5,0 55,8 57.5,0 60,8 62.5,0 65,8 67.5,0 70,8 72.5,0 75,8 77.5,0 80,8 82.5,0 85,8 87.5,0 90,8 92.5,0 95,8 97.5,0 100,8"
            : "0,0 2.5,8 5,0 7.5,8 10,0 12.5,8 15,0 17.5,8 20,0 22.5,8 25,0 27.5,8 30,0 32.5,8 35,0 37.5,8 40,0 42.5,8 45,0 47.5,8 50,0 52.5,8 55,0 57.5,8 60,0 62.5,8 65,0 67.5,8 70,0 72.5,8 75,0 77.5,8 80,0 82.5,8 85,0 87.5,8 90,0 92.5,8 95,0 97.5,8 100,0"
        }
      />
    </svg>
  );
};
