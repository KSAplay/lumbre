import { apiRequest, setStaffSession, setStaffToken } from "../config/api";

export type StaffRole = "recepcion" | "cocina" | "camarero" | "backoffice";

export type PinAuthStaff = {
  id: string;
  name: string;
  imageUrl?: string;
};

export type PinAuthResponse = {
  ok: boolean;
  role: StaffRole;
  redirectPath: string;
  token?: string;
  staff?: PinAuthStaff;
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
    if (result.staff) {
      setStaffSession({
        id: result.staff.id,
        name: result.staff.name,
        role: result.role,
        ...(result.staff.imageUrl ? { imageUrl: result.staff.imageUrl } : {}),
      });
    }
  }

  return result;
}
