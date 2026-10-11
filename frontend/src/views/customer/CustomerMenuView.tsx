import { useState } from "react";
import { useParams } from "react-router";
import { ImageOff, Menu, Plus, Search } from "lucide-react";
import { CATEGORIES, MOCK_DISHES } from "../../data/mockDishes";
import type { CategoryId, Dish } from "../../types/menu";

type SelectedCategory = CategoryId | "ALL";

const formatPrice = (price: number) =>
  price.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });

export const CustomerMenuView = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const mesaLabel = `Mesa ${String(tableId ?? "01").padStart(2, "0")}`;

  // Datos temporales de carta
  // TODO: Sustituir MOCK_DISHES por la respuesta del API cuando el backend esté conectado.
  const query = searchQuery.trim().toLowerCase();
  const filteredDishes = MOCK_DISHES.filter((dish) => {
    const matchesCategory =
      selectedCategory === "ALL" || dish.category === selectedCategory;
    const matchesSearch =
      query.length === 0 || dish.name.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  const dishesByCategory = CATEGORIES.map((category) => ({
    category,
    dishes: filteredDishes.filter((dish) => dish.category === category.id),
  })).filter((group) => group.dishes.length > 0);

  const categoryTabs: {
    id: SelectedCategory;
    label?: string;
    ariaLabel?: string;
  }[] = [
    { id: "ALL", ariaLabel: "Todas las categorías" },
    ...CATEGORIES.map(({ id, label }) => ({ id, label })),
  ];

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas-dim font-sans text-text-main lg:p-6">
      {/* Marco: pantalla completa en móvil/tablet; en desktop se limita al tamaño tablet */}
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-canvas lg:h-[min(90dvh,1024px)] lg:w-full lg:max-w-3xl lg:rounded-2xl lg:shadow-xl">
        <div className="mx-auto flex h-full w-full flex-col gap-4 p-5 md:mx-auto md:max-w-2xl md:gap-5 md:px-8 md:py-6 lg:max-w-none lg:px-8">
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-text-main md:text-3xl">
              Menú
            </h1>
            <span className="rounded-full border bg-cacao-300 px-3 py-1 text-sm font-medium text-white md:px-4 md:text-base">
              {mesaLabel}
            </span>
          </header>

          {/* Buscador */}
          <div className="relative w-full shrink-0">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-full border-0 bg-canvas-white py-3 pr-11 pl-4 text-sm text-text-main shadow-sm placeholder:text-text-muted outline-none md:py-3.5 md:text-base"
            />
            <Search
              className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
          </div>

          {/* Categorías */}
          <div
            className="flex shrink-0 gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Categorías"
          >
            {categoryTabs.map((tab) => {
              const isActive = selectedCategory === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.ariaLabel}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`h-7 shrink-0 rounded-full text-sm font-bold whitespace-nowrap shadow-sm transition-colors md:h-8 md:text-base ${
                    tab.id === "ALL" ? "px-2.5" : "px-4"
                  } ${
                    isActive
                      ? "bg-latte-400 text-white"
                      : "bg-canvas-white text-text-main"
                  }`}
                >
                  {tab.id === "ALL" ? <Menu className="size-5" /> : tab.label}
                </button>
              );
            })}
          </div>

          {/* Lista de platos */}
          <section className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-none] [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col gap-4">
              {dishesByCategory.map(({ category, dishes }) => (
                <div key={category.id} className="flex flex-col gap-2">
                  <h2 className="text-base font-bold text-text-main md:text-lg">
                    {category.label}
                  </h2>

                  <ul className="flex flex-col gap-3">
                    {dishes.map((dish) => (
                      <DishCard key={dish.id} dish={dish} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Componente para la tarjeta de plato
const DishCard = ({
  dish,
  imageFallbackBg = "bg-canvas-muted",
  imageFallbackIcon = "text-slate-100",
}: {
  dish: Dish;
  imageFallbackBg?: string;
  imageFallbackIcon?: string;
}) => {
  const [imageFailed, setImageFailed] = useState(!dish.imageUrl);

  return (
    <li className="flex h-18.5 overflow-hidden rounded-[9px] bg-canvas-white shadow-sm">
      {/* Imagen */}
      {imageFailed ? (
        <div
          className={`flex h-full w-25 shrink-0 items-center justify-center ${imageFallbackBg}`}
          aria-hidden
        >
          <ImageOff className={`size-7 ${imageFallbackIcon}`} />
        </div>
      ) : (
        <img
          src={dish.imageUrl}
          alt=""
          onError={() => setImageFailed(true)}
          className="h-full w-25 shrink-0 object-cover"
        />
      )}

      {/* Nombre y precio */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2">
        <h3 className="truncate text-[13px] font-bold text-text-main">
          {dish.name}
        </h3>
        <p className="text-[14px] font-black text-text-main">
          {formatPrice(dish.price)}
        </p>
      </div>

      {/* Botón de añadir */}
      <button
        type="button"
        aria-label={`Añadir ${dish.name}`}
        className="flex h-full w-7.5 shrink-0 items-center justify-center bg-terracotta-300 text-white transition-colors active:bg-terracotta-400"
      >
        <Plus className="size-5 stroke-3" />
      </button>
    </li>
  );
};
