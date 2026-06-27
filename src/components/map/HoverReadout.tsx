import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useSettingsStore } from "@/store/settingsStore";
import {
  convertTemp,
  convertWind,
  tempUnitSymbol,
  windUnitLabel,
} from "@/lib/units";
import type { CursorReadout, WeatherLayer } from "@/lib/mapLayers/types";

interface Props {
  map: L.Map | null;
  layer: WeatherLayer | null;
}

function bearingToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) / 45) % 8)];
}

export function HoverReadout({ map, layer }: Props) {
  const [readout, setReadout] = useState<{ x: number; y: number; data: CursorReadout } | null>(null);
  const tempUnit = useSettingsStore((s) => s.settings.temp_unit);
  const windUnit = useSettingsStore((s) => s.settings.wind_unit);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !layer?.sampleAt) {
      setReadout(null);
      return;
    }
    const container = map.getContainer();

    const handleMove = (e: L.LeafletMouseEvent) => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const data = layer.sampleAt!(e.latlng.lat, e.latlng.lng);
        if (!data) {
          setReadout(null);
          return;
        }
        setReadout({ x: e.containerPoint.x, y: e.containerPoint.y, data });
      });
    };
    const handleLeave = () => setReadout(null);

    map.on("mousemove", handleMove);
    container.addEventListener("mouseleave", handleLeave);
    return () => {
      map.off("mousemove", handleMove);
      container.removeEventListener("mouseleave", handleLeave);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [map, layer]);

  if (!readout) return null;

  const { x, y, data } = readout;

  const left = x + 14;
  const top = y + 14;

  return (
    <div
      className="absolute z-[415] pointer-events-none"
      style={{ left, top }}
    >
      <div className="rounded-lg bg-black/80 border border-white/[0.10] backdrop-blur-md shadow-lg px-2.5 py-1.5 flex items-center gap-2 tabular-nums">
        {data.temp != null && (
          <span className="text-[12px] font-bold text-white">
            {Math.round(convertTemp(data.temp, tempUnit))}
            {tempUnitSymbol(tempUnit)}
          </span>
        )}
        {data.windSpeed != null && (
          <>
            {data.windDir != null && (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                className="text-violet-300"
                style={{ transform: `rotate(${data.windDir}deg)` }}
              >
                <path d="M12 3 L7 14 L12 11 L17 14 Z" fill="currentColor" />
              </svg>
            )}
            <span className="text-[12px] font-bold text-white">
              {Math.round(convertWind(data.windSpeed, windUnit))}
            </span>
            <span className="text-[10px] text-white/55">
              {windUnitLabel(windUnit)}
            </span>
            {data.windDir != null && (
              <span className="text-[10px] text-white/45">
                {bearingToCardinal(data.windDir)}
              </span>
            )}
          </>
        )}
        {data.cloud != null && (
          <span className="text-[12px] font-bold text-white">
            {Math.round(data.cloud)}%
          </span>
        )}
      </div>
    </div>
  );
}
