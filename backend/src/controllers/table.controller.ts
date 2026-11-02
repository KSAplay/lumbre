import type { Request, Response } from "express";
import {
  Table,
  TABLE_ORIENTATIONS,
  TABLE_SHAPES,
  TABLE_STATUSES,
  type TableStatus,
} from "../models/Table.js";
import { Zone } from "../models/Zone.js";
import { HttpError } from "../utils/httpError.js";

type FloorTablePayload = {
  id: string;
  number: number;
  capacity: number;
  shape: string;
  zone: string;
  position: { x: number; y: number };
  orientation?: string;
  status: string;
  guestCount: number;
  statusChangedAt: number;
  reservation?: { guestName: string; time: string };
  currentSessionId?: string;
};

type FloorWallPayload = {
  id: string;
  zone: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  shape?: string;
  rotation?: number;
  corners?: {
    nw: string;
    ne: string;
    se: string;
    sw: string;
  };
};

/**
 * Devuelve el plano de sala (mesas + muros aplanados por zona).
 */
export async function getFloorPlan(
  _req: Request,
  res: Response,
): Promise<void> {
  const [tables, zones] = await Promise.all([
    Table.find().sort({ number: 1 }).lean(),
    Zone.find().sort({ sortOrder: 1 }).lean(),
  ]);

  const walls: FloorWallPayload[] = zones.flatMap((zone) =>
    (zone.walls ?? []).map((wall) => ({
      id: wall.id,
      zone: zone.slug,
      x: wall.x,
      y: wall.y,
      width: wall.width,
      height: wall.height,
      ...(wall.name ? { name: wall.name } : {}),
      ...(wall.shape ? { shape: wall.shape } : {}),
      ...(wall.rotation !== undefined && wall.rotation !== null
        ? { rotation: wall.rotation }
        : {}),
      ...(wall.corners ? { corners: wall.corners } : {}),
    })),
  );

  const mappedTables: FloorTablePayload[] = tables.map((t) => ({
    id: t._id,
    number: t.number,
    capacity: t.capacity,
    shape: t.shape,
    zone: t.zone,
    position: t.position,
    ...(t.orientation ? { orientation: t.orientation } : {}),
    status: t.status,
    guestCount: t.guestCount,
    statusChangedAt: new Date(t.statusChangedAt).getTime(),
    ...(t.reservation
      ? {
          reservation: {
            guestName: t.reservation.guestName,
            time: t.reservation.time,
          },
        }
      : {}),
    ...(t.currentSessionId ? { currentSessionId: t.currentSessionId } : {}),
  }));

  res.json({ tables: mappedTables, walls });
}

/**
 * Sustituye el plano completo (modo edición recepción → check).
 * Body: `{ tables, walls }`
 */
