const KNOWN_PILLS: Record<string, string> = {
  ENTRADAS: "bg-latte-100 text-latte-500",
  PRINCIPALES: "bg-terracotta-100 text-terracotta-400",
  POSTRES: "bg-cacao-100 text-cacao-300",
  BEBIDAS: "bg-toast-blue-soft text-status-pendiente",
};

const FALLBACK_PILLS = [
  "bg-latte-100 text-latte-500",
  "bg-terracotta-100 text-terracotta-400",
  "bg-cacao-100 text-cacao-300",
  "bg-toast-blue-soft text-status-pendiente",
];

/**
 * Color de pastilla de una categoría. Las conocidas tienen color fijo;
 * el resto recorre la misma paleta.
 */
export function categoryPillClass(slug: string): string {
  const known = KNOWN_PILLS[slug];
  if (known) return known;
  let hash = 0;
  for (const char of slug) hash += char.charCodeAt(0);
  return FALLBACK_PILLS[hash % FALLBACK_PILLS.length] ?? FALLBACK_PILLS[0];
}

type CategoryPillProps = {
  slug: string;
  label: string;
};

/** Etiqueta de categoría, sin borde, al estilo de Visible / Oculto. */
export const CategoryPill = ({ slug, label }: CategoryPillProps) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${categoryPillClass(slug)}`}
  >
    {label}
  </span>
);
