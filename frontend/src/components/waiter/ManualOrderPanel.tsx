import { useEffect, useState } from "react";
import {
  ImageOff,
  LoaderCircle,
  Menu,
  Minus,
  Plus,
  Search,
  SendHorizontal,
  SquareText,
  UtensilsCrossed,
} from "lucide-react";
import { mediaUrl } from "../../config/api";
import { TABLE_STATUS_DOT } from "../../constants/tableStatus";
import { formatTableLabel } from "../../utils/mockHydrate";
import { getMenu } from "../../services/orderService";
import { sendManualOrder } from "../../services/waiterService";
import type { Category, CategoryId, Dish } from "../../types/menu";
import type { TableNodeData } from "../../types/table";
import type { WaiterOrderLine } from "../../types/waiter";
import { ConfirmModal } from "../ui/ConfirmModal";
import { LoadErrorState } from "../ui/LoadErrorState";
import { MarqueeText } from "../ui/MarqueeText";
import { useToast } from "../ui/useToast";
import {
  CompactDishListSkeleton,
  TableChipsSkeleton,
} from "./WaiterSkeletons";

type ManualOrderPanelProps = {
  /** Mesas en las que se puede pedir (ocupadas) */
  tables: TableNodeData[];
  /** La sala aún se está cargando */
  tablesLoading?: boolean;
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  /** Se llama cuando el servidor acepta la comanda */
  onOrderSent: (tableId: string) => void;
};

type SelectedCategory = CategoryId | "ALL";

const NOTE_MAX_CHARS = 160;

const formatPrice = (price: number) =>
  price.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });

const tableLabelOf = (table: TableNodeData) => formatTableLabel(table.number);

