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

interface Verdict {
  score: Score;
  reason: string;
}

interface Activity {
  key: string;
  label: string;
  score: Score;
  reason: string;
  icon: React.ReactNode;
}

interface Conditions {
  temp: number;
  wind: number;
  code: number;
  inGolden: boolean;
  isNight: boolean;
  isPrecip: boolean;
  isHeavy: boolean;
  isStorm: boolean;
  isFog: boolean;
  isSnow: boolean;
  tu: TempUnit;
  wu: WindUnit;
  t: TFunction;
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
  const cond: Conditions = {
    temp,
    wind,
    code,
    inGolden: (now > sunrise && now < sunrise + 3600) || (now > sunset - 3600 && now < sunset),
    isNight: now < sunrise || now > sunset,
    isPrecip: code >= 51,
    isHeavy: code >= 65,
    isStorm: code >= 95,
    isFog: code === 45 || code === 48,
    isSnow: (code >= 71 && code <= 77) || (code >= 85 && code <= 86),
    tu,
    wu,
    t,
  };

  return [
    { key: "running",     label: t("activities.running"),     ...evalRunning(cond),     icon: <RunningIcon /> },
    { key: "cycling",     label: t("activities.cycling"),     ...evalCycling(cond),     icon: <CyclingIcon /> },
    { key: "hiking",      label: t("activities.hiking"),      ...evalHiking(cond),      icon: <HikingIcon /> },
    { key: "swimming",    label: t("activities.swimming"),    ...evalSwimming(cond),    icon: <SwimmingIcon /> },
    { key: "outdoors",    label: t("activities.outdoors"),    ...evalOutdoors(cond),    icon: <OutdoorIcon /> },
    { key: "photography", label: t("activities.photography"), ...evalPhotography(cond), icon: <CameraIcon /> },
    { key: "stargazing",  label: t("activities.stargazing"),  ...evalStargazing(cond),  icon: <StarIcon /> },
    { key: "driving",     label: t("activities.driving"),     ...evalDriving(cond),     icon: <CarIcon /> },
  ];
}

function verdict(score: Score, reason: string): Verdict {
  return { score, reason };
}

function evalRunning(c: Conditions): Verdict {
  const { temp, wind, isPrecip, isHeavy, tu, wu, t } = c;
  if (temp >= 36) return verdict("poor", t("reasons.dangerHeat", { t: fmtT(temp, tu) }));
  if (temp >= 32) return verdict("poor", t("reasons.heatStress", { t: fmtT(temp, tu) }));
  if (temp < 0)   return verdict("poor", t("reasons.tooCold", { t: fmtT(temp, tu) }));
  if (isHeavy)    return verdict("poor", t("reasons.precipitation"));
  if (temp > 30)  return verdict("poor", t("reasons.tooHot", { t: fmtT(temp, tu) }));
  if (temp >= 5 && temp <= 24 && !isPrecip && wind < 35) return verdict("good", t("reasons.ideal"));
  if (wind >= 35) return verdict("fair", t("reasons.windy", { w: fmtW(wind, wu) }));
  if (isPrecip)   return verdict("fair", t("reasons.lightRain"));
  if (temp > 24)  return verdict("fair", t("reasons.hot", { t: fmtT(temp, tu) }));
  return verdict("fair", t("reasons.cold", { t: fmtT(temp, tu) }));
}

function evalCycling(c: Conditions): Verdict {
  const { temp, wind, isPrecip, isHeavy, tu, wu, t } = c;
  if (temp >= 36) return verdict("poor", t("reasons.dangerHeat", { t: fmtT(temp, tu) }));
  if (temp < 0)   return verdict("poor", t("reasons.tooCold", { t: fmtT(temp, tu) }));
  if (isHeavy)    return verdict("poor", t("reasons.precipitation"));
  if (temp > 32)  return verdict("poor", t("reasons.tooHot", { t: fmtT(temp, tu) }));
  if (temp >= 5 && temp <= 26 && !isPrecip && wind < 30) return verdict("good", t("reasons.ideal"));
  if (temp >= 32) return verdict("fair", t("reasons.heatStress", { t: fmtT(temp, tu) }));
  if (wind >= 30) return verdict("fair", t("reasons.windy", { w: fmtW(wind, wu) }));
  if (isPrecip)   return verdict("fair", t("reasons.lightRain"));
  if (temp > 26)  return verdict("fair", t("reasons.hot", { t: fmtT(temp, tu) }));
  return verdict("fair", t("reasons.cold", { t: fmtT(temp, tu) }));
}

