import type { KitchenAlertType, OrderStatus } from "../models/Order.js";
import type { NotificationType } from "../models/Notification.js";
import type { StaffRole } from "../models/Staff.js";
import type {
  TableOrientation,
  TableShape,
  TableStatus,
} from "../models/Table.js";
import type {
  WallCornerKind,
  WallRotation,
  WallShape,
} from "../models/Zone.js";

/**
 * Snapshot inicial de Lumbre que `npm run seed` vuelca en MongoDB.
 * Los tiempos son relativos (`minutesAgo`) y se convierten a fechas al ejecutar el seed.
 */

export type MockStaff = {
  name: string;
  pin: string;
  role: StaffRole;
};

export type MockCategory = {
  slug: string;
  name: string;
};

export type MockDish = {
  code: number;
  name: string;
  price: number;
  categorySlug: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  options?: { name: string; choices: string[] }[];
};

export type MockWall = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  shape?: WallShape;
  rotation?: WallRotation;
  corners?: {
    nw: WallCornerKind;
    ne: WallCornerKind;
    se: WallCornerKind;
    sw: WallCornerKind;
  };
};

export type MockZone = {
  slug: string;
  name: string;
  walls: MockWall[];
};

export type MockTable = {
  id: string;
  number: number;
  capacity: number;
  shape: TableShape;
  zone: string;
  orientation?: TableOrientation;
  position: { x: number; y: number };
  state?: {
    status: TableStatus;
    guestCount: number;
    minutesAgo: number;
    reservation?: { guestName: string; time: string };
  };
};

export type MockRound = {
  number: number;
  tableId: string;
  tableNumber: number;
  status: OrderStatus;
  minutesAgo: number;
  note?: string;
  alert?: KitchenAlertType;
  items: {
    dishCode: number;
    quantity: number;
    done?: boolean;
  }[];
};

export type MockNotification = {
  type: NotificationType;
  tableId: string;
  message: string;
  minutesAgo: number;
  read: boolean;
  kitchenAlert?: KitchenAlertType;
  /** Número de la ronda relacionada (se resuelve a su `_id` en el seed). */
  roundNumber?: number;
};

const SQUARE_CORNERS = {
  nw: "square",
  ne: "square",
  se: "square",
  sw: "square",
} as const;

export const staffMock: MockStaff[] = [
  { name: "Recepción", pin: "1111", role: "recepcion" },
  { name: "Cocina", pin: "2222", role: "cocina" },
  { name: "Camarero", pin: "3333", role: "camarero" },
  { name: "Backoffice", pin: "9999", role: "backoffice" },
];

export const categoriesMock: MockCategory[] = [
  { slug: "ENTRADAS", name: "Entradas" },
  { slug: "PRINCIPALES", name: "Principales" },
  { slug: "POSTRES", name: "Postres" },
  { slug: "BEBIDAS", name: "Bebidas" },
];

