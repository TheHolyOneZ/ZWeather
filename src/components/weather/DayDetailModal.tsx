import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DailyForecast, HourlyForecast } from "@/types/weather";
import { WeatherIcon, tempToColor } from "./WeatherIcon";
import { TempSparkline } from "./TempSparkline";
import { useHorizontalWheel } from "@/hooks/useHorizontalWheel";
import { formatHourLabelAt, formatTimeAt, isDayHour } from "@/lib/time";
import {
  convertTemp,
  convertWind,
  tempUnitSymbol,
  windUnitLabel,
  formatPrecip,
  type TempUnit,
  type WindUnit,
  type PrecipUnit,
} from "@/lib/units";
import { wmoLabelKey } from "@/lib/wmo";
import { useSettingsStore } from "@/store/settingsStore";
import { useAirQuality, useAlerts } from "@/hooks/useWeather";
import { AQI_BAND_COLOR, europeanAqiBand } from "@/types/airQuality";

interface DayDetailModalProps {
  day: DailyForecast;
  hours: HourlyForecast[];
  utcOffsetSeconds: number;
  timeFormat: "24h" | "12h";
  tempUnit: TempUnit;
  windUnit: WindUnit;
  dayLabel: string;
  locationId?: string | null;
  onClose: () => void;
}

