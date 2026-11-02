/** Incidencias que cocina puede marcar en una comanda */
export type KitchenAlertType = "falta_producto" | "repitiendo" | "venir_cocina";

export type KitchenTicketItem = {
  id: string;
  name: string;
  quantity: number;
  /** Plato tachado por el cocinero */
  done: boolean;
};

/** Comanda (ronda enviada por una mesa) tal como la ve el KDS */
export type KitchenTicket = {
  id: string;
  number: number;
  /** Id de plano unificado (`I04`, `T02`, …) */
  tableId: string;
  tableLabel: string;
  sentAt: Date;
  /** Nota general del cliente para toda la ronda */
  note?: string;
  items: KitchenTicketItem[];
  alert: KitchenAlertType | null;
  completedAt?: Date;
};
