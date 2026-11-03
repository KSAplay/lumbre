import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { LoadErrorState } from "../ui/LoadErrorState";
import { CategoryPill } from "./CategoryPill";
import {
  createCategory,
  listAdminCategories,
  updateCategory,
} from "../../services/menuAdminService";
import { getSettings, updateSettings } from "../../services/settingsService";
import { setKitchenPin } from "../../services/staffService";
import { SOCKET_EVENTS } from "../../services/socketEvents";
import { useSocketRefresh } from "../../hooks/useSocketRefresh";
import type { AdminCategory } from "../../types/admin";

const fieldClass =
  "w-full rounded-lg border-0 bg-canvas-muted px-3 py-2.5 text-sm text-text-main outline-none ring-1 ring-slate-50 focus:ring-2 focus:ring-terracotta-200";

/**
 * Ajustes generales: nombre del restaurante, PIN de cocina y categorías.
 */
export const AdminSettingsPanel = ({
  onFeedback,
}: {
  onFeedback: (message: string, tone: "green" | "red") => void;
}) => {
  const [restaurantName, setRestaurantName] = useState("");
  const [kitchenPin, setKitchenPinValue] = useState("");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [settings, cats] = await Promise.all([
          getSettings(),
          listAdminCategories(),
        ]);
        if (cancelled) return;
        setRestaurantName(settings.restaurantName);
        setCategories(cats);
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

  const refreshCategories = useCallback(async () => {
    try {
      setCategories(await listAdminCategories());
    } catch {
      /* el siguiente evento reintenta */
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const settings = await getSettings();
      setRestaurantName(settings.restaurantName);
    } catch {
      /* el siguiente evento reintenta */
    }
  }, []);

  useSocketRefresh([SOCKET_EVENTS.MENU_UPDATED], () => {
    void refreshCategories();
  });
  useSocketRefresh([SOCKET_EVENTS.SETTINGS_UPDATED], () => {
    void refreshSettings();
  });

  const saveName = async () => {
    const name = restaurantName.trim();
    if (!name) {
      onFeedback("El nombre no puede estar vacío.", "red");
      return;
    }
    setSavingName(true);
    try {
      const saved = await updateSettings(name);
      setRestaurantName(saved.restaurantName);
      onFeedback("Nombre del restaurante actualizado.", "green");
    } catch (err) {
      onFeedback(
        err instanceof Error ? err.message : "No se pudo guardar el nombre.",
        "red",
      );
    } finally {
      setSavingName(false);
    }
  };

  const saveKitchenPin = async () => {
    if (!/^\d{4}$/.test(kitchenPin)) {
      onFeedback("El PIN de cocina debe tener 4 dígitos.", "red");
      return;
    }
    setSavingPin(true);
    try {
      await setKitchenPin(kitchenPin);
      setKitchenPinValue("");
      onFeedback("PIN de cocina actualizado.", "green");
    } catch (err) {
      onFeedback(
        err instanceof Error ? err.message : "No se pudo cambiar el PIN.",
        "red",
      );
    } finally {
      setSavingPin(false);
    }
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const created = await createCategory(name);
      setCategories((prev) => [...prev, created]);
      setNewCategory("");
      onFeedback("Categoría creada.", "green");
    } catch (err) {
      onFeedback(
        err instanceof Error ? err.message : "No se pudo crear la categoría.",
        "red",
      );
    }
  };

  const toggleCategory = async (category: AdminCategory) => {
    try {
      const updated = await updateCategory(category.id, {
        active: !category.active,
      });
      setCategories((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      onFeedback(
        err instanceof Error ? err.message : "No se pudo actualizar la categoría.",
        "red",
      );
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 rounded-lg bg-canvas-white ring-1 ring-slate-50" />
        <div className="h-40 rounded-lg bg-canvas-white ring-1 ring-slate-50" />
      </div>
    );
  }

  if (error) {
    return (
      <LoadErrorState icon={Settings} title="No se pudo cargar la configuración" />
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <header>
        <h1 className="text-xl font-bold text-text-main">Configuración</h1>
        <p className="mt-1 text-sm text-text-muted">
          Datos generales del restaurante y de la carta.
        </p>
      </header>

      <section className="rounded-lg bg-canvas-white p-5 shadow-sm ring-1 ring-slate-50">
        <h2 className="text-sm font-bold text-text-main">Restaurante</h2>
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            Nombre
          </span>
          <input
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className={fieldClass}
            maxLength={60}
          />
        </label>
        <button
          type="button"
          disabled={savingName}
          onClick={() => void saveName()}
          className="mt-3 cursor-pointer rounded-lg bg-terracotta-400 px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
        >
          Guardar nombre
        </button>
      </section>

      <section className="rounded-lg bg-canvas-white p-5 shadow-sm ring-1 ring-slate-50">
        <h2 className="text-sm font-bold text-text-main">PIN de cocina</h2>
        <p className="mt-1 text-sm text-text-muted">
          PIN compartido del monitor KDS. Cualquier cocinero inicia el día con
          el mismo código.
        </p>
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            Nuevo PIN
          </span>
          <input
            inputMode="numeric"
            maxLength={4}
            value={kitchenPin}
            onChange={(e) =>
              setKitchenPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="••••"
            className={fieldClass}
          />
        </label>
        <button
          type="button"
          disabled={savingPin}
          onClick={() => void saveKitchenPin()}
          className="mt-3 cursor-pointer rounded-lg bg-cacao-300 px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
        >
          Actualizar PIN
        </button>
      </section>

      <section className="rounded-lg bg-canvas-white p-5 shadow-sm ring-1 ring-slate-50">
        <h2 className="text-sm font-bold text-text-main">Categorías de carta</h2>
        <ul className="mt-3 divide-y divide-slate-50">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div>
                <CategoryPill slug={category.id} label={category.label} />
              </div>
              <button
                type="button"
                onClick={() => void toggleCategory(category)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-transform active:scale-95 ${
                  category.active
                    ? "bg-toast-green-soft text-toast-green"
                    : "bg-canvas-muted text-text-muted"
                }`}
              >
                {category.active ? "Activa" : "Oculta"}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nueva categoría"
            className={fieldClass}
            maxLength={40}
          />
          <button
            type="button"
            onClick={() => void addCategory()}
            className="shrink-0 cursor-pointer rounded-lg bg-terracotta-400 px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95"
          >
            Añadir
          </button>
        </div>
      </section>
    </div>
  );
};
