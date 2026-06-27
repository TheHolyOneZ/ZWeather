import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocations } from "@/hooks/useLocations";
import { useLocationsStore } from "@/store/locationsStore";
import { useCurrentWeather, useHourlyForecast } from "@/hooks/useWeather";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { useSettings } from "@/hooks/useSettings";
import { Skeleton } from "@/components/ui/Skeleton";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { wmoLabelKey } from "@/lib/wmo";

export function TrayPopover() {
  const { activeLocationId } = useLocationsStore();
  useLocations();
  useSettings();
  useLanguageSync();
  const { t } = useTranslation();

  const { data: current } = useCurrentWeather(activeLocationId);
  const { data: hourly } = useHourlyForecast(activeLocationId);

  return (
    <motion.div
      className="glass-popover h-screen w-full flex flex-col p-4 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >

      <div className="mb-4">
        {current ? (
          <>
            <div className="text-[56px] font-semibold leading-none tracking-[-0.025em] font-tabular">
              {Math.round(current.temperature)}°
            </div>
            <p className="text-[14px] text-white/70 mt-1">{t(wmoLabelKey(current.condition_code))}</p>
            <p className="text-[13px] text-white/40">
              {t("tray.feelsLike", { value: `${Math.round(current.feels_like)}°` })}
            </p>
          </>
        ) : (
          <Skeleton className="h-16 w-28 rounded-xl" />
        )}
      </div>


      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {hourly
          ? hourly.slice(0, 6).map((h, i) => (
              <motion.div
                key={h.time}
                className="glass rounded-xl p-2 shrink-0 w-14 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 + i * 0.04 }}
              >
                <p className="text-[11px] text-white/50">
                  {new Date(h.time * 1000).getHours()}h
                </p>
                <p className="text-[13px] font-medium mt-0.5">{Math.round(h.temperature)}°</p>
                <p className="text-[11px] text-blue-400 mt-0.5">{Math.round(h.precip_probability)}%</p>
              </motion.div>
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="w-14 h-16 rounded-xl shrink-0" />
            ))}
      </div>


      <button
        className="mt-auto inline-flex items-center justify-center gap-1.5 text-[13px] text-white/50 hover:text-white/80 transition-colors"
        onClick={() => {
          getCurrentWindow().hide();
        }}
      >
        <span>{t("tray.openDashboard")}</span>
        <ArrowRight size={12} className="opacity-80" />
      </button>
    </motion.div>
  );
}
