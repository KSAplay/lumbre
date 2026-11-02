import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { KITCHEN_ALERT_TYPES } from "./Order.js";

/** Tipos de aviso que recibe el camarero. */
export const NOTIFICATION_TYPES = [
  "nuevo_pedido",
  "ayuda",
  "cuenta",
  "plato_listo",
  "incidencia_cocina",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Aviso de sala persistido (camarero).
 */
const notificationSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES,
    },
    tableId: { type: String, required: true, trim: true, index: true },
    tableLabel: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    kitchenAlert: {
      type: String,
      enum: KITCHEN_ALERT_TYPES,
      default: undefined,
    },
    roundId: { type: String, trim: true, default: undefined },
  },
  { timestamps: true },
);

notificationSchema.index({ createdAt: -1 });

export type NotificationDocument = InferSchemaType<
  typeof notificationSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const Notification: Model<NotificationDocument> =
  mongoose.models.Notification ??
  mongoose.model<NotificationDocument>("Notification", notificationSchema);
