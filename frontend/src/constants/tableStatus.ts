import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Check,
  ClipboardList,
  Clock,
  HandPlatter,
  ReceiptEuro,
  Sparkles,
} from "lucide-react";
import type { TableStatus } from "../types/table";

/** Hex base = variables --color-table-* de index.css */
export const TABLE_STATUS_HEX: Record<TableStatus, string> = {
  libre: "#7cbf9e",
  decidiendo: "#f4a981",
  esperando: "#e56b6b",
  servido: "#649fe3",
  cuenta: "#9c8ed3",
  limpiando: "#d5d5d5",
  reservada: "#f2cc8f",
};

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  libre: "Libre",
  decidiendo: "Decidiendo",
  esperando: "Esperando",
  servido: "Servido",
  cuenta: "Cuenta",
  limpiando: "Limpiando",
  reservada: "Reservada",
};

export const TABLE_STATUS_ICONS: Record<TableStatus, LucideIcon> = {
  libre: Check,
  decidiendo: ClipboardList,
  esperando: Clock,
  servido: HandPlatter,
  cuenta: ReceiptEuro,
  limpiando: Sparkles,
  reservada: CalendarClock,
};

/** Clases Tailwind del punto de color (bg-table-*) */
export const TABLE_STATUS_DOT: Record<TableStatus, string> = {
  libre: "bg-table-libre",
  decidiendo: "bg-table-decidiendo",
  esperando: "bg-table-esperando",
  servido: "bg-table-servido",
  cuenta: "bg-table-cuenta",
  limpiando: "bg-table-limpiando",
  reservada: "bg-table-reservada",
};

export const ALL_TABLE_STATUSES: TableStatus[] = [
  "libre",
  "decidiendo",
  "esperando",
  "servido",
  "cuenta",
  "limpiando",
  "reservada",
];

const TIMED_STATUSES: ReadonlySet<TableStatus> = new Set([
  "decidiendo",
  "esperando",
  "servido",
  "cuenta",
  "limpiando",
]);

export function statusShowsElapsed(status: TableStatus): boolean {
  return TIMED_STATUSES.has(status);
}
