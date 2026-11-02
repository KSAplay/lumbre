/**
 * Base de la API Express.
 * IP temporal para acceso en red local (`vite --host`); puerto del backend.
 */
const IP = "localhost"; /* temporal: cambia a tu IP de red si usas vite --host */
const PORT = 3000;

const API_ORIGIN = `http://${IP}:${PORT}`;

export const API_BASE = `${API_ORIGIN}/api`;

/**
 * Convierte una ruta de archivo del backend (`/uploads/...`) en URL absoluta.
 *
 * @param path - Ruta relativa guardada en BBDD; las URLs absolutas se devuelven tal cual.
 * @returns URL lista para `<img src>`, o cadena vacía si no hay ruta.
 */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

const TOKEN_KEY = "lumbre_staff_token";

/** Guarda el JWT de staff tras el login. */
export function setStaffToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

/** Elimina el JWT (bloqueo / fin de turno). */
export function clearStaffToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

/** Lee el JWT actual, si existe. */
export function getStaffToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Cabeceras JSON; añade Bearer si hay sesión staff.
 */
export function apiHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getStaffToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

/**
 * Fetch JSON contra la API.
 *
 * @throws Error si la respuesta no es ok.
 */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: apiHeaders(init?.headers),
  });

  if (!response.ok) {
    let message = `Error HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
