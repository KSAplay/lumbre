import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const dishOptionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    choices: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length > 0,
        message: "options.choices debe tener al menos una opción",
      },
    },
  },
  { _id: false },
);

/**
 * Plato/producto de la carta.
 */
const menuItemSchema = new Schema(
  {
    code: { type: Number, required: true, unique: true, min: 1 },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, default: true },
    options: { type: [dishOptionSchema], default: undefined },
  },
  { timestamps: true },
);

export type MenuItemDocument = InferSchemaType<typeof menuItemSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MenuItem: Model<MenuItemDocument> =
  mongoose.models.MenuItem ??
  mongoose.model<MenuItemDocument>("MenuItem", menuItemSchema);
