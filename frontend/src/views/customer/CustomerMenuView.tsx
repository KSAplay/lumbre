import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  ImageOff,
  LogOut,
  Maximize,
  Menu,
  Minimize,
  Minus,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import {
  CartSheet,
  type CartLine,
  type SentOrderPayload,
} from "../../components/customer/CartSheet";
import {
  OrdersHistorySheet,
  type SentOrder,
} from "../../components/customer/OrdersHistorySheet";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { MarqueeText } from "../../components/ui/MarqueeText";
import { mediaUrl } from "../../config/api";
import { getMenu, getTableRounds } from "../../services/orderService";
import type { Category, CategoryId, Dish } from "../../types/menu";

type SelectedCategory = CategoryId | "ALL";

const HISTORY_GUARD = { lumbreMenu: true as const };

const formatPrice = (price: number) =>
  price.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });

const armHistoryGuard = () => {
  window.history.pushState(HISTORY_GUARD, "", window.location.href);
};

const toggleMenuFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
  } catch {
    console.error("No se pudo entrar a pantalla completa");
  }
};

export const CustomerMenuView = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState(false);
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [sentOrders, setSentOrders] = useState<SentOrder[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [fabPressed, setFabPressed] = useState(false);
  const [ordersFabPressed, setOrdersFabPressed] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== "undefined" && !!document.fullscreenElement,
  );

  const leaveConfirmOpenRef = useRef(false);
  const isCartOpenRef = useRef(false);
  const isOrdersOpenRef = useRef(false);
  const allowExitRef = useRef(false);
  const cartBackHandlerRef = useRef<(() => boolean) | null>(null);
  const ordersBackHandlerRef = useRef<(() => boolean) | null>(null);

  const mesaLabel = `Mesa ${String(tableId ?? "01").padStart(2, "0")}`;
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    isCartOpenRef.current = isCartOpen;
  }, [isCartOpen]);

  useEffect(() => {
    isOrdersOpenRef.current = isOrdersOpen;
  }, [isOrdersOpen]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMenuAndRounds = async () => {
      setMenuLoading(true);
      setMenuError(false);

      try {
        const [menu, rounds] = await Promise.all([
          getMenu(),
          getTableRounds(tableId ?? ""),
        ]);
        if (cancelled) return;
        setCategories(menu.categories);
        setDishes(menu.dishes);
        setSentOrders(
          rounds.map((round) => ({
            id: round.id,
            number: round.number,
            sentAt: round.sentAt,
            status: round.status,
            note: round.note,
            items: round.items.map((item) => ({
              dishId: item.dishId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
          })),
        );
      } catch {
        if (!cancelled) setMenuError(true);
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    };

    void loadMenuAndRounds();
    return () => {
      cancelled = true;
    };
  }, [tableId]);

  /*
   * Candado simple: una sola entrada fantasma.
   * En cada atrás la reponemos y cerramos la capa UI de arriba.
   * Sin contar capas (eso fallaba en Chrome tras quedarme + carrito + confirm).
   */
  useEffect(() => {
    const state = window.history.state as { lumbreMenu?: boolean } | null;
    if (!state?.lumbreMenu) {
      armHistoryGuard();
    }

    const onPopState = () => {
      if (allowExitRef.current) return;

      armHistoryGuard();

      if (leaveConfirmOpenRef.current) {
        leaveConfirmOpenRef.current = false;
        setLeaveConfirmOpen(false);
        return;
      }

      if (isCartOpenRef.current) {
        if (cartBackHandlerRef.current?.()) return;
        setIsCartOpen(false);
        return;
      }

      if (isOrdersOpenRef.current) {
        if (ordersBackHandlerRef.current?.()) return;
        setIsOrdersOpen(false);
        return;
      }

      leaveConfirmOpenRef.current = true;
      setLeaveConfirmOpen(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const registerCartBackHandler = useCallback(
    (handler: (() => boolean) | null) => {
      cartBackHandlerRef.current = handler;
    },
    [],
  );

  const registerOrdersBackHandler = useCallback(
    (handler: (() => boolean) | null) => {
      ordersBackHandlerRef.current = handler;
    },
    [],
  );

  const handleCartClose = () => {
    setIsCartOpen(false);
  };

  const handleOrdersClose = () => {
    setIsOrdersOpen(false);
  };

  const handleOrderSent = (payload: SentOrderPayload) => {
    setSentOrders((prev) => [
      ...prev,
      {
        id: `order-${Date.now()}`,
        number: prev.length + 1,
        sentAt: payload.sentAt,
        // TODO: Sustituir por estado en tiempo real (Socket.io) desde el backend
        status: "por_confirmar",
        items: payload.items,
        note: payload.note,
      },
    ]);
    setCartItems([]);
  };

  const dismissLeaveConfirm = () => {
    leaveConfirmOpenRef.current = false;
    setLeaveConfirmOpen(false);
  };

  const handleConfirmLeave = () => {
    allowExitRef.current = true;
    leaveConfirmOpenRef.current = false;
    setLeaveConfirmOpen(false);
    window.history.back();

    window.setTimeout(() => {
      if (!allowExitRef.current) return;
      if (!window.location.pathname.includes("/mesa/")) return;
      window.history.back();
    }, 50);
  };

  const openCart = () => {
    if (fabPressed || isCartOpen || isOrdersOpen) return;
    setFabPressed(true);
    window.setTimeout(() => {
      setIsCartOpen(true);
      setFabPressed(false);
    }, 160);
  };

  const openOrders = () => {
    if (ordersFabPressed || isOrdersOpen || isCartOpen) return;
    setOrdersFabPressed(true);
    window.setTimeout(() => {
      setIsOrdersOpen(true);
      setOrdersFabPressed(false);
    }, 160);
  };

  const addDish = (dish: Dish) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.dishId === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dishId === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          dishId: dish.id,
          name: dish.name,
          quantity: 1,
          price: dish.price,
        },
      ];
    });
  };

  const increaseDish = (dishId: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.dishId === dishId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  };

  const removeDish = (dishId: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.dishId === dishId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredDishes = dishes.filter((dish) => {
    const matchesCategory =
      selectedCategory === "ALL" || dish.category === selectedCategory;
    const matchesSearch =
      query.length === 0 || dish.name.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  const dishesByCategory = categories
    .map((category) => ({
      category,
      dishes: filteredDishes.filter((dish) => dish.category === category.id),
    }))
    .filter((group) => group.dishes.length > 0);

  const categoryTabs: {
    id: SelectedCategory;
    label?: string;
    ariaLabel?: string;
  }[] = [
    { id: "ALL", ariaLabel: "Todas las categorías" },
    ...categories.map(({ id, label }) => ({ id, label })),
  ];

  return (
    <div className="flex min-h-dvh items-center justify-center bg-terracotta-300 font-sans text-text-main xl:bg-white xl:p-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-terracotta-300 xl:h-[min(90dvh,1024px)] xl:w-full xl:max-w-3xl xl:rounded-2xl xl:shadow-xl">
        {/* Cabecera */}
        <header className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-3 text-white md:px-8 md:pt-6">
          <h1 className="text-xl font-bold md:text-[18px]">Menú</h1>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-terracotta-500 px-3 py-1 text-[13px] font-bold text-white md:px-4 md:text-[14px]">
              {mesaLabel}
            </span>
            <button
              type="button"
              aria-label={
                isFullscreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
              onClick={() => void toggleMenuFullscreen()}
              className="bg-transparent p-0 text-white cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize
                  className="size-5 transition-transform duration-150 ease-out active:scale-75 md:size-5.5"
                  strokeWidth={2.5}
                />
              ) : (
                <Maximize
                  className="size-5 transition-transform duration-150 ease-out active:scale-75 md:size-5.5"
                  strokeWidth={2.5}
                />
              )}
            </button>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[1.75rem] bg-canvas shadow-[0_-8px_24px_rgba(43,44,52,0.08)]">
          <div className="mx-auto flex h-full w-full flex-col gap-4 p-5 md:mx-auto md:max-w-2xl md:gap-5 md:px-8 md:py-6 xl:max-w-none xl:px-8">
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
              {menuLoading
                ? Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-7 shrink-0 animate-pulse rounded-full bg-canvas-white/80 shadow-sm md:h-8 ${
                        i === 0
                          ? "w-9"
                          : i === 1
                            ? "w-20"
                            : i === 2
                              ? "w-24"
                              : "w-16"
                      }`}
                      aria-hidden
                    />
                  ))
                : categoryTabs.map((tab) => {
                    const isActive = selectedCategory === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={tab.ariaLabel}
                        onClick={() => setSelectedCategory(tab.id)}
                        className={`h-7 shrink-0 rounded-full text-[13px] font-bold whitespace-nowrap shadow-sm transition-transform duration-150 ease-out active:scale-95 md:h-8 md:text-[14px] cursor-pointer ${
                          tab.id === "ALL" ? "px-2.5" : "px-4"
                        } ${
                          isActive
                            ? "bg-latte-400 text-white"
                            : "bg-canvas-white text-text-main"
                        }`}
                      >
                        {tab.id === "ALL" ? (
                          <Menu className="size-5" strokeWidth={2.6} />
                        ) : (
                          tab.label
                        )}
                      </button>
                    );
                  })}
            </div>

            {/* Lista de platos */}
            <section
              className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-none] [&::-webkit-scrollbar]:hidden"
              aria-busy={menuLoading}
            >
              {menuLoading ? (
                <DishListSkeleton />
              ) : menuError ? (
                <MenuEmptyState
                  title="No se pudo cargar la carta"
                  description="Revisa tu conexión e inténtalo de nuevo."
                />
              ) : dishes.length === 0 ? (
                <MenuEmptyState
                  title="No hay platos disponibles"
                  description="La carta de esta mesa está vacía por ahora."
                />
              ) : dishesByCategory.length === 0 ? (
                <MenuEmptyState
                  title="Sin resultados"
                  description="No hay platos que coincidan con tu búsqueda."
                />
              ) : (
                <div className="flex flex-col gap-4 pb-20">
                  {dishesByCategory.map(({ category, dishes: groupDishes }) => (
                    <div key={category.id} className="flex flex-col gap-3">
                      <h2 className="text-base font-bold text-text-main md:text-lg">
                        {category.label}
                      </h2>

                      <ul className="mb-4 flex flex-col gap-3">
                        {groupDishes.map((dish) => (
                          <DishCard
                            key={dish.id}
                            dish={dish}
                            quantity={
                              cartItems.find((item) => item.dishId === dish.id)
                                ?.quantity ?? 0
                            }
                            onAdd={() => addDish(dish)}
                            onRemove={() => removeDish(dish.id)}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Botones flotantes */}
          <div className="absolute right-5 bottom-5 z-30 flex flex-col-reverse items-end gap-3 md:right-8 md:bottom-6">
            <button
              type="button"
              aria-label="Ver tu pedido"
              onClick={openCart}
              className={`cursor-pointer relative flex size-13.75 items-center justify-center rounded-full bg-terracotta-400 text-white shadow-md transition-all duration-150 ${
                fabPressed
                  ? "scale-90 bg-terracotta-500 shadow-sm"
                  : "scale-100"
              }`}
            >
              <ShoppingBag
                className={`size-8 transition-transform ${
                  fabPressed ? "scale-90" : "scale-100"
                }`}
                strokeWidth={1.8}
              />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-canvas-white text-[11px] font-black text-terracotta-400">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {sentOrders.length > 0 && (
              <button
                type="button"
                aria-label="Ver pedidos realizados"
                onClick={openOrders}
                className={`cursor-pointer relative flex size-13.75 items-center justify-center rounded-full bg-canvas-white text-terracotta-400 shadow-md transition-all ${
                  ordersFabPressed
                    ? "scale-90 bg-canvas-muted shadow-sm"
                    : "scale-100"
                }`}
              >
                <ReceiptText
                  className={`size-8 transition-transform duration-150 ${
                    ordersFabPressed ? "scale-90" : "scale-100"
                  }`}
                  strokeWidth={1.8}
                />
                <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-terracotta-400 text-[11px] font-black text-white">
                  {sentOrders.length > 99 ? "99+" : sentOrders.length}
                </span>
              </button>
            )}
          </div>
        </div>

        <CartSheet
          open={isCartOpen}
          onClose={handleCartClose}
          tableId={tableId ?? "01"}
          tableLabel={mesaLabel}
          items={cartItems}
          onAddItem={increaseDish}
          onRemoveItem={removeDish}
          onOrderSent={handleOrderSent}
          registerBackHandler={registerCartBackHandler}
        />

        <OrdersHistorySheet
          open={isOrdersOpen}
          onClose={handleOrdersClose}
          orders={sentOrders}
          tableId={tableId ?? "01"}
          tableLabel={mesaLabel}
          registerBackHandler={registerOrdersBackHandler}
        />

        <ConfirmModal
          open={leaveConfirmOpen}
          tone="cacao"
          icon={<LogOut className="size-8" strokeWidth={2} />}
          title="¿Salir del menú?"
          description="Si sales, perderás la vista del menú de esta mesa. Tendrás que volver a escanear el código QR."
          confirmLabel="Salir"
          cancelLabel="Quedarme"
          onCancel={dismissLeaveConfirm}
          onConfirm={handleConfirmLeave}
        />
      </div>
    </div>
  );
};

const SKELETON_GROUPS = [
  { titleWidth: "w-24", cards: 3 },
  { titleWidth: "w-32", cards: 2 },
  { titleWidth: "w-20", cards: 3 },
] as const;

const DishListSkeleton = () => (
  <div
    className="flex flex-col gap-4 pb-20"
    aria-label="Cargando carta"
    role="status"
  >
    {SKELETON_GROUPS.map((group, groupIndex) => (
      <div key={groupIndex} className="flex flex-col gap-3">
        <div
          className={`h-5 animate-pulse rounded-md bg-slate-50/80 md:h-6 ${group.titleWidth}`}
        />
        <ul className="mb-4 flex flex-col gap-3">
          {Array.from({ length: group.cards }, (_, i) => (
            <li
              key={i}
              className="flex h-18.5 overflow-hidden rounded-[9px] bg-canvas-white shadow-sm"
            >
              <div className="h-full w-25 shrink-0 animate-pulse bg-canvas-muted" />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-3 py-2">
                <div className="h-3.5 w-[70%] animate-pulse rounded bg-slate-50/80" />
                <div className="h-3.5 w-14 animate-pulse rounded bg-slate-50/60" />
              </div>
              <div className="h-full w-7.5 shrink-0 animate-pulse bg-terracotta-100/70" />
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

const MenuEmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 pb-20 text-center">
    <UtensilsCrossed
      className="size-16 text-text-main md:size-20"
      strokeWidth={1.4}
      aria-hidden
    />
    <div className="flex flex-col gap-1">
      <p className="text-base font-bold text-text-main md:text-lg">{title}</p>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  </div>
);

// Componente para la tarjeta de plato
const DishCard = ({
  dish,
  quantity,
  onAdd,
  onRemove,
  imageFallbackBg = "bg-canvas-muted",
  imageFallbackIcon = "text-slate-100",
}: {
  dish: Dish;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  imageFallbackBg?: string;
  imageFallbackIcon?: string;
}) => {
  const [imageFailed, setImageFailed] = useState(!dish.imageUrl);
  const hasQuantity = quantity > 0;

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
          src={mediaUrl(dish.imageUrl)}
          alt=""
          onError={() => setImageFailed(true)}
          className="h-full w-25 shrink-0 object-cover"
        />
      )}

      {/* Nombre y precio */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2">
        <MarqueeText
          text={dish.name}
          as="h3"
          className="text-[13px] font-bold text-text-main"
        />
        <p className="text-[14px] font-black text-text-main">
          {formatPrice(dish.price)}
        </p>
      </div>

      {/* Contador + acciones */}
      {hasQuantity && (
        <div className="flex h-full w-5.5 shrink-0 items-center justify-center bg-latte-200 text-sm font-bold text-text-main">
          {quantity}
        </div>
      )}

      <div className="flex h-full w-7.5 shrink-0 flex-col">
        {/* Botón de añadir */}
        <button
          type="button"
          aria-label={`Añadir ${dish.name}`}
          onClick={onAdd}
          className={`group flex w-full items-center justify-center bg-terracotta-300 text-white cursor-pointer ${
            hasQuantity ? "h-1/2" : "h-full"
          }`}
        >
          <Plus className="size-5 stroke-3 transition-transform group-active:scale-75" />
        </button>

        {/* Botón de quitar */}
        {hasQuantity && (
          <button
            type="button"
            aria-label={`Quitar ${dish.name}`}
            onClick={onRemove}
            className="group flex h-1/2 w-full items-center justify-center bg-terracotta-400 text-white cursor-pointer"
          >
            <Minus className="size-5 stroke-3 transition-transform group-active:scale-75" />
          </button>
        )}
      </div>
    </li>
  );
};
