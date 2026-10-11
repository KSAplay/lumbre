// Estados de un elemento individual de la comanda
export type OrderItemStatus = 'draft' | 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

// Estado de la ronda completa
export type RoundStatus = 'draft' | 'sent' | 'in_kitchen' | 'served';

// Estado global de la sesión de pago
export type PaymentStatus = 'pending' | 'bill_requested' | 'paid';

// Producto individual dentro de un pedido
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;         // Ej: 'Sin cebolla', 'Salsa aparte'
  status: OrderItemStatus;
}

// Una ronda (lote) de pedidos enviada por la mesa
export interface OrderRound {
  id: string;
  roundNumber: number;    // Ronda 1, Ronda 2...
  items: OrderItem[];
  status: RoundStatus;
  createdAt: string;      // ISO Timestamp
}

// Sesión activa de una mesa que agrupa sus rondas
export interface TableSession {
  id: string;
  tableId: string;
  rounds: OrderRound[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'cash' | 'card';
  createdAt: string;
}