/**
 * Realistic SVG poker chip.
 *
 * Design features:
 *  - Dark outer rim with 8 edge-spot segments (alternating white / team-color)
 *  - Main disk fill using team color
 *  - Thin inset ring separator
 *  - Inner embossed circle
 *  - 3-D highlight arc on upper-left
 *  - Optional ★ center for sequence chips
 */

interface PokerChipProps {
  color: string;
  /** Show a star in the center for completed-sequence chips */
  isSequence?: boolean;
  /** 0–1 – opacity for subtle fade effects */
  opacity?: number;
  size?: number;
  className?: string;
}

export function PokerChip({ color, isSequence = false, opacity = 1, size = 40, className }: PokerChipProps) {
  const cx = 50;
  const cy = 50;

  // Lighten / darken the base color for gradients
  const segments = 8;
  const segAngles = Array.from({ length: segments }, (_, i) => (i * 360) / segments);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Outer rim gradient – gives 3D depth */}
        <radialGradient id={`rim-${color.replace('#','')}`} cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="70%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </radialGradient>

        {/* Inner fill gradient */}
        <radialGradient id={`fill-${color.replace('#','')}`} cx="35%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="45%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </radialGradient>

        {/* Highlight gradient for the 3D sheen */}
        <radialGradient id="sheen" cx="32%" cy="28%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        <clipPath id={`chip-clip-${color.replace('#','')}`}>
          <circle cx={cx} cy={cy} r="48" />
        </clipPath>
      </defs>

      {/* ── Base disk (outer) ── */}
      <circle cx={cx} cy={cy} r="48" fill={`url(#rim-${color.replace('#','')})`} />

      {/* ── Edge spot segments (notch pattern) ── */}
      {segAngles.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const nextRad = ((angle + 360 / segments) * Math.PI) / 180;
        const outerR = 48;
        const innerR = 38;
        const x1o = cx + outerR * Math.cos(rad);
        const y1o = cy + outerR * Math.sin(rad);
        const x2o = cx + outerR * Math.cos(nextRad);
        const y2o = cy + outerR * Math.sin(nextRad);
        const x1i = cx + innerR * Math.cos(rad);
        const y1i = cy + innerR * Math.sin(rad);
        const x2i = cx + innerR * Math.cos(nextRad);
        const y2i = cy + innerR * Math.sin(nextRad);
        const isWhite = i % 2 === 0;

        return (
          <path
            key={i}
            d={`M ${x1i} ${y1i} L ${x1o} ${y1o} A ${outerR} ${outerR} 0 0 1 ${x2o} ${y2o} L ${x2i} ${y2i} Z`}
            fill={isWhite ? '#ffffff' : color}
            fillOpacity={isWhite ? 0.85 : 0.6}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="0.3"
          />
        );
      })}

      {/* ── Inner main disk ── */}
      <circle cx={cx} cy={cy} r="38" fill={`url(#fill-${color.replace('#','')})`} />

      {/* ── Separator ring ── */}
      <circle cx={cx} cy={cy} r="38" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.4" />
      <circle cx={cx} cy={cy} r="30" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.25" />

      {/* ── Inner emboss circle ── */}
      <circle cx={cx} cy={cy} r="28" fill={color} fillOpacity="0.35" />

      {/* ── Sequence star ── */}
      {isSequence && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="20"
          fontWeight="900"
          fontFamily="Georgia,serif"
          fill="#ffffff"
          fillOpacity="0.92"
        >
          ★
        </text>
      )}

      {/* ── 3-D sheen highlight (upper-left arc) ── */}
      <ellipse
        cx={cx - 8}
        cy={cy - 10}
        rx="20"
        ry="12"
        fill="url(#sheen)"
        transform={`rotate(-30 ${cx - 8} ${cy - 10})`}
      />
    </svg>
  );
}
