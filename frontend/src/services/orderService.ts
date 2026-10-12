import type { Category, Dish } from '../types/menu'

/**
 * Base temporal: JSON estáticos en public/api (Vite en localhost:5173).
 * Cuando el backend Express esté listo, cámbiala por ejemplo a:
 *   'http://localhost:3000/api'
 *
 * Si entras a la app por IP de red (vite --host), usa mejor '/api'
 * para evitar CORS.
 */
const IP = '192.168.1.17'; /* temporal */
const PORT = 5173;
const API_BASE = `http://${IP}:${PORT}/api`;

export type MenuResponse = {
  categories: Category[]
  dishes: Dish[]
}

export type HelpRequestBody = {
  tableId: string
  tableLabel: string
}

export type HelpResponse = {
  ok: boolean
  message: string
}

export type BillRequestBody = {
  tableId: string
  tableLabel: string
}

export type BillResponse = {
  ok: boolean
  message: string
}

export type OrderLinePayload = {
  dishId: number
  name: string
  quantity: number
  price: number
}

export type SendRoundBody = {
  tableId: string
  tableLabel: string
  note?: string
  items: OrderLinePayload[]
  sentAt: string
}

export type SendRoundResponse = {
  ok: boolean
  id: string
  number: number
  status: 'por_confirmar' | 'en_cocina' | 'servido' | 'pagado' | 'incidencia'
  message: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

/** Obtiene la carta (categorías + platos). */
export async function getMenu(): Promise<MenuResponse> {
  // Backend real: return request<MenuResponse>('/carta')
  // Mock temporal:
  return request<MenuResponse>('/menu.json')
}

/** Avisa al equipo de sala desde la mesa. */
export async function requestTableHelp(
  tableId: string,
  body: HelpRequestBody,
): Promise<HelpResponse> {
  // Backend real:
  // return request<HelpResponse>(`/mesas/${tableId}/ayuda`, {
  //   method: 'POST',
  //   body: JSON.stringify(body),
  // })

  // Mock temporal (los JSON de public/ solo admiten GET):
  console.debug('[mock] ayuda', tableId, body)
  return request<HelpResponse>('/ayuda.json')
}

/** Envía una ronda de pedido a cocina. */
export async function sendOrderRound(
  tableId: string,
  body: SendRoundBody,
): Promise<SendRoundResponse> {
  // Backend real:
  // return request<SendRoundResponse>(`/mesas/${tableId}/rondas`, {
  //   method: 'POST',
  //   body: JSON.stringify(body),
  // })

  // Mock temporal (los JSON de public/ solo admiten GET):
  console.debug('[mock] ronda', tableId, body)
  return request<SendRoundResponse>('/rondas.json')
}

/** Solicita la cuenta de la mesa. */
export async function requestTableBill(
  tableId: string,
  body: BillRequestBody,
): Promise<BillResponse> {
  // Backend real:
  // return request<BillResponse>(`/mesas/${tableId}/cuenta`, {
  //   method: 'POST',
  //   body: JSON.stringify(body),
  // })

  // Mock temporal (los JSON de public/ solo admiten GET):
  console.debug('[mock] cuenta', tableId, body)
  return request<BillResponse>('/cuenta.json')
}
