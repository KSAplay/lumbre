import { useEffect, useState } from "react";
import { User, UserRound } from "lucide-react";
import { mediaUrl } from "../../config/api";
import { STAFF_ROLE_LABELS, STAFF_ROLE_OPTIONS } from "../../constants/staffRoles";
import type { StaffRole } from "../../services/authService";
import {
  createStaff,
  updateStaff,
  uploadStaffPhoto,
} from "../../services/staffService";
import type { StaffGender, StaffMember } from "../../types/staff";
import { AdminDialog } from "./AdminDialog";
import { AdminSelect } from "./AdminSelect";
import { ImageDropZone } from "./ImageDropZone";

type StaffFormModalProps = {
  open: boolean;
  staff: StaffMember | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
};

const fieldClass =
  "w-full rounded-lg border-0 bg-canvas-muted px-3 py-2.5 text-sm text-text-main outline-none ring-1 ring-slate-50 focus:ring-2 focus:ring-terracotta-200";

/**
 * Modal para crear o editar un empleado y su PIN de acceso.
 */
export const StaffFormModal = ({
  open,
  staff,
  onClose,
  onSaved,
  onError,
}: StaffFormModalProps) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("camarero");
  const [gender, setGender] = useState<StaffGender>("hombre");
  const [pin, setPin] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formKey = open ? (staff?.id ?? "new") : "";
  const [appliedKey, setAppliedKey] = useState("");

  if (formKey && formKey !== appliedKey) {
    setAppliedKey(formKey);
    setName(staff?.name ?? "");
    setRole(staff?.role ?? "camarero");
    setGender(staff?.gender ?? "hombre");
    setPin("");
    setFile(null);
    setPreview(staff?.imageUrl ? mediaUrl(staff.imageUrl) : null);
  }

  if (!open && appliedKey) {
    setAppliedKey("");
  }

  const isKitchen = role === "cocina";
  const pinRequired = !staff || (staff.role === "cocina" && role !== "cocina");

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      onError("El nombre es obligatorio.");
      return;
    }
    if (pin && !/^\d{4}$/.test(pin)) {
      onError("El PIN debe tener 4 dígitos.");
      return;
    }
    if (pinRequired && !pin) {
      onError("Indica un PIN de 4 dígitos.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmed,
        role,
        gender,
        ...(pin ? { pin } : {}),
      };
      const saved = staff
        ? await updateStaff(staff.id, payload)
        : await createStaff(payload);
      if (file) {
        await uploadStaffPhoto(saved.id, file);
      }
      onSaved();
      onClose();
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "No se pudo guardar el empleado.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDialog
      open={open}
      title={staff ? "Editar empleado" : "Nuevo empleado"}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-canvas-muted px-4 py-2 text-sm font-bold text-text-muted transition-transform active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="cursor-pointer rounded-lg bg-terracotta-400 px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-btn-disabled-bg disabled:text-btn-disabled-text"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ImageDropZone
          previewUrl={preview}
          hint="Foto opcional. Si no hay, se usa el icono de género."
          shape="circle"
          emptyIcon={gender === "mujer" ? UserRound : User}
          onFile={setFile}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            Nombre
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            maxLength={60}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
              Rol
            </span>
            <AdminSelect
              ariaLabel="Rol"
              value={role}
              onChange={(value) => setRole(value as StaffRole)}
              options={STAFF_ROLE_OPTIONS.map((option) => ({
                value: option,
                label: STAFF_ROLE_LABELS[option],
              }))}
            />
          </label>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
              Género
            </legend>
            <div className="flex gap-2 pt-1">
              {(["hombre", "mujer"] as const).map((value) => (
                <label
                  key={value}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-sm font-bold ring-1 transition-colors ${
                    gender === value
                      ? "bg-terracotta-100 text-terracotta-400 ring-terracotta-200"
                      : "bg-canvas-muted text-text-muted ring-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="staff-gender"
                    value={value}
                    checked={gender === value}
                    onChange={() => setGender(value)}
                    className="sr-only"
                  />
                  {value === "hombre" ? "Hombre" : "Mujer"}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            PIN de 4 dígitos
          </span>
          <input
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder={staff ? "Dejar vacío para no cambiar" : "0000"}
            className={fieldClass}
          />
          <span className="text-[11px] text-text-muted">
            {isKitchen
              ? "Los cocineros comparten el mismo PIN del monitor KDS."
              : "PIN individual para acceder a su panel."}
          </span>
        </label>
      </div>
    </AdminDialog>
  );
};
