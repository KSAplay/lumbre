/** Nº de platos de cada ticket de ejemplo */
const SKELETON_TICKETS = [3, 2, 4, 2, 3, 4, 2, 3] as const;

const LINE_WIDTHS = ["w-[72%]", "w-[58%]", "w-[80%]", "w-[64%]"] as const;

const TicketSkeleton = ({ items }: { items: number }) => (
  <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-canvas-white shadow-[0_10px_28px_rgba(43,44,52,0.14)]">
    <div className="shrink-0 px-5 pt-4 pb-3">
      <div className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="h-6 w-10 animate-pulse rounded-md bg-slate-50/80" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-terracotta-100/70" />
        <div className="size-11 animate-pulse justify-self-end rounded-full bg-canvas-muted" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="h-8 w-24 animate-pulse rounded-md bg-slate-50/80" />
        <div className="h-7 w-18 animate-pulse rounded-full bg-canvas-muted" />
      </div>
    </div>

    <div className="mx-5 border-t border-slate-50" />

    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-12 animate-pulse rounded bg-slate-50/60" />
        <div className="h-3 w-6 animate-pulse rounded bg-slate-50/60" />
      </div>
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-7 shrink-0 animate-pulse rounded-full bg-canvas-muted" />
          <div
            className={`h-4 animate-pulse rounded bg-slate-50/80 ${LINE_WIDTHS[i % LINE_WIDTHS.length]}`}
          />
        </div>
      ))}
    </div>

    <div className="h-15 shrink-0 animate-pulse bg-canvas-muted" />
  </div>
);

/** Esqueleto del tablero KDS: dos filas de tickets con cabecera, platos y botón. */
export const KitchenBoardSkeleton = () => (
  <div
    role="status"
    aria-label="Cargando comandas"
    className="relative min-h-0 flex-1 px-5 md:px-6 lg:px-8"
  >
    <div className="absolute inset-x-5 top-0 bottom-0 overflow-hidden md:inset-x-6 lg:inset-x-8">
      <ul className="grid h-full auto-rows-[calc((100%-6.25rem)/2)] grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-x-6 gap-y-11 px-2 pt-11 pb-6">
        {SKELETON_TICKETS.map((items, index) => (
          <li key={index}>
            <TicketSkeleton items={items} />
          </li>
        ))}
      </ul>
    </div>
  </div>
);
