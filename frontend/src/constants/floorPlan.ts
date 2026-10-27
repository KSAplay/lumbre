import type { TableShape } from "../types/table";

/** Máximo de comensales por mesa */
export const MAX_TABLE_GUESTS = 20;

/** Máximo en mesas redondas (más grandes crecerían demasiado) */
export const MAX_ROUND_TABLE_GUESTS = 12;

export function maxGuestsForShape(shape: TableShape): number {
  return shape === "circle" ? MAX_ROUND_TABLE_GUESTS : MAX_TABLE_GUESTS;
}

/** Rejilla de snap en modo edición (px) */
export const EDIT_SNAP_PX = 20;

/** Rejilla decorativa en modo normal (px) */
export const VIEW_GRID_PX = 40;
