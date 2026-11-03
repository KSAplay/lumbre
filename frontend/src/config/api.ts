/**
 * Base de la API Express.
 * IP temporal para acceso en red local (`vite --host`); puerto del backend.
 */
const IP = "localhost"; /* temporal: cambia a tu IP de red si usas vite --host */
const PORT = 3000;

export const API_ORIGIN = `http://${IP}:${PORT}`;

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
const STAFF_PROFILE_KEY = "lumbre_staff_profile";

export type StaffSessionProfile = {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
};

/** Guarda el JWT de staff tras el login. */
export function setStaffToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

/** Guarda el perfil del empleado autenticado (nombre, rol, foto). */
export function setStaffSession(profile: StaffSessionProfile): void {
  sessionStorage.setItem(STAFF_PROFILE_KEY, JSON.stringify(profile));
}

/** Lee el perfil de staff de la sesión, si existe. */
export function getStaffSession(): StaffSessionProfile | null {
  const raw = sessionStorage.getItem(STAFF_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StaffSessionProfile;
  } catch {
    return null;
  }
}

/** Elimina el JWT y el perfil (bloqueo / cierre de sesión / fin de turno). */
export function clearStaffToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(STAFF_PROFILE_KEY);
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

/**
 * Fetch multipart (FormData) contra la API.
 * No fija `Content-Type`: el navegador añade el boundary.
 *
 * @throws Error si la respuesta no es ok.
 */
export async function apiFormRequest<T>(
  path: string,
  form: FormData,
  init?: Omit<RequestInit, "body">,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.delete("Content-Type");
  const token = getStaffToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    ...init,
    headers,
    body: form,
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
