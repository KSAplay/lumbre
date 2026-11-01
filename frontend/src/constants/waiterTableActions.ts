import type { TableStatus } from "../types/table";
import type { WaiterTableAction } from "../types/waiter";

/** Estado destino de cada acción; `take-order` no cambia el estado por sí sola */
export const WAITER_ACTION_NEXT_STATUS: Record<
  Exclude<WaiterTableAction, "take-order">,
  TableStatus
> = {
  served: "servido",
  bill: "cuenta",
  paid: "limpiando",
  ready: "libre",
};