export const dishesMock: MockDish[] = [
  {
    code: 1,
    name: "Ceviche Clásico",
    price: 16.5,
    categorySlug: "ENTRADAS",
    description:
      "Pescado fresco del día en leche de tigre de ají limo, acompañado de camote glaseado, choclo desgranado y cancha serrana crujiente.",
    imageUrl: "/uploads/dishes/ceviche-clasico.png",
    isAvailable: true,
    options: [
      {
        name: "Nivel de Picante",
        choices: ["Sin picante", "Medio", "Picante tradicional"],
      },
    ],
  },
  {
    code: 2,
    name: "Causa Limeña de Pollo",
    price: 11,
    categorySlug: "ENTRADAS",
    description:
      "Papa amarilla prensada y sazonada con ají amarillo y limón, rellena de pollo deshilachado, palta y mayonesa casera.",
    imageUrl: "/uploads/dishes/causa-limena-pollo.png",
    isAvailable: true,
  },
  {
    code: 3,
    name: "Anticuchos de Corazón",
    price: 13,
    categorySlug: "ENTRADAS",
    description:
      "Brochetas de corazón de res marinadas en ají panca y especias a la parrilla, servidas con papa dorada y choclo.",
    imageUrl: "/uploads/dishes/anticuchos.png",
    isAvailable: true,
  },
  {
    code: 4,
    name: "Papa a la Huancaína",
    price: 9.5,
    categorySlug: "ENTRADAS",
    description:
      "Rodajas de papa cocida bañadas en crema suave de ají amarillo y queso fresco, decoradas con huevo duro y aceituna botija.",
    imageUrl: "/uploads/dishes/papa-huancaina.png",
    isAvailable: true,
  },
  {
    code: 5,
    name: "Lomo Saltado Tradicional",
    price: 19,
    categorySlug: "PRINCIPALES",
    description:
      "Tiras de solomillo salteadas al wok a fuego alto con cebolla roja, tomate, ají amarillo y cilantro. Acompañado de papas fritas y arroz blanco.",
    imageUrl: "/uploads/dishes/lomo-saltado.png",
    isAvailable: true,
    options: [
      {
        name: "Término de la carne",
        choices: ["Jugoso", "En su punto", "Bien cocido"],
      },
    ],
  },
  {
    code: 6,
    name: "Ají de Gallina",
    price: 15.5,
    categorySlug: "PRINCIPALES",
    description:
      "Pechuga de pollo deshilachada en crema tersa de ají amarillo, nueces y queso parmesano. Servido con papa, arroz blanco y aceituna.",
    imageUrl: "/uploads/dishes/aji-de-gallina.png",
    isAvailable: true,
  },
  {
    code: 7,
    name: "Arroz con Mariscos",
    price: 18,
    categorySlug: "PRINCIPALES",
    description:
      "Arroz meloso especiado con ají panca y vino blanco, salteado con langostinos, calamares y choros. Coronado con sarsa criolla.",
    imageUrl: "/uploads/dishes/arroz-mariscos.png",
    isAvailable: true,
  },
  {
    code: 8,
    name: "Seco de Res con Frejoles",
    price: 17,
    categorySlug: "PRINCIPALES",
    description:
      "Guiso tradicional de res macerado en cilantro y chicha de jora, servido sobre frejoles canario cremosos y arroz.",
    imageUrl: "/uploads/dishes/seco-res.png",
    isAvailable: true,
  },
  {
    code: 9,
    name: "Suspiro a la Limeña",
    price: 6.5,
    categorySlug: "POSTRES",
    description:
      "Manjar blanco cremoso de leche condensada y yemas, cubierto con merengue al oporto y canela en polvo.",
    imageUrl: "/uploads/dishes/suspiro-limeno.png",
    isAvailable: true,
  },
  {
    code: 10,
    name: "Picarones Tradicionales",
    price: 6,
    categorySlug: "POSTRES",
    description:
      "Buñuelos crujientes de zapallo y camote fritos al momento, bañados en miel de chancaca con higo.",
    imageUrl: "/uploads/dishes/picarones.png",
    isAvailable: true,
  },
  {
    code: 11,
    name: "Chicha Morada Artesanal (Jarra 1L)",
    price: 9,
    categorySlug: "BEBIDAS",
    description:
      "Bebida tradicional elaborada en casa con maíz morado, piña, manzana, canela y clavo de olor.",
    imageUrl: "/uploads/dishes/chicha-morada.png",
    isAvailable: true,
  },
  {
    code: 12,
    name: "Pisco Sour Clásico",
    price: 9.5,
    categorySlug: "BEBIDAS",
    description:
      "Pisco Quebranta, zumo de lima recién exprimido, jarabe de goma, clara de huevo y gotas de amargo de Angostura.",
    imageUrl: "/uploads/dishes/pisco-sour.png",
    isAvailable: true,
  },
];

export const zonesMock: MockZone[] = [
  {
    slug: "interior",
    name: "Interior",
    walls: [
      {
        id: "W-I-BARRA",
        x: 46,
        y: 2,
        width: 30,
        height: 8,
        name: "Barra",
        shape: "rectangle",
        rotation: 0,
        corners: { nw: "square", ne: "square", se: "square", sw: "round" },
      },
      {
        id: "W-I-COCINA",
        x: 78,
        y: 2,
        width: 20,
        height: 32,
        name: "Cocina",
        shape: "rectangle",
        rotation: 0,
        corners: SQUARE_CORNERS,
      },
      {
        id: "W-I-BANOS",
        x: 82,
        y: 70,
        width: 16,
        height: 28,
        name: "Baños",
        shape: "rectangle",
        rotation: 0,
        corners: SQUARE_CORNERS,
      },
    ],
  },
  {
    slug: "terraza",
    name: "Terraza",
    walls: [
      {
        id: "W-T-FACHADA",
        x: 2,
        y: 2,
        width: 96,
        height: 5,
        name: "Fachada",
        shape: "rectangle",
        rotation: 0,
        corners: SQUARE_CORNERS,
      },
      {
        id: "W-T-JARDINERA",
        x: 10,
        y: 92,
        width: 80,
        height: 5,
        name: "Jardinera",
        shape: "rectangle",
        rotation: 0,
        corners: { nw: "round", ne: "round", se: "round", sw: "round" },
      },
    ],
  },
];

