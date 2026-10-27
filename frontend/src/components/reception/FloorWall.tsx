import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type RefObject,
} from "react";
import { BrickWall } from "lucide-react";
import { EDIT_SNAP_PX } from "../../constants/floorPlan";
import type {
  FloorWallData,
  WallCornerKind,
  WallCorners,
  WallRotation,
  WallShape,
} from "../../types/table";

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
type CornerKey = "nw" | "ne" | "se" | "sw";

type FloorWallProps = {
  wall: FloorWallData;
  selected: boolean;
  editMode: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, next: Partial<FloorWallData>) => void;
  mapRef: RefObject<HTMLDivElement | null>;
};

const MIN_PCT = 3;
/** Separación fija muro ↔ asa (como sillas), en px */
const HANDLE_GAP_PX = 6;
/** Grosor fijo del asa, en px */
const HANDLE_DEPTH_PX = 7;
/** Longitud base de asas laterales; crece con el lado (tope) */
const SIDE_HANDLE_MIN_LEN_PX = 32;
const SIDE_HANDLE_MAX_LEN_PX = 72;
/** Espacio mínimo en un lado para mostrar el asa recta */
const SIDE_HANDLE_MIN_PX = 58;
const WALL_FILL = "var(--color-slate-50)";
const WALL_TEXT = "var(--color-slate-200)";
const HANDLE_COLOR = "var(--color-slate-200)";
/** Chaflán / radio muy marcados (más que el rounded-md de mesas) */
const CORNER_CUT_PCT = 40;
const CORNER_ROUND_PX = 48;

const DEFAULT_CORNERS: WallCorners = {
  nw: "square",
  ne: "square",
  se: "square",
  sw: "square",
};

