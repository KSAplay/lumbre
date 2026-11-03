import { apiRequest } from "../config/api";
import type { ShiftDetail } from "../types/shift";

type ShiftApi = {
  id: string;
  startedAt: string;
  endedAt: string;
  closedByName: string;
  totalRevenue: number;
  tablesPaid: number;
  guestsServed: number;
  averageTicket: number;
  products: {
    dishCode: number;
    name: string;
    quantity: number;
    revenue: number;
  }[];
};

function mapShift(shift: ShiftApi): ShiftDetail {
  return {
    id: shift.id,
    startedAt: new Date(shift.startedAt),
    endedAt: new Date(shift.endedAt),
    closedByName: shift.closedByName,
    totalRevenue: shift.totalRevenue,
    tablesPaid: shift.tablesPaid,
    guestsServed: shift.guestsServed,
    averageTicket: shift.averageTicket,
    products: shift.products,
  };
}

/**
 * Cierra el turno en curso (recepción). Persiste el snapshot de recaudación.
 *
 * @throws Error si falla la red o el usuario no es recepción.
 */
export async function closeShift(): Promise<ShiftDetail> {
  const data = await apiRequest<{ shift: ShiftApi }>("/turnos/cerrar", {
    method: "POST",
  });
  return mapShift(data.shift);
}

/**
 * Historial de cierres de turno, del más reciente al más antiguo.
 *
 * @throws Error si falla la red.
 */
export async function listShifts(): Promise<ShiftDetail[]> {
  const data = await apiRequest<{ shifts: ShiftApi[] }>("/turnos");
  return data.shifts.map(mapShift);
}

/**
 * Detalle completo de un cierre (todos los productos servidos).
 *
 * @param id - Identificador del turno.
 * @throws Error si no existe o falla la red.
 */
export async function getShift(id: string): Promise<ShiftDetail> {
  const data = await apiRequest<{ shift: ShiftApi }>(`/turnos/${id}`);
  return mapShift(data.shift);
}
