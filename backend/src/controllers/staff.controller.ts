import fs from "node:fs/promises";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import {
  STAFF_GENDERS,
  STAFF_ROLES,
  Staff,
  type StaffGender,
  type StaffRole,
} from "../models/Staff.js";
import { removeUploadedFile } from "../middleware/upload.middleware.js";
import { HttpError } from "../utils/httpError.js";
import { hashPin } from "../utils/password.js";
import {
  applyKitchenPin,
  assertPinAvailable,
  requireFourDigitPin,
} from "../utils/staffPin.js";
import { SOCKET_EVENTS, SOCKET_ROOMS } from "../sockets/events.js";
import { emitTo } from "../sockets/io.js";

function mapStaff(doc: {
  _id: mongoose.Types.ObjectId;
  name: string;
  role: StaffRole;
  gender?: StaffGender | null;
  imageUrl?: string | null;
  active?: boolean;
  pin?: string | null;
}) {
  return {
    id: String(doc._id),
    name: doc.name,
    role: doc.role,
    gender: doc.gender === "mujer" ? "mujer" : "hombre",
    ...(doc.imageUrl ? { imageUrl: doc.imageUrl } : {}),
    active: doc.active !== false,
    sharedPin: doc.role === "cocina",
    pin: doc.pin ?? "",
  };
}

function parseRole(value: unknown): StaffRole {
  if (typeof value !== "string" || !STAFF_ROLES.includes(value as StaffRole)) {
    throw new HttpError(400, "Rol no válido");
  }
  return value as StaffRole;
}

function parseGender(value: unknown): StaffGender {
  if (value === undefined || value === null || value === "") return "hombre";
  if (typeof value !== "string" || !STAFF_GENDERS.includes(value as StaffGender)) {
    throw new HttpError(400, "Género no válido");
  }
  return value as StaffGender;
}

function parseName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) throw new HttpError(400, "El nombre es obligatorio");
  return name;
}

async function kitchenCredentials(): Promise<{
  pinHash: string;
  pin: string;
} | null> {
  const cook = await Staff.findOne({ role: "cocina" }).select("+pinHash +pin");
  if (!cook?.pinHash || !cook.pin) return null;
  return { pinHash: cook.pinHash, pin: cook.pin };
}

async function ensureAnotherAdmin(excludeId: string): Promise<void> {
  const others = await Staff.countDocuments({
    role: "backoffice",
    active: true,
    _id: { $ne: excludeId },
  });
  if (others === 0) {
    throw new HttpError(
      409,
      "No se puede desactivar al último administrador",
    );
  }
}

/**
 * Lista el personal registrado (sin exponer el hash del PIN).
 */
export async function listStaff(_req: Request, res: Response): Promise<void> {
  const staff = await Staff.find().select("+pin").sort({ role: 1, name: 1 }).lean();
  res.json({ staff: staff.map(mapStaff) });
}

/**
 * Crea un empleado. Cocina hereda o actualiza el PIN compartido del monitor KDS.
 */
export async function createStaff(req: Request, res: Response): Promise<void> {
  const name = parseName(req.body?.name);
  const role = parseRole(req.body?.role);
  const gender = parseGender(req.body?.gender);
  const pinRaw =
    typeof req.body?.pin === "string" ? req.body.pin.trim() : "";

  let pinHash: string;
  let pinPlain: string;

  if (role === "cocina") {
    if (pinRaw) {
      pinPlain = requireFourDigitPin(pinRaw);
      await assertPinAvailable(pinPlain, "cocina");
      pinHash = await applyKitchenPin(pinPlain);
    } else {
      const existing = await kitchenCredentials();
      if (!existing) {
        throw new HttpError(
          400,
          "Indica el PIN compartido de cocina (aún no hay ninguno)",
        );
      }
      pinHash = existing.pinHash;
      pinPlain = existing.pin;
    }
  } else {
    pinPlain = requireFourDigitPin(pinRaw);
    await assertPinAvailable(pinPlain, role);
    pinHash = await hashPin(pinPlain);
  }

  const staff = await Staff.create({
    name,
    role,
    gender,
    pinHash,
    pin: pinPlain,
    active: true,
  });

  emitTo([SOCKET_ROOMS.backoffice], SOCKET_EVENTS.STAFF_UPDATED, { ok: true });
  res.status(201).json({ staff: mapStaff(staff) });
}

