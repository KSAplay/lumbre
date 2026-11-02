import type { ZoneId } from "../../types/table";
import { Chair } from "./Chair";

type SkeletonTable =
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      /** Sillas por lado: [arriba, derecha, abajo, izquierda] */
      sides: [number, number, number, number];
    }
  | { kind: "circle"; x: number; y: number; size: number; seats: number };

type SkeletonWall = { x: number; y: number; width: number; height: number };

const CHAIR_GAP = 5;
const CHAIR_DEPTH = 12;
const CHAIR_COLOR = "var(--color-slate-50)";

const square = (x: number, y: number): SkeletonTable => ({
  kind: "rect",
  x,
  y,
  width: 140,
  height: 140,
  sides: [1, 1, 1, 1],
});

const smallSquare = (x: number, y: number): SkeletonTable => ({
  kind: "rect",
  x,
  y,
  width: 116,
  height: 116,
  sides: [1, 0, 1, 0],
});

const longTable = (x: number, y: number): SkeletonTable => ({
  kind: "rect",
  x,
  y,
  width: 200,
  height: 96,
  sides: [3, 1, 3, 1],
});

const round = (
  x: number,
  y: number,
  seats: number,
  size: number,
): SkeletonTable => ({ kind: "circle", x, y, seats, size });

const LAYOUTS: Record<
  ZoneId,
  { tables: SkeletonTable[]; walls: SkeletonWall[] }
> = {
  interior: {
    tables: [
      longTable(14, 26),
      longTable(14, 57),
      square(35, 30),
      square(51, 30),
      square(67, 30),
      square(35, 57),
      square(51, 57),
      square(67, 57),
      smallSquare(10, 86),
      smallSquare(24, 86),
      smallSquare(38, 86),
      smallSquare(52, 86),
      smallSquare(66, 86),
    ],
    walls: [
      { x: 46, y: 2, width: 30, height: 8 },
      { x: 78, y: 2, width: 20, height: 32 },
      { x: 82, y: 70, width: 16, height: 28 },
    ],
  },
  terraza: {
    tables: [
      round(10, 26, 2, 112),
      round(28, 26, 4, 136),
      round(47, 26, 4, 136),
      round(66, 26, 4, 136),
      round(85, 26, 2, 112),
      round(18, 64, 6, 156),
      round(45, 64, 8, 176),
      round(74, 64, 4, 136),
    ],
    walls: [
      { x: 2, y: 2, width: 96, height: 5 },
      { x: 10, y: 92, width: 80, height: 5 },
    ],
  },
};

/** Centros a lo largo de un lado con huecos iguales entre sillas y esquinas. */
function alongSide(n: number, length: number, chairW: number): number[] {
  if (n <= 0) return [];
  const gap = (length - n * chairW) / (n + 1);
  const start = -length / 2 + gap + chairW / 2;
  return Array.from({ length: n }, (_, i) => start + i * (chairW + gap));
}

const RectTableSkeleton = ({
  width,
  height,
  sides,
}: {
  width: number;
  height: number;
  sides: [number, number, number, number];
}) => {
  const [top, right, bottom, left] = sides;
  const chairW = top + right + bottom + left >= 6 ? 36 : 44;
  const dX = width / 2 + CHAIR_GAP + CHAIR_DEPTH / 2;
  const dY = height / 2 + CHAIR_GAP + CHAIR_DEPTH / 2;

  const chairs = [
    ...alongSide(top, width, chairW).map((x) => ({ x, y: -dY, r: 180 })),
    ...alongSide(right, height, chairW).map((y) => ({ x: dX, y, r: 270 })),
    ...alongSide(bottom, width, chairW).map((x) => ({ x, y: dY, r: 0 })),
    ...alongSide(left, height, chairW).map((y) => ({ x: -dX, y, r: 90 })),
  ];

  return (
    <>
      {chairs.map((c, i) => (
        <Chair
          key={i}
          offsetX={c.x}
          offsetY={c.y}
          rotateDeg={c.r}
          width={chairW}
          depth={CHAIR_DEPTH}
          color={CHAIR_COLOR}
        />
      ))}
      <TableTop width={width} height={height} rounded="rounded-md" />
    </>
  );
};

