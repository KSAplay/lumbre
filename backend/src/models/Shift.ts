import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const shiftProductSchema = new Schema(
  {
    dishCode: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    revenue: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

/**
 * Cierre de turno ejecutado por recepción («Finalizar Turno»).
 * Guarda un snapshot de las cifras para que el historial no dependa
 * de cambios posteriores en carta o personal.
 */
const shiftSchema = new Schema(
  {
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true, index: true },
    closedBy: { type: Schema.Types.ObjectId, ref: "Staff", default: undefined },
    closedByName: { type: String, required: true, trim: true },
    totalRevenue: { type: Number, required: true, min: 0 },
    tablesPaid: { type: Number, required: true, min: 0 },
    guestsServed: { type: Number, required: true, min: 0, default: 0 },
    averageTicket: { type: Number, required: true, min: 0 },
    /** Productos servidos y cobrados en el turno, de más a menos unidades. */
    products: { type: [shiftProductSchema], default: [] },
  },
  { timestamps: true },
);

export type ShiftDocument = InferSchemaType<typeof shiftSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Shift: Model<ShiftDocument> =
  mongoose.models.Shift ?? mongoose.model<ShiftDocument>("Shift", shiftSchema);
