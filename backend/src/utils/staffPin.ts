import { Staff, type StaffRole } from "../models/Staff.js";
import { HttpError } from "./httpError.js";
import { hashPin, verifyPin } from "./password.js";

/**
 * Comprueba que el PIN no choque con otro empleado activo de un rol distinto.
 * Los de cocina pueden compartir PIN entre sí.
 *
 * @param pin - PIN de 4 dígitos en claro.
 * @param role - Rol del empleado que va a usar el PIN.
 * @param excludeId - Empleado que se está editando (se ignora en la comparación).
 * @throws HttpError 409 si el PIN ya pertenece a otro rol o a un no-cocinero.
 */
export async function assertPinAvailable(
  pin: string,
  role: StaffRole,
  excludeId?: string,
): Promise<void> {
  const staffList = await Staff.find({ active: true }).select("+pinHash role");

  for (const staff of staffList) {
    if (excludeId && String(staff._id) === excludeId) continue;
    if (!staff.pinHash) continue;
    const matches = await verifyPin(pin, staff.pinHash);
    if (!matches) continue;
    if (role === "cocina" && staff.role === "cocina") continue;
    throw new HttpError(409, "Ese PIN ya está en uso por otro empleado");
  }
}

/**
 * Recalcula el hash y lo aplica a todos los empleados de cocina.
 *
 * @param pin - PIN compartido de 4 dígitos.
 * @returns Hash resultante.
 */
export async function applyKitchenPin(pin: string): Promise<string> {
  const pinHash = await hashPin(pin);
  await Staff.updateMany({ role: "cocina" }, { $set: { pinHash, pin } });
  return pinHash;
}

/**
 * Valida que el PIN tenga exactamente 4 dígitos.
 *
 * @throws HttpError 400 si el formato no es válido.
 */
export function requireFourDigitPin(pin: unknown): string {
  const value = typeof pin === "string" ? pin.trim() : "";
  if (!/^\d{4}$/.test(value)) {
    throw new HttpError(400, "El PIN debe tener 4 dígitos");
  }
  return value;
}
