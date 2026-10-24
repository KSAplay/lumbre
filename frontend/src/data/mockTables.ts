import type { TableNodeData, TableStatus } from "../types/table";

const STATUSES: TableStatus[] = [
  "libre",
  "decidiendo",
  "esperando",
  "servido",
  "cuenta",
  "limpiando",
  "reservada",
];

const RESERVED_NAMES = ["García", "López", "Martín", "Ruiz", "Soto"];

function seededStatus(seed: number): TableStatus {
  const idx = (seed * 17 + 7) % STATUSES.length;
  return STATUSES[idx]!;
}

function seededChangedAt(seed: number): number {
  const now = Date.now();
  const bucket = seed % 5;
  if (bucket === 0) return now - (3 + (seed % 6)) * 1000;
  if (bucket === 1) return now - (12 + (seed % 40)) * 1000;
  if (bucket === 2) return now - (2 + (seed % 10)) * 60 * 1000;
  if (bucket === 3) return now - (1 + (seed % 4)) * 3600 * 1000;
  return now - (5 + (seed % 4)) * 1000;
}

function guestsFor(status: TableStatus, capacity: number, seed: number): number {
  if (status === "libre" || status === "limpiando") return 0;
  if (status === "reservada") return Math.min(capacity, 2 + (seed % 2));
  return Math.min(capacity, 1 + (seed % capacity));
}

type TableBase = Omit<
  TableNodeData,
  "status" | "guestCount" | "statusChangedAt" | "reservation"
>;

const INTERIOR: TableBase[] = [
  { id: "I01", number: 1, capacity: 2, shape: "square", zone: "interior", position: { x: 12, y: 18 } },
  { id: "I02", number: 2, capacity: 4, shape: "square", zone: "interior", position: { x: 32, y: 18 } },
  { id: "I03", number: 3, capacity: 4, shape: "square", zone: "interior", position: { x: 52, y: 18 } },
  { id: "I04", number: 4, capacity: 2, shape: "square", zone: "interior", position: { x: 72, y: 18 } },
  { id: "I05", number: 5, capacity: 6, shape: "rectangle", zone: "interior", position: { x: 18, y: 48 } },
  { id: "I06", number: 6, capacity: 4, shape: "square", zone: "interior", position: { x: 42, y: 48 } },
  { id: "I07", number: 7, capacity: 4, shape: "square", zone: "interior", position: { x: 62, y: 48 } },
  { id: "I08", number: 8, capacity: 8, shape: "rectangle", zone: "interior", position: { x: 28, y: 78 } },
  { id: "I09", number: 9, capacity: 4, shape: "square", zone: "interior", position: { x: 55, y: 78 } },
  { id: "I10", number: 10, capacity: 2, shape: "square", zone: "interior", position: { x: 78, y: 62 } },
];

const TERRAZA: TableBase[] = [
  { id: "T01", number: 11, capacity: 2, shape: "circle", zone: "terraza", position: { x: 18, y: 22 } },
  { id: "T02", number: 12, capacity: 4, shape: "circle", zone: "terraza", position: { x: 42, y: 20 } },
  { id: "T03", number: 13, capacity: 4, shape: "circle", zone: "terraza", position: { x: 66, y: 22 } },
  { id: "T04", number: 14, capacity: 6, shape: "circle", zone: "terraza", position: { x: 28, y: 50 } },
  { id: "T05", number: 15, capacity: 4, shape: "circle", zone: "terraza", position: { x: 55, y: 48 } },
  { id: "T06", number: 16, capacity: 2, shape: "circle", zone: "terraza", position: { x: 78, y: 52 } },
  { id: "T07", number: 17, capacity: 8, shape: "circle", zone: "terraza", position: { x: 38, y: 78 } },
  { id: "T08", number: 18, capacity: 4, shape: "circle", zone: "terraza", position: { x: 68, y: 78 } },
];

function hydrate(base: TableBase, seed: number): TableNodeData {
  const status = seededStatus(seed);
  return {
    ...base,
    status,
    guestCount: guestsFor(status, base.capacity, seed),
    statusChangedAt: seededChangedAt(seed),
    reservation:
      status === "reservada"
        ? {
            guestName: RESERVED_NAMES[seed % RESERVED_NAMES.length]!,
            time: `${12 + (seed % 8)}:${seed % 2 === 0 ? "00" : "30"}`,
          }
        : undefined,
  };
}

export const MOCK_TABLES: TableNodeData[] = [
  ...INTERIOR.map((t, i) => hydrate(t, i + 1)),
  ...TERRAZA.map((t, i) => hydrate(t, i + 20)),
];
