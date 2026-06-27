import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { convertTemp, tempUnitSymbol, type TempUnit } from "@/lib/units";
import { formatHourLabelAt } from "@/lib/time";

interface TempSparklineProps {
  temps: number[];
  width: number;
  height?: number;

  times?: number[];
  utcOffsetSeconds?: number;
  timeFormat?: "24h" | "12h";
  tempUnit?: TempUnit;
}

export function TempSparkline({
  temps,
  width,
  height = 36,
  times,
  utcOffsetSeconds = 0,
  timeFormat = "24h",
  tempUnit = "C",
}: TempSparklineProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [tipPx, setTipPx] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (temps.length < 2) return null;

  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = max - min || 1;
  const padY = 4;
  const usableH = height - padY * 2;

  const colW = width / (temps.length - 1);

  const pts = temps.map((t, i) => ({
    x: i * colW,
    y: padY + usableH - ((t - min) / span) * usableH,
  }));

  function catmullPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  const linePath = catmullPath(pts);

  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 6)}`;
  const hoverEnabled = !!times && times.length === temps.length;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!hoverEnabled || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.max(0, Math.min(temps.length - 1, Math.round(x / colW)));
    setHover(idx);
    const sx = rect.width / width;
    const sy = rect.height / height;
    setTipPx({
      x: rect.left + pts[idx].x * sx,
      y: rect.top + pts[idx].y * sy,
    });
  }

  function handleLeave() {
    setHover(null);
    setTipPx(null);
  }

  const hoverPt = hover !== null ? pts[hover] : null;
  const hoverColor = hover !== null ? tempToGradColor(temps[hover]) : "";

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        style={{ display: "block" }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {temps.map((t, i) => (
              <stop
                key={i}
                offset={`${(i / (temps.length - 1)) * 100}%`}
                stopColor={tempToGradColor(t)}
              />
            ))}
          </linearGradient>
          <linearGradient id={`${gradId}-area`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.15)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradId}-area)`} />

        <path
          d={linePath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {pts.map((p, i) => {
          const isMin = temps[i] === min;
          const isMax = temps[i] === max;
          if (!isMin && !isMax) return null;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={2.5}
              fill={tempToGradColor(temps[i])}
              opacity={0.9}
            />
          );
        })}


        {hoverPt && (
          <g pointerEvents="none">
            <line
              x1={hoverPt.x}
              x2={hoverPt.x}
              y1={0}
              y2={height}
              stroke="color-mix(in srgb, var(--color-foreground) 28%, transparent)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx={hoverPt.x} cy={hoverPt.y} r={4} fill={hoverColor} />
            <circle cx={hoverPt.x} cy={hoverPt.y} r={6} fill={hoverColor} opacity="0.25" />
          </g>
        )}
      </svg>


      {hoverEnabled && times && hover !== null && tipPx &&
        createPortal(
          <div
            className="fixed glass-popover rounded-lg px-2.5 py-1.5 pointer-events-none whitespace-nowrap"
            style={{
              left: tipPx.x,
              top: tipPx.y - 14,
              transform: "translate(-50%, -100%)",
              zIndex: 9999,
            }}
          >
            <p className="text-[10px] text-white/55 leading-none">
              {formatHourLabelAt(times[hover], utcOffsetSeconds, timeFormat)}
            </p>
            <p
              className="text-[13px] font-semibold tabular-nums leading-tight mt-0.5"
              style={{ color: hoverColor }}
            >
              {Math.round(convertTemp(temps[hover], tempUnit))}
              {tempUnitSymbol(tempUnit)}
            </p>
          </div>,
          document.body
        )}
    </div>
  );
}

function tempToGradColor(c: number): string {
  if (c <= 0)  return "#93c5fd";
  if (c <= 10) return "#67e8f9";
  if (c <= 18) return "#86efac";
  if (c <= 25) return "#fde68a";
  if (c <= 32) return "#fdba74";
  return "#fca5a5";
}
