import {
  useEffect,
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

/**
 * Calcula el alto de fila para que quepan 3 filas si hay altura suficiente, o 2 si no.
 *
 * @param height - Alto visible del tablero en píxeles.
 * @returns Alto de fila en píxeles; en pantallas muy bajas usa un mínimo y el tablero hace scroll.
 */
const computeRowHeight = (height: number) => {
  const available = height - PADDING_TOP - PADDING_BOTTOM;
  const rows = available >= MIN_TICKET_HEIGHT * 3 + ROW_GAP * 2 ? 3 : 2;
  const rowHeight = (available - ROW_GAP * (rows - 1)) / rows;
  return Math.max(FALLBACK_TICKET_HEIGHT, rowHeight);
};

export const KitchenTicketBoard = ({
  tickets,
  renderTicket,
  emptyState,
}: KitchenTicketBoardProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const positionsRef = useRef(new Map<string, { left: number; top: number }>());
  const orderKeyRef = useRef("");
  const [rowHeight, setRowHeight] = useState(MIN_TICKET_HEIGHT);
  // Solo los tickets presentes al montar entran escalonados
  const [initialIds] = useState(() => tickets.map((ticket) => ticket.id));

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new ResizeObserver(([entry]) => {
      setRowHeight(computeRowHeight(entry.contentRect.height));
    });
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  // FLIP: al cambiar el orden, cada ticket parte de su posición anterior y se desliza a la nueva
  useLayoutEffect(() => {
    const orderKey = tickets.map((ticket) => ticket.id).join("|");
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
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        className="absolute inset-0 overflow-y-auto px-5 md:px-6 lg:px-8"
      >
        {tickets.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            {emptyState}
          </div>
        ) : (
          <ul
            className="relative grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-x-6"
            style={{
              gridAutoRows: `${rowHeight}px`,
              rowGap: ROW_GAP,
              paddingTop: PADDING_TOP,
              paddingBottom: PADDING_BOTTOM,
            }}
          >
            {tickets.map((ticket) => {
              const initialIndex = initialIds.indexOf(ticket.id);
              const enterDelayMs =
                initialIndex === -1
                  ? 0
                  : Math.min(initialIndex, MAX_STAGGER_STEPS) * STAGGER_MS;

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
  );
};
