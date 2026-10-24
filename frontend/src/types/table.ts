/** Formas visuales de mesa en el mapa de sala */
export type TableShape = "square" | "circle" | "rectangle";

/** Zonas del plano (pestañas de recepción) */
export type ZoneId = "interior" | "terraza";

/** Estados posibles de la mesa en la sala */
export type TableStatus =
  | "libre"
  | "decidiendo"
  | "esperando"
  | "servido"
  | "cuenta"
  | "limpiando"
  | "reservada";

/** Posición libre en el plano (porcentaje del contenedor) */
export interface TablePosition {
  x: number;
  y: number;
}

/** Reserva mostrada sobre la mesa (estado reservada) */
export interface TableReservationInfo {
  guestName: string;
  time: string;
}

/** Nodo de mesa en el mapa interactivo */
export interface TableNodeData {
  id: string;
  number: number;
  capacity: number;
  shape: TableShape;
  zone: ZoneId;
  position: TablePosition;
  status: TableStatus;
  guestCount: number;
  statusChangedAt: number;
  currentSessionId?: string;
  reservation?: TableReservationInfo;
}

export interface Reservation {
  id: string;
  tableId: string;
  guestName: string;
  guestCount: number;
  time: string;
  notes?: string;
}

export {
  ALL_TABLE_STATUSES,
  TABLE_STATUS_LABELS,
} from "../constants/tableStatus";
