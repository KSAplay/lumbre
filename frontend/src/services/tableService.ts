import type {
  FloorWallData,
  TableNodeData,
  TableStatus,
} from "../types/table";
import { apiRequest } from "../config/api";

export type UpdateTableStatusBody = {
  status: TableStatus;
  guestCount?: number;
};

export type UpdateTableStatusResponse = {
  ok: boolean;
  message: string;
};

export type FloorPlanResponse = {
  tables: TableNodeData[];
  walls: FloorWallData[];
};

type FloorPlanApi = {
  tables: Array<
    Omit<TableNodeData, "statusChangedAt"> & { statusChangedAt: number }
  >;
  walls: FloorWallData[];
};

/**
 * Carga el plano de sala (mesas + muros) desde Mongo.
 */
export async function getFloorPlan(): Promise<FloorPlanResponse> {
  const data = await apiRequest<FloorPlanApi>("/plano");
  return {
    tables: data.tables.map((t) => ({
      ...t,
      statusChangedAt: t.statusChangedAt,
    })),
    walls: data.walls,
  };
}

/**
 * Guarda el plano completo al salir del modo edición (check).
 */
export async function saveFloorPlan(
  tables: TableNodeData[],
  walls: FloorWallData[],
): Promise<{ ok: boolean; message: string }> {
  return apiRequest("/plano", {
    method: "PUT",
    body: JSON.stringify({ tables, walls }),
  });
}

/** Cambia el estado operativo de una mesa (ciclo de sala). */
export async function updateTableStatus(
  tableId: string,
  body: UpdateTableStatusBody,
): Promise<UpdateTableStatusResponse> {
  return apiRequest<UpdateTableStatusResponse>(`/mesas/${tableId}/estado`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Pasa todas las mesas en limpieza a libre. */
export async function releaseCleaningTables(): Promise<{
  ok: boolean;
  message: string;
  modifiedCount?: number;
}> {
  return apiRequest("/mesas/liberar-limpias", { method: "POST" });
}
