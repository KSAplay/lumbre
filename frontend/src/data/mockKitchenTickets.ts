import type { KitchenTicket } from "../types/kitchen";

type TicketTemplate = Omit<KitchenTicket, "id" | "number" | "sentAt" | "alert">;

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000);

const INITIAL_TEMPLATES: { minutesAgo: number; ticket: TicketTemplate }[] = [
  {
    minutesAgo: 24,
    ticket: {
      tableLabel: "Mesa 04",
      note: "Uno de los comensales es celíaco, por favor sin trazas de gluten.",
      items: [
        { id: "a", name: "Lomo Saltado Tradicional", quantity: 2, done: true },
        { id: "b", name: "Ají de Gallina", quantity: 1, done: false },
        { id: "c", name: "Chicha Morada Artesanal (Jarra 1L)", quantity: 1, done: false },
      ],
    },
  },
  {
    minutesAgo: 15,
    ticket: {
      tableLabel: "Mesa 01",
      items: [
        { id: "a", name: "Ceviche Clásico", quantity: 1, done: false },
        { id: "b", name: "Causa Limeña de Pollo", quantity: 2, done: false },
        { id: "c", name: "Pisco Sour Clásico", quantity: 2, done: false },
      ],
    },
  },
  {
    minutesAgo: 8,
    ticket: {
      tableLabel: "Mesa 07",
      note: "El ceviche sin picante, es para un niño.",
      items: [
        { id: "a", name: "Ceviche Clásico", quantity: 2, done: false },
        { id: "b", name: "Papa a la Huancaína", quantity: 1, done: false },
      ],
    },
  },
  {
    minutesAgo: 3,
    ticket: {
      tableLabel: "Mesa 12",
      items: [
        { id: "a", name: "Arroz con Mariscos", quantity: 1, done: false },
        { id: "b", name: "Seco de Res con Frejoles", quantity: 1, done: false },
        { id: "c", name: "Anticuchos de Corazón", quantity: 2, done: false },
        { id: "d", name: "Picarones Tradicionales", quantity: 1, done: false },
      ],
    },
  },
  {
    minutesAgo: 1,
    ticket: {
      tableLabel: "Mesa 03",
      items: [{ id: "a", name: "Suspiro a la Limeña", quantity: 3, done: false }],
    },
  },
];

export const INITIAL_KITCHEN_TICKET_COUNT = INITIAL_TEMPLATES.length;

/** Rondas que irán llegando durante la demo, en orden */
export const MOCK_INCOMING_TICKETS: TicketTemplate[] = [
  {
    tableLabel: "Mesa 09",
    note: "Traer los platos a la vez, por favor.",
    items: [
      { id: "a", name: "Lomo Saltado Tradicional", quantity: 1, done: false },
      { id: "b", name: "Ají de Gallina", quantity: 1, done: false },
    ],
  },
  {
    tableLabel: "Mesa 02",
    items: [
      { id: "a", name: "Anticuchos de Corazón", quantity: 1, done: false },
      { id: "b", name: "Pisco Sour Clásico", quantity: 2, done: false },
    ],
  },
  {
    tableLabel: "Mesa 05",
    items: [
      { id: "a", name: "Picarones Tradicionales", quantity: 2, done: false },
      { id: "b", name: "Suspiro a la Limeña", quantity: 1, done: false },
    ],
  },
];

/**
 * Crea las comandas iniciales de la demo con horas relativas al momento actual,
 * para que se vean los tres colores del tiempo transcurrido.
 *
 * @returns Comandas en orden FIFO (la más antigua primero), numeradas desde 1.
 */
export const createInitialKitchenTickets = (): KitchenTicket[] =>
  INITIAL_TEMPLATES.map(({ minutesAgo: ago, ticket }, index) => ({
    ...ticket,
    id: `ticket-${index + 1}`,
    number: index + 1,
    sentAt: minutesAgo(ago),
    alert: null,
  }));

/**
 * Construye una comanda nueva a partir de una plantilla, recibida "ahora".
 *
 * @param template - Mesa, nota y platos de la ronda.
 * @param number - Número de comanda a mostrar como `#N`.
 */
export const createKitchenTicket = (
  template: TicketTemplate,
  number: number,
): KitchenTicket => ({
  ...template,
  items: template.items.map((item) => ({ ...item })),
  id: `ticket-${number}`,
  number,
  sentAt: new Date(),
  alert: null,
});
