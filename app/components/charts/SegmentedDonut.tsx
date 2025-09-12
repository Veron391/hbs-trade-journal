import React, { useMemo, useState } from "react";

type DonutDatum = { label: string; value: number; color?: string };

type Props = {
  data: DonutDatum[];
  totalLabel?: string;
  size?: number;
  thickness?: number;
  gapDeg?: number;
};

const palette = [
  "#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#ef7722", "#f59e0b", "#fbbf24"
];

const toRad = (deg: number) => (deg * Math.PI) / 180;
const fmtNumber = (n: number) =>
  n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` :
  n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` :
  n >= 1e3 ? `$${(n/1e3).toFixed(1)}K` : `$${n.toFixed(2)}`;

export default function SegmentedDonut({
  data,
  totalLabel = "Total",
  size = 360,
  thickness = 22,
  gapDeg = 6,
}: Props) {
  const [hover, setHover] = useState<{i: number; x: number; y: number} | null>(null);

  const total = useMemo(() => data.reduce((a, b) => a + b.value, 0), [data]);
  const radius = size / 2 - thickness / 2 - 8; // Add safety buffer for hover effects
  const cx = size / 2;
  const cy = size / 2;

  const segments = useMemo(() => {
    if (total <= 0) return [];
    const entries = data.map((d, i) => ({
      ...d,
      color: d.color ?? palette[i % palette.length],
      share: d.value / total,
    }));

    const res: Array<{
      start: number; end: number; color: string; label: string; value: number;
      isHovered?: boolean;
    }> = [];

    let cursor = -90;
    entries.forEach((e) => {
      const sweep = 360 * e.share;
      const start = cursor;
      const end = cursor + sweep;
      if (end > start) {
        res.push({ 
          start, 
          end, 
          color: e.color!, 
          label: e.label, 
          value: e.value,
          isHovered: hover?.i === res.length
        });
      }
      cursor += sweep - 3; // Overlap segments by 3 degrees (counter-clockwise)
    });
    return res;
  }, [data, total, gapDeg, hover]);

  const arcPath = (startDeg: number, endDeg: number, isHovered: boolean = false) => {
    const r = isHovered ? radius + 5 : radius; // Make hovered segments 5px larger
    const start = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
    const end =   { x: cx + r * Math.cos(toRad(endDeg)),   y: cy + r * Math.sin(toRad(endDeg)) };
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const glowArcPath = (startDeg: number, endDeg: number) => {
    // Counter-clockwise glow: extend the arc slightly in counter-clockwise direction
    const extendedStart = startDeg - 2; // Start 2 degrees earlier (counter-clockwise)
    const extendedEnd = endDeg + 2;     // End 2 degrees later (counter-clockwise)
    const r = radius + 5; // Same as hovered segment
    const start = { x: cx + r * Math.cos(toRad(extendedStart)), y: cy + r * Math.sin(toRad(extendedStart)) };
    const end =   { x: cx + r * Math.cos(toRad(extendedEnd)),   y: cy + r * Math.sin(toRad(extendedEnd)) };
    const largeArc = extendedEnd - extendedStart > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <div className="relative inline-flex items-center justify-center"
         style={{ width: size + 80, height: size + 80, overflow: 'visible' }}>
      <svg 
        width={size + 40} 
        height={size + 40} 
        viewBox={`-20 -20 ${size + 40} ${size + 40}`}
        role="img" 
        aria-label="Segmented donut chart" 
        style={{ position: 'absolute', top: 20, left: 20, overflow: 'visible' }}>
        <defs>
          <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {segments.map((s, i) => (
          <g key={i}>
            {/* Shadow for stacking effect - cast shadow on next segment */}
            <path
              d={arcPath(s.start, s.end, hover?.i === i)}
              stroke="rgba(0, 0, 0, 0.68)"
              strokeWidth={thickness + 5}
              strokeLinecap="round"
              fill="none"
              style={{ 
                filter: "blur(3px)",
                opacity: 0.9
              }}
            />
            {/* Additional shadow for depth */}
            <path
              d={arcPath(s.start, s.end, hover?.i === i)}
              stroke="rgba(0, 0, 0, 0.34)"
              strokeWidth={thickness + 2}
              strokeLinecap="round"
              fill="none"
              style={{ 
                filter: "blur(2px)",
                opacity: 0.7
              }}
            />
            {/* Glow effect for hovered segment */}
            {hover?.i === i && (
              <>
                {/* Outer glow */}
                <path
                  d={glowArcPath(s.start, s.end)}
                  stroke={s.color}
                  strokeWidth={thickness + 8}
                  strokeLinecap="round"
                  fill="none"
                  style={{ 
                    filter: "blur(6px)",
                    opacity: 0.6
                  }}
                />
                {/* Inner glow */}
                <path
                  d={glowArcPath(s.start, s.end)}
                  stroke={s.color}
                  strokeWidth={thickness + 4}
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#glowFilter)"
                  style={{ 
                    opacity: 0.8
                  }}
                />
              </>
            )}
            {/* Main segment */}
            <path
              d={arcPath(s.start, s.end, hover?.i === i)}
              stroke={s.color}
              strokeWidth={thickness + 8}
              strokeLinecap="round"
              fill="none"
              onMouseEnter={(e) => {
                if (hover?.i !== i) {
                  setHover({ i, x: e.clientX, y: e.clientY });
                }
              }}
              onMouseLeave={() => {
                if (hover?.i === i) {
                  setHover(null);
                }
              }}
              style={{ 
                cursor: "pointer", 
                transition: "all 0.2s ease",
                pointerEvents: "stroke"
              }}
              opacity={1}
            />
          </g>
        ))}

        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={18} fontWeight={700} fill="#ffffff">
          {hover && segments[hover.i] ? segments[hover.i].label : (data.length > 0 ? data[0].label : 'N/A')}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={14} fill="#d1d5db">
          {hover && segments[hover.i] ? `${segments[hover.i].value} trades` : (data.length > 0 ? `${data[0].value} trades` : 'No data')}
        </text>
      </svg>

      {hover && segments[hover.i] && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 rounded-xl border px-4 py-3 text-sm shadow-2xl"
               style={{
                 left: hover.x - (typeof window !== "undefined" ? window.scrollX : 0) - (size/2) + 60,
                 top: hover.y - (typeof window !== "undefined" ? window.scrollY : 0) - (size/2) + 60,
            background: "rgba(15, 15, 18, 0.95)",
            borderColor: segments[hover.i].color,
            color: "white",
            whiteSpace: "nowrap",
            backdropFilter: "blur(10px)",
            minWidth: "160px"
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-white/20"
              style={{ background: segments[hover.i].color }}
            />
            <span className="font-semibold text-base">{segments[hover.i].label}</span>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold" style={{ color: segments[hover.i].color }}>
              {segments[hover.i].value.toLocaleString()}
            </div>
            <div className="text-neutral-300 text-xs">
              {((segments[hover.i].value / total) * 100).toFixed(1)}% of total
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
