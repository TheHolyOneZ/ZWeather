import { memo, useEffect, useRef } from "react";
import { meteoconUrl, wmoToMeteocon } from "@/lib/meteocons";
import { loadSvg } from "@/lib/svgCache";
import { useSettingsStore } from "@/store/settingsStore";

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
}

export function WeatherIcon({ code, isDay = true, size = 24, className = "" }: WeatherIconProps) {
  const name = wmoToMeteocon(code, isDay);
  const src = meteoconUrl(name);
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


export const MeteoconImg = memo(function MeteoconImg({
  src,
  size,
  className = "",
  animated,
  stripRotate = false,
}: {
  src: string;
  size: number;
  className?: string;
  animated: boolean;
  stripRotate?: boolean;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);


  const lastHtml = useRef<string>("");

  useEffect(() => {
    let alive = true;
    loadSvg(src, !animated, stripRotate).then((text) => {
      if (!alive || !text || !ref.current) return;
      const sized = text.replace(/<svg\b([^>]*)>/, (_m, attrs) => {
        const cleaned = attrs.replace(/\s(width|height)="[^"]*"/g, "");
        return `<svg${cleaned} width="${size}" height="${size}">`;
      });
      if (lastHtml.current === sized) return;
      lastHtml.current = sized;
      ref.current.innerHTML = sized;
    });
    return () => {
      alive = false;
    };
  }, [src, animated, size, stripRotate]);

  return (
    <span
      ref={ref}
      aria-hidden
      className={`meteocon ${className}`}
      style={{ width: size, height: size, flexShrink: 0, display: "block" }}
    />
  );
});


export function tempToColor(celsius: number): string {
  const light = typeof document !== "undefined"
    && document.documentElement.getAttribute("data-theme") === "light";
  if (light) {
    if (celsius <= 0)  return "#1d4ed8";
    if (celsius <= 10) return "#0e7490";
    if (celsius <= 18) return "#15803d";
    if (celsius <= 25) return "#a16207";
    if (celsius <= 32) return "#c2410c";
    return "#b91c1c";
  }
  if (celsius <= 0)  return "#93c5fd";
  if (celsius <= 10) return "#67e8f9";
  if (celsius <= 18) return "#86efac";
  if (celsius <= 25) return "#fde68a";
  if (celsius <= 32) return "#fdba74";
  return "#fca5a5";
}
