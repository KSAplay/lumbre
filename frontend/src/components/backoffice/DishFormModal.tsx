import { useEffect, useState } from "react";
import { mediaUrl } from "../../config/api";
import {
  createDish,
  updateDish,
  uploadDishImage,
} from "../../services/menuAdminService";
import type { Category, Dish } from "../../types/menu";
import { AdminDialog } from "./AdminDialog";
import { AdminSelect } from "./AdminSelect";
import { ImageDropZone } from "./ImageDropZone";

type DishFormModalProps = {
  open: boolean;
  dish: Dish | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
};

const fieldClass =
  "w-full rounded-lg border-0 bg-canvas-muted px-3 py-2.5 text-sm text-text-main outline-none ring-1 ring-slate-50 focus:ring-2 focus:ring-terracotta-200";

/**
 * Modal para crear o editar un plato de la carta.
 */
export const DishFormModal = ({
  open,
  dish,
  categories,
  onClose,
  onSaved,
  onError,
}: DishFormModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formKey = open ? String(dish?.id ?? "new") : "";
  const [appliedKey, setAppliedKey] = useState("");

  if (formKey && formKey !== appliedKey) {
    setAppliedKey(formKey);
    setName(dish?.name ?? "");
    setDescription(dish?.description ?? "");
    setPrice(dish ? String(dish.price) : "");
    setCategory(dish?.category ?? categories[0]?.id ?? "");
    setFile(null);
    setPreview(dish?.imageUrl ? mediaUrl(dish.imageUrl) : null);
  }

  if (!open && appliedKey) {
    setAppliedKey("");
  }

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedPrice = Number(price.replace(",", "."));
    if (!trimmedName || !trimmedDescription || !category) {
      onError("Completa nombre, descripción y categoría.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      onError("El precio no es válido.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        description: trimmedDescription,
        price: parsedPrice,
        category,
      };
      const saved = dish
        ? await updateDish(dish.id, payload)
        : await createDish(payload);
      if (file) {
        await uploadDishImage(saved.id, file);
      }
      onSaved();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo guardar el plato.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDialog
      open={open}
      title={dish ? "Editar plato" : "Añadir plato"}
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
          hint="Recomendado 800×800 px (PNG, JPEG o WebP)"
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
            maxLength={80}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            Descripción
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${fieldClass} min-h-20 resize-y`}
            maxLength={280}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
              Precio (€)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={fieldClass}
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
              Categoría
            </span>
            <AdminSelect
              ariaLabel="Categoría"
              value={category}
              onChange={setCategory}
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.label,
                pillSlug: cat.id,
              }))}
            />
          </div>
        </div>
      </div>
    </AdminDialog>
  );
};
