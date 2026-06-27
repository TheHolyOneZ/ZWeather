import { meteoconUrlFill, wmoToMeteocon } from "@/lib/meteocons";
import { useSettingsStore } from "@/store/settingsStore";
import { MeteoconImg } from "./WeatherIcon";
import { CrescentMoonIcon } from "./CrescentMoonIcon";

interface HeroWeatherIconProps {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
}

export function HeroWeatherIcon({ code, isDay = true, size = 72, className }: HeroWeatherIconProps) {


  if (code === 0 && !isDay) {
    return <CrescentMoonIcon size={size} className={className} />;
  }
  const name = wmoToMeteocon(code, isDay);
  const src = meteoconUrlFill(name);
  const animated = useSettingsStore((s) => s.settings.animated_icons);
  const stripRotate = name.includes("night") || name.startsWith("moon");
  return (
    <MeteoconImg
      src={src}
      size={size}
      className={className}
      animated={animated}
      stripRotate={stripRotate}
    />
  );
}
