import type { CurrentWeather } from "@/types/weather";
import type { AirQuality } from "@/types/airQuality";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { convertTemp, convertWind, tempUnitSymbol, windUnitLabel, type TempUnit, type WindUnit } from "@/lib/units";

interface ActivityCardProps {
  current: CurrentWeather;
  now: number;
  tempUnit?: TempUnit;
  windUnit?: WindUnit;
  airQuality?: AirQuality;
  className?: string;
}

type AqiLevel = "ok" | "moderate" | "bad";

function classifyAqi(aq?: AirQuality): AqiLevel {
  if (!aq) return "ok";
  const us = aq.us_aqi ?? 0;
  const eu = aq.european_aqi ?? 0;
  if (us >= 101 || eu >= 60) return "bad";
  if (us >= 51  || eu >= 40) return "moderate";
  return "ok";
}

const OUTDOOR_ACTIVITIES = new Set(["running", "cycling", "hiking", "outdoors"]);

function applyAqi(score: Score, reason: string, key: string, level: AqiLevel, t: TFunction): { score: Score; reason: string } {
  if (level === "ok" || !OUTDOOR_ACTIVITIES.has(key)) return { score, reason };
  if (level === "bad") {
    return { score: "poor", reason: t("reasons.aqiPoor") };
  }
  if (score === "good") {
    return { score: "fair", reason: t("reasons.aqiModerate") };
  }
  return { score, reason };
}


function fmtT(c: number, u: TempUnit): string {
  return `${Math.round(convertTemp(c, u))}${tempUnitSymbol(u)}`;
}
function fmtW(kmh: number, u: WindUnit): string {
  return `${Math.round(convertWind(kmh, u))} ${windUnitLabel(u)}`;
}

type Score = "good" | "fair" | "poor";

interface Activity {
  key: string;
  label: string;
  score: Score;
  reason: string;
  icon: React.ReactNode;
}

function scoreLabel(s: Score, t: TFunction): string {
  if (s === "good") return t("scores.good");
  if (s === "fair") return t("scores.fair");
  return t("scores.poor");
}

function scorePillStyle(s: Score): { background: string; color: string } {
  const light = typeof document !== "undefined"
    && document.documentElement.getAttribute("data-theme") === "light";
  if (s === "good") return { background: "rgba(74, 222, 128, 0.18)", color: light ? "#15803d" : "#86efac" };
  if (s === "fair") return { background: "rgba(251, 191, 36, 0.20)", color: light ? "#a16207" : "#fcd34d" };
  return { background: "rgba(248, 113, 113, 0.20)", color: light ? "#b91c1c" : "#fca5a5" };
}

