import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpNarrowWide,
  Eye,
  EyeOff,
  Funnel,
  FunnelX,
  ImageOff,
  Pencil,
  Plus,
  Search,
  UtensilsCrossed,
} from "lucide-react";
import { mediaUrl } from "../../config/api";
import { updateDish } from "../../services/menuAdminService";
import { getMenu } from "../../services/orderService";
import { SOCKET_EVENTS } from "../../services/socketEvents";
import { useSocketRefresh } from "../../hooks/useSocketRefresh";
import type { Category, Dish } from "../../types/menu";
import { formatEuro } from "../../utils/money";
import { LoadErrorState } from "../ui/LoadErrorState";
import { AdminSelect } from "./AdminSelect";
import { CategoryPill } from "./CategoryPill";
import { DishFormModal } from "./DishFormModal";

type AvailabilityFilter = "all" | "visible" | "hidden";
type SortKey = "name" | "price" | "category";
type SortDir = "asc" | "desc";

/**
 * Gestión de carta: listado filtrable con alta, edición y ocultar/mostrar.
 */
export const AdminMenuPanel = ({
  onFeedback,
}: {
  onFeedback: (message: string, tone: "green" | "red") => void;
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  /** Recarga categorías y platos tras crear o editar. */
  const refreshMenu = async () => {
    try {
      const menu = await getMenu();
      setCategories(menu.categories);
      setDishes(menu.dishes);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadMenu = async () => {
      try {
        const menu = await getMenu();
        if (cancelled) return;
        setCategories(menu.categories);
        setDishes(menu.dishes);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadMenu();
    return () => {
      cancelled = true;
    };
  }, []);

  useSocketRefresh([SOCKET_EVENTS.MENU_UPDATED], () => {
    void refreshMenu();
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = dishes.filter((dish) => {
      if (categoryFilter !== "ALL" && dish.category !== categoryFilter) {
        return false;
      }
      if (availability === "visible" && !dish.isAvailable) return false;
      if (availability === "hidden" && dish.isAvailable) return false;
      if (q && !dish.name.toLowerCase().includes(q)) return false;
      return true;
    });

    const categoryLabel = (id: string) =>
      categories.find((c) => c.id === id)?.label ?? id;

    const direction = sortDir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      if (sortKey === "price") return (a.price - b.price) * direction;
      if (sortKey === "category") {
        return (
          categoryLabel(a.category).localeCompare(
            categoryLabel(b.category),
            "es",
          ) * direction
        );
      }
      return a.name.localeCompare(b.name, "es") * direction;
    });
  }, [dishes, categories, query, categoryFilter, availability, sortKey, sortDir]);

  const filtersActive =
    query.trim() !== "" || categoryFilter !== "ALL" || availability !== "all";

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const sortHeader = (key: SortKey, label: string) => {
    const active = sortKey === key;
    const Icon = !active
      ? ArrowUpDown
      : sortDir === "asc"
        ? ArrowUpNarrowWide
        : ArrowDownWideNarrow;
    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className={`inline-flex cursor-pointer items-center gap-1.5 font-bold uppercase ${
          active ? "text-terracotta-400" : "text-text-main"
        }`}
      >
        {label}
        <Icon className="size-3.5" strokeWidth={2.4} aria-hidden />
      </button>
    );
  };

  const toggleAvailability = async (dish: Dish) => {
    setBusyId(dish.id);
    try {
      const updated = await updateDish(dish.id, {
        isAvailable: !dish.isAvailable,
      });
      setDishes((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      onFeedback(
        updated.isAvailable
          ? `${updated.name} vuelve a estar visible.`
          : `${updated.name} se ha ocultado de la carta.`,
        "green",
      );
    } catch (err) {
      onFeedback(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar la visibilidad.",
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
      <LoadErrorState
        icon={UtensilsCrossed}
        title="No se pudo cargar la carta"
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-main">Carta</h1>
          <p className="mt-1 text-sm text-text-muted">
            Alta, edición y visibilidad de platos y bebidas.
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
          Añadir plato
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-100" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar plato…"
            className="w-full rounded-full border-0 bg-canvas-white py-2 pr-3 pl-9 text-sm text-text-main shadow-sm outline-none ring-1 ring-slate-50"
          />
        </label>
        <AdminSelect
          ariaLabel="Filtrar por categoría"
          value={categoryFilter}
          active={categoryFilter !== "ALL"}
          onChange={setCategoryFilter}
          options={[
            { value: "ALL", label: "Todas las categorías" },
            ...categories.map((cat) => ({
              value: cat.id,
              label: cat.label,
              pillSlug: cat.id,
            })),
          ]}
        />
        <AdminSelect
          ariaLabel="Filtrar por estado"
          value={availability}
          active={availability !== "all"}
          onChange={(value) => setAvailability(value as AvailabilityFilter)}
          options={[
            { value: "all", label: "Todos los estados" },
            { value: "visible", label: "Visibles" },
            { value: "hidden", label: "Ocultos" },
          ]}
        />
        <button
          type="button"
          aria-label={filtersActive ? "Quitar filtros" : "Sin filtros"}
          disabled={!filtersActive}
          onClick={() => {
            setQuery("");
            setCategoryFilter("ALL");
            setAvailability("all");
          }}
          className={`flex size-9 cursor-pointer items-center justify-center rounded-lg shadow-sm ring-1 transition-transform active:scale-95 disabled:cursor-default disabled:active:scale-100 ${
            filtersActive
              ? "bg-terracotta-100 text-terracotta-400 ring-terracotta-200"
              : "bg-canvas-white text-text-muted ring-slate-50"
          }`}
        >
          {filtersActive ? (
            <FunnelX className="size-4" strokeWidth={2.2} />
          ) : (
            <Funnel className="size-4" strokeWidth={2.2} />
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-canvas-white shadow-sm ring-1 ring-slate-50">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="sticky top-0 bg-canvas-white text-sm font-bold tracking-wide text-text-main uppercase">
            <tr className="border-b border-slate-50">
              <th className="px-4 py-3">{sortHeader("name", "Plato")}</th>
              <th className="px-4 py-3">{sortHeader("category", "Categoría")}</th>
              <th className="px-4 py-3">{sortHeader("price", "Precio")}</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-text-muted"
                >
                  No hay platos con esos filtros.
                </td>
              </tr>
            ) : (
              visible.map((dish) => {
                const categoryLabel =
                  categories.find((c) => c.id === dish.category)?.label ??
                  dish.category;
                return (
                  <tr
                    key={dish.id}
                    className="border-b border-slate-50 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {dish.imageUrl ? (
                          <img
                            src={mediaUrl(dish.imageUrl)}
                            alt=""
                            className="size-11 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-canvas-muted text-slate-100">
                            <ImageOff className="size-4" />
                          </span>
                        )}
                        <span className="font-semibold text-text-main">
                          {dish.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CategoryPill slug={dish.category} label={categoryLabel} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-main tabular-nums">
                      {formatEuro(dish.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          dish.isAvailable
                            ? "bg-toast-green-soft text-toast-green"
                            : "bg-toast-red-soft text-toast-red"
                        }`}
                      >
                        {dish.isAvailable ? "Visible" : "Oculto"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label="Editar"
                          onClick={() => {
                            setEditing(dish);
                            setModalOpen(true);
                          }}
                          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-canvas-muted hover:text-text-main"
                        >
                          <Pencil className="size-4" strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          aria-label={
                            dish.isAvailable ? "Ocultar plato" : "Mostrar plato"
                          }
                          disabled={busyId === dish.id}
                          onClick={() => void toggleAvailability(dish)}
                          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-canvas-muted hover:text-text-main disabled:opacity-50"
                        >
                          {dish.isAvailable ? (
                            <EyeOff className="size-4" strokeWidth={2.2} />
                          ) : (
                            <Eye className="size-4" strokeWidth={2.2} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <DishFormModal
        open={modalOpen}
        dish={editing}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          void refreshMenu();
          onFeedback(
            editing ? "Plato actualizado." : "Plato añadido a la carta.",
            "green",
          );
        }}
        onError={(message) => onFeedback(message, "red")}
      />
    </div>
  );
};
