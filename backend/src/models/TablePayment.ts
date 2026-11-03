import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Cobro de una mesa al cerrar su ciclo (`cuenta` → `limpiando`).
 * Es la fuente de recaudación, mesas cobradas y ticket medio de los turnos.
 */
const tablePaymentSchema = new Schema(
  {
    tableId: { type: String, required: true, trim: true, index: true },
    tableNumber: { type: Number, required: true, min: 1 },
    sessionId: { type: String, trim: true, default: undefined },
    guestCount: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    paidBy: { type: Schema.Types.ObjectId, ref: "Staff", default: undefined },
    paidAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

export type TablePaymentDocument = InferSchemaType<typeof tablePaymentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TablePayment: Model<TablePaymentDocument> =
  mongoose.models.TablePayment ??
  mongoose.model<TablePaymentDocument>("TablePayment", tablePaymentSchema);
