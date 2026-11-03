import {
  ChefHat,
  ConciergeBell,
  HandPlatter,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { StaffRole } from "../services/authService";

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  recepcion: "Recepción",
  cocina: "Cocina",
  camarero: "Camarero",
  backoffice: "Administración",
};

export const STAFF_ROLE_ICONS: Record<StaffRole, LucideIcon> = {
  recepcion: ConciergeBell,
  cocina: ChefHat,
  camarero: HandPlatter,
  backoffice: Shield,
};

export const STAFF_ROLE_OPTIONS: StaffRole[] = [
  "recepcion",
  "cocina",
  "camarero",
  "backoffice",
];
