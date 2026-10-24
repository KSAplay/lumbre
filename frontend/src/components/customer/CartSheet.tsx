import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type TransitionEvent,
} from "react";
import {
  ConciergeBell,
  Eye,
  EyeOff,
  HandPlatter,
  LoaderCircle,
  Minus,
  Plus,
  SendHorizontal,
  CircleCheck,
  SquareText,
  Trash2,
} from "lucide-react";
import { ConfirmModal } from "../ui/ConfirmModal";
import { MarqueeText } from "../ui/MarqueeText";
import { useToast } from "../ui/useToast";
import { requestTableHelp, sendOrderRound } from "../../services/orderService";

export type CartLine = {
  dishId: number;
  name: string;
  quantity: number;
  price: number;
};

export type SentOrderPayload = {
  tableId: string;
  tableLabel: string;
  note?: string;
  items: CartLine[];
  sentAt: Date;
};

type CartSheetProps = {
  open: boolean;
  onClose: () => void;
  tableId: string;
  tableLabel: string;
  items: CartLine[];
  onAddItem: (dishId: number) => void;
  onRemoveItem: (dishId: number) => void;
  onOrderSent: (payload: SentOrderPayload) => void;
  registerBackHandler?: (handler: (() => boolean) | null) => void;
};

const CLOSE_DRAG_THRESHOLD = 120;
const ANIMATION_MS = 300;
const NOTE_LINE_HEIGHT = 24;
const NOTE_MIN_LINES = 2;
const NOTE_MAX_LINES = 4;
const NOTE_MAX_CHARS = 160;
const NOTE_PADDING_Y = 16;

const formatPrice = (price: number) =>
  price.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });

