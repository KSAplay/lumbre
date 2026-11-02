const LINE_WIDTHS = ["w-[62%]", "w-[48%]", "w-[70%]", "w-[54%]"] as const;

/** Nº de platos de cada ronda de ejemplo */
const ORDER_LINES = [3, 2, 2, 3] as const;

export const PendingOrdersSkeleton = () => (
  <ul
    role="status"
    aria-label="Cargando pedidos por confirmar"
    className="flex animate-pulse flex-col gap-3 md:grid md:grid-cols-2 md:items-start"
  >
    {ORDER_LINES.map((lines, index) => (
      <li
        key={index}
        className="overflow-hidden rounded-[14px] bg-canvas-white shadow-sm"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-6.5 w-18 rounded-full bg-cacao-100/60" />
            <span className="h-4 w-6 rounded bg-slate-50/80" />
            <span className="h-3 w-12 rounded bg-slate-50/60" />
          </div>
          <span className="h-6 w-12 rounded-full bg-canvas-muted" />
        </div>

        <ul className="px-4">
          {Array.from({ length: lines }, (_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 border-b border-slate-50 py-2.5 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="size-6 shrink-0 rounded-md bg-latte-200" />
                <span
                  className={`h-3.5 rounded bg-slate-50/80 ${LINE_WIDTHS[i % LINE_WIDTHS.length]}`}
                />
              </div>
              <span className="h-3.5 w-12 rounded bg-slate-50/80" />
            </li>
          ))}
        </ul>

        <div className="border-t border-slate-50 px-4 pt-3 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="h-3.5 w-16 rounded bg-slate-50/60" />
            <span className="h-5 w-20 rounded bg-slate-50/80" />
          </div>
          <div className="grid grid-cols-[auto_auto_1fr] gap-2">
            <span className="size-11 rounded-[9px] bg-terracotta-100" />
            <span className="h-11 w-24 rounded-[9px] bg-latte-100 ring-1 ring-latte-300" />
            <span className="h-11 rounded-[9px] bg-terracotta-100" />
          </div>
        </div>
      </li>
    ))}
  </ul>
);

export const WaiterTablesSkeleton = () => (
  <div
    role="status"
    aria-label="Cargando mesas"
    className="flex min-h-0 flex-1 animate-pulse flex-col gap-3 px-4 pt-4 md:px-6 md:pt-5"
  >
    <div className="grid shrink-0 grid-cols-3 gap-1 rounded-lg bg-canvas-dim/40 p-1">
      <span className="h-9 rounded-md bg-canvas-white shadow-sm" />
      <span className="h-9" />
      <span className="h-9" />
    </div>

    <div className="flex shrink-0 gap-2 overflow-hidden pb-1">
      {["w-24", "w-28", "w-20", "w-26", "w-24"].map((w, i) => (
        <span
          key={i}
          className={`h-8 shrink-0 rounded-full bg-canvas-white shadow-sm ${w}`}
        />
      ))}
    </div>

    <ul className="grid grid-cols-2 gap-3 overflow-hidden sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 12 }, (_, i) => (
        <li
          key={i}
          className="flex h-28 overflow-hidden rounded-xl bg-canvas-white shadow-sm"
        >
          <span className="w-1.5 shrink-0 bg-slate-50" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="h-4.5 w-18 rounded bg-slate-50/80" />
              <span className="size-4.5 rounded-full bg-slate-50/80" />
            </div>
            <span className="h-5 w-20 rounded-full bg-canvas-muted" />
            <div className="mt-auto flex items-center justify-between">
              <span className="h-3 w-8 rounded bg-slate-50/60" />
              <span className="h-3 w-12 rounded bg-slate-50/60" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

/** Filas de plato de la comanda manual (imagen, nombre, precio y botón). */
export const CompactDishListSkeleton = () => (
  <ul
    role="status"
    aria-label="Cargando carta"
    className="flex animate-pulse flex-col gap-2"
  >
    {Array.from({ length: 7 }, (_, i) => (
      <li
        key={i}
        className="flex h-14 items-center gap-3 overflow-hidden rounded-[9px] bg-canvas-white pr-2 shadow-sm"
      >
        <span className="h-full w-14 shrink-0 bg-canvas-muted" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span
            className={`h-3.5 rounded bg-slate-50/80 ${LINE_WIDTHS[i % LINE_WIDTHS.length]}`}
          />
          <span className="h-3 w-12 rounded bg-slate-50/60" />
        </div>
        <span className="size-8 shrink-0 rounded-full bg-terracotta-100" />
      </li>
    ))}
  </ul>
);

/** Chips de mesa de la comanda manual mientras carga la sala. */
export const TableChipsSkeleton = () => (
  <div
    role="status"
    aria-label="Cargando mesas"
    className="flex animate-pulse gap-2 overflow-hidden pb-1"
  >
    {Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className="h-9 w-24 shrink-0 rounded-full bg-canvas-white shadow-sm"
      />
    ))}
  </div>
);

export const NotificationsSkeleton = () => (
  <ul
    role="status"
    aria-label="Cargando avisos"
    className="flex animate-pulse flex-col gap-2"
  >
    {Array.from({ length: 6 }, (_, i) => (
      <li
        key={i}
        className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
          i < 3 ? "bg-canvas-white shadow-sm" : "bg-canvas-muted/60"
        }`}
      >
        <span className="size-11 shrink-0 rounded-full bg-slate-50/80" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-28 rounded bg-slate-50/80" />
            <span className="h-4 w-14 rounded-full bg-cacao-100/50" />
          </div>
          <span
            className={`h-3 rounded bg-slate-50/60 ${LINE_WIDTHS[i % LINE_WIDTHS.length]}`}
          />
          <span className="h-2.5 w-20 rounded bg-slate-50/50" />
        </div>
        <span className="size-2.5 shrink-0 rounded-full bg-slate-50" />
      </li>
    ))}
  </ul>
);
