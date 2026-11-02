import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { StaffRole } from "../models/Staff.js";
import { HttpError } from "../utils/httpError.js";
import { verifyStaffToken } from "../utils/jwt.js";

/**
 * Exige `Authorization: Bearer <jwt>` válido y adjunta `req.staff`.
 */
export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "No autorizado"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    next(new HttpError(401, "No autorizado"));
    return;
  }

  try {
    const payload = verifyStaffToken(token);
    req.staff = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, "Token inválido o caducado"));
  }
};

/**
 * Restringe la ruta a uno o más roles tras `authMiddleware`.
 *
 * @param roles - Roles permitidos.
 */
export function requireRole(...roles: StaffRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.staff) {
      next(new HttpError(401, "No autorizado"));
      return;
    }
    if (!roles.includes(req.staff.role)) {
      next(new HttpError(403, "No tienes permiso para esta acción"));
      return;
    }
    next();
  };
}
