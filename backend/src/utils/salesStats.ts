import { Order } from "../models/Order.js";
import { Shift } from "../models/Shift.js";
import { TablePayment } from "../models/TablePayment.js";

export type ProductSales = {
  dishCode: number;
  name: string;
  quantity: number;
  revenue: number;
};

export type SalesSummary = {
  totalRevenue: number;
  tablesPaid: number;
  guestsServed: number;
  averageTicket: number;
  /** Ordenados por unidades vendidas, de mayor a menor. */
  products: ProductSales[];
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcula la recaudación y los productos cobrados en un intervalo.
 *
 * Las cifras económicas salen de {@link TablePayment}; los productos, de las
 * rondas con `paidAt` dentro del intervalo (excluye canceladas).
 *
 * @param from - Inicio inclusivo.
 * @param to - Fin inclusivo.
 */
export async function computeSalesSummary(
  from: Date,
  to: Date,
): Promise<SalesSummary> {
  const range = { $gte: from, $lte: to };

  const [payments, orders] = await Promise.all([
    TablePayment.find({ paidAt: range }).lean(),
    Order.find({ paidAt: range, status: { $ne: "cancelado" } }).lean(),
  ]);

  const totalRevenue = round2(payments.reduce((sum, p) => sum + p.total, 0));
  const tablesPaid = payments.length;
  const guestsServed = payments.reduce((sum, p) => sum + (p.guestCount ?? 0), 0);

  const byCode = new Map<number, ProductSales>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = byCode.get(item.dishCode) ?? {
        dishCode: item.dishCode,
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += item.quantity;
      current.revenue = round2(current.revenue + item.price * item.quantity);
      byCode.set(item.dishCode, current);
    }
  }

  const products = [...byCode.values()].sort(
    (a, b) => b.quantity - a.quantity || b.revenue - a.revenue,
  );

  return {
    totalRevenue,
    tablesPaid,
    guestsServed,
    averageTicket: tablesPaid > 0 ? round2(totalRevenue / tablesPaid) : 0,
    products,
  };
}

/** Devuelve las 00:00 locales del día de `now`. */
export function startOfDay(now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Inicio del turno en curso: fin del último cierre o, si nunca se ha cerrado
 * ninguno, las 00:00 locales de hoy. Así ningún cobro queda fuera de un turno.
 */
export async function currentShiftStart(now = new Date()): Promise<Date> {
  const last = await Shift.findOne().sort({ endedAt: -1 }).lean();
  return last ? last.endedAt : startOfDay(now);
}
