import { apiFormRequest, apiRequest } from "../config/api";
import type { StaffRole } from "./authService";
import type { StaffGender, StaffMember } from "../types/staff";

export type StaffPayload = {
  name: string;
  role: StaffRole;
  gender: StaffGender;
  pin?: string;
  active?: boolean;
};

/**
 * Lista el personal registrado.
 *
 * @throws Error si falla la red.
 */
export async function listStaff(): Promise<StaffMember[]> {
  const data = await apiRequest<{ staff: StaffMember[] }>("/staff");
  return data.staff;
}

/**
 * Crea un empleado.
 *
 * @throws Error si el PIN choca, el body es inválido o falla la red.
 */
export async function createStaff(payload: StaffPayload): Promise<StaffMember> {
  const data = await apiRequest<{ staff: StaffMember }>("/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.staff;
}

/**
 * Actualiza un empleado.
 *
 * @throws Error si no existe, el PIN choca o falla la red.
 */
export async function updateStaff(
  id: string,
  payload: Partial<StaffPayload>,
): Promise<StaffMember> {
  const data = await apiRequest<{ staff: StaffMember }>(`/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.staff;
}

/**
 * Cambia el PIN compartido de cocina.
 *
 * @param pin - PIN de 4 dígitos.
 * @throws Error si el PIN choca o falla la red.
 */
export async function setKitchenPin(pin: string): Promise<void> {
  await apiRequest("/staff/cocina/pin", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

/**
 * Sube o sustituye la foto de un empleado.
 *
 * @returns Ruta pública de la imagen.
 * @throws Error si el archivo no es válido o falla la red.
 */
export async function uploadStaffPhoto(
  id: string,
  file: File,
): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const data = await apiFormRequest<{ imageUrl: string }>(
    `/staff/${id}/foto`,
    form,
  );
  return data.imageUrl;
}