export function DayDetailModal({
  day,
  hours,
  utcOffsetSeconds,
  timeFormat,
  tempUnit,
  windUnit,
  dayLabel,
  locationId,
  onClose,
}: DayDetailModalProps) {
  const { t, i18n } = useTranslation();
  const hourlyRef = useRef<HTMLDivElement>(null);
  useHorizontalWheel(hourlyRef);
  const { data: airQuality } = useAirQuality(locationId ?? null);
  const { data: alerts } = useAlerts(locationId ?? null);

  const aqiForDay = airQuality?.daily_max_aqi?.find((d) => d.date === day.date);
  const dayStart = new Date(day.date + "T00:00:00").getTime() / 1000 - utcOffsetSeconds;
  const dayEnd = dayStart + 86400;
  const dayAlerts = (alerts ?? []).filter((a) => {

    if (!a.issued && !a.expires) return true;
    const issued = a.issued || 0;
    const expires = a.expires || Number.MAX_SAFE_INTEGER;
    return issued < dayEnd && expires > dayStart;
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const date = new Date(day.date);
  const dateLine = date.toLocaleDateString(i18n.language, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const precipUnit = useSettingsStore((s) => s.settings.precip_unit) as PrecipUnit;
  const maxGust = day.wind_gust_max || (hours.length > 0 ? Math.max(...hours.map((h) => h.wind_speed)) : day.wind_speed);
  const sparkWidth = Math.max(320, hours.length * 28);
  const sunshineH = Math.floor(day.sunshine_seconds / 3600);
  const sunshineM = Math.round((day.sunshine_seconds % 3600) / 60);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        className="relative glass-popover rounded-2xl w-full max-w-2xl max-h-[88vh] mx-4 flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >

        <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <WeatherIcon code={day.condition_code} size={56} />
            <div>
              <p className="text-[20px] font-semibold text-white/95 leading-tight">{dayLabel}</p>
              <p className="text-[13px] text-white/45 mt-0.5">{dateLine}</p>
              <p className="text-[13px] text-white/65 mt-1">{t(wmoLabelKey(day.condition_code))}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            title={t("dayDetail.close")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
        </div>


        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {dayAlerts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {dayAlerts.map((a) => {
                const c = severityChip(a.severity);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: c.chipBg, color: c.fg }}>
                      {t(`alerts.${a.severity}`, { defaultValue: a.severity })}
                    </span>
                    <span className="text-white/85 truncate">{a.title}</span>
                  </div>
                );
              })}
            </div>
          )}


          <dl className="rounded-xl border border-white/[0.08] bg-white/[0.02] divide-y divide-white/[0.06] overflow-hidden">

            <div className="flex items-baseline gap-3 flex-wrap px-4 py-3.5">
              <div className="flex items-baseline gap-3">
                <span
                  className="text-[40px] font-semibold tabular-nums leading-none tracking-tight"
                  style={{ color: tempToColor(day.temp_high) }}
                >
                  {Math.round(convertTemp(day.temp_high, tempUnit))}{tempUnitSymbol(tempUnit)}
                </span>
                <span className="text-[26px] text-white/25 leading-none">/</span>
                <span
                  className="text-[28px] font-medium tabular-nums leading-none tracking-tight"
                  style={{ color: tempToColor(day.temp_low) }}
                >
                  {Math.round(convertTemp(day.temp_low, tempUnit))}{tempUnitSymbol(tempUnit)}
                </span>
              </div>
              <span className="text-[12px] text-white/50 ml-1">
                {t("dayDetail.feelsShort")}{" "}
                <span className="text-white/80 tabular-nums">
                  {Math.round(convertTemp(day.feels_high, tempUnit))}{tempUnitSymbol(tempUnit)}
                </span>
                <span className="text-white/30"> / </span>
                <span className="text-white/80 tabular-nums">
                  {Math.round(convertTemp(day.feels_low, tempUnit))}{tempUnitSymbol(tempUnit)}
                </span>
              </span>
            </div>
            <MetricRow accent="#7dd3fc" label={t("stats.precipitation", { defaultValue: "Precipitation" })}>
              <ValueWithGlyph glyph={<DropGlyph />} color={day.precip_probability > 30 ? "#7dd3fc" : undefined}>
                {Math.round(day.precip_probability)}%
              </ValueWithGlyph>
              <Divider />
              <ValueWithGlyph glyph={<GaugeGlyph />} color={day.precip_amount > 0 ? "#7dd3fc" : undefined}>
                {formatPrecip(day.precip_amount, precipUnit)}
              </ValueWithGlyph>
            </MetricRow>

            <MetricRow accent="#fbbf24" label={t("dayDetail.solar", { defaultValue: "Solar" })}>
              <ValueWithGlyph glyph={<SunRayGlyph />} color={uvColor(day.uv_max)}>
                {t("dayDetail.uvMax")} {day.uv_max.toFixed(1)}
              </ValueWithGlyph>
              {day.sunshine_seconds > 0 && (
                <>
                  <Divider />
                  <ValueWithGlyph glyph={<ClockGlyph />}>
                    {sunshineH}{t("time.hoursShort")} {sunshineM}{t("time.minutesShort")} {t("dayDetail.sunshine").toLowerCase()}
                  </ValueWithGlyph>
                </>
              )}
            </MetricRow>

            <MetricRow accent="#a5f3fc" label={t("sections.wind")}>
              <ValueWithGlyph glyph={<WindGlyph />}>
                {t("dayDetail.windGust")} {Math.round(convertWind(maxGust, windUnit))} {windUnitLabel(windUnit)}
              </ValueWithGlyph>
            </MetricRow>

            {aqiForDay && (
              <MetricRow
                accent={AQI_BAND_COLOR[europeanAqiBand(aqiForDay.european_aqi_max)]}
                label={t("sections.airQuality", { defaultValue: "Air" })}
              >
                <ValueWithGlyph
                  glyph={<AqiDotGlyph color={AQI_BAND_COLOR[europeanAqiBand(aqiForDay.european_aqi_max)]} />}
                  color={AQI_BAND_COLOR[europeanAqiBand(aqiForDay.european_aqi_max)]}
                >
                  {t("aqi.maxAqi")} {aqiForDay.european_aqi_max}
                </ValueWithGlyph>
                <Divider />
                <ValueWithGlyph glyph={<MoleculeGlyph />}>
                  {t(`pollutants.${aqiForDay.dominant_pollutant}`, { defaultValue: aqiForDay.dominant_pollutant })}
                </ValueWithGlyph>
                {topPollenLabel(airQuality, t) && (
                  <>
                    <Divider />
                    <ValueWithGlyph glyph={<LeafGlyph />}>
                      {topPollenLabel(airQuality, t)}
                    </ValueWithGlyph>
                  </>
                )}
              </MetricRow>
            )}


            <MetricRow accent="#fbbf24" label={t("sections.sun")}>
              <div className="flex items-center gap-2.5 w-full min-w-0">
                <span className="text-[13px] font-medium text-white/90 tabular-nums shrink-0">
                  {formatTimeAt(day.sunrise, utcOffsetSeconds, { format: timeFormat })}
                </span>
                <div className="flex-1 min-w-0">
                  <SunArc sunrise={day.sunrise} sunset={day.sunset} />
                </div>
                <span className="text-[13px] font-medium text-white/90 tabular-nums shrink-0">
                  {formatTimeAt(day.sunset, utcOffsetSeconds, { format: timeFormat })}
                </span>
                <Divider />
                <span className="text-[11px] text-white/55 tabular-nums shrink-0">
                  {(() => {
                    const m = Math.round((day.sunset - day.sunrise) / 60);
                    return `${Math.floor(m / 60)}${t("time.hoursShort")} ${m % 60}${t("time.minutesShort")}`;
                  })()}
                </span>
              </div>
            </MetricRow>
          </dl>


          {hours.length >= 2 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/45 uppercase tracking-[0.14em]">
                {t("dayDetail.tempCurve")}
              </p>
              <div className="overflow-x-auto no-scrollbar">
                <TempSparkline
                  temps={hours.map((h) => h.temperature)}
                  width={sparkWidth}
                  height={64}
                  times={hours.map((h) => h.time)}
                  utcOffsetSeconds={utcOffsetSeconds}
                  timeFormat={timeFormat}
                  tempUnit={tempUnit}
                />
              </div>
            </div>
          )}


          {hours.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/45 uppercase tracking-[0.14em]">
                {t("dayDetail.hourly")}
              </p>
              <HourlyScrollWrap scrollRef={hourlyRef}>
              <div
                ref={hourlyRef}
                className="overflow-x-auto no-scrollbar pb-1 rounded-xl border border-white/[0.08] bg-white/[0.02]"
                style={{ scrollSnapType: "x mandatory" }}
              >
                <div className="flex">
                  {hours.map((h, i) => (
                    <div
                      key={h.time}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 min-w-[78px] ${
                        i < hours.length - 1 ? "border-r border-white/[0.05]" : ""
                      }`}
                      style={{ scrollSnapAlign: "start" }}
                      title={
                        `${formatHourLabelAt(h.time, utcOffsetSeconds, timeFormat)}\n` +
                        `${t("dayDetail.feelsLike", { value: `${Math.round(convertTemp(h.feels_like, tempUnit))}${tempUnitSymbol(tempUnit)}` })}\n` +
                        `${t("dayDetail.humidity")}: ${h.humidity}%\n` +
                        `${t("dayDetail.clouds")}: ${h.cloud_cover}%`
                      }
                    >
                      <span className="text-[11px] font-medium text-white/75 tabular-nums">
                        {formatHourLabelAt(h.time, utcOffsetSeconds, timeFormat)}
                      </span>
                      <WeatherIcon
                        code={h.condition_code}
                        isDay={isDayHour(h.time, utcOffsetSeconds)}
                        size={20}
                      />
                      <span
                        className="text-[14px] font-semibold tabular-nums leading-none"
                        style={{ color: tempToColor(h.temperature) }}
                      >
                        {Math.round(convertTemp(h.temperature, tempUnit))}
                        {tempUnitSymbol(tempUnit)}
                      </span>
                      <div className="flex items-baseline gap-1 leading-none">
                        <span className="text-[9px] text-white/45 uppercase tracking-wide">
                          {t("dayDetail.feelsShort")}
                        </span>
                        <span className="text-[11px] text-white/75 tabular-nums">
                          {Math.round(convertTemp(h.feels_like, tempUnit))}
                          {tempUnitSymbol(tempUnit)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 leading-none">
                        <svg width="7" height="9" viewBox="0 0 5 7" fill="none">
                          <path
                            d="M2.5 0C2.5 0 0 3.5 0 4.8a2.5 2.5 0 005 0C5 3.5 2.5 0 2.5 0z"
                            fill="#60a5fa"
                            opacity={h.precip_probability > 10 ? Math.min(1, h.precip_probability / 60) : 0.35}
                          />
                        </svg>
                        <span
                          className="text-[11px] font-medium tabular-nums"
                          style={{ color: h.precip_probability > 10 ? "#7dd3fc" : "color-mix(in srgb, var(--color-foreground) 50%, transparent)" }}
                        >
                          {Math.round(h.precip_probability)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 leading-none">
                        <HumidityGlyph />
                        <span className="text-[11px] text-white/65 tabular-nums w-7 text-left">{h.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-1 leading-none">
                        <CloudGlyph />
                        <span className="text-[11px] text-white/65 tabular-nums w-7 text-left">{h.cloud_cover}%</span>
                      </div>
                      <div className="flex items-center gap-1 leading-none mt-0.5">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 10 10"
                          style={{ transform: `rotate(${h.wind_direction}deg)`, opacity: 0.7 }}
                        >
                          <polygon
                            points="5,0 8.5,8.5 5,7 1.5,8.5"
                            fill="color-mix(in srgb, var(--color-foreground) 95%, transparent)"
                          />
                        </svg>
                        <span className="text-[11px] text-white/70 tabular-nums">
                          {Math.round(convertWind(h.wind_speed, windUnit))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </HourlyScrollWrap>
            </div>
          ) : (
            <p className="text-[12px] text-white/40 italic px-1">{t("tenday.noHourly")}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function HourlyScrollWrap({
  scrollRef,
  children,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [scrollRef]);

  const page = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {children}

      <div
        className="pointer-events-none absolute top-0 left-0 bottom-1 w-10 transition-opacity duration-200"
        style={{
          background: "linear-gradient(90deg, rgba(15,16,20,0.85), transparent)",
          opacity: canLeft ? 1 : 0,
        }}
      />
      <button
        type="button"
        onClick={() => page(-1)}
        aria-label="Scroll left"
        className="absolute top-1/2 -translate-y-1/2 left-1 w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.1] backdrop-blur-md flex items-center justify-center text-white/80 transition-opacity duration-200"
        style={{ opacity: canLeft ? 1 : 0, pointerEvents: canLeft ? "auto" : "none" }}
      >
        <ChevronLeft size={14} />
      </button>

      <div
        className="pointer-events-none absolute top-0 right-0 bottom-1 w-10 transition-opacity duration-200"
        style={{
          background: "linear-gradient(270deg, rgba(15,16,20,0.85), transparent)",
          opacity: canRight ? 1 : 0,
        }}
      />
      <button
        type="button"
        onClick={() => page(1)}
        aria-label="Scroll right"
        className="absolute top-1/2 -translate-y-1/2 right-1 w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.1] backdrop-blur-md flex items-center justify-center text-white/80 transition-opacity duration-200"
        style={{ opacity: canRight ? 1 : 0, pointerEvents: canRight ? "auto" : "none" }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function topPollenLabel(
  aq: ReturnType<typeof useAirQuality>["data"] | undefined,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string | null {
  if (!aq) return null;
  const pollens: Array<[string, number]> = [
    ["alder", aq.alder_pollen],
    ["birch", aq.birch_pollen],
    ["grass", aq.grass_pollen],
    ["mugwort", aq.mugwort_pollen],
    ["olive", aq.olive_pollen],
    ["ragweed", aq.ragweed_pollen],
  ];
  const top = pollens.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  return t(`pollen.${top[0]}`, { defaultValue: top[0] });
}

function severityChip(severity: string): { bg: string; border: string; chipBg: string; fg: string } {
  switch (severity) {
    case "extreme":
      return { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  chipBg: "rgba(239,68,68,0.22)",  fg: "#fca5a5" };
    case "severe":
      return { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", chipBg: "rgba(249,115,22,0.22)", fg: "#fdba74" };
    case "moderate":
      return { bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.22)", chipBg: "rgba(251,191,36,0.18)", fg: "#fde68a" };
    default:
      return { bg: "rgba(250,204,21,0.05)", border: "rgba(250,204,21,0.18)", chipBg: "rgba(250,204,21,0.15)", fg: "#fde68a" };
  }
}

function uvColor(uv: number): string | undefined {
  if (uv >= 11) return "#a855f7";
  if (uv >= 8)  return "#ef4444";
  if (uv >= 6)  return "#f97316";
  if (uv >= 3)  return "#fbbf24";
  return undefined;
}

function CloudGlyph() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="shrink-0">
      <path
        d="M3 7c-1.5 0-2.5-1-2.5-2.3 0-1.2 1-2.2 2.3-2.2 0.3-1.4 1.6-2.3 3-2.2 1.5 0 2.7 1 2.9 2.5 1.4 0.1 2.3 1.1 2.3 2.2 0 1.2-1 2-2.5 2H3z"
        fill="rgba(226,232,240,0.85)"
      />
    </svg>
  );
}

function HumidityGlyph() {

  return (
    <svg width="10" height="8" viewBox="0 0 12 9" fill="none" className="shrink-0">
      <path
        d="M0 2 Q 2 0.5 4 2 T 8 2 T 12 2"
        stroke="rgba(125,211,252,0.75)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M0 5 Q 2 3.5 4 5 T 8 5 T 12 5"
        stroke="rgba(125,211,252,0.6)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M0 8 Q 2 6.5 4 8 T 8 8 T 12 8"
        stroke="rgba(125,211,252,0.5)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}


function MetricRow({
  label,
  accent,
  align = "center",
  children,
}: {
  label: string;
  accent: string;
  align?: "center" | "start";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid grid-cols-[128px_1fr] ${align === "start" ? "items-start" : "items-center"}`}
    >
      <dt
        className={`flex items-center gap-2 text-[10px] text-white/45 uppercase tracking-[0.14em] px-3.5 py-2.5 border-r border-white/[0.06] h-full ${
          align === "start" ? "pt-3" : ""
        }`}
      >
        <AccentDot color={accent} />
        <span className="leading-[1.15] break-words">{label}</span>
      </dt>
      <dd className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-white/85 px-3.5 py-2.5 min-w-0">
        {children}
      </dd>
    </div>
  );
}

function ValueWithGlyph({
  glyph,
  color,
  children,
}: {
  glyph: React.ReactNode;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 leading-none">
      <span className="shrink-0 opacity-90">{glyph}</span>
      <span
        className="font-medium tabular-nums"
        style={{ color: color ?? "color-mix(in srgb, var(--color-foreground) 88%, transparent)" }}
      >
        {children}
      </span>
    </span>
  );
}

function Divider() {


  return (
    <svg
      width="1"
      height="14"
      viewBox="0 0 1 14"
      className="shrink-0 mx-0.5 opacity-70"
      aria-hidden
    >
      <defs>
        <linearGradient id="dl-divider" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
          <stop offset="50%"  stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <line x1="0.5" y1="0" x2="0.5" y2="14" stroke="url(#dl-divider)" strokeWidth="1" />
    </svg>
  );
}

function AccentDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="shrink-0 inline-block w-1.5 h-1.5 rounded-full"
      style={{
        background: color,
        boxShadow: `0 0 6px ${color}66`,
      }}
    />
  );
}

