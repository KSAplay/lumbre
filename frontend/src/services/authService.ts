/**
 * Autenticación del personal por PIN (4 dígitos).
 *
 * Base temporal: misma convención que orderService.
 * Cuando el backend Express esté listo, pon USE_MOCK_AUTH en false.
 */
const IP = "192.168.1.16"; /* temporal */
const PORT = 5173;
const API_BASE = `http://${IP}:${PORT}/api`;

/** true = PINs locales; false = POST /auth/pin del backend */
const USE_MOCK_AUTH = true;

export type StaffRole = "recepcion" | "cocina" | "camarero" | "backoffice";

export type PinAuthResponse = {
  ok: boolean;
  role: StaffRole;
  redirectPath: string;
  /** Reservado para JWT / sesión cuando exista el backend */
  token?: string;
};

/** Mapa mock: PIN → destino. Sustituir por respuesta del API. */
const MOCK_PIN_ROUTES: Record<
  string,
  { role: StaffRole; redirectPath: string }
> = {
  "1111": { role: "recepcion", redirectPath: "/recepcion" },
  "2222": { role: "cocina", redirectPath: "/cocina" },
  "3333": { role: "camarero", redirectPath: "/camarero" },
  "9999": { role: "backoffice", redirectPath: "/admin" },
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

/** Valida el PIN del personal y devuelve el destino del panel. */
export async function authenticatePin(pin: string): Promise<PinAuthResponse> {
  if (!USE_MOCK_AUTH) {
    return request<PinAuthResponse>("/auth/pin", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 120));

  const match = MOCK_PIN_ROUTES[pin];
  if (!match) {
    throw new Error("PIN incorrecto");
  }

  return {
    ok: true,
    role: match.role,
    redirectPath: match.redirectPath,
  };
}
