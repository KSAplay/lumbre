import { ChevronRight } from "lucide-react";
import { KITCHEN_ALERTS } from "../../constants/kitchenAlerts";
import { WAITER_NOTIFICATIONS } from "../../constants/waiterNotifications";
import type { WaiterNotification } from "../../types/waiter";
import { formatAppTime } from "../../utils/dateTime";
import { formatStatusElapsed } from "../../utils/tableTime";

type WaiterNotificationItemProps = {
  notification: WaiterNotification;
  nowMs: number;
  onOpen: (notification: WaiterNotification) => void;
};

export const WaiterNotificationItem = ({
  notification,
  nowMs,
  onOpen,
}: WaiterNotificationItemProps) => {
  const config = WAITER_NOTIFICATIONS[notification.type];
  const kitchenConfig = notification.kitchenAlert
    ? KITCHEN_ALERTS[notification.kitchenAlert]
    : null;
  const Icon = kitchenConfig?.icon ?? config.icon;
  const iconBg = kitchenConfig?.bg ?? config.iconBg;
  const title = kitchenConfig?.label ?? config.label;
  const unread = !notification.read;
  const elapsedSeconds = (nowMs - notification.createdAt.getTime()) / 1000;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-[background-color,transform] duration-300 active:scale-[0.98] ${
          unread ? "bg-canvas-white shadow-sm" : "bg-canvas-muted/60"
        }`}
      >
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
            unread ? `${iconBg} text-white` : "bg-slate-50 text-slate-100"
          }`}
        >
          <Icon className="size-5.5" strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`truncate text-[14px] transition-colors duration-300 ${
                unread
                  ? "font-black text-text-main"
                  : "font-semibold text-slate-100"
              }`}
            >
              {title}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors duration-300 ${
                unread
                  ? "bg-cacao-300 text-white"
                  : "bg-slate-50 text-slate-100"
              }`}
            >
              {notification.tableLabel}
            </span>
          </div>
          <p
            className={`mt-0.5 truncate text-[13px] transition-colors duration-300 ${
              unread ? "text-text-muted" : "text-slate-100"
            }`}
          >
            {notification.message}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-100 tabular-nums">
            {formatAppTime(notification.createdAt)} · hace{" "}
            {formatStatusElapsed(elapsedSeconds)}
          </p>
        </div>

        {unread ? (
          <span
            className="size-2.5 shrink-0 rounded-full bg-terracotta-300"
            aria-label="Sin leer"
          />
        ) : (
          <ChevronRight
            className="size-4 shrink-0 text-slate-100"
            aria-hidden
          />
        )}
      </button>
    </li>
  );
};
