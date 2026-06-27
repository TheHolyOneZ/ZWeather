import { GlassCard } from "@/components/ui/GlassCard";
import { convertWind, windUnitLabel, type WindUnit } from "@/lib/units";
import { useTranslation } from "react-i18next";

interface WindCardProps {
  speed: number;
  direction: number;
  unit?: WindUnit;
}

const COMPASS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];

function compassLabel(deg: number): string {
  return COMPASS[Math.round(deg / 22.5) % 16];
}

function beaufortKey(kmh: number): string {
  if (kmh < 2)  return "beaufort.calm";
  if (kmh < 12) return "beaufort.light";
  if (kmh < 30) return "beaufort.gentle";
  if (kmh < 50) return "beaufort.moderate";
  if (kmh < 75) return "beaufort.fresh";
  if (kmh < 102)return "beaufort.strong";
  return "beaufort.storm";
}

export function WindCard({ speed, direction, unit = "kmh" }: WindCardProps) {
  const { t } = useTranslation();
  const displaySpeed = convertWind(speed, unit);
  const unitLabel = windUnitLabel(unit);
  return (
    <GlassCard className="p-3">
      <div className="flex items-center gap-3">

        <div className="relative w-11 h-11 shrink-0">
          <svg viewBox="0 0 56 56" width="44" height="44">
            <circle cx="28" cy="28" r="24" fill="none" stroke="color-mix(in srgb, var(--color-foreground) 18%, transparent)" strokeWidth="1.5" />
            {[["N",28,8],["E",50,30],["S",28,52],["W",8,30]].map(([l,x,y]) => (
              <text key={l as string} x={x as number} y={y as number} textAnchor="middle" dominantBaseline="middle"
                fill="color-mix(in srgb, var(--color-foreground) 45%, transparent)" fontSize="7" fontFamily="system-ui">
                {l}
              </text>
            ))}
            <g transform={`rotate(${direction}, 28, 28)`}>
              <polygon points="28,10 31,28 28,25 25,28" fill="color-mix(in srgb, var(--color-foreground) 90%, transparent)" />
              <polygon points="28,46 31,28 28,31 25,28" fill="color-mix(in srgb, var(--color-foreground) 40%, transparent)" />
            </g>
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[10px] text-white/55 uppercase tracking-widest">{t("sections.wind")}</p>
            <span className="text-[11px] text-white/55 font-medium">{compassLabel(direction)}</span>
          </div>
          <p className="text-[18px] font-semibold tabular-nums text-white/90 leading-tight mt-0.5">
            {Math.round(displaySpeed)}
            <span className="text-[12px] font-normal text-white/45 ml-1">{unitLabel}</span>
          </p>
          <p className="text-[11px] text-white/55 leading-tight mt-0.5">
            {t(beaufortKey(speed))}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
