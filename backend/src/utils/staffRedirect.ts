import type { StaffRole } from "../models/Staff.js";

/** Destino de React Router tras login por rol. */
const ROLE_REDIRECT: Record<StaffRole, string> = {
  recepcion: "/recepcion",
  cocina: "/cocina",
  camarero: "/camarero",
  backoffice: "/admin",
};

/**
 * Devuelve la ruta de panel asociada a un rol de staff.
 */
export function redirectPathForRole(role: StaffRole): string {
  return ROLE_REDIRECT[role];
}
