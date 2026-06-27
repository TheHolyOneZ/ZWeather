import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import type { AirQuality, AqiBand } from "@/types/airQuality";
import { AQI_BAND_COLOR, europeanAqiBand, usAqiBand } from "@/types/airQuality";

interface AirQualityCardProps {
  data: AirQuality;
  country?: string;
}

const POLLEN_MAX = 50;
const POLLUTANT_MAX: Record<string, number> = {
  pm2_5: 75,
  pm10: 100,
  ozone: 240,
  no2: 200,
  so2: 350,
  co: 10000,
  dust: 80,
};

export function AirQualityCard({ data, country }: AirQualityCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const useUs = country === "United States" || country === "USA" || country === "US";
  const value = useUs ? data.us_aqi : data.european_aqi;
  const band: AqiBand = useUs ? usAqiBand(value) : europeanAqiBand(value);
  const bandColor = AQI_BAND_COLOR[band];
  const max = useUs ? 300 : 100;
  const pct = Math.min(100, (value / max) * 100);

  const pollens = [
    { key: "alder", v: data.alder_pollen },
    { key: "birch", v: data.birch_pollen },
    { key: "grass", v: data.grass_pollen },
    { key: "mugwort", v: data.mugwort_pollen },
    { key: "olive", v: data.olive_pollen },
    { key: "ragweed", v: data.ragweed_pollen },
  ];
  const hasPollen = pollens.some((p) => p.v > 0);
  const topPollens = pollens.filter((p) => p.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);

  const pollutants = [
    { key: "pm25", v: data.pm2_5, max: POLLUTANT_MAX.pm2_5, unit: "μg/m³" },
    { key: "pm10", v: data.pm10, max: POLLUTANT_MAX.pm10, unit: "μg/m³" },
    { key: "ozone", v: data.ozone, max: POLLUTANT_MAX.ozone, unit: "μg/m³" },
    { key: "no2", v: data.nitrogen_dioxide, max: POLLUTANT_MAX.no2, unit: "μg/m³" },
    { key: "so2", v: data.sulphur_dioxide, max: POLLUTANT_MAX.so2, unit: "μg/m³" },
    { key: "co", v: data.carbon_monoxide, max: POLLUTANT_MAX.co, unit: "μg/m³" },
    { key: "dust", v: data.dust, max: POLLUTANT_MAX.dust, unit: "μg/m³" },
  ];

  return (
    <motion.div
      className="rounded-2xl border overflow-hidden shrink-0"
      style={{
        background: `linear-gradient(135deg, ${bandColor}10, ${bandColor}05)`,
        borderColor: `${bandColor}33`,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >

        <div className="relative shrink-0">
          <svg width="48" height="48" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke="color-mix(in srgb, var(--color-foreground) 12%, transparent)"
              strokeWidth="3.2"
            />
            <motion.circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke={bandColor}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 106.8} 106.8`}
              transform="rotate(-90 20 20)"
              initial={{ strokeDasharray: "0 106.8" }}
              animate={{ strokeDasharray: `${(pct / 100) * 106.8} 106.8` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-semibold tabular-nums leading-none" style={{ color: bandColor }}>
              {value}
            </span>
          </div>
        </div>


        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold" style={{ color: bandColor }}>
              {t(`aqi.${band}`)}
            </p>
            <span className="text-[10px] text-white/35 uppercase tracking-wider">
              {useUs ? t("aqi.us") : t("aqi.european")}
            </span>
          </div>
          <p className="text-[11px] text-white/55 truncate mt-0.5">
            <span className="text-white/40">{t("aqi.dominantPollutant")}:</span>{" "}
            <span className="text-white/75 font-medium">{t(`pollutants.${data.dominant_pollutant}`)}</span>
          </p>
        </div>


        {hasPollen && !expanded && (
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {topPollens.map((p) => (
              <div
                key={p.key}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]"
                title={`${t(`pollen.${p.key}`)}: ${p.v.toFixed(1)} grains/m³`}
              >
                <PollenDots level={p.v} />
                <span className="text-[10px] text-white/55">{t(`pollen.${p.key}`)}</span>
              </div>
            ))}
          </div>
        )}

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="shrink-0 text-white/40"
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>


      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        aria-hidden={!expanded}
      >
        <div className="overflow-hidden min-h-0">
          <div
            className={`border-t border-white/[0.06] transition-opacity duration-200 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">

              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                  {t("aqi.pollutants")}
                </p>
                <div className="space-y-1.5">
                  {pollutants.map((p) => (
                    <PollutantBar
                      key={p.key}
                      label={t(`pollutants.${p.key}`)}
                      value={p.v}
                      max={p.max}
                      unit={p.unit}
                      color={bandColor}
                    />
                  ))}
                </div>
              </div>


              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                  {t("aqi.pollen")}
                </p>
                {hasPollen ? (
                  <div className="space-y-1.5">
                    {pollens.map((p) => (
                      <PollutantBar
                        key={p.key}
                        label={t(`pollen.${p.key}`)}
                        value={p.v}
                        max={POLLEN_MAX}
                        unit="g/m³"
                        color="#a78bfa"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/35 italic">{t("aqi.pollenUnavailable")}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PollutantBar({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-white/60 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-white/65 tabular-nums w-14 text-right shrink-0">
        {value < 10 ? value.toFixed(1) : Math.round(value)}
        <span className="text-white/30 text-[9px] ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

function PollenDots({ level }: { level: number }) {

  let count = 0;
  if (level >= 1) count = 1;
  if (level >= 20) count = 2;
  if (level >= 50) count = 3;
  if (level >= 150) count = 4;
  const color = level >= 150 ? "#ef4444" : level >= 50 ? "#fb923c" : level >= 20 ? "#facc15" : "#84cc16";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ background: i < count ? color : "color-mix(in srgb, var(--color-foreground) 15%, transparent)" }}
        />
      ))}
    </div>
  );
}
