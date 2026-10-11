// Formas disponibles para las mesas en el editor
export type TableShape = 'square' | 'circle' | 'rectangle';

// Identificadores de zonas
export type ZoneId = 'salon' | 'terraza' | 'barra';

// Estados posibles de la mesa en la sala
export type TableStatus =
  | 'libre'
  | 'decidiendo'
  | 'esperando'
  | 'servido'
  | 'cuenta'
  | 'limpiando'
  | 'reservada';

// Coordenadas en la cuadrícula (Snap-to-Grid)
export interface GridPosition {
  row: number;
  col: number;
}

// Datos completos de un nodo de mesa en el mapa
export interface TableNodeData {
  id: string;             // Ej: 'M01'
  number: number;         // Ej: 1
  capacity: number;       // Número de sillas (2, 4, 6, etc.)
  shape: TableShape;
  zone: ZoneId;
  position: GridPosition;
  status: TableStatus;
  currentSessionId?: string; // ID de la sesión activa si está ocupada
  guestCount?: number;    // Personas sentadas actualmente
  timeInStateMinutes?: number; // Tiempo transcurrido en el estado actual
}

// Estructura de una reserva asignada a una mesa
export interface Reservation {
  id: string;
  tableId: string;
  guestName: string;
  guestCount: number;
  time: string;           // Ej: '14:30'
  notes?: string;
}