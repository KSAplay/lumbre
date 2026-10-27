import type { PointerEvent, RefObject } from "react";
import { EDIT_SNAP_PX } from "../../constants/floorPlan";
import {
  statusShowsElapsed,
  TABLE_STATUS_HEX,
  TABLE_STATUS_ICONS,
} from "../../constants/tableStatus";
import type { TableNodeData, TableShape } from "../../types/table";
import { darkenColor } from "../../utils/color";
import { formatStoredTime } from "../../utils/dateTime";
import {
  elapsedSecondsSince,
  formatStatusElapsed,
} from "../../utils/tableTime";
import { Chair } from "./Chair";

type FloorTableProps = {
  table: TableNodeData;
  selected: boolean;
  editMode: boolean;
  nowMs: number;
  appearing?: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  mapRef: RefObject<HTMLDivElement | null>;
};

type Side = "top" | "right" | "bottom" | "left";

type ChairPose = {
  key: string;
  offsetX: number;
  offsetY: number;
  rotateDeg: number;
};

const CHAIR_GAP = 5;
const CHAIR_WIDTH = 44;
const CHAIR_DEPTH = 12;
/** Hueco uniforme: esquina ↔ silla ↔ silla ↔ esquina */
const SIDE_GAP = 12;
/** Alto mínimo del tablero (número + icono); crece si hay reserva/temporizador */
const CONTENT_MIN_H = 96;
const CONTENT_EXTRA_H = 128;

/** Distribución base en horizontal: [top, right, bottom, left] */
function seatsPerSideHorizontal(
  count: number,
): [number, number, number, number] {
  const n = Math.max(0, Math.min(20, count));
  if (n <= 0) return [0, 0, 0, 0];
  if (n === 1) return [1, 0, 0, 0];
  // 2: enfrentadas a los lados; en vertical pasan arriba / abajo
  if (n === 2) return [0, 1, 0, 1];
  if (n === 3) return [1, 0, 1, 1];
  if (n === 4) return [1, 1, 1, 1];

  // 5–10: 1 por costado; extras alternan arriba / abajo al expandir el ancho
  if (n <= 10) {
    const extras = n - 4;
    const topExtra = Math.ceil(extras / 2);
    const bottomExtra = Math.floor(extras / 2);
    return [1 + topExtra, 1, 1 + bottomExtra, 1];
  }

  // 11–12: una expansión en alto para 2 sillas en cada costado
  if (n === 11) return [4, 1, 4, 2];
  if (n === 12) return [4, 2, 4, 2];

  // 13–20: más ancho; arriba/abajo crecen hasta 8+8 con 2 en cada costado
  const extras = n - 12;
  const topExtra = Math.ceil(extras / 2);
  const bottomExtra = Math.floor(extras / 2);
  return [4 + topExtra, 2, 4 + bottomExtra, 2];
}

/** Gira la ocupación 90° horaria para orientación vertical */
function seatsPerSide(
  count: number,
  vertical: boolean,
): [number, number, number, number] {
  const [top, right, bottom, left] = seatsPerSideHorizontal(count);
  if (!vertical) return [top, right, bottom, left];
  return [left, top, right, bottom];
}

/** Lado = n·anchoSilla + (n+1)·hueco (huecos iguales en extremos y entre sillas) */
function sideLengthFor(chairs: number, chairW: number, minSide: number): number {
  if (chairs <= 0) return minSide;
  return Math.max(minSide, chairs * chairW + (chairs + 1) * SIDE_GAP);
}

function tableFootprint(
  shape: TableShape,
  seatCount: number,
  vertical: boolean,
  extraContent: boolean,
) {
  const seats = Math.max(1, Math.min(20, seatCount));
  const [topN, rightN, bottomN, leftN] = seatsPerSide(seats, false);
  const chairW = seats >= 6 ? 36 : CHAIR_WIDTH;
  const contentH = extraContent ? CONTENT_EXTRA_H : CONTENT_MIN_H;

  if (shape === "circle") {
    const base =
      seats <= 2 ? 112 : seats <= 4 ? 136 : seats <= 6 ? 156 : seats <= 10 ? 176 : 196;
    return { width: base, height: base, chairW };
  }

  const minSquare = seats <= 2 ? 116 : 140;

  if (seats <= 4) {
    return { width: minSquare, height: minSquare, chairW };
  }

  const longN = Math.max(topN, bottomN);
  const shortN = Math.max(leftN, rightN, 1);
  // Ancho según sillas del lado largo; alto compacto (crece con contenido o 2 sillas laterales)
  let width = sideLengthFor(longN, chairW, minSquare);
  let height =
    seats <= 10
      ? contentH
      : Math.max(contentH, sideLengthFor(shortN, chairW, contentH));

  if (vertical) {
    const swap = width;
    width = height;
    height = swap;
  }

  return { width, height, chairW };
}

/** Centros con el mismo hueco esquina–silla que entre sillas */
function alongSide(n: number, length: number, chairW: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];

  const gap = (length - n * chairW) / (n + 1);
  const start = -length / 2 + gap + chairW / 2;
  return Array.from({ length: n }, (_, i) => start + i * (chairW + gap));
}

function chairCenterDist(edge: number, depth: number) {
  return edge + CHAIR_GAP + depth / 2;
}