export const tablesMock: MockTable[] = [
  {
    id: "I01",
    number: 1,
    capacity: 10,
    shape: "rectangle",
    zone: "interior",
    orientation: "horizontal",
    position: { x: 14, y: 26 },
    state: { status: "servido", guestCount: 8, minutesAgo: 18 },
  },
  {
    id: "I02",
    number: 2,
    capacity: 8,
    shape: "rectangle",
    zone: "interior",
    orientation: "horizontal",
    position: { x: 14, y: 57 },
    state: {
      status: "reservada",
      guestCount: 6,
      minutesAgo: 0,
      reservation: { guestName: "Familia Ruiz", time: "21:30" },
    },
  },
  {
    id: "I03",
    number: 3,
    capacity: 4,
    shape: "square",
    zone: "interior",
    position: { x: 35, y: 30 },
    state: { status: "decidiendo", guestCount: 3, minutesAgo: 6 },
  },
  {
    id: "I04",
    number: 4,
    capacity: 4,
    shape: "square",
    zone: "interior",
    position: { x: 51, y: 30 },
    state: { status: "esperando", guestCount: 4, minutesAgo: 22 },
  },
  {
    id: "I05",
    number: 5,
    capacity: 4,
    shape: "square",
    zone: "interior",
    position: { x: 67, y: 30 },
    state: { status: "cuenta", guestCount: 2, minutesAgo: 6 },
  },
  {
    id: "I06",
    number: 6,
    capacity: 4,
    shape: "square",
    zone: "interior",
    position: { x: 35, y: 57 },
  },
  {
    id: "I07",
    number: 7,
    capacity: 4,
    shape: "square",
    zone: "interior",
    position: { x: 51, y: 57 },
    state: { status: "esperando", guestCount: 4, minutesAgo: 9 },
  },
  {
    id: "I08",
    number: 8,
    capacity: 4,
    shape: "square",
    zone: "interior",
    position: { x: 67, y: 57 },
    state: { status: "limpiando", guestCount: 0, minutesAgo: 2 },
  },
  {
    id: "I09",
    number: 9,
    capacity: 2,
    shape: "square",
    zone: "interior",
    orientation: "vertical",
    position: { x: 10, y: 86 },
  },
  {
    id: "I10",
    number: 10,
    capacity: 2,
    shape: "square",
    zone: "interior",
    orientation: "vertical",
    position: { x: 24, y: 86 },
  },
  {
    id: "I11",
    number: 11,
    capacity: 2,
    shape: "square",
    zone: "interior",
    orientation: "vertical",
    position: { x: 38, y: 86 },
  },
  {
    id: "I12",
    number: 12,
    capacity: 2,
    shape: "square",
    zone: "interior",
    orientation: "vertical",
    position: { x: 52, y: 86 },
    state: { status: "esperando", guestCount: 2, minutesAgo: 3 },
  },
  {
    id: "I13",
    number: 13,
    capacity: 2,
    shape: "square",
    zone: "interior",
    orientation: "vertical",
    position: { x: 66, y: 86 },
    state: { status: "decidiendo", guestCount: 2, minutesAgo: 1 },
  },
  {
    id: "T01",
    number: 14,
    capacity: 2,
    shape: "circle",
    zone: "terraza",
    position: { x: 10, y: 26 },
  },
  {
    id: "T02",
    number: 15,
    capacity: 4,
    shape: "circle",
    zone: "terraza",
    position: { x: 28, y: 26 },
    state: { status: "servido", guestCount: 4, minutesAgo: 31 },
  },
  {
    id: "T03",
    number: 16,
    capacity: 4,
    shape: "circle",
    zone: "terraza",
    position: { x: 47, y: 26 },
    state: { status: "decidiendo", guestCount: 3, minutesAgo: 7 },
  },
  {
    id: "T04",
    number: 17,
    capacity: 4,
    shape: "circle",
    zone: "terraza",
    position: { x: 66, y: 26 },
  },
  {
    id: "T05",
    number: 18,
    capacity: 2,
    shape: "circle",
    zone: "terraza",
    position: { x: 85, y: 26 },
  },
  {
    id: "T06",
    number: 19,
    capacity: 6,
    shape: "circle",
    zone: "terraza",
    position: { x: 18, y: 64 },
    state: { status: "cuenta", guestCount: 5, minutesAgo: 12 },
  },
  {
    id: "T07",
    number: 20,
    capacity: 8,
    shape: "circle",
    zone: "terraza",
    position: { x: 45, y: 64 },
    state: {
      status: "reservada",
      guestCount: 8,
      minutesAgo: 0,
      reservation: { guestName: "Lucía M.", time: "21:30" },
    },
  },
  {
    id: "T08",
    number: 21,
    capacity: 4,
    shape: "circle",
    zone: "terraza",
    position: { x: 74, y: 64 },
  },
];

