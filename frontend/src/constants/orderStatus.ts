import type { LucideIcon } from "lucide-react";
import {
  CircleAlert,
  ClipboardClock,
  CookingPot,
  HandCoins,
  HandPlatter,
} from "lucide-react";

/**
 * Estados de pedido vistos por el cliente (historial / carta).
 * Unificado para reutilizar en camarero, cocina, etc.
 */
export type CustomerOrderStatus =
  | "por_confirmar"
  | "en_cocina"
  | "servido"
  | "pagado"
  | "cancelado";

/** Hex / tokens alineados con --color-status-* y table-cuenta de index.css */
export const CUSTOMER_ORDER_STATUS_HEX: Record<CustomerOrderStatus, string> = {
  por_confirmar: "#5e9adf",
  en_cocina: "#f2cc8f",
  servido: "#7cbf9e",
  pagado: "#9c8ed3",
  cancelado: "#e56b6b",
};

export const CUSTOMER_ORDER_STATUS_LABELS: Record<CustomerOrderStatus, string> =
  {
    por_confirmar: "Por confirmar",
    en_cocina: "En cocina",
    servido: "Servido",
    pagado: "Pagado",
    cancelado: "Cancelado",
  };

export const CUSTOMER_ORDER_STATUS_ICONS: Record<
  CustomerOrderStatus,
  LucideIcon
> = {
  por_confirmar: ClipboardClock,
  en_cocina: CookingPot,
  servido: HandPlatter,
  pagado: HandCoins,
  cancelado: CircleAlert,
};

export const CUSTOMER_ORDER_STATUS_TEXT: Record<CustomerOrderStatus, string> = {
  por_confirmar: "text-status-pendiente",
  en_cocina: "text-status-preparando",
  servido: "text-status-listo",
  pagado: "text-table-cuenta",
  cancelado: "text-status-urgente",
};

export const ALL_CUSTOMER_ORDER_STATUSES: CustomerOrderStatus[] = [
  "por_confirmar",
  "en_cocina",
  "servido",
  "pagado",
  "cancelado",
];

/** Estados de ítem / ronda (comanda interna — types/order.ts) */
export const KITCHEN_STATUS_HEX = {
  pendiente: "#5e9adf",
  preparando: "#f2cc8f",
  listo: "#7cbf9e",
  urgente: "#e56b6b",
} as const;