/**
 * Actualiza nombre, rol, género, PIN u activo.
 */
export async function patchStaff(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(404, "Empleado no encontrado");
  }

  const staff = await Staff.findById(id).select("+pinHash +pin");
  if (!staff) {
    throw new HttpError(404, "Empleado no encontrado");
  }

  if (typeof req.body?.name === "string") {
    staff.name = parseName(req.body.name);
  }

  const nextRole =
    req.body?.role !== undefined ? parseRole(req.body.role) : staff.role;
  const roleChanged = nextRole !== staff.role;

  if (req.body?.gender !== undefined) {
    staff.gender = parseGender(req.body.gender);
  }

  if (typeof req.body?.active === "boolean") {
    if (req.body.active === false && staff.role === "backoffice") {
      await ensureAnotherAdmin(id);
    }
    staff.active = req.body.active;
  }

  const pinRaw =
    typeof req.body?.pin === "string" ? req.body.pin.trim() : "";

  if (nextRole === "cocina") {
    if (pinRaw) {
      const pin = requireFourDigitPin(pinRaw);
      await assertPinAvailable(pin, "cocina", id);
      const pinHash = await applyKitchenPin(pin);
      staff.pinHash = pinHash;
      staff.pin = pin;
    } else if (roleChanged) {
      const existing = await kitchenCredentials();
      if (!existing) {
        throw new HttpError(
          400,
          "Indica el PIN compartido de cocina (aún no hay ninguno)",
        );
      }
      staff.pinHash = existing.pinHash;
      staff.pin = existing.pin;
    }
    staff.role = "cocina";
  } else {
    if (pinRaw) {
      const pin = requireFourDigitPin(pinRaw);
      await assertPinAvailable(pin, nextRole, id);
      staff.pinHash = await hashPin(pin);
      staff.pin = pin;
    } else if (roleChanged && staff.role === "cocina") {
      throw new HttpError(
        400,
        "Al salir de cocina hay que asignar un PIN individual",
      );
    }
    staff.role = nextRole;
  }

  await staff.save();
  emitTo([SOCKET_ROOMS.backoffice], SOCKET_EVENTS.STAFF_UPDATED, { ok: true });
  res.json({ staff: mapStaff(staff) });
}

/**
 * Cambia el PIN compartido de todos los cocineros.
 */
export async function setKitchenPin(req: Request, res: Response): Promise<void> {
  const pin = requireFourDigitPin(req.body?.pin);
  await assertPinAvailable(pin, "cocina");
  await applyKitchenPin(pin);
  emitTo([SOCKET_ROOMS.backoffice], SOCKET_EVENTS.STAFF_UPDATED, { ok: true });
  res.json({ ok: true, message: "PIN de cocina actualizado" });
}

/**
 * Sube o sustituye la foto del empleado.
 */
export async function uploadStaffPhoto(
  req: Request,
  res: Response,
): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(404, "Empleado no encontrado");
  }
  if (!req.file) {
    throw new HttpError(400, "Selecciona una imagen");
  }

  const staff = await Staff.findById(id);
  if (!staff) {
    await fs.unlink(req.file.path).catch(() => undefined);
    throw new HttpError(404, "Empleado no encontrado");
  }

  const imageUrl = `/uploads/staff/${req.file.filename}`;
  const previous = staff.imageUrl;
  staff.imageUrl = imageUrl;

  try {
    await staff.save();
  } catch (err) {
    await fs.unlink(req.file.path).catch(() => undefined);
    throw err;
  }

  await removeUploadedFile(previous);
  emitTo([SOCKET_ROOMS.backoffice], SOCKET_EVENTS.STAFF_UPDATED, { ok: true });
  res.json({ ok: true, imageUrl });
}
