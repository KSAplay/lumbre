import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { ShiftDetail } from "../types/shift";
import { formatEuro } from "./money";

function stamp(shift: ShiftDetail): string {
  const d = shift.endedAt;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatRange(shift: ShiftDetail): string {
  const start = shift.startedAt.toLocaleString("es-ES");
  const end = shift.endedAt.toLocaleString("es-ES");
  return `${start} — ${end}`;
}

/**
 * Descarga un PDF con el detalle del cierre de turno.
 *
 * @param shift - Snapshot persistido del turno.
 */
export function downloadShiftPdf(shift: ShiftDetail): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Cierre de turno — Lumbre", 14, 18);
  doc.setFontSize(11);
  doc.text(`Turno: ${formatRange(shift)}`, 14, 28);
  doc.text(`Cerrado por: ${shift.closedByName}`, 14, 35);
  doc.setFontSize(14);
  doc.text(`Total recaudado: ${formatEuro(shift.totalRevenue)}`, 14, 48);
  doc.setFontSize(11);
  doc.text(`Mesas cobradas: ${shift.tablesPaid}`, 14, 56);
  doc.text(`Ticket medio: ${formatEuro(shift.averageTicket)}`, 14, 63);

  autoTable(doc, {
    startY: 72,
    head: [["Producto", "Unidades", "Importe"]],
    body: shift.products.map((p) => [
      p.name,
      String(p.quantity),
      formatEuro(p.revenue),
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [224, 122, 95] },
  });

  doc.save(`turno-lumbre-${stamp(shift)}.pdf`);
}

/**
 * Descarga un Excel con el detalle del cierre de turno.
 *
 * @param shift - Snapshot persistido del turno.
 */
export function downloadShiftExcel(shift: ShiftDetail): void {
  const summary = [
    ["Cierre de turno — Lumbre"],
    ["Turno", formatRange(shift)],
    ["Cerrado por", shift.closedByName],
    ["Total recaudado", shift.totalRevenue],
    ["Mesas cobradas", shift.tablesPaid],
    ["Ticket medio", shift.averageTicket],
    [],
    ["Producto", "Unidades", "Importe"],
    ...shift.products.map((p) => [p.name, p.quantity, p.revenue]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(summary);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Turno");
  XLSX.writeFile(book, `turno-lumbre-${stamp(shift)}.xlsx`);
}
