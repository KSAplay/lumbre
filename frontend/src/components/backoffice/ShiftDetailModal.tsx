import { FileSpreadsheet, FileText } from "lucide-react";
import type { ShiftDetail } from "../../types/shift";
import { formatEuro } from "../../utils/money";
import {
  downloadShiftExcel,
  downloadShiftPdf,
} from "../../utils/shiftExport";
import { AdminDialog } from "./AdminDialog";

type ShiftDetailModalProps = {
  open: boolean;
  shift: ShiftDetail | null;
  onClose: () => void;
};

/**
 * Detalle de un cierre de turno: cabecera, recaudación y productos servidos.
 */
export const ShiftDetailModal = ({
  open,
  shift,
  onClose,
}: ShiftDetailModalProps) => {
  if (!shift) {
    return null;
  }

  const range = `${shift.startedAt.toLocaleString("es-ES")} — ${shift.endedAt.toLocaleString("es-ES")}`;

  return (
    <AdminDialog
      open={open}
      title="Detalle del turno"
      onClose={onClose}
      maxWidthClass="max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={() => downloadShiftPdf(shift)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-cacao-100 px-3 py-2 text-sm font-bold text-cacao-300 transition-transform active:scale-95"
          >
            <FileText className="size-4" />
            PDF
          </button>
          <button
            type="button"
            onClick={() => downloadShiftExcel(shift)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-toast-green-soft px-3 py-2 text-sm font-bold text-toast-green transition-transform active:scale-95"
          >
            <FileSpreadsheet className="size-4" />
            Excel
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            Identificación
          </h3>
          <p className="mt-1 text-sm text-text-main">{range}</p>
          <p className="mt-0.5 text-sm text-text-muted">
            Cerrado por {shift.closedByName}
          </p>
        </section>

        <section className="rounded-lg bg-terracotta-100 px-4 py-4 text-center">
          <p className="text-[11px] font-semibold tracking-wide text-terracotta-400 uppercase">
            Total recaudado
          </p>
          <p className="mt-1 text-3xl font-black text-terracotta-400 tabular-nums">
            {formatEuro(shift.totalRevenue)}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-canvas-muted px-3 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
              Mesas cobradas
            </p>
            <p className="mt-1 text-xl font-bold text-text-main tabular-nums">
              {shift.tablesPaid}
            </p>
          </div>
          <div className="rounded-lg bg-canvas-muted px-3 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
              Ticket medio
            </p>
            <p className="mt-1 text-xl font-bold text-text-main tabular-nums">
              {formatEuro(shift.averageTicket)}
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            Productos servidos
          </h3>
          {shift.products.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">
              No se cobró ningún producto en este turno.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-50">
              {shift.products.map((product) => (
                <li
                  key={`${product.dishCode}-${product.name}`}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate font-semibold text-text-main">
                    {product.quantity}× {product.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-text-muted">
                    {formatEuro(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminDialog>
  );
};
