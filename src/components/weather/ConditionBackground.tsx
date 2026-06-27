import { wmoToConditionGroup, type ConditionGroup } from "@/types/weather";
import { useSettingsStore } from "@/store/settingsStore";

interface ConditionBackgroundProps {
  conditionCode: number;
  isDay?: boolean;
}

export function ConditionBackground({ conditionCode, isDay = true }: ConditionBackgroundProps) {
  const animatedBackground = useSettingsStore((s) => s.settings.animated_background);
  const timeOfDayShift = useSettingsStore((s) => s.settings.time_of_day_shift);
  const theme = useSettingsStore((s) => s.settings.theme);

  const effectiveIsDay = timeOfDayShift ? isDay : true;
  const group = wmoToConditionGroup(conditionCode, effectiveIsDay);

  const resolvedLight =
    theme === "light" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: light)").matches);

  return (
    <div
      className={`absolute inset-0 ${animatedBackground ? "transition-all duration-[1200ms]" : ""}`}
      style={{ background: resolvedLight ? lightGradientForGroup(group) : gradientForGroup(group) }}
    />
  );
}

function lightGradientForGroup(group: ConditionGroup): string {
  switch (group) {
    case "clear-day":
      return [
        "radial-gradient(ellipse 70% 55% at 75% -5%, rgba(251,146,60,0.28) 0%, transparent 65%)",
        "radial-gradient(ellipse 45% 40% at 90% 15%, rgba(234,88,12,0.16) 0%, transparent 55%)",
        "radial-gradient(ellipse 55% 40% at 15% 90%, rgba(253,224,71,0.18) 0%, transparent 55%)",
        "#fdfbf7",
      ].join(", ");
    case "clear-night":
      return [
        "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(180,164,200,0.30) 0%, transparent 65%)",
        "radial-gradient(ellipse 35% 30% at 80% 20%, rgba(160,140,200,0.18) 0%, transparent 50%)",
        "#e8e2f0",
      ].join(", ");
    case "cloudy":
    case "overcast":
      return "radial-gradient(ellipse at 50% 0%, rgba(148,163,184,0.18) 0%, transparent 60%), #f1ede4";
    case "fog":
      return "radial-gradient(ellipse at 50% 50%, rgba(203,213,225,0.25) 0%, transparent 70%), #efece4";
    case "drizzle":
    case "rain":
      return [
        "radial-gradient(ellipse 60% 50% at 50% -5%, rgba(56,189,248,0.20) 0%, transparent 65%)",
        "radial-gradient(ellipse 40% 30% at 20% 80%, rgba(125,211,252,0.16) 0%, transparent 50%)",
        "#e8edf2",
      ].join(", ");
    case "snow":
      return "radial-gradient(ellipse at 50% 0%, rgba(186,230,253,0.30) 0%, transparent 60%), #f0f4f8";
    case "thunderstorm":
      return [
        "radial-gradient(ellipse 55% 45% at 50% -5%, rgba(139,92,246,0.22) 0%, transparent 60%)",
        "radial-gradient(ellipse 35% 30% at 70% 30%, rgba(167,139,250,0.15) 0%, transparent 50%)",
        "#e0dceb",
      ].join(", ");
    default:
      return "#fdfbf7";
  }
}

function gradientForGroup(group: ConditionGroup): string {
  switch (group) {
    case "clear-day":
      return [
        "radial-gradient(ellipse 70% 55% at 75% -5%, rgba(251,191,36,0.28) 0%, transparent 65%)",
        "radial-gradient(ellipse 45% 40% at 90% 15%, rgba(251,146,60,0.18) 0%, transparent 55%)",
        "radial-gradient(ellipse 55% 40% at 15% 90%, rgba(14,165,233,0.12) 0%, transparent 55%)",
        "#08080b",
      ].join(", ");
    case "clear-night":
      return [
        "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 65%)",
        "radial-gradient(ellipse 35% 30% at 80% 20%, rgba(139,92,246,0.10) 0%, transparent 50%)",
        "#050508",
      ].join(", ");
    case "cloudy":
    case "overcast":
      return "radial-gradient(ellipse at 50% 0%, rgba(148,163,184,0.10) 0%, transparent 60%), #0a0a0f";
    case "fog":
      return "radial-gradient(ellipse at 50% 50%, rgba(203,213,225,0.08) 0%, transparent 70%), #0c0c10";
    case "drizzle":
    case "rain":
      return [
        "radial-gradient(ellipse 60% 50% at 50% -5%, rgba(14,165,233,0.16) 0%, transparent 65%)",
        "radial-gradient(ellipse 40% 30% at 20% 80%, rgba(56,189,248,0.08) 0%, transparent 50%)",
        "#07090d",
      ].join(", ");
    case "snow":
      return "radial-gradient(ellipse at 50% 0%, rgba(186,230,253,0.12) 0%, transparent 60%), #090a10";
    case "thunderstorm":
      return [
        "radial-gradient(ellipse 55% 45% at 50% -5%, rgba(99,102,241,0.22) 0%, transparent 60%)",
        "radial-gradient(ellipse 35% 30% at 70% 30%, rgba(167,139,250,0.10) 0%, transparent 50%)",
        "#050508",
      ].join(", ");
    default:
      return "#08080b";
  }
}
