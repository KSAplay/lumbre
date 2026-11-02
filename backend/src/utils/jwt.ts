import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { StaffRole } from "../models/Staff.js";

/** Claims del JWT emitido tras login por PIN. */
export type StaffJwtPayload = {
  sub: string;
  role: StaffRole;
};

const TOKEN_EXPIRES_IN = "12h";

/**
 * Firma un JWT de sesión staff.
 *
 * @param staffId - `_id` del documento Staff.
 * @param role - Rol del personal.
 * @returns Token compacto Bearer.
 */
export function signStaffToken(staffId: string, role: StaffRole): string {
  const payload: StaffJwtPayload = { sub: staffId, role };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

/**
 * Verifica y decodifica un JWT de staff.
 *
 * @param token - Token sin prefijo Bearer.
 * @returns Payload con `sub` y `role`.
 * @throws Error si el token es inválido o ha caducado.
 */
export function verifyStaffToken(token: string): StaffJwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.sub !== "string" ||
    typeof (decoded as { role?: unknown }).role !== "string"
  ) {
    throw new Error("Token JWT inválido");
  }
  return {
    sub: decoded.sub,
    role: (decoded as { role: StaffRole }).role,
  };
}
