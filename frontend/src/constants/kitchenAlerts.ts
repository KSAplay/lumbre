import type { LucideIcon } from "lucide-react";
import { Megaphone, PackageX, RotateCcw } from "lucide-react";
import type { ToastTone } from "../components/ui/Toast";
import type { KitchenAlertType } from "../types/kitchen";

type KitchenAlertConfig = {
  /** Texto bajo el botón del modal */
  label: string;
  /** Texto corto de la pestaña sobre el ticket */
  tabLabel: string;
  icon: LucideIcon;
  bg: string;
  ring: string;
  text: string;
  toastTone: ToastTone;
};

export const KITCHEN_ALERTS: Record<KitchenAlertType, KitchenAlertConfig> = {
  falta_producto: {
    label: "Falta producto",
    tabLabel: "Falta producto",
    icon: PackageX,
    bg: "bg-status-urgente",
    ring: "ring-status-urgente",
    text: "text-status-urgente",
    toastTone: "red",
  },
  repitiendo: {
    label: "Repitiendo plato",
    tabLabel: "Repitiendo",
    icon: RotateCcw,
    bg: "bg-table-cuenta",
    ring: "ring-table-cuenta",
    text: "text-table-cuenta",
    toastTone: "purple",
  },
  venir_cocina: {
    label: "Venir a cocina",
    tabLabel: "Venir a cocina",
    icon: Megaphone,
    bg: "bg-status-pendiente",
    ring: "ring-status-pendiente",
    text: "text-status-pendiente",
    toastTone: "blue",
  },
};

export const KITCHEN_ALERT_ORDER: KitchenAlertType[] = [
  "falta_producto",
  "repitiendo",
  "venir_cocina",
];
