import React from "react";

export type BadgeVariant =
  | "default"
  | "libre"
  | "decidiendo"
  | "esperando"
  | "servido"
  | "cuenta"
  | "limpiando"
  | "reservada"
  | "draft"
  | "preparing"
  | "ready";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  icon,
  className = "",
}) => {
  // Mapeo de estilos según las variables de color CSS del proyecto
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-slate-100 text-slate-700 border-slate-200",

    // Estados de mesa
    libre: "bg-table-libre/15 text-[#4D8B6F] border-table-libre/30",
    decidiendo:
      "bg-table-decidiendo/15 text-[#C96B3C] border-table-decidiendo/30",
    esperando: "bg-table-esperando/15 text-[#B83E3E] border-table-esperando/30",
    servido: "bg-table-servido/15 text-[#5A7A32] border-table-servido/30",
    cuenta: "bg-table-cuenta/15 text-[#6D5DB3] border-table-cuenta/30",
    limpiando: "bg-table-limpiando/30 text-slate-600 border-table-limpiando",
    reservada: "bg-table-reservada/20 text-[#A87226] border-table-reservada/40",

    // Estados de pedidos/kds
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    preparing: "bg-blue-50 text-blue-700 border-blue-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
