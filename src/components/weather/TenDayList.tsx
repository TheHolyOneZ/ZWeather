import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DailyForecast, HourlyForecast } from "@/types/weather";
import { GlassCard } from "@/components/ui/GlassCard";
import { WeatherIcon, tempToColor } from "./WeatherIcon";
import { wmoToConditionGroup } from "@/types/weather";
import { getDateAt } from "@/lib/time";
import { convertTemp, tempUnitSymbol, type TempUnit, type WindUnit } from "@/lib/units";
import { DayDetailModal } from "./DayDetailModal";

interface TenDayListProps {
  days: DailyForecast[];
  allHourly?: HourlyForecast[];
  utcOffsetSeconds?: number;
  timeFormat?: "24h" | "12h";
  tempUnit?: TempUnit;
  windUnit?: WindUnit;
  locationId?: string | null;
}

const CONDITION_LABEL_KEYS: Record<string, string> = {
  "clear-day":   "tenday.clearDay",
  "clear-night": "tenday.clearNight",
  "cloudy":      "tenday.cloudy",
  "overcast":    "tenday.overcast",
  "fog":         "tenday.fog",
  "drizzle":     "tenday.drizzle",
  "rain":        "tenday.rain",
  "snow":        "tenday.snow",
  "thunderstorm":"tenday.thunderstorm",
};

export function TenDayList({
  days,
  allHourly = [],
  utcOffsetSeconds = 0,
  timeFormat = "24h",
  tempUnit = "C",
  windUnit = "kmh",
  locationId = null,
}: TenDayListProps) {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (!days.length) return null;

  const weekMin = Math.min(...days.map((d) => d.temp_low));
  const weekMax = Math.max(...days.map((d) => d.temp_high));
  const weekSpan = weekMax - weekMin || 1;


  const tickValues = [-20, -10, 0, 10, 20, 30, 40].filter(
    (v) => v > weekMin && v < weekMax,
  );
  const tickPositions = tickValues.map((v) => ({
    value: v,
    pct: ((v - weekMin) / weekSpan) * 100,
  }));

  const selectedDay = selectedDate ? days.find((d) => d.date === selectedDate) ?? null : null;
  const selectedHours = selectedDay
    ? allHourly.filter((h) => getDateAt(h.time, utcOffsetSeconds) === selectedDay.date)
    : [];
  const selectedIdx = selectedDay ? days.findIndex((d) => d.date === selectedDay.date) : -1;
  const selectedLabel = selectedDay
    ? selectedIdx === 0
      ? t("time.today")
      : selectedIdx === 1
      ? t("time.tomorrow")
      : new Date(selectedDay.date).toLocaleDateString(i18n.language, { weekday: "long" })
    : "";

  return (
    <>
      <GlassCard className="p-4 shrink-0">
        <p className="text-[11px] text-white/55 uppercase tracking-widest mb-3">{t("sections.tenDay")}</p>

        <div className="flex flex-col divide-y divide-white/[0.04]">
          {days.map((day, i) => {
            const date = new Date(day.date);
            const dayLabel = i === 0 ? t("time.today") : i === 1 ? t("time.tomorrow")
              : date.toLocaleDateString(i18n.language, { weekday: "short" });

            const group = wmoToConditionGroup(day.condition_code);
            const condKey = CONDITION_LABEL_KEYS[group];
            const condLabel = condKey ? t(condKey) : "—";
            const hasPrecip = day.precip_probability > 10;
            const isToday = i === 0;

            const barLeft  = ((day.temp_low  - weekMin) / weekSpan) * 100;
            const barRight = ((weekMax - day.temp_high) / weekSpan) * 100;

            return (
              <motion.button
                key={day.date}
                className={[
                  "w-full flex items-center gap-3 py-2.5 rounded-xl px-1 text-left",
                  isToday ? "bg-white/[0.04]" : "",
                  "hover:bg-white/[0.04] transition-colors group",
                ].join(" ")}
                onClick={() => setSelectedDate(day.date)}
                whileTap={{ scale: 0.99 }}
              >

                <span className={`text-[13px] w-[76px] shrink-0 font-medium ${isToday ? "text-white/90" : "text-white/70"}`}>
                  {dayLabel}
                </span>


                <div className="flex items-center gap-1.5 w-[78px] shrink-0">
                  <WeatherIcon code={day.condition_code} size={28} />
                  <span className="text-[12px] text-white/40 truncate">{condLabel}</span>
                </div>


                <div className="flex items-center gap-0.5 w-9 shrink-0 justify-end">
                  {hasPrecip && (
                    <svg width="5" height="6" viewBox="0 0 5 7" fill="none">
                      <path d="M2.5 0C2.5 0 0 3.5 0 4.8a2.5 2.5 0 005 0C5 3.5 2.5 0 2.5 0z"
                        fill="#60a5fa" opacity={Math.min(1, day.precip_probability / 60)} />
                    </svg>
                  )}
                  <span
                    className="text-[12px] tabular-nums"
                    style={{ color: hasPrecip ? "#60a5fa" : "color-mix(in srgb, var(--color-foreground) 15%, transparent)" }}
                  >
                    {hasPrecip ? `${Math.round(day.precip_probability)}%` : ""}
                  </span>
                </div>


                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-[12px] text-white/45 tabular-nums w-7 text-right shrink-0">
                    {Math.round(convertTemp(day.temp_low, tempUnit))}{tempUnitSymbol(tempUnit)}
                  </span>
                  <div className="flex-1 h-[6px] rounded-full bg-white/[0.10] relative">

                    {tickPositions.map((tick) => (
                      <div
                        key={tick.value}
                        className="absolute top-[-2px] bottom-[-2px] w-px"
                        style={{
                          left: `${tick.pct}%`,
                          background: tick.value === 0 ? "rgba(125,211,252,0.30)" : "color-mix(in srgb, var(--color-foreground) 10%, transparent)",
                        }}
                      />
                    ))}
                    <div
                      className="absolute top-0 bottom-0 rounded-full"
                      style={{
                        left: `${barLeft}%`,
                        right: `${barRight}%`,
                        background: `linear-gradient(90deg, ${tempToColor(day.temp_low)}, ${tempToColor(day.temp_high)})`,
                      }}
                    />
                  </div>
                  <span className={`text-[13px] tabular-nums w-7 shrink-0 font-medium ${isToday ? "text-white/95" : "text-white/85"}`}>
                    {Math.round(convertTemp(day.temp_high, tempUnit))}{tempUnitSymbol(tempUnit)}
                  </span>
                </div>


                <ChevronRight
                  size={14}
                  className="shrink-0 text-white/15 group-hover:text-white/45 transition-colors"
                />
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      <AnimatePresence>
        {selectedDay && (
          <DayDetailModal
            day={selectedDay}
            hours={selectedHours}
            utcOffsetSeconds={utcOffsetSeconds}
            timeFormat={timeFormat}
            tempUnit={tempUnit}
            windUnit={windUnit}
            dayLabel={selectedLabel}
            locationId={locationId}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
