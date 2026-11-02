import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Formas de muro del plano (opciones de UI, no contenido de negocio). */
export const WALL_SHAPES = ["rectangle", "circle"] as const;
export type WallShape = (typeof WALL_SHAPES)[number];

export const WALL_CORNER_KINDS = ["square", "round", "cut"] as const;
export type WallCornerKind = (typeof WALL_CORNER_KINDS)[number];

export const WALL_ROTATIONS = [0, 90, 180, 270] as const;
export type WallRotation = (typeof WALL_ROTATIONS)[number];

const wallCornersSchema = new Schema(
  {
    nw: { type: String, required: true, enum: WALL_CORNER_KINDS },
    ne: { type: String, required: true, enum: WALL_CORNER_KINDS },
    se: { type: String, required: true, enum: WALL_CORNER_KINDS },
    sw: { type: String, required: true, enum: WALL_CORNER_KINDS },
  },
  { _id: false },
);

/**
 * Muro del plano embebido en una zona.
 * El slug de zona se reinyecta al serializar la API (no se guarda en el subdoc).
 */
const floorWallSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
    name: { type: String, trim: true },
    shape: { type: String, enum: WALL_SHAPES },
    rotation: { type: Number, enum: WALL_ROTATIONS },
    corners: { type: wallCornersSchema },
  },
  { _id: false },
);

/**
 * Zona del plano (pestaña de recepción).
 * Slug y nombre son datos en Mongo: se pueden crear/editar, no van fijados a interior/terraza.
 */
const zoneSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
    walls: { type: [floorWallSchema], default: [] },
  },
  { timestamps: true },
);

export type ZoneDocument = InferSchemaType<typeof zoneSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Zone: Model<ZoneDocument> =
  mongoose.models.Zone ?? mongoose.model<ZoneDocument>("Zone", zoneSchema);
