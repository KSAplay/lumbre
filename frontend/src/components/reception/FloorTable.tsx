import type { PointerEvent, RefObject } from "react";
import type { TableNodeData, TableShape } from "../../types/table";
import {
  statusShowsElapsed,
  TABLE_STATUS_HEX,
  TABLE_STATUS_ICONS,
} from "../../constants/tableStatus";
import { darkenColor } from "../../utils/color";
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
  onSelect: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  mapRef: RefObject<HTMLDivElement | null>;
};

type ChairPose = { offsetX: number; offsetY: number; rotateDeg: number };

const SNAP_PX = 20;
const CHAIR_GAP = 3;
const CHAIR_WIDTH = 46;
const CHAIR_DEPTH = 12;

function tableFootprint(shape: TableShape, seatCount: number) {
  const seats = Math.max(2, seatCount);
  const base =
    seats <= 2 ? 108 : seats <= 4 ? 132 : seats === 5 ? 148 : seats <= 6 ? 164 : 180;

  if (shape === "rectangle") {
    return { width: base * 1.35, height: base * 0.92 };
  }

  return { width: base, height: base };
}

function seatsPerSide(count: number): [number, number, number, number] {
  if (count <= 0) return [0, 0, 0, 0];
  if (count === 1) return [1, 0, 0, 0];
  if (count === 2) return [1, 0, 1, 0];
  if (count === 3) return [1, 1, 1, 0];
  if (count === 4) return [1, 1, 1, 1];

  const base = Math.floor(count / 4);
  const extra = count % 4;
  return [
    base + (extra > 0 ? 1 : 0),
    base + (extra > 1 ? 1 : 0),
    base + (extra > 2 ? 1 : 0),
    base,
  ];
}

function alongSide(n: number, length: number, chairW: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const span = Math.min(length * 0.72, (n - 1) * (chairW + 6));
  return Array.from({ length: n }, (_, i) => -span / 2 + (span * i) / (n - 1));
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
): ChairPose[] {
  const [topN, rightN, bottomN, leftN] = seatsPerSide(count);
  const poses: ChairPose[] = [];
  const halfW = width / 2;
  const halfH = height / 2;
  const dY = chairCenterDist(halfH, depth);
  const dX = chairCenterDist(halfW, depth);

  for (const x of alongSide(topN, width, chairW)) {
    poses.push({ offsetX: x, offsetY: -dY, rotateDeg: 180 });
  }
  for (const y of alongSide(rightN, height, chairW)) {
    poses.push({ offsetX: dX, offsetY: y, rotateDeg: 270 });
  }
  for (const x of alongSide(bottomN, width, chairW)) {
    poses.push({ offsetX: x, offsetY: dY, rotateDeg: 0 });
  }
  for (const y of alongSide(leftN, height, chairW)) {
    poses.push({ offsetX: -dX, offsetY: y, rotateDeg: 90 });
  }

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
  onSelect,
  onPositionChange,
  mapRef,
}: FloorTableProps) => {
  const fill = TABLE_STATUS_HEX[table.status];
  const accent = darkenColor(fill, 0.32);
  const chairColor = darkenColor(fill, 0.18);
  const StatusIcon = TABLE_STATUS_ICONS[table.status];

  const chairCount =
    table.guestCount > 0 ? table.guestCount : table.capacity;
  const { width, height } = tableFootprint(table.shape, chairCount);
  const chairW = chairCount >= 6 ? 38 : CHAIR_WIDTH;
  const chairD = CHAIR_DEPTH;
  const isRound = table.shape === "circle";
  const tableRadius = Math.max(width, height) / 2;

  const rectPoses = isRound
    ? []
    : rectChairPoses(chairCount, width, height, chairD, chairW);
  const circleAngles = isRound ? circleChairAngles(chairCount) : [];

  const showTimer = statusShowsElapsed(table.status);
  const elapsed = elapsedSecondsSince(table.statusChangedAt, nowMs);
  const pad = (CHAIR_GAP + chairD) * 2 + 10;
  const showReservation =
    table.status === "reservada" && table.reservation;

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
      x = snapToGrid(x, rect.width, SNAP_PX);
      y = snapToGrid(y, rect.height, SNAP_PX);
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
      className={`absolute -translate-x-1/2 -translate-y-1/2 touch-none outline-none ${
        editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${selected ? "z-20" : "z-10"}`}
      style={{ left: `${table.position.x}%`, top: `${table.position.y}%` }}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Mesa ${tableCode(table.number)}`}
      aria-pressed={selected}
    >
      <div
        className="relative"
        style={{ width: width + pad, height: height + pad }}
      >
        {isRound
          ? circleAngles.map((angle, i) => (
              <Chair
                key={i}
                arched
                angleDeg={angle}
                tableRadius={tableRadius}
                gap={CHAIR_GAP}
                depth={chairD}
                width={chairW}
                color={chairColor}
              />
            ))
          : rectPoses.map((pose, i) => (
              <Chair
                key={i}
                offsetX={pose.offsetX}
                offsetY={pose.offsetY}
                rotateDeg={pose.rotateDeg}
                width={chairW}
                depth={chairD}
                color={chairColor}
              />
            ))}

        <div
          className={`absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 px-2 shadow-[0_2px_5px_rgba(43,44,52,0.22)] ${
            isRound ? "rounded-full" : "rounded-md"
          } ${selected ? "animate-table-selected ring-2 ring-cacao-400 ring-offset-2 ring-offset-canvas-muted" : ""}`}
          style={{
            width,
            height,
            backgroundColor: fill,
          }}
        >
          <span
            className="text-[13px] font-black tracking-tight tabular-nums"
            style={{ color: accent }}
          >
            {tableCode(table.number)}
          </span>

          <StatusIcon
            className="size-5 shrink-0"
            strokeWidth={2.25}
            style={{ color: accent }}
            aria-hidden
          />

          {showReservation && (
            <div className="mt-0.5 max-w-[90%] text-center leading-tight">
              <p
                className="truncate text-[10px] font-bold"
                style={{ color: accent }}
              >
                {table.reservation!.guestName}
              </p>
              <p
                className="text-[10px] font-semibold tabular-nums"
                style={{ color: accent }}
              >
                {table.reservation!.time}
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