function evalHiking(c: Conditions): Verdict {
  const { temp, wind, isPrecip, isHeavy, isStorm, tu, wu, t } = c;
  if (isStorm)    return verdict("poor", t("reasons.stormy"));
  if (temp >= 36) return verdict("poor", t("reasons.dangerHeat", { t: fmtT(temp, tu) }));
  if (temp < 0)   return verdict("poor", t("reasons.tooCold", { t: fmtT(temp, tu) }));
  if (isHeavy)    return verdict("poor", t("reasons.heavyRain"));
  if (temp > 30)  return verdict("poor", t("reasons.tooHot", { t: fmtT(temp, tu) }));
  if (temp >= 8 && temp <= 24 && !isPrecip && wind < 30) return verdict("good", t("reasons.ideal"));
  if (wind >= 30) return verdict("fair", t("reasons.windy", { w: fmtW(wind, wu) }));
  if (isPrecip)   return verdict("fair", t("reasons.lightRain"));
  if (temp > 24)  return verdict("fair", t("reasons.hot", { t: fmtT(temp, tu) }));
  return verdict("fair", t("reasons.cool", { t: fmtT(temp, tu) }));
}

function evalSwimming(c: Conditions): Verdict {
  const { temp, wind, code, isPrecip, isHeavy, isStorm, isFog, tu, wu, t } = c;
  if (isStorm)    return verdict("poor", t("reasons.stormy"));
  if (isHeavy)    return verdict("poor", t("reasons.heavyRain"));
  if (temp < 22)  return verdict("poor", t("reasons.tooCold", { t: fmtT(temp, tu) }));
  if (wind >= 30) return verdict("poor", t("reasons.windy", { w: fmtW(wind, wu) }));
  if (temp >= 24 && code <= 3 && wind < 25) return verdict("good", t("reasons.ideal"));
  if (isPrecip)   return verdict("fair", t("reasons.lightRain"));
  if (isFog)      return verdict("fair", t("reasons.fog"));
  if (code > 3)   return verdict("fair", t("reasons.cloudy"));
  if (wind >= 25) return verdict("fair", t("reasons.breezy", { w: fmtW(wind, wu) }));
  return verdict("fair", t("reasons.cool", { t: fmtT(temp, tu) }));
}

function evalOutdoors(c: Conditions): Verdict {
  const { temp, wind, isPrecip, isHeavy, tu, wu, t } = c;
  if (temp >= 36) return verdict("poor", t("reasons.dangerHeat", { t: fmtT(temp, tu) }));
  if (temp >= 32) return verdict("poor", t("reasons.tooHot", { t: fmtT(temp, tu) }));
  if (temp < 5)   return verdict("poor", t("reasons.tooCold", { t: fmtT(temp, tu) }));
  if (isHeavy)    return verdict("poor", t("reasons.precipitation"));
  if (temp >= 16 && temp <= 28 && !isPrecip && wind < 25) return verdict("good", t("reasons.ideal"));
  if (wind >= 25) return verdict("fair", t("reasons.windy", { w: fmtW(wind, wu) }));
  if (isPrecip)   return verdict("fair", t("reasons.lightRain"));
  if (temp > 28)  return verdict("fair", t("reasons.warm", { t: fmtT(temp, tu) }));
  return verdict("fair", t("reasons.cool", { t: fmtT(temp, tu) }));
}

function evalPhotography(c: Conditions): Verdict {
  const { code, inGolden, isHeavy, isStorm, isFog, t } = c;
  if (isStorm)     return verdict("poor", t("reasons.stormy"));
  if (isHeavy)     return verdict("poor", t("reasons.heavyRain"));
  if (inGolden)    return verdict("good", t("reasons.goldenHour"));
  if (code <= 2)   return verdict("good", t("reasons.clearHarsh"));
  if (code === 3)  return verdict("good", t("reasons.softOvercast"));
  if (isFog)       return verdict("fair", t("reasons.fog"));
  if (code <= 48)  return verdict("fair", t("reasons.cloudy"));
  return verdict("poor", t("reasons.precipitation"));
}

function evalStargazing(c: Conditions): Verdict {
  const { code, wind, isNight, isFog, wu, t } = c;
  if (!isNight)   return verdict("poor", t("reasons.daylight"));
  if (isFog)      return verdict("poor", t("reasons.fog"));
  if (code === 0 && wind < 20) return verdict("good", t("reasons.ideal"));
  if (code === 0) return verdict("fair", t("reasons.windy", { w: fmtW(wind, wu) }));
  if (code <= 2)  return verdict("fair", t("reasons.someClouds"));
  return verdict("poor", t("reasons.cloudy"));
}

function evalDriving(c: Conditions): Verdict {
  const { wind, isPrecip, isHeavy, isStorm, isFog, isSnow, wu, t } = c;
  if (isStorm)   return verdict("poor", t("reasons.stormy"));
  if (isFog)     return verdict("poor", t("reasons.fog"));
  if (isSnow)    return verdict("poor", t("reasons.slippery"));
  if (isHeavy)   return verdict("poor", t("reasons.heavyRain"));
  if (wind > 45) return verdict("fair", t("reasons.windy", { w: fmtW(wind, wu) }));
  if (isPrecip)  return verdict("fair", t("reasons.lightRain"));
  return verdict("good", t("reasons.ideal"));
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
      <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden no-scrollbar min-h-0 pr-1">
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
