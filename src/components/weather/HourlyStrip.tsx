import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { HourlyForecast } from "@/types/weather";
import { GlassCard } from "@/components/ui/GlassCard";
import { WeatherIcon, tempToColor } from "./WeatherIcon";
import { TempSparkline } from "./TempSparkline";
import { useHorizontalWheel } from "@/hooks/useHorizontalWheel";
import { formatHourLabelAt, isDayHour } from "@/lib/time";
import { convertTemp, convertWind, tempUnitSymbol, windUnitLabel, type TempUnit, type WindUnit } from "@/lib/units";

interface HourlyStripProps {
  hours: HourlyForecast[];
  currentTemp?: number;
  utcOffsetSeconds?: number;
  timeFormat?: "24h" | "12h";
  tempUnit?: TempUnit;
  windUnit?: WindUnit;
}

const COL_W = 54;

export function HourlyStrip({ hours, currentTemp, utcOffsetSeconds = 0, timeFormat = "24h", tempUnit = "C", windUnit = "kmh" }: HourlyStripProps) {
  const { t } = useTranslation();
  const now = Date.now() / 1000;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useHorizontalWheel(scrollRef);

  const slice = hours.slice(0, 25);
  const nowIdx = slice.findIndex(
    (h, i) => h.time <= now && (slice[i + 1]?.time ?? Infinity) > now
  );
  const temps = slice.map((h, i) =>
    i === nowIdx && currentTemp != null ? currentTemp : h.temperature
  );
  const sparkW = (slice.length - 1) * COL_W;

  return (
    <GlassCard className="p-4 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-white/55 uppercase tracking-widest">{t("sections.next24h")}</span>
      </div>


      <div ref={scrollRef} className="overflow-x-auto pb-1 no-scrollbar">
        <div style={{ width: sparkW + COL_W }}>

          <div className="flex">
            {slice.map((h, i) => {
              const isPast = h.time < now;
              const isCurrent = i === nowIdx;
              const displayTemp = isCurrent && currentTemp != null ? currentTemp : h.temperature;
              const color = tempToColor(displayTemp);
              const hasPrecip = h.precip_probability > 10;
              const isHovered = hoveredIdx === i;

              return (
                <motion.div
                  key={h.time}
                  style={{ width: COL_W, minWidth: COL_W }}
                  className={[
                    "flex flex-col items-center gap-1 py-2 rounded-xl relative cursor-default",
                    isCurrent ? "bg-white/[0.09] ring-1 ring-white/15" : "",
                    isHovered && !isCurrent ? "bg-white/[0.06]" : "",
                    isPast ? "opacity-40" : "",
                  ].filter(Boolean).join(" ")}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  animate={{ opacity: isPast ? 0.4 : 1 }}
                  transition={{ delay: i * 0.012 }}
                >

                  <span className={`text-[12px] tabular-nums ${isCurrent ? "text-white/90 font-semibold" : "text-white/70"}`}>
                    {isCurrent ? t("time.now") : formatHourLabelAt(h.time, utcOffsetSeconds, timeFormat)}
                  </span>


                  <WeatherIcon code={h.condition_code} isDay={isDayHour(h.time, utcOffsetSeconds)} size={36} />


                  <span className="text-[14px] font-semibold tabular-nums" style={{ color }}>
                    {Math.round(convertTemp(displayTemp, tempUnit))}{tempUnitSymbol(tempUnit)}
                  </span>


                  <div className="flex items-center gap-0.5">
                    {hasPrecip && (
                      <svg width="5" height="7" viewBox="0 0 5 7" fill="none">
                        <path d="M2.5 0C2.5 0 0 3.5 0 4.8a2.5 2.5 0 005 0C5 3.5 2.5 0 2.5 0z"
                          fill="#60a5fa" opacity={Math.min(1, h.precip_probability / 55)} />
                      </svg>
                    )}
                    <span
                      className="text-[11px] tabular-nums font-medium"
                      style={{ color: hasPrecip ? "#7dd3fc" : "color-mix(in srgb, var(--color-foreground) 45%, transparent)" }}
                    >
                      {Math.round(h.precip_probability)}%
                    </span>
                  </div>


                  {(h.wind_speed > 12 || isHovered) && (
                    <svg width="10" height="10" viewBox="0 0 10 10"
                      style={{ transform: `rotate(${h.wind_direction}deg)`, opacity: 0.5 }}>
                      <polygon points="5,0 8.5,8.5 5,7 1.5,8.5" fill="color-mix(in srgb, var(--color-foreground) 80%, transparent)" />
                    </svg>
                  )}


                  {isHovered && (
                    <motion.div
                      className="absolute bottom-full mb-2 glass-popover rounded-xl p-2.5 text-[11px] text-white/70 whitespace-nowrap z-20 pointer-events-none"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12 }}
                      style={{ left: "50%", transform: "translateX(-50%)" }}
                    >
                      <p className="font-medium text-white/90">{formatHourLabelAt(h.time, utcOffsetSeconds, timeFormat)}</p>
                      <p>{Math.round(convertTemp(displayTemp, tempUnit))}{tempUnitSymbol(tempUnit)} · {Math.round(h.precip_probability)}% rain</p>
                      <p className="text-white/50">{Math.round(convertWind(h.wind_speed, windUnit))} {windUnitLabel(windUnit)}</p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>


          <div className="mt-1 px-[27px]">
            <TempSparkline
              temps={temps}
              width={sparkW}
              height={32}
              times={slice.map((h) => h.time)}
              utcOffsetSeconds={utcOffsetSeconds}
              timeFormat={timeFormat}
              tempUnit={tempUnit}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