export const roundsMock: MockRound[] = [
  {
    number: 1,
    tableId: "I04",
    tableNumber: 4,
    status: "en_cocina",
    minutesAgo: 22,
    note: "Uno de los comensales es celíaco, por favor sin trazas de gluten.",
    alert: "falta_producto",
    items: [
      { dishCode: 5, quantity: 2, done: true },
      { dishCode: 6, quantity: 1 },
      { dishCode: 11, quantity: 1 },
    ],
  },
  {
    number: 2,
    tableId: "I07",
    tableNumber: 7,
    status: "en_cocina",
    minutesAgo: 9,
    note: "El ceviche sin picante, es para un niño.",
    items: [
      { dishCode: 1, quantity: 2 },
      { dishCode: 4, quantity: 1 },
    ],
  },
  {
    number: 3,
    tableId: "I12",
    tableNumber: 12,
    status: "en_cocina",
    minutesAgo: 3,
    items: [
      { dishCode: 7, quantity: 1 },
      { dishCode: 8, quantity: 1 },
      { dishCode: 3, quantity: 2 },
      { dishCode: 10, quantity: 1 },
    ],
  },
  {
    number: 4,
    tableId: "I03",
    tableNumber: 3,
    status: "por_confirmar",
    minutesAgo: 6,
    note: "Una de las causas sin mayonesa, por favor.",
    items: [
      { dishCode: 2, quantity: 2 },
      { dishCode: 5, quantity: 1 },
      { dishCode: 12, quantity: 3 },
    ],
  },
  {
    number: 5,
    tableId: "T03",
    tableNumber: 16,
    status: "por_confirmar",
    minutesAgo: 2,
    items: [
      { dishCode: 1, quantity: 1 },
      { dishCode: 11, quantity: 12 },
    ],
  },
  {
    number: 6,
    tableId: "I13",
    tableNumber: 13,
    status: "por_confirmar",
    minutesAgo: 1,
    items: [
      { dishCode: 3, quantity: 1 },
      { dishCode: 6, quantity: 1 },
    ],
  },
  {
    number: 7,
    tableId: "I01",
    tableNumber: 1,
    status: "servido",
    minutesAgo: 25,
    note: "Compartir los platos en el centro.",
    items: [
      { dishCode: 1, quantity: 2 },
      { dishCode: 5, quantity: 3 },
      { dishCode: 11, quantity: 2 },
    ],
  },
  {
    number: 8,
    tableId: "T02",
    tableNumber: 15,
    status: "servido",
    minutesAgo: 35,
    items: [
      { dishCode: 7, quantity: 2 },
      { dishCode: 12, quantity: 4 },
    ],
  },
  {
    number: 9,
    tableId: "I05",
    tableNumber: 5,
    status: "servido",
    minutesAgo: 40,
    items: [
      { dishCode: 2, quantity: 1 },
      { dishCode: 6, quantity: 1 },
      { dishCode: 9, quantity: 2 },
    ],
  },
  {
    number: 10,
    tableId: "T06",
    tableNumber: 19,
    status: "servido",
    minutesAgo: 45,
    items: [
      { dishCode: 5, quantity: 2 },
      { dishCode: 8, quantity: 2 },
      { dishCode: 10, quantity: 3 },
      { dishCode: 11, quantity: 2 },
    ],
  },
];

export const notificationsMock: MockNotification[] = [
  {
    type: "plato_listo",
    tableId: "I01",
    message: "La comanda está lista para servir.",
    minutesAgo: 14,
    read: true,
  },
  {
    type: "incidencia_cocina",
    tableId: "I04",
    message: "Falta producto: Ají de Gallina.",
    minutesAgo: 9,
    read: true,
    kitchenAlert: "falta_producto",
    roundNumber: 1,
  },
  {
    type: "nuevo_pedido",
    tableId: "I03",
    message: "Nueva ronda pendiente de confirmar.",
    minutesAgo: 6,
    read: false,
    roundNumber: 4,
  },
  {
    type: "cuenta",
    tableId: "I05",
    message: "La mesa ha pedido la cuenta.",
    minutesAgo: 4,
    read: false,
  },
  {
    type: "nuevo_pedido",
    tableId: "T03",
    message: "Nueva ronda pendiente de confirmar.",
    minutesAgo: 2,
    read: false,
    roundNumber: 5,
  },
  {
    type: "nuevo_pedido",
    tableId: "I13",
    message: "Nueva ronda pendiente de confirmar.",
    minutesAgo: 1,
    read: false,
    roundNumber: 6,
  },
];
