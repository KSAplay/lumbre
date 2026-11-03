import { useRef, type ChangeEvent } from "react";
import { ImagePlus, type LucideIcon } from "lucide-react";

type ImageDropZoneProps = {
  previewUrl: string | null;
  hint: string;
  /** `square` para platos 1:1; `circle` para avatares. */
  shape?: "square" | "circle";
  emptyIcon?: LucideIcon;
  onFile: (file: File | null) => void;
};

/**
 * Zona de subida de imagen con borde discontinuo y vista previa.
 */
export const ImageDropZone = ({
  previewUrl,
  hint,
  shape = "square",
  emptyIcon: EmptyIcon = ImagePlus,
  onFile,
}: ImageDropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isCircle = shape === "circle";

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFile(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-slate-100 bg-canvas-muted transition-colors hover:border-terracotta-200 hover:bg-terracotta-100/40 ${
          isCircle
            ? "size-28 rounded-full"
            : "aspect-square w-40 rounded-lg"
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <EmptyIcon
            className="size-8 text-slate-100"
            strokeWidth={1.6}
            aria-hidden
          />
        )}
      </button>
      <p className="text-center text-[11px] leading-snug text-text-muted">
        {hint}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
};