const CircleTableSkeleton = ({
  size,
  seats,
}: {
  size: number;
  seats: number;
}) => (
  <>
    {Array.from({ length: seats }, (_, i) => (
      <Chair
        key={i}
        arched
        angleDeg={(360 / seats) * i}
        tableRadius={size / 2}
        gap={CHAIR_GAP}
        depth={CHAIR_DEPTH}
        width={seats >= 6 ? 36 : 44}
        color={CHAIR_COLOR}
      />
    ))}
    <TableTop width={size} height={size} rounded="rounded-full" />
  </>
);

const TableTop = ({
  width,
  height,
  rounded,
}: {
  width: number;
  height: number;
  rounded: string;
}) => (
  <div
    className={`absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 bg-canvas-white/80 ${rounded}`}
    style={{ width, height }}
  >
    <div className="h-3 w-10 rounded bg-slate-50/80" />
    <div className="size-6 rounded-full bg-slate-50/80" />
  </div>
);

/** Esqueleto del plano de sala con la distribución típica de cada zona. */
export const ReceptionFloorSkeleton = ({ zone }: { zone: ZoneId }) => {
  const { tables, walls } = LAYOUTS[zone];
  const pad = (CHAIR_GAP + CHAIR_DEPTH) * 2 + 12;

  return (
    <div
      role="status"
      aria-label="Cargando plano de sala"
      className="absolute inset-0 animate-pulse"
    >
      {walls.map((wall, i) => (
        <div
          key={i}
          className="absolute rounded-md bg-slate-50/70"
          style={{
            left: `${wall.x}%`,
            top: `${wall.y}%`,
            width: `${wall.width}%`,
            height: `${wall.height}%`,
          }}
        />
      ))}

      {tables.map((table, i) => {
        const width = table.kind === "circle" ? table.size : table.width;
        const height = table.kind === "circle" ? table.size : table.height;

        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${table.x}%`,
              top: `${table.y}%`,
              width: width + pad,
              height: height + pad,
              transform: "translate(-50%, -50%)",
            }}
          >
            {table.kind === "circle" ? (
              <CircleTableSkeleton size={table.size} seats={table.seats} />
            ) : (
              <RectTableSkeleton
                width={table.width}
                height={table.height}
                sides={table.sides}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/** Esqueleto del panel lateral en su vista de resumen de sala. */
export const ReceptionPanelSkeleton = () => (
  <div
    role="status"
    aria-label="Cargando resumen de sala"
    className="flex min-h-full animate-pulse flex-col gap-5"
  >
    <div className="flex flex-col gap-2">
      <div className="h-5 w-36 rounded-md bg-slate-50/80" />
      <div className="h-3.5 w-44 rounded bg-slate-50/60" />
    </div>

    <ul className="flex flex-col gap-2">
      {["w-20", "w-24", "w-16", "w-28", "w-20"].map((w, i) => (
        <li
          key={i}
          className="flex items-center justify-between rounded-lg bg-canvas-muted px-3 py-3"
        >
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-slate-50" />
            <span className={`h-3.5 rounded bg-slate-50/80 ${w}`} />
          </span>
          <span className="h-3.5 w-4 rounded bg-slate-50/80" />
        </li>
      ))}
    </ul>

    <div className="mt-auto flex flex-col gap-2 border-t border-slate-50 pt-4">
      <div className="h-3 w-28 rounded bg-slate-50/60" />
      <div className="h-10 rounded-lg bg-cacao-300/25" />
      <div className="h-10 rounded-lg bg-canvas-muted" />
    </div>
  </div>
);
