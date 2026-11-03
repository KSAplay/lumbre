import type { Request, Response } from "express";
import { Order } from "../models/Order.js";
import { Table } from "../models/Table.js";
import { computeSalesSummary, startOfDay } from "../utils/salesStats.js";

const OCCUPIED_NOW = ["decidiendo", "esperando", "servido", "cuenta"] as const;

/**
 * Resumen operativo y económico del día en curso (00:00 local → ahora).
 */
export async function getDaySummary(
  _req: Request,
  res: Response,
): Promise<void> {
  const from = startOfDay();
  const to = new Date();

  const [sales, occupiedTables, kitchenTickets] = await Promise.all([
    computeSalesSummary(from, to),
    Table.countDocuments({ status: { $in: [...OCCUPIED_NOW] } }),
    Order.countDocuments({ status: "en_cocina" }),
  ]);

  const top = sales.products[0] ?? null;

  res.json({
    totalRevenue: sales.totalRevenue,
    averageTicket: sales.averageTicket,
    tablesPaid: sales.tablesPaid,
    guestsServed: sales.guestsServed,
    topDish: top
      ? { name: top.name, quantity: top.quantity, revenue: top.revenue }
      : null,
    topProducts: sales.products.slice(0, 5).map((product) => ({
      name: product.name,
      quantity: product.quantity,
      revenue: product.revenue,
    })),
    occupiedTables,
    kitchenTickets,
  });
}