function rectChairPoses(
  count: number,
  width: number,
  height: number,
  depth: number,
  chairW: number,
  vertical: boolean,
): ChairPose[] {
  const [topN, rightN, bottomN, leftN] = seatsPerSide(count, vertical);
  const poses: ChairPose[] = [];
  const halfW = width / 2;
  const halfH = height / 2;
  const dY = chairCenterDist(halfH, depth);
  const dX = chairCenterDist(halfW, depth);

  const push = (
    side: Side,
    positions: number[],
    axis: "x" | "y",
    rotateDeg: number,
  ) => {
    positions.forEach((pos, i) => {
      poses.push({
        key: `${side}-${i}`,
        offsetX: axis === "x" ? pos : side === "right" ? dX : -dX,
        offsetY: axis === "y" ? pos : side === "bottom" ? dY : -dY,
        rotateDeg,
      });
    });
  };

  push("top", alongSide(topN, width, chairW), "x", 180);
  push("right", alongSide(rightN, height, chairW), "y", 270);
  push("bottom", alongSide(bottomN, width, chairW), "x", 0);
  push("left", alongSide(leftN, height, chairW), "y", 90);

  return poses;
}

function circleChairAngles(count: number): number[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => (360 / count) * i);
}

function snapToGrid(
  percent: number,
  mapSizePx: number,
  gridPx: number,
): number {
  const px = (percent / 100) * mapSizePx;
  const snapped = Math.round(px / gridPx) * gridPx;
  return (snapped / mapSizePx) * 100;
}

function tableCode(number: number): string {
  return `M-${String(number).padStart(2, "0")}`;
}

export const FloorTable = ({
  table,
  selected,
  editMode,
  nowMs,
  appearing = false,
  onSelect,
  onPositionChange,
  mapRef,
}: FloorTableProps) => {
  const fill = TABLE_STATUS_HEX[table.status];
  const accent = darkenColor(fill, 0.32);
  const chairColor = darkenColor(fill, 0.36);
  const StatusIcon = TABLE_STATUS_ICONS[table.status];

  const chairCount =
    table.guestCount > 0 ? table.guestCount : table.capacity;
  const isRound = table.shape === "circle";
  // Afecta a 2 comensales (sillas enfrentadas) y al rectángulo (≥5)
  const vertical =
    !isRound &&
    table.orientation === "vertical" &&
    (chairCount === 2 || chairCount >= 5);
  const showTimer = statusShowsElapsed(table.status);
  const showReservation =
    table.status === "reservada" && table.reservation;
  const { width, height, chairW } = tableFootprint(
    table.shape,
    chairCount,
    vertical,
    Boolean(showReservation || showTimer),
  );
  const chairD = CHAIR_DEPTH;
  const tableRadius = Math.max(width, height) / 2;

  const rectPoses = isRound
    ? []
    : rectChairPoses(chairCount, width, height, chairD, chairW, vertical);
  const circleAngles = isRound ? circleChairAngles(chairCount) : [];

  const elapsed = elapsedSecondsSince(table.statusChangedAt, nowMs);
  const pad = (CHAIR_GAP + chairD) * 2 + 12;

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSelect(table.id);

    if (!editMode) return;

    e.preventDefault();
    const mapEl = mapRef.current;
    if (!mapEl) return;

    const rect = mapEl.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);

    const onMove = (ev: globalThis.PointerEvent) => {
      let x = ((ev.clientX - rect.left) / rect.width) * 100;
      let y = ((ev.clientY - rect.top) / rect.height) * 100;
      x = snapToGrid(x, rect.width, EDIT_SNAP_PX);
      y = snapToGrid(y, rect.height, EDIT_SNAP_PX);
      onPositionChange(
        table.id,
        Math.min(92, Math.max(8, x)),
        Math.min(90, Math.max(10, y)),
      );
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <button
      type="button"
      className={`absolute touch-none outline-none ${
        editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${selected ? "z-20" : "z-10"} ${appearing ? "animate-table-appear" : ""}`}
      style={{
        left: `${table.position.x}%`,
        top: `${table.position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Mesa ${tableCode(table.number)}`}
      aria-pressed={selected}
    >
      <div
        className="relative transition-[width,height] duration-300 ease-out"
        style={{
          width: width + pad,
          height: height + pad,
        }}
      >
        {isRound
          ? circleAngles.map((angle, i) => (
              <Chair
                key={`arc-${i}`}
                arched
                angleDeg={angle}
                tableRadius={tableRadius}
                gap={CHAIR_GAP}
                depth={chairD}
                width={chairW}
                color={chairColor}
                selected={selected}
              />
            ))
          : rectPoses.map((pose) => (
              <Chair
                key={pose.key}
                offsetX={pose.offsetX}
                offsetY={pose.offsetY}
                rotateDeg={pose.rotateDeg}
                width={chairW}
                depth={chairD}
                color={chairColor}
                selected={selected}
              />
            ))}

        <div
          className={`absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 px-2.5 shadow-[0_2px_5px_rgba(43,44,52,0.22)] transition-[width,height] duration-300 ease-out ${
            isRound ? "rounded-full" : "rounded-md"
          } ${selected ? "animate-table-selected" : ""}`}
          style={{
            width,
            height,
            backgroundColor: fill,
            ["--sel-ring" as string]: accent,
          }}
        >
          <span
            className="text-[13px] font-black tracking-tight tabular-nums"
            style={{ color: accent }}
          >
            {tableCode(table.number)}
          </span>

          <StatusIcon
            className="size-6 shrink-0"
            strokeWidth={2.25}
            style={{ color: accent }}
            aria-hidden
          />

          {showReservation && (
            <div className="mt-0.5 max-w-[92%] text-center leading-snug">
              <p
                className="truncate text-xs font-bold"
                style={{ color: accent }}
              >
                {table.reservation!.guestName}
              </p>
              <p
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: accent }}
              >
                {formatStoredTime(table.reservation!.time)}
              </p>
            </div>
          )}

          {showTimer && (
            <span className="mt-0.5 rounded-full bg-canvas-white px-2.5 py-0.5 text-xs font-bold tracking-wide text-text-main tabular-nums">
              {formatStatusElapsed(elapsed)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
