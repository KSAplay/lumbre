import type { TableNodeData } from "../types/table";

type TableBase = Omit<
  TableNodeData,
  "status" | "guestCount" | "statusChangedAt" | "reservation"
>;

// Sala: barra arriba, cocina a la derecha y ba�os abajo a la derecha.
// Mesas grandes a la izquierda, bloque central de 4 y fila de 2 abajo
const INTERIOR: TableBase[] = [
  { id: "I01", number: 1, capacity: 10, shape: "rectangle", zone: "interior", orientation: "horizontal", position: { x: 14, y: 26 } },
  { id: "I02", number: 2, capacity: 8, shape: "rectangle", zone: "interior", orientation: "horizontal", position: { x: 14, y: 57 } },
  { id: "I03", number: 3, capacity: 4, shape: "square", zone: "interior", position: { x: 35, y: 30 } },
  { id: "I04", number: 4, capacity: 4, shape: "square", zone: "interior", position: { x: 51, y: 30 } },
  { id: "I05", number: 5, capacity: 4, shape: "square", zone: "interior", position: { x: 67, y: 30 } },
  { id: "I06", number: 6, capacity: 4, shape: "square", zone: "interior", position: { x: 35, y: 57 } },
  { id: "I07", number: 7, capacity: 4, shape: "square", zone: "interior", position: { x: 51, y: 57 } },
  { id: "I08", number: 8, capacity: 4, shape: "square", zone: "interior", position: { x: 67, y: 57 } },
  { id: "I09", number: 9, capacity: 2, shape: "square", zone: "interior", orientation: "vertical", position: { x: 10, y: 86 } },
  { id: "I10", number: 10, capacity: 2, shape: "square", zone: "interior", orientation: "vertical", position: { x: 24, y: 86 } },
  { id: "I11", number: 11, capacity: 2, shape: "square", zone: "interior", orientation: "vertical", position: { x: 38, y: 86 } },
  { id: "I12", number: 12, capacity: 2, shape: "square", zone: "interior", orientation: "vertical", position: { x: 52, y: 86 } },
  { id: "I13", number: 13, capacity: 2, shape: "square", zone: "interior", orientation: "vertical", position: { x: 66, y: 86 } },
];

// Terraza: fachada arriba y jardinera cerrando abajo
const TERRAZA: TableBase[] = [
  { id: "T01", number: 14, capacity: 2, shape: "circle", zone: "terraza", position: { x: 10, y: 26 } },
  { id: "T02", number: 15, capacity: 4, shape: "circle", zone: "terraza", position: { x: 28, y: 26 } },
  { id: "T03", number: 16, capacity: 4, shape: "circle", zone: "terraza", position: { x: 47, y: 26 } },
  { id: "T04", number: 17, capacity: 4, shape: "circle", zone: "terraza", position: { x: 66, y: 26 } },
  { id: "T05", number: 18, capacity: 2, shape: "circle", zone: "terraza", position: { x: 85, y: 26 } },
  { id: "T06", number: 19, capacity: 6, shape: "circle", zone: "terraza", position: { x: 18, y: 64 } },
  { id: "T07", number: 20, capacity: 8, shape: "circle", zone: "terraza", position: { x: 45, y: 64 } },
  { id: "T08", number: 21, capacity: 4, shape: "circle", zone: "terraza", position: { x: 74, y: 64 } },
];

function asFree(base: TableBase): TableNodeData {
  return {
    ...base,
    status: "libre",
    guestCount: 0,
    statusChangedAt: Date.now(),
  };
}

/** Mesas iniciales (mock hasta BBDD), todas libres */
export const MOCK_TABLES: TableNodeData[] = [...INTERIOR, ...TERRAZA].map(
  asFree,
);

/** Estado de demo por mesa: [estado, comensales, minutos en ese estado] */
const WAITER_DEMO_STATES: Partial<
  Record<string, [TableNodeData["status"], number, number]>
> = {
  I01: ["servido", 8, 18],
  I02: ["reservada", 6, 0],
  I03: ["decidiendo", 3, 4],
  I04: ["esperando", 4, 22],
  I05: ["cuenta", 2, 6],
  I07: ["esperando", 4, 9],
  I08: ["limpiando", 0, 2],
  I12: ["esperando", 2, 3],
  I13: ["decidiendo", 2, 1],
  T02: ["servido", 4, 31],
  T03: ["decidiendo", 3, 7],
  T06: ["cuenta", 5, 12],
  T07: ["reservada", 8, 0],
};

/**
 * Crea las mesas de la demo del camarero con estados variados y tiempos
 * relativos al momento actual, para que se vean todos los colores y contadores.
 *
 * @returns Copia de {@link MOCK_TABLES}; las mesas sin estado de demo quedan libres.
 */
export const createWaiterDemoTables = (): TableNodeData[] => {
  const now = Date.now();
  return MOCK_TABLES.map((table) => {
    const demo = WAITER_DEMO_STATES[table.id];
    if (!demo) return { ...table, statusChangedAt: now };
    const [status, guestCount, minutesAgo] = demo;
    return {
      ...table,
      status,
      guestCount,
      statusChangedAt: now - minutesAgo * 60_000,
      reservation:
        status === "reservada"
          ? { guestName: table.id === "I02" ? "Familia Ruiz" : "Lucía M.", time: "21:30" }
          : undefined,
    };
  });
};