function computeActivities(c: CurrentWeather, now: number, tu: TempUnit, wu: WindUnit, t: TFunction): Activity[] {
  const { temperature: temp, wind_speed: wind, condition_code: code, sunrise, sunset } = c;
  const inGolden = (now > sunrise && now < sunrise + 3600) || (now > sunset - 3600 && now < sunset);
  const isNight  = now < sunrise || now > sunset;
  const isPrecip = code >= 51;
  const isHeavy  = code >= 65;
  const isStorm  = code >= 95;
  const isFog    = code === 45 || code === 48;
  const isSnow   = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
  const isHot    = temp >= 32;
  const isDanger = temp >= 36;

  const running: Score =
    isDanger || temp < 0 ? "poor"
    : temp >= 5 && temp <= 24 && !isPrecip && wind < 35 ? "good"
    : temp <= 30 && !isHeavy ? "fair"
    : "poor";

  const cycling: Score =
    isDanger || temp < 0 ? "poor"
    : temp >= 5 && temp <= 26 && !isPrecip && wind < 30 ? "good"
    : temp <= 32 && !isHeavy ? "fair"
    : "poor";

  const photo: Score =
    isStorm ? "poor"
    : inGolden && !isHeavy ? "good"
    : !isHeavy && code <= 3 ? "good"
    : !isHeavy && (code <= 48) ? "fair"
    : "poor";

  const outdoor: Score =
    isDanger || temp < 5 ? "poor"
    : temp >= 16 && temp <= 28 && !isPrecip && wind < 25 ? "good"
    : !isHot && temp <= 32 && !isHeavy ? "fair"
    : "poor";

  const swimming: Score =
    isStorm || temp < 20 ? "poor"
    : temp >= 24 && code <= 3 && wind < 25 ? "good"
    : temp >= 22 && !isHeavy && wind < 30 ? "fair"
    : "poor";

  const hiking: Score =
    isStorm || isDanger || temp < 0 ? "poor"
    : temp >= 8 && temp <= 24 && !isPrecip && wind < 30 ? "good"
    : temp >= 0 && temp <= 30 && !isHeavy ? "fair"
    : "poor";

  const stargazing: Score =
    !isNight ? "poor"
    : code === 0 && wind < 20 ? "good"
    : code <= 2 ? "fair"
    : "poor";

  const driving: Score =
    isStorm || isFog || isHeavy || isSnow ? "poor"
    : isPrecip || wind > 45 ? "fair"
    : "good";

  return [
    { key: "running",     label: t("activities.running"),     score: running,    reason: runningReason(temp, wind, isPrecip, isHeavy, tu, wu, t),   icon: <RunningIcon /> },
    { key: "cycling",     label: t("activities.cycling"),     score: cycling,    reason: cyclingReason(temp, wind, isPrecip, isHeavy, tu, wu, t),   icon: <CyclingIcon /> },
    { key: "hiking",      label: t("activities.hiking"),      score: hiking,     reason: hikingReason(temp, wind, isPrecip, isHeavy, isStorm, tu, wu, t), icon: <HikingIcon /> },
    { key: "swimming",    label: t("activities.swimming"),    score: swimming,   reason: swimmingReason(temp, isStorm, isHeavy, code, tu, t),       icon: <SwimmingIcon /> },
    { key: "outdoors",    label: t("activities.outdoors"),    score: outdoor,    reason: outdoorReason(temp, wind, isPrecip, isHeavy, tu, wu, t),   icon: <OutdoorIcon /> },
    { key: "photography", label: t("activities.photography"), score: photo,      reason: photoReason(inGolden, isStorm, isHeavy, code, t),          icon: <CameraIcon /> },
    { key: "stargazing",  label: t("activities.stargazing"),  score: stargazing, reason: stargazeReason(isNight, code, t),                          icon: <StarIcon /> },
    { key: "driving",     label: t("activities.driving"),     score: driving,    reason: drivingReason(isFog, isSnow, isStorm, isHeavy, isPrecip, wind, wu, t), icon: <CarIcon /> },
  ];
}

function runningReason(temp: number, wind: number, precip: boolean, heavy: boolean, tu: TempUnit, wu: WindUnit, t: TFunction): string {
  if (temp >= 36) return t("reasons.dangerHeat", { t: fmtT(temp, tu) });
  if (temp >= 32) return t("reasons.heatStress", { t: fmtT(temp, tu) });
  if (heavy)      return t("reasons.precipitation");
  if (temp > 28)  return t("reasons.hot", { t: fmtT(temp, tu) });
  if (temp < 5)   return t("reasons.cold", { t: fmtT(temp, tu) });
  if (wind > 35)  return t("reasons.windy", { w: fmtW(wind, wu) });
  if (precip)     return t("reasons.lightRain");
  return t("reasons.ideal");
}

