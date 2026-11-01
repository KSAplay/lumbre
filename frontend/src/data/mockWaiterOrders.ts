import type {
  PendingOrder,
  WaiterNotification,
  WaiterNotificationType,
} from "../types/waiter";
import type { KitchenAlertType } from "../types/kitchen";

type OrderTemplate = Omit<PendingOrder, "id" | "number" | "sentAt">;

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000);

const INITIAL_ORDERS: { minutesAgo: number; order: OrderTemplate }[] = [
  {
    minutesAgo: 6,
    order: {
      tableId: "I03",
      tableLabel: "Mesa 03",
      note: "Una de las causas sin mayonesa, por favor.",
      items: [
        { dishId: 2, name: "Causa Limeña de Pollo", quantity: 2, price: 11 },
        { dishId: 5, name: "Lomo Saltado Tradicional", quantity: 1, price: 19 },
        { dishId: 12, name: "Pisco Sour Clásico", quantity: 3, price: 9.5 },
      ],
    },
  },
  {
    minutesAgo: 2,
    order: {
      tableId: "T03",
      tableLabel: "Mesa 16",
      items: [
        { dishId: 1, name: "Ceviche Clásico", quantity: 1, price: 16.5 },
        // Cantidad fuera de lugar para que el camarero la ajuste en la demo
        { dishId: 11, name: "Chicha Morada Artesanal (Jarra 1L)", quantity: 12, price: 9 },
      ],
    },
  },
];

/** Rondas que pueden "llegar" al pulsar el botón de demo */
const MOCK_INCOMING_ORDERS: OrderTemplate[] = [
  {
    tableId: "I13",
    tableLabel: "Mesa 13",
    items: [
      { dishId: 3, name: "Anticuchos de Corazón", quantity: 1, price: 13 },
      { dishId: 6, name: "Ají de Gallina", quantity: 1, price: 15.5 },
    ],
  },
  {
    tableId: "I01",
    tableLabel: "Mesa 01",
    note: "Los postres para compartir, traer cucharas extra.",
    items: [
      { dishId: 9, name: "Suspiro a la Limeña", quantity: 2, price: 6.5 },
      { dishId: 10, name: "Picarones Tradicionales", quantity: 2, price: 6 },
    ],
  },
  {
    tableId: "T02",
    tableLabel: "Mesa 15",
    items: [{ dishId: 12, name: "Pisco Sour Clásico", quantity: 4, price: 9.5 }],
  },
];

export const INITIAL_PENDING_ORDER_COUNT = INITIAL_ORDERS.length;

/**
 * Crea las rondas por confirmar iniciales con horas relativas al momento actual.
 *
 * @returns Rondas en orden FIFO (la más antigua primero), numeradas desde 1.
 */
export const createInitialPendingOrders = (): PendingOrder[] =>
  INITIAL_ORDERS.map(({ minutesAgo: ago, order }, index) => ({
    ...order,
    items: order.items.map((item) => ({ ...item })),
    id: `pending-${index + 1}`,
    number: index + 1,
    sentAt: minutesAgo(ago),
  }));

/**
 * Construye una ronda nueva recibida "ahora" a partir de una plantilla aleatoria.
 *
 * @param number - Número de ronda a mostrar como `#N`.
 */
export const createRandomPendingOrder = (number: number): PendingOrder => {
  const template =
    MOCK_INCOMING_ORDERS[Math.floor(Math.random() * MOCK_INCOMING_ORDERS.length)];
  return {
    ...template,
    items: template.items.map((item) => ({ ...item })),
    id: `pending-${number}-${Date.now().toString(36)}`,
    number,
    sentAt: new Date(),
  };
};

const INITIAL_NOTIFICATIONS: {
  minutesAgo: number;
  notification: Omit<WaiterNotification, "id" | "createdAt">;
}[] = [
  {
    minutesAgo: 14,
    notification: {
      type: "plato_listo",
      tableId: "I01",
      tableLabel: "Mesa 01",
      message: "La comanda #2 está lista para servir.",
      read: true,
    },
  },
  {
    minutesAgo: 9,
    notification: {
      type: "incidencia_cocina",
      tableId: "I04",
      tableLabel: "Mesa 04",
      message: "Falta producto: Ají de Gallina.",
      read: true,
      kitchenAlert: "falta_producto",
    },
  },
  {
    minutesAgo: 6,
    notification: {
      type: "nuevo_pedido",
      tableId: "I03",
      tableLabel: "Mesa 03",
      message: "Nueva ronda pendiente de confirmar.",
      read: false,
    },
  },
  {
    minutesAgo: 4,
    notification: {
      type: "cuenta",
      tableId: "I05",
      tableLabel: "Mesa 05",
      message: "La mesa ha pedido la cuenta.",
      read: false,
    },
  },
  {
    minutesAgo: 2,
    notification: {
      type: "nuevo_pedido",
      tableId: "T03",
      tableLabel: "Mesa 16",
      message: "Nueva ronda pendiente de confirmar.",
      read: false,
    },
  },
];

/**
 * Crea los avisos iniciales de la demo (algunos ya leídos).
 *
 * @returns Avisos ordenados del más reciente al más antiguo.
 */
export const createInitialWaiterNotifications = (): WaiterNotification[] =>
  INITIAL_NOTIFICATIONS.map(({ minutesAgo: ago, notification }, index) => ({
    ...notification,
    id: `notif-${index + 1}`,
    createdAt: minutesAgo(ago),
  })).reverse();

const RANDOM_NOTIFICATIONS: {
  type: Exclude<WaiterNotificationType, "nuevo_pedido">;
  tableId: string;
  tableLabel: string;
  message: string;
  kitchenAlert?: KitchenAlertType;
}[] = [
  { type: "ayuda", tableId: "I07", tableLabel: "Mesa 07", message: "La mesa solicita atención." },
  { type: "cuenta", tableId: "T06", tableLabel: "Mesa 19", message: "La mesa ha pedido la cuenta." },
  { type: "plato_listo", tableId: "I04", tableLabel: "Mesa 04", message: "La comanda está lista para servir." },
  { type: "plato_listo", tableId: "I12", tableLabel: "Mesa 12", message: "La comanda está lista para servir." },
  {
    type: "incidencia_cocina",
    tableId: "I07",
    tableLabel: "Mesa 07",
    message: "Cocina pide que vengas un momento.",
    kitchenAlert: "venir_cocina",
  },
];

/**
 * Genera un aviso aleatorio (ayuda, cuenta, plato listo o incidencia) recibido "ahora".
 *
 * Los avisos de nuevo pedido no salen de aquí: se crean junto a la ronda en la vista.
 */
export const createRandomWaiterNotification = (): WaiterNotification => {
  const template =
    RANDOM_NOTIFICATIONS[Math.floor(Math.random() * RANDOM_NOTIFICATIONS.length)];
  return {
    ...template,
    id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date(),
    read: false,
  };
};