export const CartSheet = ({
  open,
  onClose,
  tableId,
  tableLabel,
  items,
  onAddItem,
  onRemoveItem,
  onOrderSent,
  registerBackHandler,
}: CartSheetProps) => {
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [noteReady, setNoteReady] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  const [note, setNote] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [confirmHelpOpen, setConfirmHelpOpen] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [helpRequested, setHelpRequested] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const startYRef = useRef(0);
  const dragYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const closingRef = useRef(false);
  const focusNoteOnOpenRef = useRef(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const notePanelRef = useRef<HTMLDivElement>(null);
  const confirmHelpOpenRef = useRef(confirmHelpOpen);
  const confirmSendOpenRef = useRef(confirmSendOpen);
  const beginCloseRef = useRef<() => void>(() => undefined);

  const hasItems = items.length > 0;
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (!hasItems && (noteReady || noteVisible || note.length > 0)) {
    setNoteReady(false);
    setNoteVisible(false);
    setNote("");
  }

  if (open && !visible) {
    setVisible(true);
  }

  useEffect(() => {
    if (!open || !visible) return;

    closingRef.current = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });

    return () => cancelAnimationFrame(id);
  }, [open, visible]);

  // Evita que el teclado móvil tape el recuadro de la nota
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateOffset = () => {
      const offset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardOffset(offset);
    };

    updateOffset();
    viewport.addEventListener("resize", updateOffset);
    viewport.addEventListener("scroll", updateOffset);
    return () => {
      viewport.removeEventListener("resize", updateOffset);
      viewport.removeEventListener("scroll", updateOffset);
    };
  }, []);

  useEffect(() => {
    if (!noteVisible) return;

    const frame = requestAnimationFrame(() => {
      const field = noteRef.current;
      if (!field) return;
      resizeNoteField(field);
      // Solo abre el teclado al añadir por primera vez
      if (focusNoteOnOpenRef.current) {
        field.focus();
        focusNoteOnOpenRef.current = false;
      }
      notePanelRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [noteVisible]);

  const resetDrag = () => {
    dragYRef.current = 0;
    isDraggingRef.current = false;
    setDragY(0);
    setIsDragging(false);
  };

  const beginClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragY(0);
    dragYRef.current = 0;
    setConfirmHelpOpen(false);
    setConfirmSendOpen(false);
    setEntered(false);
  };

  useEffect(() => {
    confirmHelpOpenRef.current = confirmHelpOpen;
  }, [confirmHelpOpen]);

  useEffect(() => {
    confirmSendOpenRef.current = confirmSendOpen;
  }, [confirmSendOpen]);

  useEffect(() => {
    beginCloseRef.current = beginClose;
  });

  // Un solo registro estable: evita huecos al cambiar confirms
  useEffect(() => {
    if (!registerBackHandler) return;

    if (!open) {
      registerBackHandler(null);
      return;
    }

    registerBackHandler(() => {
      if (confirmHelpOpenRef.current) {
        setConfirmHelpOpen(false);
        return true;
      }
      if (confirmSendOpenRef.current) {
        setConfirmSendOpen(false);
        return true;
      }
      beginCloseRef.current();
      return true;
    });

    return () => registerBackHandler(null);
  }, [open, registerBackHandler]);

  if (!visible) return null;

  const finishClose = () => {
    resetDrag();
    setVisible(false);
    onClose();
  };

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "transform") return;
    if (!entered && closingRef.current) {
      finishClose();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (closingRef.current || !entered) return;
    startYRef.current = event.clientY;
    isDraggingRef.current = true;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const delta = Math.max(0, event.clientY - startYRef.current);
    dragYRef.current = delta;
    setDragY(delta);
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (dragYRef.current >= CLOSE_DRAG_THRESHOLD) {
      beginClose();
      return;
    }

    dragYRef.current = 0;
    setDragY(0);
  };

  const handleNoteButton = () => {
    if (!noteReady) {
      focusNoteOnOpenRef.current = true;
      setNoteReady(true);
      setNoteVisible(true);
      return;
    }

    if (noteVisible) {
      noteRef.current?.blur();
      setNoteVisible(false);
      return;
    }

    focusNoteOnOpenRef.current = false;
    setNoteVisible(true);
  };

  const handleNoteChange = (value: string) => {
    const limited = limitNoteText(value);
    setNote(limited);
    if (noteRef.current) resizeNoteField(noteRef.current);
  };

  const handleConfirmHelp = async () => {
    setConfirmHelpOpen(false);
    setHelpLoading(true);

    try {
      await requestTableHelp(tableId, { tableId, tableLabel });

      setHelpRequested(true);
      showToast({
        message: "Hemos avisado al equipo de sala",
        icon: <ConciergeBell className="size-4" strokeWidth={2.5} />,
        tone: "cacao",
      });
    } catch {
      showToast({
        message: "No se pudo avisar al camarero. Inténtalo de nuevo.",
        tone: "red",
      });
    } finally {
      setHelpLoading(false);
    }
  };

  const handleConfirmSend = async () => {
    if (sendLoading || !hasItems) return;
    setConfirmSendOpen(false);
    setSendLoading(true);

    const sentAt = new Date();
    const payload: SentOrderPayload = {
      tableId,
      tableLabel,
      note: note.trim() || undefined,
      items: items.map((item) => ({
        dishId: item.dishId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      sentAt,
    };

    try {
      await sendOrderRound(tableId, {
        tableId,
        tableLabel,
        note: payload.note,
        items: payload.items,
        sentAt: sentAt.toISOString(),
      });

      setNote("");
      setNoteReady(false);
      setNoteVisible(false);
      setSendLoading(false);
      onOrderSent(payload);
      beginClose();
      showToast({
        message: "Tu pedido se ha enviado a cocina",
        icon: <CircleCheck className="size-4" strokeWidth={2.5} />,
        tone: "green",
      });
    } catch {
      setSendLoading(false);
      showToast({
        message: "No se pudo enviar el pedido. Revisa e inténtalo otra vez.",
        tone: "red",
      });
    }
  };

  const sheetOffset = isDragging ? `${dragY}px` : entered ? "0px" : "100%";
  const minNoteHeight = NOTE_LINE_HEIGHT * NOTE_MIN_LINES + NOTE_PADDING_Y;
  const maxNoteHeight = NOTE_LINE_HEIGHT * NOTE_MAX_LINES + NOTE_PADDING_Y;

  return (
    <div className="absolute inset-0 z-40 flex flex-col">
      {/* Fondo oscurecido */}
      <button
        type="button"
        aria-label="Cerrar pedido"
        className={`absolute inset-0 bg-text-main/45 transition-opacity ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${ANIMATION_MS}ms` }}
        onClick={beginClose}
      />

      {/* Sheet: padding lateral/superior; pegado abajo */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sheet-title"
        className={`absolute inset-x-5 top-5 bottom-0 flex flex-col overflow-hidden rounded-t-[20px] bg-canvas-white shadow-lg ease-out md:inset-x-8 md:top-6 ${
          isDragging ? "" : "transition-transform"
        }`}
        style={{
          transform: `translateY(${sheetOffset})`,
          transitionDuration: isDragging ? "0ms" : `${ANIMATION_MS}ms`,
          paddingBottom: keyboardOffset > 0 ? keyboardOffset : undefined,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Cabecera (zona de arrastre) */}
        <div
          className="flex shrink-0 touch-none flex-col px-5 pt-3 pb-3 md:px-7"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-50"
            aria-hidden
          />
          <div className="flex items-center justify-between gap-3">
            <h1
              id="cart-sheet-title"
              className="text-[18px] font-bold text-text-main md:text-[18px]"
            >
              Tu Pedido
            </h1>
            <span className="shrink-0 rounded-full bg-cacao-300 px-3 py-1 text-[12px] font-bold text-white md:px-4 md:text-[14px]">
              {tableLabel}
            </span>
          </div>
        </div>

        {/* Lista de platos */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 md:px-7">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <HandPlatter
                className="size-16 text-text-main md:size-20"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="mt-4 text-[15px] font-bold text-text-main">
                Tu pedido está vacío
              </p>
              <p className="mt-1.5 max-w-60 text-[13px] text-text-muted">
                Explora nuestra carta y añade tus platos favoritos para empezar.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {items.map((item) => {
                const lineTotal = item.price * item.quantity;
                const isLastUnit = item.quantity === 1;

                return (
                  <li
                    key={item.dishId}
                    className="border-b border-slate-50 py-3 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <MarqueeText
                        text={item.name}
                        as="h3"
                        className="text-[13px] font-bold text-text-main"
                      />
                      <p className="shrink-0 text-[14px] font-black text-text-main">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-100 italic">
                        {formatPrice(item.price)} c/u
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={
                            isLastUnit
                              ? `Eliminar ${item.name}`
                              : `Quitar ${item.name}`
                          }
                          onClick={() => onRemoveItem(item.dishId)}
                          className="flex size-7 items-center justify-center rounded-full bg-terracotta-400 text-white shadow-sm transition-transform active:scale-90"
                        >
                          {isLastUnit ? (
                            <Trash2 className="size-3.5" strokeWidth={2.5} />
                          ) : (
                            <Minus className="size-3.5" strokeWidth={3} />
                          )}
                        </button>

                        <span className="min-w-5 text-center text-sm font-bold text-text-main">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          aria-label={`Añadir ${item.name}`}
                          onClick={() => onAddItem(item.dishId)}
                          className="flex size-7 items-center justify-center rounded-full bg-terracotta-300 text-white shadow-sm transition-transform active:scale-90"
                        >
                          <Plus className="size-3.5" strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie: nota, acciones, total y envío */}
        <div className="shrink-0 px-5 pt-3 pb-5 md:px-7">
          {hasItems && noteVisible && (
            <div
              ref={notePanelRef}
              className="mb-2.5 overflow-hidden rounded-[9px] bg-latte-200 shadow-md"
            >
              <textarea
                ref={noteRef}
                value={note}
                onChange={(event) => handleNoteChange(event.target.value)}
                placeholder="Escribe una nota para cocina..."
                rows={NOTE_MIN_LINES}
                maxLength={NOTE_MAX_CHARS}
                className="w-full resize-none border-0 bg-transparent px-3 py-2 text-left text-sm text-text-main outline-none placeholder:text-slate-100"
                style={{
                  minHeight: minNoteHeight,
                  maxHeight: maxNoteHeight,
                  lineHeight: `${NOTE_LINE_HEIGHT}px`,
                  backgroundImage: `repeating-linear-gradient(
                    to bottom,
                    transparent,
                    transparent ${NOTE_LINE_HEIGHT - 1}px,
                    var(--color-note-line) ${NOTE_LINE_HEIGHT - 1}px,
                    var(--color-note-line) ${NOTE_LINE_HEIGHT}px
                  )`,
                  backgroundAttachment: "local",
                  backgroundOrigin: "content-box",
                  backgroundClip: "content-box",
                }}
              />
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {hasItems && (
              <button
                type="button"
                onClick={handleNoteButton}
                className={`flex w-full items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-[13px] font-bold shadow-sm transition-transform active:scale-[0.98] ${
                  noteReady
                    ? "border border-latte-400 bg-latte-100 text-latte-500"
                    : "bg-latte-400 text-white"
                }`}
              >
                {!noteReady ? (
                  <>
                    <SquareText className="size-4" />
                    Añadir nota
                  </>
                ) : noteVisible ? (
                  <>
                    <EyeOff className="size-4" />
                    Cerrar nota
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    Ver nota
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              disabled={helpRequested || helpLoading}
              onClick={() => {
                if (helpRequested || helpLoading) return;
                setConfirmHelpOpen(true);
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-[13px] font-bold shadow-sm ${
                helpRequested
                  ? "cursor-not-allowed bg-cacao-200 text-white"
                  : helpLoading
                    ? "cursor-wait bg-cacao-200 text-white"
                    : "bg-text-cacao text-white transition-transform active:scale-[0.98]"
              }`}
            >
              <ConciergeBell className="size-4" />
              {helpRequested
                ? "Ayuda solicitada"
                : helpLoading
                  ? "Avisando..."
                  : "Solicitar ayuda"}
            </button>
          </div>

          <div className="mt-3 border-t border-slate-50 pt-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-base font-bold text-text-main">Total</span>
              <span className="text-xl font-black text-text-main">
                {formatPrice(total)}
              </span>
            </div>

            <button
              type="button"
              disabled={!hasItems || sendLoading}
              onClick={() => {
                if (!hasItems || sendLoading) return;
                setConfirmSendOpen(true);
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-[9px] px-4 py-3 text-[13px] font-bold shadow-sm ${
                sendLoading
                  ? "cursor-wait bg-terracotta-200 text-white"
                  : hasItems
                    ? "bg-terracotta-400 text-white transition-transform active:scale-[0.98]"
                    : "cursor-not-allowed bg-btn-disabled-bg text-btn-disabled-text"
              }`}
            >
              {sendLoading ? (
                <LoaderCircle
                  className="size-5 animate-spin"
                  strokeWidth={2.5}
                  aria-label="Enviando pedido"
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
      </div>

      <ConfirmModal
        open={confirmHelpOpen}
        tone="cacao"
        icon={<ConciergeBell className="size-8" strokeWidth={2} />}
        title="¿Llamar al camarero?"
        description="Avisaremos a sala para que se acerque a tu mesa."
        confirmLabel="Llamar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmHelpOpen(false)}
        onConfirm={handleConfirmHelp}
      />

      <ConfirmModal
        open={confirmSendOpen}
        tone="terracotta"
        icon={<SendHorizontal className="size-8" strokeWidth={2} />}
        title="¿Enviar a cocina?"
        description="Pondremos tu ronda en marcha de inmediato."
        confirmLabel="Enviar"
        cancelLabel="Volver"
        onCancel={() => setConfirmSendOpen(false)}
        onConfirm={handleConfirmSend}
      />
    </div>
  );
};

const limitNoteText = (value: string) => {
  const clipped = value.slice(0, NOTE_MAX_CHARS);
  const lines = clipped.split("\n");
  if (lines.length <= NOTE_MAX_LINES) return clipped;
  return lines.slice(0, NOTE_MAX_LINES).join("\n");
};

const resizeNoteField = (field: HTMLTextAreaElement) => {
  const minHeight = NOTE_LINE_HEIGHT * NOTE_MIN_LINES + NOTE_PADDING_Y;
  const maxHeight = NOTE_LINE_HEIGHT * NOTE_MAX_LINES + NOTE_PADDING_Y;

  field.style.height = "auto";
  const nextHeight = Math.min(
    Math.max(field.scrollHeight, minHeight),
    maxHeight,
  );
  field.style.height = `${nextHeight}px`;
  field.style.overflowY = "hidden";
};