function cyclingReason(temp: number, wind: number, precip: boolean, heavy: boolean, tu: TempUnit, wu: WindUnit, t: TFunction): string {
  if (temp >= 36) return t("reasons.dangerHeat", { t: fmtT(temp, tu) });
  if (temp >= 32) return t("reasons.heatStress", { t: fmtT(temp, tu) });
  if (heavy)      return t("reasons.precipitation");
  if (wind > 30)  return t("reasons.windy", { w: fmtW(wind, wu) });
  if (temp > 26)  return t("reasons.hot", { t: fmtT(temp, tu) });
  if (temp < 5)   return t("reasons.cold", { t: fmtT(temp, tu) });
  if (precip)     return t("reasons.lightRain");
  return t("reasons.ideal");
}

function photoReason(golden: boolean, storm: boolean, heavy: boolean, code: number, t: TFunction): string {
  if (storm) return t("reasons.stormy");
  if (heavy) return t("reasons.heavyRain");
  if (golden) return t("reasons.goldenHour");
  if (code === 0 || code <= 2) return t("reasons.clearHarsh");
  if (code === 3 || code <= 48) return t("reasons.softOvercast");
  return t("reasons.cloudy");
}

function outdoorReason(temp: number, wind: number, precip: boolean, heavy: boolean, tu: TempUnit, wu: WindUnit, t: TFunction): string {
  if (temp >= 36) return t("reasons.dangerHeat", { t: fmtT(temp, tu) });
  if (temp >= 32) return t("reasons.tooHot", { t: fmtT(temp, tu) });
  if (heavy)      return t("reasons.precipitation");
  if (temp < 10)  return t("reasons.cold", { t: fmtT(temp, tu) });
  if (temp > 28)  return t("reasons.warm", { t: fmtT(temp, tu) });
  if (wind > 25)  return t("reasons.windy", { w: fmtW(wind, wu) });
  if (precip)     return t("reasons.lightRain");
  return t("reasons.ideal");
}

function hikingReason(temp: number, wind: number, precip: boolean, heavy: boolean, storm: boolean, tu: TempUnit, wu: WindUnit, t: TFunction): string {
  if (storm)      return t("reasons.stormy");
  if (temp >= 36) return t("reasons.dangerHeat", { t: fmtT(temp, tu) });
  if (heavy)      return t("reasons.heavyRain");
  if (temp < 0)   return t("reasons.cold", { t: fmtT(temp, tu) });
  if (temp > 28)  return t("reasons.hot", { t: fmtT(temp, tu) });
  if (wind > 30)  return t("reasons.windy", { w: fmtW(wind, wu) });
  if (precip)     return t("reasons.lightRain");
  return t("reasons.ideal");
}

function swimmingReason(temp: number, storm: boolean, heavy: boolean, code: number, tu: TempUnit, t: TFunction): string {
  if (storm)     return t("reasons.stormy");
  if (heavy)     return t("reasons.heavyRain");
  if (temp < 20) return t("reasons.cold", { t: fmtT(temp, tu) });
  if (code > 48) return t("reasons.lightRain");
  if (code > 2)  return t("reasons.cloudy");
  return t("reasons.ideal");
}

function stargazeReason(isNight: boolean, code: number, t: TFunction): string {
  if (!isNight)  return t("reasons.daylight");
  if (code === 0) return t("reasons.ideal");
  if (code <= 2) return t("reasons.softOvercast");
  return t("reasons.cloudy");
}

function drivingReason(fog: boolean, snow: boolean, storm: boolean, heavy: boolean, precip: boolean, wind: number, wu: WindUnit, t: TFunction): string {
  if (storm)     return t("reasons.stormy");
  if (fog)       return t("reasons.fog");
  if (snow)      return t("reasons.slippery");
  if (heavy)     return t("reasons.heavyRain");
  if (wind > 45) return t("reasons.windy", { w: fmtW(wind, wu) });
  if (precip)    return t("reasons.lightRain");
  return t("reasons.ideal");
}

