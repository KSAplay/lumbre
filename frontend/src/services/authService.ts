import { apiRequest, setStaffToken } from "../config/api";

export type StaffRole = "recepcion" | "cocina" | "camarero" | "backoffice";

export type PinAuthResponse = {
  ok: boolean;
  role: StaffRole;
  redirectPath: string;
  token?: string;
};

/**
 * Valida el PIN del personal contra el backend y guarda el JWT.
 *
 * @param pin - PIN de 4 dígitos.
 * @returns Destino del panel y rol.
 * @throws Error si el PIN es incorrecto o falla la red.
 */
export async function authenticatePin(pin: string): Promise<PinAuthResponse> {
  const result = await apiRequest<PinAuthResponse>("/auth/pin", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });

  if (result.token) {
    setStaffToken(result.token);
  }

  return result;
}
