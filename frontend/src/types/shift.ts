export type ShiftProduct = {
  dishCode: number;
  name: string;
  quantity: number;
  revenue: number;
};

export type ShiftDetail = {
  id: string;
  startedAt: Date;
  endedAt: Date;
  closedByName: string;
  totalRevenue: number;
  tablesPaid: number;
  guestsServed: number;
  averageTicket: number;
  products: ShiftProduct[];
};
