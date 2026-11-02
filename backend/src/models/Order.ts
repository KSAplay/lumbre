import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Estados de ronda (comanda) alineados con `CustomerOrderStatus` del frontend.
 * Las incidencias de cocina no son un status: viven en `alert`.
 */
export const ORDER_STATUSES = [
  "por_confirmar",
  "en_cocina",
  "servido",
  "pagado",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Incidencias que cocina puede marcar en una ronda. */
export const KITCHEN_ALERT_TYPES = [
  "falta_producto",
  "repitiendo",
  "venir_cocina",
] as const;

export type KitchenAlertType = (typeof KITCHEN_ALERT_TYPES)[number];

/**
 * Línea de una ronda: snapshot de nombre/precio + progreso KDS (`done`).
 */
const orderItemSchema = new Schema(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      default: undefined,
    },
    /** Copia del `code` de MenuItem al crear la línea. */
    dishCode: { type: Number, required: true, min: 1 },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    done: { type: Boolean, default: false },
  },
  { _id: true },
);

/**
 * Una comanda/ronda enviada por mesa (o camarero en manual).
 * Agrupa la visita con `sessionId` (sin colección TableSession).
 */
const orderSchema = new Schema(
  {
    number: { type: Number, required: true, min: 1 },
    tableId: { type: String, required: true, trim: true, index: true },
    tableLabel: { type: String, required: true, trim: true },
    tableNumber: { type: Number, required: true, min: 1 },
    sessionId: { type: String, trim: true, default: undefined, index: true },
    status: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
      default: "por_confirmar",
    },
    note: { type: String, trim: true, default: undefined },
    alert: {
      type: String,
      enum: KITCHEN_ALERT_TYPES,
      default: null,
    },
    sentAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date, default: undefined },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
        message: "La ronda debe tener al menos un ítem",
      },
    },
  },
  { timestamps: true },
);

orderSchema.index({ tableId: 1, sentAt: -1 });
orderSchema.index({ status: 1, sentAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order: Model<OrderDocument> =
  mongoose.models.Order ?? mongoose.model<OrderDocument>("Order", orderSchema);
