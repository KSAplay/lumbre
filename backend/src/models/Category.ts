import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Categoría de la carta gestionable desde backoffice.
 */
const categorySchema = new Schema(
  {
    /** Identificador estable para URLs/API (p. ej. `ENTRADAS`, `PRINCIPALES`). */
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    /** Etiqueta visible (p. ej. "Entradas"). */
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CategoryDocument = InferSchemaType<typeof categorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Category: Model<CategoryDocument> =
  mongoose.models.Category ??
  mongoose.model<CategoryDocument>("Category", categorySchema);
