import { apiRequest } from "../config/api";
import type { DaySummary } from "../types/admin";

/**
 * Resumen económico y operativo del día en curso.
 *
 * @throws Error si falla la red.
 */
export async function getDaySummary(): Promise<DaySummary> {
  return apiRequest<DaySummary>("/admin/resumen");
}
