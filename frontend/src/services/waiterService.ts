import type { WaiterOrderLine } from "../types/waiter";

/**
 * Base temporal: JSON estáticos en public/api (Vite).
 * Cuando el backend Express esté listo, cámbiala p. ej. a:
 *   'http://localhost:3000/api'
 *
 * TODO: sustituir API_BASE y los GET a .json por las peticiones reales a /rondas y /mesas
 */
const IP = "192.168.1.13"; /* temporal */
const PORT = 5173;
const API_BASE = `http://${IP}:${PORT}/api`;

export type ConfirmOrderBody = {
  tableId: string;
  /** Líneas finales tras el ajuste del camarero */
  items: WaiterOrderLine[];
  note?: string;
};

export type ConfirmOrderResponse = {
  ok: boolean;
  status: "en_cocina";
  message: string;
};

export type RejectOrderBody = {
  tableId: string;
  reason?: string;
};

export type RejectOrderResponse = {
  ok: boolean;
  status: "cancelado";
  message: string;
};

export type ManualOrderBody = {
  tableId: string;
  tableLabel: string;
  note?: string;
  items: WaiterOrderLine[];
  sentAt: string;
};

export type ManualOrderResponse = {
  ok: boolean;
  id: string;
  number: number;
  status: "en_cocina";
  message: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Confirma una ronda enviada por el cliente para que pase a cocina (KDS).
 *
 * @param orderId - Id de la ronda por confirmar.
 * @param body - Mesa y líneas definitivas (pueden diferir de las que envió el cliente).
 * @returns Respuesta del servidor con la ronda ya en estado `en_cocina`.
 * @throws Error si la petición falla o el servidor responde con un código HTTP de error.
 */
export async function confirmOrder(
  orderId: string,
  body: ConfirmOrderBody,
): Promise<ConfirmOrderResponse> {
  // Backend real:
  // return request<ConfirmOrderResponse>(`/rondas/${orderId}/confirmar`, {
  //   method: "POST",
  //   body: JSON.stringify(body),
  // });

  // Mock temporal (public/api solo admite GET):
  console.debug("[mock] confirmar ronda", orderId, body);
  return request<ConfirmOrderResponse>("/pedido-confirmado.json");
}

/**
 * Rechaza una ronda enviada por el cliente; no llega a cocina.
 *
 * @param orderId - Id de la ronda por confirmar.
 * @param body - Mesa y motivo opcional que verá el cliente en su historial.
 * @returns Respuesta del servidor con la ronda en estado `cancelado`.
 * @throws Error si la petición falla o el servidor responde con un código HTTP de error.
 */
export async function rejectOrder(
  orderId: string,
  body: RejectOrderBody,
): Promise<RejectOrderResponse> {
  // Backend real:
  // return request<RejectOrderResponse>(`/rondas/${orderId}/rechazar`, {
  //   method: "POST",
  //   body: JSON.stringify(body),
  // });

  // Mock temporal (public/api solo admite GET):
  console.debug("[mock] rechazar ronda", orderId, body);
  return request<RejectOrderResponse>("/pedido-rechazado.json");
}

/**
 * Envía directamente a cocina una comanda tomada a mano por el camarero,
 * sin pasar por el estado «por confirmar».
 *
 * @param tableId - Id de la mesa que pide.
 * @returns Respuesta del servidor con la ronda creada en estado `en_cocina`.
 * @throws Error si la petición falla o el servidor responde con un código HTTP de error.
 */
export async function sendManualOrder(
  tableId: string,
  body: ManualOrderBody,
): Promise<ManualOrderResponse> {
  // Backend real:
  // return request<ManualOrderResponse>(`/mesas/${tableId}/rondas/manual`, {
  //   method: "POST",
  //   body: JSON.stringify(body),
  // });

  // Mock temporal (public/api solo admite GET):
  console.debug("[mock] comanda manual", tableId, body);
  return request<ManualOrderResponse>("/comanda-manual.json");
}
