import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Roles del personal que usan los paneles staff (login por PIN). */
export const STAFF_ROLES = [
  "recepcion",
  "cocina",
  "camarero",
  "backoffice",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

const staffSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Hash del PIN; nunca se expone en consultas por defecto. */
    pinHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: STAFF_ROLES,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type StaffDocument = InferSchemaType<typeof staffSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Staff: Model<StaffDocument> =
  mongoose.models.Staff ?? mongoose.model<StaffDocument>("Staff", staffSchema);