export async function putFloorPlan(
  req: Request,
  res: Response,
): Promise<void> {
  const tables = req.body?.tables;
  const walls = req.body?.walls;

  if (!Array.isArray(tables) || !Array.isArray(walls)) {
    throw new HttpError(400, "Body inválido: se requieren tables y walls");
  }

  const zoneSlugs = new Set<string>();
  for (const raw of tables) {
    if (!raw || typeof raw !== "object") {
      throw new HttpError(400, "Mesa inválida en el plano");
    }
    const t = raw as FloorTablePayload;
    if (!t.id || typeof t.number !== "number" || !t.zone) {
      throw new HttpError(400, "Cada mesa necesita id, number y zone");
    }
    if (!TABLE_SHAPES.includes(t.shape as (typeof TABLE_SHAPES)[number])) {
      throw new HttpError(400, `Forma de mesa inválida: ${t.shape}`);
    }
    if (!TABLE_STATUSES.includes(t.status as TableStatus)) {
      throw new HttpError(400, `Estado de mesa inválido: ${t.status}`);
    }
    zoneSlugs.add(String(t.zone).toLowerCase());
  }

  for (const raw of walls) {
    if (!raw || typeof raw !== "object") {
      throw new HttpError(400, "Muro inválido en el plano");
    }
    const w = raw as FloorWallPayload;
    if (!w.id || !w.zone) {
      throw new HttpError(400, "Cada muro necesita id y zone");
    }
    zoneSlugs.add(String(w.zone).toLowerCase());
  }

  for (const slug of zoneSlugs) {
    const exists = await Zone.exists({ slug });
    if (!exists) {
      throw new HttpError(400, `Zona desconocida: ${slug}`);
    }
  }

  const incomingIds = tables.map((t: FloorTablePayload) => t.id);

  await Table.deleteMany({ _id: { $nin: incomingIds } });

  for (const raw of tables as FloorTablePayload[]) {
    const orientation =
      raw.orientation &&
      TABLE_ORIENTATIONS.includes(
        raw.orientation as (typeof TABLE_ORIENTATIONS)[number],
      )
        ? raw.orientation
        : undefined;

    await Table.findByIdAndUpdate(
      raw.id,
      {
        _id: raw.id,
        number: raw.number,
        capacity: raw.capacity,
        shape: raw.shape,
        zone: String(raw.zone).toLowerCase(),
        position: raw.position,
        orientation,
        status: raw.status,
        guestCount: raw.guestCount,
        statusChangedAt: new Date(raw.statusChangedAt || Date.now()),
        reservation:
          raw.status === "reservada" && raw.reservation
            ? raw.reservation
            : undefined,
        currentSessionId: raw.currentSessionId,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }

  const wallsByZone = new Map<string, FloorWallPayload[]>();
  for (const w of walls as FloorWallPayload[]) {
    const slug = String(w.zone).toLowerCase();
    const list = wallsByZone.get(slug) ?? [];
    list.push(w);
    wallsByZone.set(slug, list);
  }

  const allZones = await Zone.find().lean();
  for (const zone of allZones) {
    const zoneWalls = wallsByZone.get(zone.slug) ?? [];
    await Zone.updateOne(
      { _id: zone._id },
      {
        walls: zoneWalls.map((w) => ({
          id: w.id,
          x: w.x,
          y: w.y,
          width: w.width,
          height: w.height,
          name: w.name,
          shape: w.shape,
          rotation: w.rotation,
          corners: w.corners,
        })),
      },
    );
  }

  // TODO: emitir evento Socket.io (plano actualizado a recepción/camarero)
  res.json({ ok: true, message: "Plano guardado" });
}

/**
 * Cambia el estado operativo de una mesa.
 * Body: `{ status, guestCount? }`
 */
export async function updateTableStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const tableId = String(req.params.id ?? "");
  const status = req.body?.status as TableStatus | undefined;
  const guestCountRaw = req.body?.guestCount;

  if (!TABLE_STATUSES.includes(status as TableStatus)) {
    throw new HttpError(400, "Estado de mesa inválido");
  }

  const table = await Table.findById(tableId);
  if (!table) {
    throw new HttpError(404, "Mesa no encontrada");
  }

  const prevStatus = table.status;
  table.status = status as TableStatus;

  if (typeof guestCountRaw === "number") {
    table.guestCount = guestCountRaw;
  } else if (status === "libre" || status === "limpiando") {
    table.guestCount = 0;
  }

  if (status !== "reservada") {
    table.set("reservation", null);
  }

  if (status === "libre") {
    table.set("helpRequestedAt", null);
    table.set("billRequestedAt", null);
    table.set("currentSessionId", null);
  }

  if (prevStatus !== status) {
    table.statusChangedAt = new Date();
  }

  await table.save();

  // TODO: emitir evento Socket.io (table:status)
  res.json({ ok: true, message: "Estado de mesa actualizado" });
}

/**
 * Pasa todas las mesas en `limpiando` a `libre`.
 */
export async function releaseCleaningTables(
  _req: Request,
  res: Response,
): Promise<void> {
  const now = new Date();
  const result = await Table.updateMany(
    { status: "limpiando" },
    {
      $set: {
        status: "libre",
        guestCount: 0,
        statusChangedAt: now,
      },
      $unset: {
        reservation: 1,
        helpRequestedAt: 1,
        billRequestedAt: 1,
        currentSessionId: 1,
      },
    },
  );

  // TODO: emitir evento Socket.io (mesas liberadas)
  res.json({
    ok: true,
    message: "Mesas en limpieza liberadas",
    modifiedCount: result.modifiedCount,
  });
}
