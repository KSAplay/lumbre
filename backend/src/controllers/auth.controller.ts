import type { Request, Response } from "express";
import { Staff } from "../models/Staff.js";
import { HttpError } from "../utils/httpError.js";
import { signStaffToken } from "../utils/jwt.js";
import { verifyPin } from "../utils/password.js";
import { redirectPathForRole } from "../utils/staffRedirect.js";

/**
 * Valida el PIN del personal y emite JWT + ruta de panel.
 *
 * Body: `{ pin: string }`
 */
export async function loginWithPin(req: Request, res: Response): Promise<void> {
  const pin =
    typeof req.body?.pin === "string" ? req.body.pin.trim() : "";

  if (!/^\d{4}$/.test(pin)) {
    throw new HttpError(400, "El PIN debe tener 4 dígitos");
  }

  const staffList = await Staff.find({ active: true }).select("+pinHash");

  let matched: (typeof staffList)[number] | null = null;
  for (const staff of staffList) {
    if (!staff.pinHash) continue;
    const ok = await verifyPin(pin, staff.pinHash);
    if (ok) {
      matched = staff;
      break;
    }
  }

  if (!matched) {
    throw new HttpError(401, "PIN incorrecto");
  }

  const token = signStaffToken(String(matched._id), matched.role);

  res.json({
    ok: true,
    role: matched.role,
    redirectPath: redirectPathForRole(matched.role),
    token,
    staff: {
      id: String(matched._id),
      name: matched.name,
      ...(matched.imageUrl ? { imageUrl: matched.imageUrl } : {}),
    },
  });
}
