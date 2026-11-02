import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Formas visuales de mesa (opciones de UI al crear/editar en el plano). */
export const TABLE_SHAPES = ["square", "circle", "rectangle"] as const;
export type TableShape = (typeof TABLE_SHAPES)[number];

export const TABLE_ORIENTATIONS = ["horizontal", "vertical"] as const;
export type TableOrientation = (typeof TABLE_ORIENTATIONS)[number];

/**
 * Estados del ciclo de sala.
 * Son reglas de negocio fijas (no las crea el admin como “contenido”).
 */
export const TABLE_STATUSES = [
  "libre",
  "decidiendo",
  "esperando",
  "servido",
  "cuenta",
  "limpiando",
  "reservada",
] as const;

export type TableStatus = (typeof TABLE_STATUSES)[number];

const tablePositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false },
);

const tableReservationSchema = new Schema(
  {
    guestName: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/**
 * Mesa del plano. Documentos creados/editados desde recepción (modo edición).
 * `_id` es el código de sala (`I01`, `T03`, …); `number` es el visible en sala/QR.
 * `zone` guarda el `slug` de un documento `Zone` existente.
 */
const tableSchema = new Schema(
  {
    _id: { type: String, required: true, trim: true },
    number: { type: Number, required: true, unique: true, min: 1 },
    capacity: { type: Number, required: true, min: 1, max: 20 },
    shape: {
      type: String,
      required: true,
      enum: TABLE_SHAPES,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    position: { type: tablePositionSchema, required: true },
    orientation: { type: String, enum: TABLE_ORIENTATIONS },
    status: {
      type: String,
      required: true,
      enum: TABLE_STATUSES,
      default: "libre",
    },
    guestCount: { type: Number, required: true, default: 0, min: 0, max: 20 },
    statusChangedAt: { type: Date, required: true, default: Date.now },
    reservation: { type: tableReservationSchema, default: undefined },
    currentSessionId: { type: String, trim: true, default: undefined },
    qrToken: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: undefined,
    },
    helpRequestedAt: { type: Date, default: undefined },
    billRequestedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

export type TableDocument = InferSchemaType<typeof tableSchema> & {
  _id: string;
};

export const Table: Model<TableDocument> =
  mongoose.models.Table ?? mongoose.model<TableDocument>("Table", tableSchema);
