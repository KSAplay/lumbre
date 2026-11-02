import type { LucideIcon } from "lucide-react";

type LoadErrorStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

export const LoadErrorState = ({
  icon: Icon,
  title,
  description = "Revisa tu conexión e inténtalo de nuevo.",
  className = "",
}: LoadErrorStateProps) => (
  <div
    role="alert"
    className={`flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 text-center ${className}`}
  >
    <Icon
      className="size-16 text-text-main md:size-20"
      strokeWidth={1.4}
      aria-hidden
    />
    <div className="flex flex-col gap-1">
      <p className="text-base font-bold text-text-main md:text-lg">{title}</p>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  </div>
);
