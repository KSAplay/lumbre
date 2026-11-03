import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Clave del único documento de ajustes del restaurante. */
export const SETTINGS_KEY = "restaurant";

const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
    restaurantName: {
      type: String,
      required: true,
      trim: true,
      default: "Lumbre",
    },
  },
  { timestamps: true },
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Settings: Model<SettingsDocument> =
  mongoose.models.Settings ??
  mongoose.model<SettingsDocument>("Settings", settingsSchema);

/**
 * Devuelve los ajustes del restaurante, creándolos con valores por defecto si faltan.
 */
export async function getOrCreateSettings() {
  const existing = await Settings.findOne({ key: SETTINGS_KEY });
  if (existing) return existing;
  return Settings.create({ key: SETTINGS_KEY });
}