export function ActivityCard({ current, now, tempUnit = "C", windUnit = "kmh", airQuality, className }: ActivityCardProps) {
  const { t } = useTranslation();
  const aqiLevel = classifyAqi(airQuality);
  const activities = computeActivities(current, now, tempUnit, windUnit, t).map((a) => {
    const { score, reason } = applyAqi(a.score, a.reason, a.key, aqiLevel, t);
    return { ...a, score, reason };
  });

  return (
    <GlassCard className={`p-4 flex flex-col ${className ?? ""}`}>
      <p className="text-[11px] text-white/55 uppercase tracking-widest mb-3 shrink-0">{t("sections.suitability")}</p>
      <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar min-h-0 pr-1">
        {activities.map((a) => (
          <div key={a.label} className="flex flex-col gap-1">
            <div className="flex items-start gap-2.5">
              <span className="text-white/30 shrink-0 mt-0.5">{a.icon}</span>
              <span className="text-[12px] font-medium text-white/75 flex-1 min-w-0 break-words leading-snug">{a.label}</span>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none shrink-0 mt-0.5"
                style={scorePillStyle(a.score)}
              >
                {scoreLabel(a.score, t)}
              </span>
            </div>
            <p className="text-[11px] text-white/45 pl-[24px] leading-snug break-words">
              {a.reason}
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function RunningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="9" cy="2.5" r="1.5" fill="currentColor" />
      <path d="M6 5l2-1.5 1.5 2.5-2 1.5L9 11H7l-1.5-3.5L4 9l-1 2H1.5L3 7.5 5 6l-.5-2L6 5z"
        fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function CyclingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="3" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="9" cy="2.5" r="1.2" fill="currentColor" />
      <path d="M9 3.7L7 7H4.5L6 10M7 7l4 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="4" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 4L5.5 2h3l1 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function OutdoorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 11.5L5 5l2.5 4L9 7l4 4.5H1z" fill="currentColor" opacity="0.7" />
      <circle cx="10.5" cy="3.5" r="1.8" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function HikingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 12L4.5 6L7 9.5L9 7L13 12H1Z" fill="currentColor" opacity="0.55" />
      <path d="M3.5 12L5.5 8L7.2 10L9 8.2L11.5 12" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" opacity="0.9" />
      <path d="M9.2 2.8L9.6 2L10 2.8L10.8 3L10.2 3.6L10.4 4.5L9.6 4.1L8.8 4.5L9 3.6L8.4 3L9.2 2.8Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

function SwimmingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="9.5" cy="3.5" r="1.3" fill="currentColor" />
      <path d="M2 7L4.5 6L6.5 7.5L9 6.5L11.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M1 10.2C2 9.5 3 10.7 4 10.2C5 9.7 6 10.7 7 10.2C8 9.7 9 10.7 10 10.2C11 9.7 12 10.7 13 10.2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
      <path d="M1 12.2C2 11.5 3 12.7 4 12.2C5 11.7 6 12.7 7 12.2C8 11.7 9 12.7 10 12.2C11 11.7 12 12.7 13 12.2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5L8.3 5L12 5.3L9.2 7.7L10.1 11.3L7 9.4L3.9 11.3L4.8 7.7L2 5.3L5.7 5L7 1.5Z" fill="currentColor" opacity="0.9" />
      <circle cx="11.5" cy="2.5" r="0.45" fill="currentColor" opacity="0.7" />
      <circle cx="2" cy="3" r="0.35" fill="currentColor" opacity="0.55" />
      <circle cx="12.5" cy="11" r="0.4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 9V7.5L3 5.2C3.2 4.7 3.6 4.5 4 4.5H10C10.4 4.5 10.8 4.7 11 5.2L12 7.5V9H2Z" fill="currentColor" opacity="0.7" />
      <rect x="1.5" y="9" width="11" height="2" rx="0.6" fill="currentColor" opacity="0.55" />
      <circle cx="4" cy="11" r="1.1" fill="currentColor" />
      <circle cx="10" cy="11" r="1.1" fill="currentColor" />
      <path d="M4 6.5H10" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}
