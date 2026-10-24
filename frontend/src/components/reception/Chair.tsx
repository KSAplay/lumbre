type ChairProps = {
  /** Color del estado (tono oscuro) */
  color: string;
  /** Trapecio recto (cuadrada / rectangular) */
  offsetX?: number;
  offsetY?: number;
  rotateDeg?: number;
  width?: number;
  depth?: number;
  /** Mesa redonda: sector de corona completo */
  arched?: boolean;
  /** Ángulo en grados (0 = arriba, horario) — solo arched */
  angleDeg?: number;
  tableRadius?: number;
  gap?: number;
};

function flatTrapezoidPath(w: number, h: number): string {
  const inset = w * 0.12;
  return `M ${inset} 0 L ${w - inset} 0 L ${w} ${h} L 0 ${h} Z`;
}

/**
 * Sector anular: todo el cuerpo sigue la curvatura de la mesa
 * (arco interno + arco externo = “boca triste” alrededor del círculo).
 * Coordenadas con origen en el centro de la mesa; 0° = arriba.
 */
function annularSectorAtAngle(
  angleDeg: number,
  tableRadius: number,
  gap: number,
  depth: number,
  chordWidth: number,
): string {
  const rIn = tableRadius + gap;
  const rOut = rIn + depth;
  const mid = (rIn + rOut) / 2;
  const half = Math.atan(chordWidth / 2 / mid);
  const base = (angleDeg * Math.PI) / 180;

  const pt = (r: number, a: number) => ({
    x: Math.sin(a) * r,
    y: -Math.cos(a) * r,
  });

  const a0 = base - half;
  const a1 = base + half;
  const i0 = pt(rIn, a0);
  const i1 = pt(rIn, a1);
  const o1 = pt(rOut, a1);
  const o0 = pt(rOut, a0);

  // Arco interior (cerca de la mesa) y exterior (lejos), ambos concéntricos
  return [
    `M ${i0.x} ${i0.y}`,
    `A ${rIn} ${rIn} 0 0 1 ${i1.x} ${i1.y}`,
    `L ${o1.x} ${o1.y}`,
    `A ${rOut} ${rOut} 0 0 0 ${o0.x} ${o0.y}`,
    "Z",
  ].join(" ");
}

export const Chair = ({
  color,
  offsetX = 0,
  offsetY = 0,
  rotateDeg = 0,
  width = 42,
  depth = 11,
  arched = false,
  angleDeg = 0,
  tableRadius = 48,
  gap = 3,
}: ChairProps) => {
  if (arched) {
    const extent = tableRadius + gap + depth + 2;
    const size = extent * 2;
    const d = annularSectorAtAngle(
      angleDeg,
      tableRadius,
      gap,
      depth,
      width,
    );

    return (
      <svg
        className="pointer-events-none absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 overflow-visible"
        width={size}
        height={size}
        viewBox={`${-extent} ${-extent} ${size} ${size}`}
        aria-hidden
      >
        <path d={d} fill={color} />
      </svg>
    );
  }

  const w = width;
  const h = depth;

  return (
    <div
      className="pointer-events-none absolute top-1/2 left-1/2 z-0"
      style={{
        width: w,
        height: h,
        transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) rotate(${rotateDeg}deg)`,
      }}
      aria-hidden
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <path d={flatTrapezoidPath(w, h)} fill={color} />
      </svg>
    </div>
  );
};
