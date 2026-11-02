import type { StaffRole } from "../models/Staff.js";

declare global {
  namespace Express {
    interface Request {
      staff?: {
        id: string;
        role: StaffRole;
      };
    }
  }
}

export {};