function snapPct(percent: number, mapSizePx: number, gridPx: number): number {
  const px = (percent / 100) * mapSizePx;
  const snapped = Math.round(px / gridPx) * gridPx;
  return (snapped / mapSizePx) * 100;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function wallClipPath(
  shape: WallShape,
  corners: WallCorners,
): string | undefined {
  if (shape === "circle") return undefined;

  const cut = CORNER_CUT_PCT;
  const pts: string[] = [];

  if (corners.nw === "cut") pts.push(`0% ${cut}%`, `${cut}% 0%`);
  else pts.push("0% 0%");

  if (corners.ne === "cut") pts.push(`${100 - cut}% 0%`, `100% ${cut}%`);
  else pts.push("100% 0%");

  if (corners.se === "cut")
    pts.push(`100% ${100 - cut}%`, `${100 - cut}% 100%`);
  else pts.push("100% 100%");

  if (corners.sw === "cut") pts.push(`${cut}% 100%`, `0% ${100 - cut}%`);
  else pts.push("0% 100%");

  const hasCut = Object.values(corners).some((c) => c === "cut");
  return hasCut ? `polygon(${pts.join(", ")})` : undefined;
}

function wallBorderRadius(
  shape: WallShape,
  corners: WallCorners,
): string | undefined {
  if (shape === "circle") return "9999px";
  const r = (k: WallCornerKind) =>
    k === "round" ? `${CORNER_ROUND_PX}px` : "0";
  return `${r(corners.nw)} ${r(corners.ne)} ${r(corners.se)} ${r(corners.sw)}`;
}

/** Arco con trazo (terminaciones redondas vía strokeLinecap) */
function annularStrokePath(
  angleDeg: number,
  radius: number,
  gap: number,
  depth: number,
  chord: number,
): string {
  const r = radius + gap + depth / 2;
  const half = Math.atan(chord / 2 / r);
  const base = (angleDeg * Math.PI) / 180;
  const a0 = base - half;
  const a1 = base + half;
  const x0 = Math.sin(a0) * r;
  const y0 = -Math.cos(a0) * r;
  const x1 = Math.sin(a1) * r;
  const y1 = -Math.cos(a1) * r;
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
}

function cornerStrokePath(
  corner: CornerKey,
  halfW: number,
  halfH: number,
  gap: number,
  depth: number,
): string {
  const r = gap + depth / 2;
  const cx = corner === "nw" || corner === "sw" ? -halfW : halfW;
  const cy = corner === "nw" || corner === "ne" ? -halfH : halfH;

  const ranges: Record<CornerKey, [number, number]> = {
    nw: [Math.PI, (3 * Math.PI) / 2],
    ne: [(3 * Math.PI) / 2, 2 * Math.PI],
    se: [0, Math.PI / 2],
    sw: [Math.PI / 2, Math.PI],
  };
  const [a0, a1] = ranges[corner];
  const x0 = cx + Math.cos(a0) * r;
  const y0 = cy + Math.sin(a0) * r;
  const x1 = cx + Math.cos(a1) * r;
  const y1 = cy + Math.sin(a1) * r;
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
}

export const FloorWall = ({
  wall,
  selected,
  editMode,
  onSelect,
  onChange,
  mapRef,
}: FloorWallProps) => {
  const shape: WallShape = wall.shape === "circle" ? "circle" : "rectangle";
  const corners = wall.corners ?? DEFAULT_CORNERS;
  const rotation: WallRotation = wall.rotation ?? 0;
  const label = (wall.name?.trim() ?? "").toUpperCase();
  const showIcon = label.length === 0;

  const wallRef = useRef<HTMLButtonElement>(null);
  const [boxPx, setBoxPx] = useState({ w: 0, h: 0 });

  // Círculo: un solo tamaño en % de ancho; el alto visual usa aspect-ratio
  const circleSizePct = Math.min(wall.width, wall.height);

  useLayoutEffect(() => {
    const el = wallRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setBoxPx({ w: r.width, h: r.height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wall.width, wall.height, shape, selected, editMode]);

  const startMove = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSelect(wall.id);
    if (!editMode) return;

    e.preventDefault();
    const mapEl = mapRef.current;
    if (!mapEl) return;

    const rect = mapEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const sizeW = shape === "circle" ? circleSizePct : wall.width;
    const sizeH = shape === "circle" ? circleSizePct : wall.height;
    const orig = { x: wall.x, y: wall.y, width: sizeW, height: sizeH };

    e.currentTarget.setPointerCapture(e.pointerId);

    const onMove = (ev: globalThis.PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      let x = snapPct(orig.x + dx, rect.width, EDIT_SNAP_PX);
      let y = snapPct(orig.y + dy, rect.height, EDIT_SNAP_PX);
      x = clamp(x, 1, 99 - orig.width);
      y = clamp(y, 1, 99 - orig.height);
      onChange(wall.id, { x, y });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startResize =
    (handle: ResizeHandle) => (e: PointerEvent<SVGElement>) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect(wall.id);

      const mapEl = mapRef.current;
      if (!mapEl) return;

      const rect = mapEl.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const orig = {
        x: wall.x,
        y: wall.y,
        width: shape === "circle" ? circleSizePct : wall.width,
        height: shape === "circle" ? circleSizePct : wall.height,
      };

      const onMove = (ev: globalThis.PointerEvent) => {
        const dx = ((ev.clientX - startX) / rect.width) * 100;
        const dy = ((ev.clientY - startY) / rect.height) * 100;

        if (shape === "circle") {
          const signed =
            handle === "se"
              ? (dx + dy) / 2
              : handle === "nw"
                ? -(dx + dy) / 2
                : handle === "ne"
                  ? (dx - dy) / 2
                  : (-dx + dy) / 2;

          let size = snapPct(orig.width + signed, rect.width, EDIT_SNAP_PX);
          size = clamp(size, MIN_PCT, 40);
          const cx = orig.x + orig.width / 2;
          const cy = orig.y + orig.height / 2;
          // height se guarda igual; el render usa aspect-ratio 1
          const x = clamp(cx - size / 2, 1, 99 - size);
          const y = clamp(cy - size / 2, 1, 99 - size);
          onChange(wall.id, { x, y, width: size, height: size });
          return;
        }

        let { x, y, width, height } = orig;

        if (handle.includes("e")) {
          width = snapPct(orig.width + dx, rect.width, EDIT_SNAP_PX);
        }
        if (handle.includes("w")) {
          const nextW = snapPct(orig.width - dx, rect.width, EDIT_SNAP_PX);
          const nextX = snapPct(
            orig.x + (orig.width - nextW),
            rect.width,
            EDIT_SNAP_PX,
          );
          x = nextX;
          width = nextW;
        }
        if (handle.includes("s")) {
          height = snapPct(orig.height + dy, rect.height, EDIT_SNAP_PX);
        }
        if (handle.includes("n")) {
          const nextH = snapPct(orig.height - dy, rect.height, EDIT_SNAP_PX);
          const nextY = snapPct(
            orig.y + (orig.height - nextH),
            rect.height,
            EDIT_SNAP_PX,
          );
          y = nextY;
          height = nextH;
        }

        width = clamp(width, MIN_PCT, 98);
        height = clamp(height, MIN_PCT, 98);
        x = clamp(x, 1, 99 - width);
        y = clamp(y, 1, 99 - height);

        onChange(wall.id, { x, y, width, height });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

  const bodyStyle: CSSProperties = {
    backgroundColor: WALL_FILL,
    borderRadius: wallBorderRadius(shape, corners),
    clipPath: wallClipPath(shape, corners),
  };

  const g = HANDLE_GAP_PX;
  const d = HANDLE_DEPTH_PX;
  const halfW = boxPx.w / 2;
  const halfH = boxPx.h / 2;
  const pad = g + d + 6;
  const svgW = boxPx.w + pad * 2;
  const svgH = boxPx.h + pad * 2;
  const showSideNS = boxPx.w >= SIDE_HANDLE_MIN_PX;
  const showSideEW = boxPx.h >= SIDE_HANDLE_MIN_PX;

  const renderHandles = () => {
    if (!editMode || !selected || boxPx.w < 4 || boxPx.h < 4) return null;

    const strokeProps = {
      fill: "none" as const,
      stroke: HANDLE_COLOR,
      strokeWidth: d,
      strokeLinecap: "round" as const,
      className: "animate-wall-handle pointer-events-auto",
    };

    if (shape === "circle") {
      const radius = Math.min(halfW, halfH);
      const chord = 26;
      const angles: { deg: number; handle: ResizeHandle }[] = [
        { deg: 45, handle: "ne" },
        { deg: 135, handle: "se" },
        { deg: 225, handle: "sw" },
        { deg: 315, handle: "nw" },
      ];

      return (
        <svg
          className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 overflow-visible"
          width={svgW}
          height={svgH}
          viewBox={`${-svgW / 2} ${-svgH / 2} ${svgW} ${svgH}`}
          aria-hidden
        >
          {angles.map(({ deg, handle }) => (
            <path
              key={handle}
              d={annularStrokePath(deg, radius, g, d, chord)}
              {...strokeProps}
              style={{
                cursor:
                  handle === "ne" || handle === "sw"
                    ? "nesw-resize"
                    : "nwse-resize",
              }}
              onPointerDown={startResize(handle)}
            />
          ))}
        </svg>
      );
    }

    const sideLenH = Math.min(
      SIDE_HANDLE_MAX_LEN_PX,
      Math.max(SIDE_HANDLE_MIN_LEN_PX, boxPx.w * 0.34),
    );
    const sideLenV = Math.min(
      SIDE_HANDLE_MAX_LEN_PX,
      Math.max(SIDE_HANDLE_MIN_LEN_PX, boxPx.h * 0.34),
    );
    const cornerKeys = ["nw", "ne", "se", "sw"] as const;

    const sides: {
      handle: ResizeHandle;
      x: number;
      y: number;
      w: number;
      h: number;
      cursor: string;
      show: boolean;
    }[] = [
      {
        handle: "n",
        x: -sideLenH / 2,
        y: -halfH - g - d / 2,
        w: sideLenH,
        h: d,
        cursor: "n-resize",
        show: showSideNS,
      },
      {
        handle: "s",
        x: -sideLenH / 2,
        y: halfH + g - d / 2,
        w: sideLenH,
        h: d,
        cursor: "s-resize",
        show: showSideNS,
      },
      {
        handle: "e",
        x: halfW + g - d / 2,
        y: -sideLenV / 2,
        w: d,
        h: sideLenV,
        cursor: "e-resize",
        show: showSideEW,
      },
      {
        handle: "w",
        x: -halfW - g - d / 2,
        y: -sideLenV / 2,
        w: d,
        h: sideLenV,
        cursor: "w-resize",
        show: showSideEW,
      },
    ];

    return (
      <svg
        className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 overflow-visible"
        width={svgW}
        height={svgH}
        viewBox={`${-svgW / 2} ${-svgH / 2} ${svgW} ${svgH}`}
        aria-hidden
      >
        {sides
          .filter((s) => s.show)
          .map((s) => (
            <rect
              key={s.handle}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={d / 2}
              ry={d / 2}
              fill={HANDLE_COLOR}
              className="animate-wall-handle pointer-events-auto"
              style={{ cursor: s.cursor }}
              onPointerDown={startResize(s.handle)}
            />
          ))}
        {cornerKeys.map((c) => (
          <path
            key={c}
            d={cornerStrokePath(c, halfW, halfH, g, d)}
            {...strokeProps}
            style={{
              cursor: c === "ne" || c === "sw" ? "nesw-resize" : "nwse-resize",
            }}
            onPointerDown={startResize(c)}
          />
        ))}
      </svg>
    );
  };

  return (
    <button
      ref={wallRef}
      type="button"
      className={`absolute touch-none outline-none ${
        editMode ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      } ${selected ? "z-20" : "z-5"}`}
      style={
        shape === "circle"
          ? {
              left: `${wall.x}%`,
              top: `${wall.y}%`,
              width: `${circleSizePct}%`,
              aspectRatio: "1",
              height: "auto",
            }
          : {
              left: `${wall.x}%`,
              top: `${wall.y}%`,
              width: `${wall.width}%`,
              height: `${wall.height}%`,
            }
      }
      onPointerDown={startMove}
      onClick={(e) => e.stopPropagation()}
      aria-label={label || "Muro"}
      aria-pressed={selected}
    >
      <div
        className="relative h-full w-full transition-transform duration-300 ease-out"
        style={{
          transform: shape === "circle" ? undefined : `rotate(${rotation}deg)`,
        }}
      >
        <div className="absolute inset-0 shadow-sm" style={bodyStyle} />

        <div
          className="absolute inset-0 z-10 flex items-center justify-center px-1.5"
          style={{
            transform:
              shape === "circle" ? undefined : `rotate(${-rotation}deg)`,
          }}
        >
          {showIcon ? (
            <BrickWall
              className="size-6 sm:size-7"
              strokeWidth={1.75}
              style={{ color: WALL_TEXT }}
              aria-hidden
            />
          ) : (
            <span
              className="max-w-full truncate text-center text-[13px] font-black tracking-tight uppercase"
              style={{ color: WALL_TEXT }}
            >
              {label}
            </span>
          )}
        </div>
      </div>

      {renderHandles()}
    </button>
  );
};
