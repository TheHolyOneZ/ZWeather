import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/store/settingsStore";
import { convertTemp, tempUnitSymbol } from "@/lib/units";
import type { LegendSpec } from "@/lib/mapLayers/types";

interface Props {
  legend: LegendSpec;
}

const TEMP_MIN_C = -30;
const TEMP_MAX_C = 42;

function resolveLabel(raw: string, opts: { tempUnit: "C" | "F" | "K"; t: (k: string) => string }): string {
  if (raw === "__TEMP_MIN__") return `${Math.round(convertTemp(TEMP_MIN_C, opts.tempUnit))}${tempUnitSymbol(opts.tempUnit)}`;
  if (raw === "__TEMP_MAX__") return `${Math.round(convertTemp(TEMP_MAX_C, opts.tempUnit))}${tempUnitSymbol(opts.tempUnit)}`;
  if (raw === "__TEMP_MID__") {
    const mid = (TEMP_MIN_C + TEMP_MAX_C) / 2;
    return `${Math.round(convertTemp(mid, opts.tempUnit))}${tempUnitSymbol(opts.tempUnit)}`;
  }
  return opts.t(raw);
}

export function MapLegend({ legend }: Props) {
  const { t } = useTranslation();
  const tempUnit = useSettingsStore((s) => s.settings.temp_unit);

  const gradient =
    "linear-gradient(to right, " +
    legend.stops.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ") +
    ")";

  return (
    <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
      <div className="rounded-xl px-3 py-2 bg-black/65 border border-white/[0.08] backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-1.5 gap-3">
          <p className="text-[10px] uppercase tracking-wider text-white/55 font-semibold">
            {t(legend.titleKey)}
          </p>
          {legend.unitKey && (
            <p className="text-[9px] text-white/35">{t(legend.unitKey)}</p>
          )}
        </div>
        <div className="h-2 w-48 rounded-full" style={{ background: gradient }} />
        {legend.ticks && (
          <div className="flex justify-between mt-1 w-48 text-[9px] text-white/55 tabular-nums">
            {legend.ticks.map((tk, i) => (
              <span key={i}>{resolveLabel(tk.label, { tempUnit, t })}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
