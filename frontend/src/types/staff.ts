import type { StaffRole } from "../services/authService";

export type StaffGender = "hombre" | "mujer";

export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  gender: StaffGender;
  imageUrl?: string;
  active: boolean;
  sharedPin: boolean;
  pin: string;
};