function SunArc({ sunrise, sunset }: { sunrise: number; sunset: number }) {


  const now = Date.now() / 1000;
  const pct = sunset > sunrise
    ? Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise)))
    : 0;
  const inDay = now >= sunrise && now <= sunset;
  return (
    <div className="relative h-1.5 w-full rounded-full overflow-visible">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.65) 25%, rgba(249,115,22,0.7) 75%, rgba(249,115,22,0.15) 100%)",
        }}
      />
      {inDay && (
        <div
          className="absolute -top-1 w-3.5 h-3.5 rounded-full"
          style={{
            left: `calc(${pct * 100}% - 7px)`,
            background: "radial-gradient(circle, #fef3c7 0%, #fbbf24 60%, rgba(251,191,36,0) 100%)",
            boxShadow: "0 0 8px rgba(251,191,36,0.6)",
          }}
        />
      )}
    </div>
  );
}


function DropGlyph() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden>
      <path
        d="M4.5 0.5 C4.5 0.5 0.8 5 0.8 7.6 a3.7 3.7 0 0 0 7.4 0 C8.2 5 4.5 0.5 4.5 0.5z"
        fill="#7dd3fc"
        opacity="0.85"
      />
      <circle cx="3" cy="8" r="1" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

function GaugeGlyph() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
      <path
        d="M1 8 A5 5 0 0 1 11 8"
        stroke="rgba(186,230,253,0.85)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="6" y1="8" x2="8.5" y2="4" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="6" cy="8" r="0.9" fill="#7dd3fc" />
    </svg>
  );
}

function SunRayGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="2.4" fill="#fbbf24" />
      <g stroke="#fbbf24" strokeWidth="1.1" strokeLinecap="round">
        <line x1="6" y1="0.5" x2="6" y2="2" />
        <line x1="6" y1="10" x2="6" y2="11.5" />
        <line x1="0.5" y1="6" x2="2" y2="6" />
        <line x1="10" y1="6" x2="11.5" y2="6" />
        <line x1="2" y1="2" x2="3" y2="3" />
        <line x1="9" y1="9" x2="10" y2="10" />
        <line x1="10" y1="2" x2="9" y2="3" />
        <line x1="3" y1="9" x2="2" y2="10" />
      </g>
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <circle cx="5.5" cy="5.5" r="4.6" stroke="rgba(255,255,255,0.65)" strokeWidth="1" />
      <line x1="5.5" y1="5.5" x2="5.5" y2="2.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="5.5" y1="5.5" x2="7.6" y2="5.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function WindGlyph() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
      <path
        d="M1 3 H 9 a1.6 1.6 0 1 0 -1.5 -2.1"
        stroke="rgba(165,243,252,0.9)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M1 6 H 11 a1.4 1.4 0 1 1 -1.3 2"
        stroke="rgba(165,243,252,0.75)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M1 9 H 6"
        stroke="rgba(165,243,252,0.55)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function AqiDotGlyph({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <circle cx="5" cy="5" r="3.4" fill={color} opacity="0.9" />
      <circle cx="5" cy="5" r="4.6" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="0.9" />
    </svg>
  );
}

function MoleculeGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <line x1="3" y1="3" x2="9" y2="9" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      <line x1="9" y1="3" x2="3" y2="9" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      <circle cx="3" cy="3" r="1.6" fill="rgba(226,232,240,0.85)" />
      <circle cx="9" cy="3" r="1.6" fill="rgba(226,232,240,0.85)" />
      <circle cx="3" cy="9" r="1.6" fill="rgba(226,232,240,0.85)" />
      <circle cx="9" cy="9" r="1.6" fill="rgba(226,232,240,0.85)" />
    </svg>
  );
}

function LeafGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path
        d="M1.5 9.5 C 1.5 4 5 1.5 9.5 1.5 C 9.5 6 7 9.5 1.5 9.5z"
        fill="#86efac"
        opacity="0.85"
      />
      <path
        d="M2 9 L 7 4"
        stroke="rgba(22,101,52,0.7)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
