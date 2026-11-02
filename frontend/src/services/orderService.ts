import type { Category, Dish } from "../types/menu";
import type { CustomerOrderStatus } from "../constants/orderStatus";
import { apiRequest } from "../config/api";

export type MenuResponse = {
  categories: Category[];
  dishes: Dish[];
};

export type HelpRequestBody = {
  tableId: string;
  tableLabel: string;
};

export type HelpResponse = {
  ok: boolean;
  message: string;
};

export type BillRequestBody = {
  tableId: string;
  tableLabel: string;
};

export type BillResponse = {
  ok: boolean;
  message: string;
};

export type OrderLinePayload = {
  dishId: number;
  name: string;
  quantity: number;
  price: number;
};

export type SendRoundBody = {
  tableId: string;
  tableLabel: string;
  note?: string;
  items: OrderLinePayload[];
  sentAt: string;
};

export type SendRoundResponse = {
  ok: boolean;
  id: string;
  number: number;
  status: CustomerOrderStatus | "incidencia";
  message: string;
};

/** Ronda hidratada para el historial del cliente */
export type TableRound = {
  id: string;
  number: number;
  tableId: string;
  tableLabel: string;
  tableNumber: number;
  status: CustomerOrderStatus;
  sentAt: Date;
  note?: string;
  items: OrderLinePayload[];
};

type RoundApi = {
  id: string;
  number: number;
  tableId: string;
  tableLabel: string;
  tableNumber: number;
  status: CustomerOrderStatus;
  sentAt: string;
  note?: string;
  items: OrderLinePayload[];
};

/** Obtiene la carta (categorías + platos). */
export async function getMenu(): Promise<MenuResponse> {
  return apiRequest<MenuResponse>("/menu");
}

/**
 * Obtiene las rondas de una mesa por su número de plano (URL `/mesa/:n`).
 *
 * @param tableNumber - Número visible de mesa.
 * @returns Rondas ordenadas de más antigua a más reciente.
 */
export async function getTableRounds(
  tableNumber: string | number,
): Promise<TableRound[]> {
  const num = Number(tableNumber);
  if (!Number.isFinite(num)) return [];

  const data = await apiRequest<{ rounds: RoundApi[] }>(
    `/rondas?tableNumber=${encodeURIComponent(String(num))}`,
  );

  return data.rounds
    .map((round) => ({
      id: round.id,
      number: round.number,
      tableId: round.tableId,
      tableLabel: round.tableLabel,
      tableNumber: round.tableNumber,
      status: round.status,
      sentAt: new Date(round.sentAt),
      note: round.note,
      items: round.items.map(({ dishId, name, quantity, price }) => ({
        dishId,
        name,
        quantity,
        price,
      })),
    }))
    .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
}

/** Avisa al equipo de sala desde la mesa. */
export async function requestTableHelp(
  tableId: string,
  body: HelpRequestBody,
): Promise<HelpResponse> {
  return apiRequest<HelpResponse>(`/mesas/${tableId}/ayuda`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Envía una ronda de pedido (varios platos) a confirmar. */
export async function sendOrderRound(
  tableId: string,
  body: SendRoundBody,
): Promise<SendRoundResponse> {
  return apiRequest<SendRoundResponse>(`/mesas/${tableId}/rondas`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Solicita la cuenta de la mesa. */
export async function requestTableBill(
  tableId: string,
  body: BillRequestBody,
): Promise<BillResponse> {
  return apiRequest<BillResponse>(`/mesas/${tableId}/cuenta`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
