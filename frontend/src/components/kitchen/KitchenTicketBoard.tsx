import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { KitchenTicket } from "../../types/kitchen";

type KitchenTicketBoardProps = {
  tickets: KitchenTicket[];
  renderTicket: (ticket: KitchenTicket, enterDelayMs: number) => ReactNode;
  emptyState: ReactNode;
};

const MIN_TICKET_HEIGHT = 360;
const FALLBACK_TICKET_HEIGHT = 300;
/** Hueco vertical suficiente para que se vea la pestaña de incidencia */
const ROW_GAP = 44;
const PADDING_TOP = 44;
const PADDING_BOTTOM = 24;
const STAGGER_MS = 70;
const MAX_STAGGER_STEPS = 8;
const SHIFT_MS = 480;
/** Filas visibles por página; el excedente pasa a otras páginas */
const ROWS_PER_PAGE = 2;
/** Coincide con `minmax(19rem, 1fr)` del grid */
const MIN_COL_REM = 19;
/** Coincide con `gap-x-6` del grid y con el hueco hasta la barra de páginas */
const COL_GAP_PX = 24;

/**
 * Calcula el alto de fila para encajar exactamente dos filas en el alto disponible.
 *
 * @param height - Alto visible del tablero en píxeles.
 * @returns Alto de fila en píxeles (nunca por debajo del mínimo de fallback).
 */
const computeRowHeight = (height: number) => {
  const available = height - PADDING_TOP - PADDING_BOTTOM;
  const rowHeight =
    (available - ROW_GAP * (ROWS_PER_PAGE - 1)) / ROWS_PER_PAGE;
  return Math.max(FALLBACK_TICKET_HEIGHT, rowHeight);
};

/**
 * Calcula cuántas columnas caben con `auto-fill` y un ancho mínimo en rem.
 *
 * @param width - Ancho útil del grid en píxeles.
 * @returns Número de columnas (≥ 1).
 */
const computeColumns = (width: number) => {
  const remPx = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  const minColPx = MIN_COL_REM * (Number.isFinite(remPx) ? remPx : 16);
  return Math.max(1, Math.floor((width + COL_GAP_PX) / (minColPx + COL_GAP_PX)));
};

export const KitchenTicketBoard = ({
  tickets,
  renderTicket,
  emptyState,
}: KitchenTicketBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const positionsRef = useRef(new Map<string, { left: number; top: number }>());
  const orderKeyRef = useRef("");
  const [rowHeight, setRowHeight] = useState(MIN_TICKET_HEIGHT);
  /** `null` hasta medir el tablero, para no montar tickets con un nº de columnas provisional */
  const [columns, setColumns] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  /** Delays de entrada de los tickets montados en la página actual */
  const [enterDelays, setEnterDelays] = useState({
    page: 0,
    byId: new Map<string, number>(),
  });

  const pageCapacity = (columns ?? 1) * ROWS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(tickets.length / pageCapacity));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageCapacity;
  const pageTickets = tickets.slice(pageStart, pageStart + pageCapacity);

  // Al cambiar de página todos los tickets se remontan y se escalonan de nuevo;
  // dentro de la misma página solo se escalonan los recién llegados
  const samePage = enterDelays.page === currentPage;
  const delaysOutdated =
    !samePage ||
    enterDelays.byId.size !== pageTickets.length ||
    pageTickets.some((ticket) => !enterDelays.byId.has(ticket.id));

  if (columns !== null && delaysOutdated) {
    const byId = new Map<string, number>();
    let staggerStep = 0;
    for (const ticket of pageTickets) {
      const previous = samePage ? enterDelays.byId.get(ticket.id) : undefined;
      if (previous !== undefined) {
        byId.set(ticket.id, previous);
        continue;
      }
      byId.set(ticket.id, Math.min(staggerStep, MAX_STAGGER_STEPS) * STAGGER_MS);
      staggerStep += 1;
    }
    setEnterDelays({ page: currentPage, byId });
  }

  const rowsBlockHeight =
    rowHeight * ROWS_PER_PAGE + ROW_GAP * (ROWS_PER_PAGE - 1);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const applySize = (width: number, height: number) => {
      setRowHeight(computeRowHeight(height));
      setColumns(computeColumns(width));
    };

    applySize(board.clientWidth, board.clientHeight);
    const observer = new ResizeObserver(([entry]) => {
      applySize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  // Si se vacía la página actual (p. ej. al completar tickets), baja al último índice válido
  if (columns !== null && page > totalPages) {
    setPage(totalPages);
  }

  // FLIP: al cambiar el orden, cada ticket parte de su posición anterior y se desliza a la nueva
  useLayoutEffect(() => {
    const orderKey = pageTickets.map((ticket) => ticket.id).join("|");
    const orderChanged = orderKey !== orderKeyRef.current;
    const nextPositions = new Map<string, { left: number; top: number }>();

    itemRefs.current.forEach((element, id) => {
      const next = { left: element.offsetLeft, top: element.offsetTop };
      const previous = positionsRef.current.get(id);
      nextPositions.set(id, next);

      if (!orderChanged || !previous) return;
      const dx = previous.left - next.left;
      const dy = previous.top - next.top;
      if (dx === 0 && dy === 0) return;

      element.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: SHIFT_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    });

    positionsRef.current = nextPositions;
    orderKeyRef.current = orderKey;
  });

  const setItemRef = (id: string) => (element: HTMLLIElement | null) => {
    if (element) itemRefs.current.set(id, element);
    else itemRefs.current.delete(id);
  };

  return (
    <div className="flex min-h-0 flex-1 gap-6 pl-5 md:pl-6 lg:pl-8">
      <div className="relative min-h-0 min-w-0 flex-1">
        <div ref={boardRef} className="absolute inset-0 overflow-hidden">
          {tickets.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              {emptyState}
            </div>
          ) : columns === null ? null : (
            <ul
              className="relative grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-x-6"
              style={{
                gridAutoRows: `${rowHeight}px`,
                rowGap: ROW_GAP,
                paddingTop: PADDING_TOP,
                paddingBottom: PADDING_BOTTOM,
              }}
            >
              {pageTickets.map((ticket) => {
                const enterDelayMs = enterDelays.byId.get(ticket.id) ?? 0;

                return (
                  <li key={ticket.id} ref={setItemRef(ticket.id)}>
                    {renderTicket(ticket, enterDelayMs)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {tickets.length > 0 ? (
        <nav
          className="mr-5 flex shrink-0 flex-col items-center gap-3 overflow-y-auto rounded-lg bg-canvas-dim/50 p-2.5 md:mr-6 lg:mr-8"
          style={{ marginTop: PADDING_TOP, height: rowsBlockHeight }}
          aria-label="Páginas de comandas"
        >
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;
            const active = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                type="button"
                aria-label={`Página ${pageNumber}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setPage(pageNumber)}
                className={`flex size-16 shrink-0 cursor-pointer items-center justify-center rounded-lg text-2xl font-bold tabular-nums transition-colors duration-200 ${
                  active
                    ? "bg-canvas-white text-text-main shadow-sm"
                    : "bg-surface-hover text-text-muted hover:bg-canvas-white hover:text-text-main"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
};
