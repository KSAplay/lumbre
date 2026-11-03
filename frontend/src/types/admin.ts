export type DaySummary = {
  totalRevenue: number;
  averageTicket: number;
  tablesPaid: number;
  guestsServed: number;
  topDish: { name: string; quantity: number; revenue: number } | null;
  topProducts: { name: string; quantity: number; revenue: number }[];
  occupiedTables: number;
  kitchenTickets: number;
};

export type RestaurantSettings = {
  restaurantName: string;
};

export type AdminCategory = {
  id: string;
  label: string;
  sortOrder: number;
  active: boolean;
};
