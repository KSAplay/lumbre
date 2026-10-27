type ChairProps = {
  /** Color del estado (tono oscuro) */
  color: string;
  /** Silla recta (cuadrada / rectangular) */
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
  /** Solo pulso de brillo al seleccionar la mesa */
  selected?: boolean;
};

/** Rectángulo suave (casi plano, bordes redondeados) */
function softRectPath(w: number, h: number): string {
  const r = Math.min(3.5, h * 0.35, w * 0.12);
  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `Q ${w} 0 ${w} ${r}`,
    `V ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `H ${r}`,
    `Q 0 ${h} 0 ${h - r}`,
    `V ${r}`,
    `Q 0 0 ${r} 0`,
    "Z",
  ].join(" ");
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

  // Esquinas suavizadas: se recorta cada vértice y se une con una curva
  const r = Math.min(3.5, depth * 0.35);
  const dIn = r / rIn;
  const dOut = r / rOut;
  const p = (rad: number, a: number) => {
    const { x, y } = pt(rad, a);
    return `${x} ${y}`;
  };

  return [
    `M ${p(rIn + r, a0)}`,
    `Q ${p(rIn, a0)} ${p(rIn, a0 + dIn)}`,
    `A ${rIn} ${rIn} 0 0 1 ${p(rIn, a1 - dIn)}`,
    `Q ${p(rIn, a1)} ${p(rIn + r, a1)}`,
    `L ${p(rOut - r, a1)}`,
    `Q ${p(rOut, a1)} ${p(rOut, a1 - dOut)}`,
    `A ${rOut} ${rOut} 0 0 0 ${p(rOut, a0 + dOut)}`,
    `Q ${p(rOut, a0)} ${p(rOut - r, a0)}`,
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
  selected = false,
}: ChairProps) => {
  const selectedClass = selected ? "animate-chair-selected" : "";

  if (arched) {
    const extent = tableRadius + gap + depth + 2;
    const size = extent * 2;

    return (
      <svg
        className={`pointer-events-none absolute top-1/2 left-1/2 z-0 overflow-visible transition-transform duration-300 ease-out ${selectedClass}`}
        width={size}
        height={size}
        viewBox={`${-extent} ${-extent} ${size} ${size}`}
        style={{ transform: `translate(-50%, -50%) rotate(${angleDeg}deg)` }}
        aria-hidden
      >
        <path
          d={annularSectorAtAngle(0, tableRadius, gap, depth, width)}
          fill={color}
          stroke={color}
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const w = width;
  const h = depth;

  return (
    <div
      className={`pointer-events-none absolute top-1/2 left-1/2 z-0 transition-transform duration-300 ease-out ${selectedClass}`}
      style={{
        width: w,
        height: h,
        transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) rotate(${rotateDeg}deg)`,
      }}
      aria-hidden
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="overflow-visible"
      >
        <path d={softRectPath(w, h)} fill={color} />
      </svg>
    </div>
  );
};