export const ManualOrderPanel = ({
  tables,
  tablesLoading = false,
  selectedTableId,
  onSelectTable,
  onOrderSent,
}: ManualOrderPanelProps) => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [lines, setLines] = useState<WaiterOrderLine[]>([]);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? null;
  const unitCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const canSend = Boolean(selectedTable) && lines.length > 0 && !sending;

  useEffect(() => {
    let cancelled = false;

    const loadMenu = async () => {
      setMenuLoading(true);
      setMenuError(false);
      try {
        const data = await getMenu();
        if (cancelled) return;
        setCategories(data.categories);
        setDishes(data.dishes.filter((dish) => dish.isAvailable));
      } catch {
        if (!cancelled) setMenuError(true);
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    };

    void loadMenu();
    return () => {
      cancelled = true;
    };
  }, []);

  const quantityOf = (dishId: number) =>
    lines.find((line) => line.dishId === dishId)?.quantity ?? 0;

  const addDish = (dish: Dish) => {
    setLines((prev) => {
      if (prev.some((line) => line.dishId === dish.id)) {
        return prev.map((line) =>
          line.dishId === dish.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        { dishId: dish.id, name: dish.name, quantity: 1, price: dish.price },
      ];
    });
  };

  const removeDish = (dishId: number) => {
    setLines((prev) =>
      prev
        .map((line) =>
          line.dishId === dishId
            ? { ...line, quantity: line.quantity - 1 }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const handleConfirmSend = async () => {
    setConfirmOpen(false);
    if (!selectedTable || lines.length === 0 || sending) return;
    setSending(true);

    const tableLabel = tableLabelOf(selectedTable);
    try {
      await sendManualOrder(selectedTable.id, {
        tableId: selectedTable.id,
        tableLabel,
        note: note.trim() || undefined,
        items: lines,
        sentAt: new Date().toISOString(),
      });
      // TODO: emitir la comanda manual a cocina por Socket.io para que aparezca en el KDS
      setLines([]);
      setNote("");
      setNoteOpen(false);
      onOrderSent(selectedTable.id);
      showToast({
        message: `Comanda enviada a cocina · ${tableLabel}`,
        icon: <SendHorizontal className="size-4" strokeWidth={2.5} />,
        tone: "green",
      });
    } catch {
      showToast({
        message: "No se pudo enviar la comanda. Inténtalo otra vez.",
        tone: "red",
      });
    } finally {
      setSending(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredDishes = dishes.filter(
    (dish) =>
      (selectedCategory === "ALL" || dish.category === selectedCategory) &&
      (query.length === 0 || dish.name.toLowerCase().includes(query)),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4 md:px-6 md:pt-5">
        {/* Mesa */}
        <div className="shrink-0">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            Mesa
          </p>
          {tablesLoading ? (
            <TableChipsSkeleton />
          ) : tables.length === 0 ? (
            <p className="rounded-lg bg-canvas-white px-3 py-2.5 text-[13px] text-text-muted shadow-sm">
              No hay mesas ocupadas. Recepción debe sentar a los comensales.
            </p>
          ) : (
            <div
              className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-none] [&::-webkit-scrollbar]:hidden"
              role="radiogroup"
              aria-label="Mesa de la comanda"
            >
              {tables.map((table) => {
                const active = table.id === selectedTableId;
                return (
                  <button
                    key={table.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onSelectTable(table.id)}
                    className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold whitespace-nowrap shadow-sm transition-transform active:scale-95 ${
                      active
                        ? "bg-cacao-300 text-white"
                        : "bg-canvas-white text-text-main"
                    }`}
                  >
                    <span
                      className={`size-2.5 rounded-full ring-2 ring-white/60 ${TABLE_STATUS_DOT[table.status]}`}
                    />
                    {tableLabelOf(table)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Buscador */}
        <div className="relative shrink-0">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar plato..."
            className="w-full rounded-full border-0 bg-canvas-white py-2.5 pr-11 pl-4 text-sm text-text-main shadow-sm outline-none placeholder:text-text-muted"
          />
          <Search
            className="pointer-events-none absolute top-1/2 right-4 size-4.5 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
        </div>

        {/* Categorías */}
        <div
          className="flex shrink-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Categorías"
        >
          {[{ id: "ALL" as const, label: "" }, ...categories].map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={tab.id === "ALL" ? "Todas las categorías" : undefined}
                onClick={() => setSelectedCategory(tab.id)}
                className={`h-7 shrink-0 cursor-pointer rounded-full text-[13px] font-bold whitespace-nowrap shadow-sm transition-transform active:scale-95 ${
                  tab.id === "ALL" ? "px-2.5" : "px-4"
                } ${
                  active
                    ? "bg-latte-400 text-white"
                    : "bg-canvas-white text-text-main"
                }`}
              >
                {tab.id === "ALL" ? (
                  <Menu className="size-4.5" strokeWidth={2.6} />
                ) : (
                  tab.label
                )}
              </button>
            );
          })}
        </div>

        {/* Platos */}
        <section
          className="min-h-0 flex-1 overflow-y-auto pb-3 [-ms-overflow-style:none] [scrollbar-none] [&::-webkit-scrollbar]:hidden"
          aria-busy={menuLoading}
        >
          {menuLoading ? (
            <CompactDishListSkeleton />
          ) : menuError ? (
            <LoadErrorState
              icon={UtensilsCrossed}
              title="No se pudo cargar la carta"
              className="min-h-40"
            />
          ) : filteredDishes.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center">
              <UtensilsCrossed
                className="size-12 text-text-main"
                strokeWidth={1.4}
              />
              <p className="text-sm font-bold text-text-main">
                Sin resultados
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredDishes.map((dish) => (
                <CompactDishRow
                  key={dish.id}
                  dish={dish}
                  quantity={quantityOf(dish.id)}
                  onAdd={() => addDish(dish)}
                  onRemove={() => removeDish(dish.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Resumen y envío */}
      <div className="shrink-0 rounded-t-[20px] bg-canvas-white px-4 pt-3 pb-4 shadow-[0_-6px_18px_rgba(43,44,52,0.08)] md:px-6">
        {noteOpen && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_CHARS))}
            placeholder="Nota para cocina (alergias, puntos, etc.)"
            rows={2}
            maxLength={NOTE_MAX_CHARS}
            className="mb-2.5 w-full resize-none rounded-[9px] border-0 bg-latte-200 px-3 py-2 text-sm text-text-main outline-none placeholder:text-slate-100"
          />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNoteOpen((prev) => !prev)}
            aria-pressed={noteOpen}
            aria-label={noteOpen ? "Ocultar nota" : "Añadir nota"}
            className={`relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[9px] transition-transform active:scale-95 ${
              noteOpen
                ? "bg-latte-400 text-white"
                : "bg-latte-100 text-latte-500 ring-1 ring-latte-300"
            }`}
          >
            <SquareText className="size-5" />
            {!noteOpen && note.trim().length > 0 && (
              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-terracotta-300 ring-2 ring-canvas-white" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-text-muted">
              {selectedTable ? tableLabelOf(selectedTable) : "Elige una mesa"} ·{" "}
              {unitCount} {unitCount === 1 ? "plato" : "platos"}
            </p>
            <p className="text-lg leading-tight font-black text-text-main">
              {formatPrice(total)}
            </p>
          </div>

          <button
            type="button"
            disabled={!canSend}
            onClick={() => setConfirmOpen(true)}
            className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-[9px] px-4 text-[13px] font-bold shadow-sm ${
              sending
                ? "cursor-wait bg-terracotta-200 text-white"
                : canSend
                  ? "cursor-pointer bg-terracotta-400 text-white transition-transform active:scale-[0.98]"
                  : "cursor-not-allowed bg-btn-disabled-bg text-btn-disabled-text"
            }`}
          >
            {sending ? (
              <LoaderCircle
                className="size-5 animate-spin"
                strokeWidth={2.5}
                aria-label="Enviando comanda"
              />
            ) : (
              <>
                <SendHorizontal className="size-4" />
                Enviar a cocina
              </>
            )}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        tone="terracotta"
        icon={<SendHorizontal className="size-8" strokeWidth={2} />}
        title="¿Enviar a cocina?"
        description={`La comanda de ${
          selectedTable ? tableLabelOf(selectedTable) : "la mesa"
        } (${unitCount} ${unitCount === 1 ? "plato" : "platos"}) irá directa al KDS.`}
        confirmLabel="Enviar"
        cancelLabel="Revisar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSend}
      />
    </div>
  );
};

const CompactDishRow = ({
  dish,
  quantity,
  onAdd,
  onRemove,
}: {
  dish: Dish;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) => {
  const [imageFailed, setImageFailed] = useState(!dish.imageUrl);
  const hasQuantity = quantity > 0;

  return (
    <li
      className={`flex h-14 items-center gap-3 overflow-hidden rounded-[9px] bg-canvas-white pr-2 shadow-sm ring-2 transition-colors ${
        hasQuantity ? "ring-latte-300" : "ring-transparent"
      }`}
    >
      {imageFailed ? (
        <div
          className="flex h-full w-14 shrink-0 items-center justify-center bg-canvas-muted"
          aria-hidden
        >
          <ImageOff className="size-5 text-slate-100" />
        </div>
      ) : (
        <img
          src={mediaUrl(dish.imageUrl)}
          alt=""
          onError={() => setImageFailed(true)}
          className="h-full w-14 shrink-0 object-cover"
        />
      )}

      <div className="min-w-0 flex-1">
        <MarqueeText
          text={dish.name}
          as="h3"
          className="text-[13px] font-bold text-text-main"
        />
        <p className="text-[13px] font-black text-text-muted">
          {formatPrice(dish.price)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {hasQuantity && (
          <>
            <button
              type="button"
              aria-label={`Quitar ${dish.name}`}
              onClick={onRemove}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-terracotta-400 text-white shadow-sm transition-transform active:scale-90"
            >
              <Minus className="size-4" strokeWidth={3} />
            </button>
            <span className="min-w-6 text-center text-sm font-bold text-text-main tabular-nums">
              {quantity}
            </span>
          </>
        )}
        <button
          type="button"
          aria-label={`Añadir ${dish.name}`}
          onClick={onAdd}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-terracotta-300 text-white shadow-sm transition-transform active:scale-90"
        >
          <Plus className="size-4" strokeWidth={3} />
        </button>
      </div>
    </li>
  );
};
