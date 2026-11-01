import type { LucideIcon } from "lucide-react";
import {
  ChefHat,
  ClipboardClock,
  ConciergeBell,
  ReceiptEuro,
  TriangleAlert,
} from "lucide-react";
import type { ToastTone } from "../components/ui/Toast";
import type { WaiterNotificationType } from "../types/waiter";

type WaiterNotificationConfig = {
  label: string;
  icon: LucideIcon;
  /** Fondo del círculo del icono cuando el aviso no se ha leído */
  iconBg: string;
  toastTone: ToastTone;
};

export const WAITER_NOTIFICATIONS: Record<
  WaiterNotificationType,
  WaiterNotificationConfig
> = {
  nuevo_pedido: {
    label: "Nuevo pedido",
    icon: ClipboardClock,
    iconBg: "bg-status-pendiente",
    toastTone: "blue",
  },
  ayuda: {
    label: "Ayuda solicitada",
    icon: ConciergeBell,
    iconBg: "bg-cacao-300",
    toastTone: "cacao",
  },
  cuenta: {
    label: "Cuenta solicitada",
    icon: ReceiptEuro,
    iconBg: "bg-table-cuenta",
    toastTone: "purple",
  },
  plato_listo: {
    label: "Listo para servir",
    icon: ChefHat,
    iconBg: "bg-status-listo",
    toastTone: "green",
  },
  incidencia_cocina: {
    label: "Incidencia de cocina",
    icon: TriangleAlert,
    iconBg: "bg-status-urgente",
    toastTone: "red",
  },
};
