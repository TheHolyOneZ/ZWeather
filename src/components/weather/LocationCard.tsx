import { useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { Location } from "@/types/location";
import { useCurrentWeather } from "@/hooks/useWeather";
import { useSettingsStore } from "@/store/settingsStore";
import { convertTemp, tempUnitSymbol } from "@/lib/units";
import { WeatherIcon } from "./WeatherIcon";
import { cn } from "@/lib/utils";
import { LocationContextMenu } from "./LocationContextMenu";
import { useTranslation } from "react-i18next";

interface LocationCardProps {
  location: Location;
  isActive: boolean;
  onClick: () => void;
  onSetPrimary?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function LocationCard({ location, isActive, onClick, onSetPrimary, onRemove }: LocationCardProps) {
  const { data: weather } = useCurrentWeather(location.id);
  const tempUnit = useSettingsStore((s) => s.settings.temp_unit);
  const { t } = useTranslation();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const now = Date.now() / 1000;
  const isDay = weather ? (now > weather.sunrise && now < weather.sunset) : true;

  function handleContextMenu(e: MouseEvent) {
    if (!onSetPrimary && !onRemove) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }

  return (
    <>
      <motion.button
        className={cn(
          "shrink-0 flex items-center gap-2 h-10 px-3 rounded-xl transition-colors border",
          isActive
            ? "bg-white/[0.12] border-white/20 text-white shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
            : "bg-transparent border-white/[0.08] hover:border-white/15 hover:bg-white/[0.04] text-white/55 hover:text-white/90"
        )}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        title={location.display_name}
      >
        {weather ? (
          <WeatherIcon code={weather.condition_code} isDay={isDay} size={14} />
        ) : (
          <div className="w-3.5 h-3.5 rounded skeleton shrink-0" />
        )}

        <span className="text-[13px] font-medium max-w-[90px] truncate leading-none">
          {location.name}
        </span>

        {weather ? (
          <span className="text-[14px] font-semibold tabular-nums leading-none opacity-75 ml-0.5">
            {Math.round(convertTemp(weather.temperature, tempUnit))}{tempUnitSymbol(tempUnit)}
          </span>
        ) : (
          <div className="w-7 h-4 rounded skeleton" />
        )}

        {location.is_primary && (
          <Star
            size={9}
            fill="currentColor"
            className="text-yellow-400/70 shrink-0"
            aria-label={t("actions.primary")}
          />
        )}
      </motion.button>

      {menuPos && (
        <LocationContextMenu
          x={menuPos.x}
          y={menuPos.y}
          isPrimary={location.is_primary}
          onSetPrimary={() => onSetPrimary?.(location.id)}
          onRemove={() => onRemove?.(location.id)}
          onClose={() => setMenuPos(null)}
        />
      )}
    </>
  );
}
