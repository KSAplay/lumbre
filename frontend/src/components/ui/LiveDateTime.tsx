import { useEffect, useState } from "react";
// Formato 12h / 24h: cambia USE_12_HOUR_CLOCK en utils/dateTime.ts
import { formatAppDate, formatAppTime } from "../../utils/dateTime";

type LiveDateTimeProps = {
  className?: string;
  /** compact = fecha · hora; stacked = fecha arriba; time = solo hora */
  layout?: "compact" | "stacked" | "time";
  showSeconds?: boolean;
};

/** Fecha y reloj en vivo (recepción, cocina, login…). */
export const LiveDateTime = ({
  className = "",
  layout = "stacked",
  showSeconds = true,
}: LiveDateTimeProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateLabel = formatAppDate(now);
  const timeLabel = formatAppTime(now, { showSeconds });

  if (layout === "time") {
    return (
      <time dateTime={now.toISOString()} className={className}>
        <span className="tabular-nums">{timeLabel}</span>
      </time>
    );
  }

  if (layout === "compact") {
    return (
      <time dateTime={now.toISOString()} className={className}>
        <span className="capitalize">{dateLabel}</span>
        <span aria-hidden className="mx-1.5 opacity-60">
          ·
        </span>
        <span className="tabular-nums">{timeLabel}</span>
      </time>
    );
  }

  return (
    <time
      dateTime={now.toISOString()}
      className={`flex flex-col ${className}`.trim()}
    >
      <span className="capitalize">{dateLabel}</span>
      <span className="tabular-nums">{timeLabel}</span>
    </time>
  );
};
