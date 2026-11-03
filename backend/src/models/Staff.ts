import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Roles del personal que usan los paneles staff (login por PIN). */
export const STAFF_ROLES = [
  "recepcion",
  "cocina",
  "camarero",
  "backoffice",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** Determina el avatar por defecto cuando no hay foto. */
export const STAFF_GENDERS = ["hombre", "mujer"] as const;

export type StaffGender = (typeof STAFF_GENDERS)[number];

const staffSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /**
     * Hash del PIN; nunca se expone en consultas por defecto.
     * Todos los empleados de `cocina` comparten el mismo PIN (un único monitor KDS).
     */
    pinHash: { type: String, required: true, select: false },
    /** PIN en claro para el listado del backoffice. El login sigue usando `pinHash`. */
    pin: { type: String, required: true, select: false, trim: true },
    role: {
      type: String,
      required: true,
      enum: STAFF_ROLES,
    },
    gender: { type: String, enum: STAFF_GENDERS, default: "hombre" },
    imageUrl: { type: String, trim: true, default: undefined },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type StaffDocument = InferSchemaType<typeof staffSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Staff: Model<StaffDocument> =
  mongoose.models.Staff ?? mongoose.model<StaffDocument>("Staff", staffSchema);
