import type { TableStatus } from "../types/table";

/**
 * Base temporal: JSON estáticos en public/api (Vite).
 * Cuando el backend Express esté listo, cámbiala p. ej. a:
 *   'http://localhost:3000/api'
 *
 * TODO: sustituir API_BASE y los GET a .json por POST reales a /mesas/:id/...
 */
const IP = "192.168.1.10"; /* temporal */
const PORT = 5173;
const API_BASE = `http://${IP}:${PORT}/api`;

export type UpdateTableStatusBody = {
  status: TableStatus;
  guestCount?: number;
};

export type UpdateTableStatusResponse = {
  ok: boolean;
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

/** Cambia el estado operativo de una mesa (ciclo de sala). */
export async function updateTableStatus(
  tableId: string,
  body: UpdateTableStatusBody,
): Promise<UpdateTableStatusResponse> {
  // Backend real:
  // return request<UpdateTableStatusResponse>(`/mesas/${tableId}/estado`, {
  //   method: "POST",
  //   body: JSON.stringify(body),
  // });

  // Mock temporal (public/api solo admite GET):
  console.debug("[mock] mesa estado", tableId, body);
  return request<UpdateTableStatusResponse>("/mesa-estado.json");
}
