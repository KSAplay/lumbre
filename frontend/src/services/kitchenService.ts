import type { KitchenAlertType, KitchenTicket } from "../types/kitchen";
import { apiRequest } from "../config/api";

export type KitchenTicketsResponse = {
  tickets: KitchenTicket[];
  completed: KitchenTicket[];
};

type TicketApi = {
  id: string;
  number: number;
  tableId: string;
  tableLabel: string;
  sentAt: string;
  note?: string;
  alert: KitchenAlertType | null;
  completedAt?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    done: boolean;
    soldOut?: boolean;
  }[];
};

function mapTicket(ticket: TicketApi): KitchenTicket {
  return {
    id: ticket.id,
    number: ticket.number,
    tableId: ticket.tableId,
    tableLabel: ticket.tableLabel,
    sentAt: new Date(ticket.sentAt),
    note: ticket.note,
    alert: ticket.alert,
    completedAt: ticket.completedAt
      ? new Date(ticket.completedAt)
      : undefined,
    items: ticket.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      done: item.done,
      soldOut: Boolean(item.soldOut),
    })),
  };
}

/**
 * Carga comandas en cocina y terminadas desde el servidor.
 */
export async function getKitchenTickets(): Promise<KitchenTicketsResponse> {
  const data = await apiRequest<{
    tickets: TicketApi[];
    completed: TicketApi[];
  }>("/cocina/tickets");

  return {
    tickets: data.tickets
      .map(mapTicket)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime()),
    completed: data.completed
      .map(mapTicket)
      .sort(
        (a, b) =>
          (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
      ),
  };
}

/** Marca un plato del ticket como hecho o pendiente. */
export async function setKitchenItemDone(
  ticketId: string,
  itemId: string,
  done: boolean,
): Promise<void> {
  await apiRequest(`/rondas/${ticketId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ done }),
  });
}

/** Asigna o limpia la alerta de incidencia de una comanda. */
export async function setKitchenTicketAlert(
  ticketId: string,
  alert: KitchenAlertType | null,
): Promise<void> {
  await apiRequest(`/rondas/${ticketId}/alert`, {
    method: "PATCH",
    body: JSON.stringify({ alert }),
  });
}

/** Marca la comanda como terminada (servido). */
export async function completeKitchenTicket(
  ticketId: string,
): Promise<void> {
  await apiRequest(`/rondas/${ticketId}/completar`, { method: "POST" });
}

/** Devuelve una comanda terminada a «en cocina». */
export async function restoreKitchenTicket(
  ticketId: string,
): Promise<void> {
  await apiRequest(`/rondas/${ticketId}/restaurar`, { method: "POST" });
}
