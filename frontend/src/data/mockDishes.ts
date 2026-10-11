import type { Category, Dish } from '../types/menu'

export const CATEGORIES: Category[] = [
  { id: 'ENTRADAS', label: 'Entradas' },
  { id: 'PRINCIPALES', label: 'Principales' },
  { id: 'POSTRES', label: 'Postres' },
  { id: 'BEBIDAS', label: 'Bebidas' },
]

export const MOCK_DISHES: Dish[] = [
  // --- ENTRADAS ---
  {
    id: 'dish-1',
    name: 'Ceviche Clásico',
    price: 16.5,
    category: 'ENTRADAS',
    description: 'Pescado fresco del día en leche de tigre de ají limo, acompañado de camote glaseado, choclo desgranado y cancha serrana crujiente.',
    imageUrl: '/images/dishes/ceviche-clasico.png',
    isAvailable: true,
    options: [
      {
        name: 'Nivel de Picante',
        choices: ['Sin picante', 'Medio', 'Picante tradicional']
      }
    ]
  },
  {
    id: 'dish-2',
    name: 'Causa Limeña de Pollo',
    price: 11.0,
    category: 'ENTRADAS',
    description: 'Papa amarilla prensada y sazonada con ají amarillo y limón, rellena de pollo deshilachado, palta y mayonesa casera.',
    imageUrl: '/images/dishes/causa-limena-pollo.png',
    isAvailable: true
  },
  {
    id: 'dish-3',
    name: 'Anticuchos de Corazón',
    price: 13.0,
    category: 'ENTRADAS',
    description: 'Brochetas de corazón de res marinadas en ají panca y especias a la parrilla, servidas con papa dorada y choclo.',
    imageUrl: '/images/dishes/anticuchos.png',
    isAvailable: true
  },
  {
    id: 'dish-4',
    name: 'Papa a la Huancaína',
    price: 9.5,
    category: 'ENTRADAS',
    description: 'Rodajas de papa cocida bañadas en crema suave de ají amarillo y queso fresco, decoradas con huevo duro y aceituna botija.',
    imageUrl: '/images/dishes/papa-huancaina.png',
    isAvailable: true
  },

  // --- PRINCIPALES ---
  {
    id: 'dish-5',
    name: 'Lomo Saltado Tradicional',
    price: 19.0,
    category: 'PRINCIPALES',
    description: 'Tiras de solomillo salteadas al wok a fuego alto con cebolla roja, tomate, ají amarillo y cilantro. Acompañado de papas fritas y arroz blanco.',
    imageUrl: '/images/dishes/lomo-saltado.png',
    isAvailable: true,
    options: [
      {
        name: 'Término de la carne',
        choices: ['Jugoso', 'En su punto', 'Bien cocido']
      }
    ]
  },
  {
    id: 'dish-6',
    name: 'Ají de Gallina',
    price: 15.5,
    category: 'PRINCIPALES',
    description: 'Pechuga de pollo deshilachada en crema tersa de ají amarillo, nueces y queso parmesano. Servido con papa, arroz blanco y aceituna.',
    imageUrl: '/images/dishes/aji-de-gallina.png',
    isAvailable: true
  },
  {
    id: 'dish-7',
    name: 'Arroz con Mariscos',
    price: 18.0,
    category: 'PRINCIPALES',
    description: 'Arroz meloso especiado con ají panca y vino blanco, salteado con langostinos, calamares y choros. Coronado con sarsa criolla.',
    imageUrl: '/images/dishes/arroz-mariscos.png',
    isAvailable: true
  },
  {
    id: 'dish-8',
    name: 'Seco de Res con Frejoles',
    price: 17.0,
    category: 'PRINCIPALES',
    description: 'Guiso tradicional de res macerado en cilantro y chicha de jora, servido sobre frejoles canario cremosos y arroz.',
    imageUrl: '/images/dishes/seco-res.png',
    isAvailable: true
  },

  // --- POSTRES ---
  {
    id: 'dish-9',
    name: 'Suspiro a la Limeña',
    price: 6.5,
    category: 'POSTRES',
    description: 'Manjar blanco cremoso de leche condensada y yemas, cubierto con merengue al oporto y canela en polvo.',
    imageUrl: '/images/dishes/suspiro-limeno.png',
    isAvailable: true
  },
  {
    id: 'dish-10',
    name: 'Picarones Tradicionales',
    price: 6.0,
    category: 'POSTRES',
    description: 'Buñuelos crujientes de zapallo y camote fritos al momento, bañados en miel de chancaca con higo.',
    imageUrl: '/images/dishes/picarones.png',
    isAvailable: true
  },

  // --- BEBIDAS ---
  {
    id: 'dish-11',
    name: 'Chicha Morada Artesanal (Jarra 1L)',
    price: 9.0,
    category: 'BEBIDAS',
    description: 'Bebida tradicional elaborada en casa con maíz morado, piña, manzana, canela y clavo de olor.',
    imageUrl: '/images/dishes/chicha-morada.png',
    isAvailable: true
  },
  {
    id: 'dish-12',
    name: 'Pisco Sour Clásico',
    price: 9.5,
    category: 'BEBIDAS',
    description: 'Pisco Quebranta, zumo de lima recién exprimido, jarabe de goma, clara de huevo y gotas de amargo de Angostura.',
    imageUrl: '/images/dishes/pisco-sour.png',
    isAvailable: true
  }
]