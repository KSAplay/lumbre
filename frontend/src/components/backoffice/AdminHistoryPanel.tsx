import { useEffect, useState } from "react";
import { FileSpreadsheet, FileText, History } from "lucide-react";
import { LoadErrorState } from "../ui/LoadErrorState";
import { getShift, listShifts } from "../../services/shiftService";
import { SOCKET_EVENTS } from "../../services/socketEvents";
import { useSocketRefresh } from "../../hooks/useSocketRefresh";
import type { ShiftDetail } from "../../types/shift";
import { formatEuro } from "../../utils/money";
import { downloadShiftExcel, downloadShiftPdf } from "../../utils/shiftExport";
import { ShiftDetailModal } from "./ShiftDetailModal";

/**
 * Historial de cierres de turno con detalle, PDF y Excel.
 */
export const AdminHistoryPanel = ({
  onFeedback,
}: {
  onFeedback: (message: string, tone: "green" | "red") => void;
}) => {
  const [shifts, setShifts] = useState<ShiftDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<ShiftDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await listShifts();
        if (!cancelled) setShifts(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useSocketRefresh([SOCKET_EVENTS.SHIFT_CLOSED], () => {
    void (async () => {
      try {
        const data = await listShifts();
        setShifts(data);
        setError(false);
      } catch {
        /* el siguiente evento reintenta */
      }
    })();
  });

  const withFullShift = async (
    id: string,
    action: (shift: ShiftDetail) => void,
  ) => {
    setBusyId(id);
    try {
      const full = await getShift(id);
      action(full);
    } catch (err) {
      onFeedback(
        err instanceof Error ? err.message : "No se pudo cargar el turno.",
        "red",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg bg-canvas-white p-6 shadow-sm ring-1 ring-slate-50">
        <div className="h-8 w-48 rounded bg-canvas-muted" />
        <div className="mt-4 h-64 rounded bg-canvas-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <LoadErrorState icon={History} title="No se pudo cargar el historial" />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header>
        <h1 className="text-xl font-bold text-text-main">Historial</h1>
        <p className="mt-1 text-sm text-text-muted">
          Cierres de turno de recepción, ordenados por fecha.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-canvas-white shadow-sm ring-1 ring-slate-50">
        {shifts.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-text-muted">
            Aún no hay cierres de turno. Recepción los genera con «Finalizar
            turno».
          </p>
        ) : (
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="sticky top-0 bg-canvas-white text-sm font-bold tracking-wide text-text-main uppercase">
              <tr className="border-b border-slate-50">
                <th className="px-4 py-3">Fecha de cierre</th>
                <th className="px-4 py-3">Cerrado por</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Mesas</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr
                  key={shift.id}
                  className="border-b border-slate-50 last:border-b-0"
                >
                  <td className="px-4 py-3 font-semibold text-text-main">
                    {shift.endedAt.toLocaleString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {shift.closedByName}
                  </td>
                  <td className="px-4 py-3 font-bold text-text-main tabular-nums">
                    {formatEuro(shift.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-muted">
                    {shift.tablesPaid}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === shift.id}
                        onClick={() =>
                          void withFullShift(shift.id, (full) => {
                            setDetail(full);
                            setDetailOpen(true);
                          })
                        }
                        className="cursor-pointer rounded-lg bg-latte-100 px-3 py-1.5 text-xs font-bold text-latte-500 ring-1 ring-latte-300 transition-transform active:scale-95 disabled:opacity-50"
                      >
                        Ver detalle
                      </button>
                      <button
                        type="button"
                        aria-label="Descargar PDF"
                        disabled={busyId === shift.id}
                        onClick={() =>
                          void withFullShift(shift.id, downloadShiftPdf)
                        }
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-cacao-300 transition-colors hover:bg-cacao-100 disabled:opacity-50"
                      >
                        <FileText className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Descargar Excel"
                        disabled={busyId === shift.id}
                        onClick={() =>
                          void withFullShift(shift.id, downloadShiftExcel)
                        }
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-toast-green transition-colors hover:bg-toast-green-soft disabled:opacity-50"
                      >
                        <FileSpreadsheet className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ShiftDetailModal
        open={detailOpen}
        shift={detail}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
};
