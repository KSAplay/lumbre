import { createContext, type ReactNode } from "react";
import type { ToastTone } from "./Toast";

export type ToastPosition =
  | "top-center"
  | "top-left"
  | "top-right"
  | "bottom-center"
  | "bottom-left"
  | "bottom-right";

export type ToastInput = {
  message: string;
  icon?: ReactNode;
  tone?: ToastTone;
  position?: ToastPosition;
  durationMs?: number;
};

export type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
