import type { KitchenAlertType } from "./kitchen";

/** Pestañas de la barra inferior del camarero */
export type WaiterTab = "orders" | "tables" | "manual" | "notifications";

/** Acciones de sala que puede hacer el camarero sobre una mesa */
export type WaiterTableAction =
  | "take-order"
  | "served"
  | "bill"
  | "paid"
  | "ready";

/** Línea de una ronda (mismo formato que el carrito del cliente) */
export type WaiterOrderLine = {
  dishId: number;
  name: string;
  quantity: number;
  price: number;
};

/** Ronda enviada desde la carta del cliente que espera la revisión del camarero */
export type PendingOrder = {
  id: string;
  number: number;
  tableId: string;
  tableLabel: string;
  sentAt: Date;
  note?: string;
  items: WaiterOrderLine[];
};

export type WaiterNotificationType =
  | "nuevo_pedido"
  | "ayuda"
  | "cuenta"
  | "plato_listo"
  | "incidencia_cocina";

/** Aviso recibido por el camarero; `read` pasa a true al tocarlo */
export type WaiterNotification = {
  id: string;
  type: WaiterNotificationType;
  tableId: string;
  tableLabel: string;
  message: string;
  createdAt: Date;
  read: boolean;
  /** Solo en `incidencia_cocina` */
  kitchenAlert?: KitchenAlertType;
};
