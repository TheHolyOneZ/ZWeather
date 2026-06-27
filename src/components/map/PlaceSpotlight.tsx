import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentWeather } from "@/hooks/useWeather";
import { useSettingsStore } from "@/store/settingsStore";
import { convertTemp, convertWind, tempUnitSymbol, windUnitLabel } from "@/lib/units";
import { formatNowAt } from "@/lib/time";
import type { Location } from "@/types/location";

interface Props {
  location: Location;
}

export function PlaceSpotlight({ location }: Props) {
  const { t } = useTranslation();
  const { data } = useCurrentWeather(location.id);
  const { temp_unit, wind_unit, time_format } = useSettingsStore((s) => s.settings);


  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (!data) return null;

  const tempStr = `${Math.round(convertTemp(data.temperature, temp_unit))}${tempUnitSymbol(temp_unit)}`;
  const windStr = `${Math.round(convertWind(data.wind_speed, wind_unit))} ${windUnitLabel(wind_unit)}`;
  const localTime = formatNowAt(data.utc_offset_seconds, { format: time_format });
  const shortName = location.name.split(",")[0].trim();

  return (
    <div className="absolute top-3 left-3 z-[410] pointer-events-none">
      <div className="rounded-2xl bg-black/65 border border-white/[0.08] backdrop-blur-md shadow-lg px-3.5 py-2.5 flex items-center gap-3.5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/45 font-semibold leading-none">
            {shortName}
          </p>
          <p className="text-[10px] text-white/55 tabular-nums mt-0.5 leading-none">
            {localTime}
          </p>
        </div>
        <div className="h-7 w-px bg-white/[0.10]" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/45 leading-none">
            {t("stats.feels", { value: "" }).replace(":", "")}
          </p>
          <p className="text-[16px] font-bold text-white tabular-nums leading-tight mt-0.5">
            {tempStr}
          </p>
        </div>
        <div className="h-7 w-px bg-white/[0.10]" />
        <div className="flex items-center gap-1.5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="text-violet-300"
            style={{ transform: `rotate(${data.wind_direction}deg)` }}
          >
            <path d="M12 3 L7 14 L12 11 L17 14 Z" fill="currentColor" />
          </svg>
          <p className="text-[12px] font-semibold text-white/85 tabular-nums leading-none">
            {windStr}
          </p>
        </div>
      </div>
    </div>
  );
}
