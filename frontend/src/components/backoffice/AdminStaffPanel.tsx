import { useEffect, useState } from "react";
import { Plus, Share2, User, UserRound, Users } from "lucide-react";
import { ConfirmModal } from "../ui/ConfirmModal";
import { LoadErrorState } from "../ui/LoadErrorState";
import { mediaUrl } from "../../config/api";
import { STAFF_ROLE_ICONS, STAFF_ROLE_LABELS } from "../../constants/staffRoles";
import { listStaff, updateStaff } from "../../services/staffService";
import { SOCKET_EVENTS } from "../../services/socketEvents";
import { useSocketRefresh } from "../../hooks/useSocketRefresh";
import type { StaffMember } from "../../types/staff";
import { StaffFormModal } from "./StaffFormModal";

/**
 * Gestión de personal: alta, edición, foto, PIN y desactivación.
 */
export const AdminStaffPanel = ({
  onFeedback,
}: {
  onFeedback: (message: string, tone: "green" | "red") => void;
}) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [toToggle, setToToggle] = useState<StaffMember | null>(null);

  /** Recarga el listado tras crear o editar un empleado. */
  const refreshStaff = async () => {
    try {
      const members = await listStaff();
      setStaff(members);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadStaff = async () => {
      try {
        const members = await listStaff();
        if (cancelled) return;
        setStaff(members);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadStaff();
    return () => {
      cancelled = true;
    };
  }, []);

  useSocketRefresh([SOCKET_EVENTS.STAFF_UPDATED], () => {
    void refreshStaff();
  });

  const confirmToggle = async () => {
    if (!toToggle) return;
    const nextActive = !toToggle.active;
    try {
      const updated = await updateStaff(toToggle.id, { active: nextActive });
      setStaff((prev) =>
        prev.map((member) => (member.id === updated.id ? updated : member)),
      );
      onFeedback(
        nextActive
          ? `${updated.name} ha sido reactivado.`
          : `${updated.name} ya no puede iniciar sesión.`,
        "green",
      );
    } catch (err) {
      onFeedback(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el empleado.",
        "red",
      );
    } finally {
      setToToggle(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg bg-canvas-white p-6 shadow-sm ring-1 ring-slate-50">
        <div className="h-8 w-40 rounded bg-canvas-muted" />
        <div className="mt-4 h-64 rounded bg-canvas-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <LoadErrorState icon={Users} title="No se pudo cargar el personal" />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-main">Personal</h1>
          <p className="mt-1 text-sm text-text-muted">
            Empleados, roles y PIN de acceso a los paneles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-terracotta-400 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          <Plus className="size-4" strokeWidth={2.4} />
          Nuevo empleado
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-canvas-white shadow-sm ring-1 ring-slate-50">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="sticky top-0 bg-canvas-white text-sm font-bold tracking-wide text-text-main uppercase">
            <tr className="border-b border-slate-50">
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">PIN</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => {
              const AvatarIcon = member.gender === "mujer" ? UserRound : User;
              const RoleIcon = STAFF_ROLE_ICONS[member.role];
              return (
                <tr
                  key={member.id}
                  className="border-b border-slate-50 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {member.imageUrl ? (
                        <img
                          src={mediaUrl(member.imageUrl)}
                          alt=""
                          className="size-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-canvas-muted text-text-muted">
                          <AvatarIcon className="size-5" strokeWidth={2} />
                        </span>
                      )}
                      <span className="font-semibold text-text-main">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-text-main">
                      <RoleIcon
                        className="size-4 shrink-0 text-text-muted"
                        strokeWidth={2.2}
                        aria-hidden
                      />
                      {STAFF_ROLE_LABELS[member.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-text-main tabular-nums">
                      {member.pin || "••••"}
                      {member.sharedPin && (
                        <Share2
                          className="size-3.5 text-terracotta-400"
                          strokeWidth={2.2}
                          aria-label="PIN compartido"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        member.active
                          ? "bg-toast-green-soft text-toast-green"
                          : "bg-canvas-muted text-text-muted"
                      }`}
                    >
                      {member.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(member);
                          setModalOpen(true);
                        }}
                        className="cursor-pointer rounded-lg bg-latte-100 px-3 py-1.5 text-xs font-bold text-latte-500 ring-1 ring-latte-300 transition-transform active:scale-95"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setToToggle(member)}
                        className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-transform active:scale-95 ${
                          member.active
                            ? "bg-terracotta-100 text-terracotta-400"
                            : "bg-toast-green-soft text-toast-green"
                        }`}
                      >
                        {member.active ? "Desactivar" : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <StaffFormModal
        open={modalOpen}
        staff={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          void refreshStaff();
          onFeedback(
            editing ? "Empleado actualizado." : "Empleado creado.",
            "green",
          );
        }}
        onError={(message) => onFeedback(message, "red")}
      />

      <ConfirmModal
        open={Boolean(toToggle)}
        tone="terracotta"
        title={
          toToggle?.active
            ? `¿Desactivar a ${toToggle.name}?`
            : `¿Reactivar a ${toToggle?.name ?? ""}?`
        }
        description={
          toToggle?.active
            ? "Dejará de poder iniciar sesión con su PIN. No se elimina del historial."
            : "Volverá a poder acceder a su panel con el PIN asignado."
        }
        confirmLabel={toToggle?.active ? "Desactivar" : "Reactivar"}
        cancelLabel="Cancelar"
        onCancel={() => setToToggle(null)}
        onConfirm={() => void confirmToggle()}
      />
    </div>
  );
};
