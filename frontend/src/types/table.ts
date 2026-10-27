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

/** Orientación del cuerpo de la mesa (el contenido interno no se voltea) */
export type TableOrientation = "horizontal" | "vertical";

/** Reserva mostrada sobre la mesa (estado reservada) */
export interface TableReservationInfo {
  guestName: string;
  time: string;
}

/** Nodo de mesa en el mapa interactivo */
export interface TableNodeData {
  id: string;
  number: number;
  /** Plazas por defecto en plano vacío; al sentar manda guestCount (máx. 20) */
  capacity: number;
  shape: TableShape;
  zone: ZoneId;
  position: TablePosition;
  orientation?: TableOrientation;
  status: TableStatus;
  guestCount: number;
  statusChangedAt: number;
  currentSessionId?: string;
  reservation?: TableReservationInfo;
}

/** Forma del cuerpo del muro */
export type WallShape = "rectangle" | "circle";

/** Esquina: recta, redondeada o chaflán triangular */
export type WallCornerKind = "square" | "round" | "cut";

export interface WallCorners {
  nw: WallCornerKind;
  ne: WallCornerKind;
  se: WallCornerKind;
  sw: WallCornerKind;
}

/** Rotación del cuerpo (el contenido interno no gira) */
export type WallRotation = 0 | 90 | 180 | 270;

/** Muro del plano (porcentajes del mapa) */
export interface FloorWallData {
  id: string;
  zone: ZoneId;
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  shape?: WallShape;
  rotation?: WallRotation;
  corners?: WallCorners;
}

/** Selección en el plano (edición) */
export type FloorSelection =
  | { kind: "table"; id: string }
  | { kind: "wall"; id: string };

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
