import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useQueryClient } from "@tanstack/react-query";
import { useLocations } from "@/hooks/useLocations";
import { useLocationsStore } from "@/store/locationsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useAlerts, useCurrentWeather, useHourlyForecast } from "@/hooks/useWeather";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { useSettings } from "@/hooks/useSettings";
import { useTrayIcon } from "@/hooks/useTrayIcon";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";
import { Skeleton } from "@/components/ui/Skeleton";
import { DATA_CHANGED_EVENT, type DataChangedPayload } from "@/lib/crossWindow";
import { convertTemp } from "@/lib/units";
import { wmoLabelKey } from "@/lib/wmo";

function useTrayVisible(): boolean {
  const [visible, setVisible] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    const unlisteners = [
      listen<boolean>("zw://tray-visibility", (e) => {
        setVisible(e.payload);
        if (!e.payload) return;
        qc.invalidateQueries({ queryKey: ["locations"] });
        qc.invalidateQueries({ queryKey: ["settings"] });
        qc.refetchQueries({ queryKey: ["weather"], stale: true });
      }),
      listen<DataChangedPayload>(DATA_CHANGED_EVENT, (e) => {
        for (const key of e.payload.keys) qc.invalidateQueries({ queryKey: [key] });
      }),
      listen("zw://weather-refreshed", () => {
        qc.invalidateQueries({ queryKey: ["weather"] });
      }),
    ];
    return () => {
      unlisteners.forEach((p) => p.then((off) => off()));
    };
  }, [qc]);

  return visible;
}


export function TrayPopover() {
  const { activeLocationId, locations } = useLocationsStore();
  const { isSuccess: locationsLoaded } = useLocations();
  useSettings();
  useLanguageSync();
  const visible = useTrayVisible();

  const current = useCurrentWeather(activeLocationId);
  const { data: alerts } = useAlerts(activeLocationId);
  const activeLocation = locations.find((l) => l.id === activeLocationId);
  useTrayIcon(current.data, activeLocation?.name);
  useAlertNotifications(alerts);

  if (!visible) return null;

  return (
    <PopoverContent
      locationId={activeLocationId}
      locationName={activeLocation?.name}
      noLocations={locationsLoaded && locations.length === 0}
    />
  );
}

function PopoverContent({
  locationId,
  locationName,
  noLocations,
}: {
  locationId: string | null;
  locationName: string | undefined;
  noLocations: boolean;
}) {
  const { t } = useTranslation();
  const tempUnit = useSettingsStore((s) => s.settings.temp_unit);
  const { data: current, isError: currentError, refetch: refetchCurrent } = useCurrentWeather(locationId);
  const { data: hourly, isError: hourlyError, refetch: refetchHourly } = useHourlyForecast(locationId);
  const temp = (c: number) => `${Math.round(convertTemp(c, tempUnit))}°`;

  const failed = (currentError && !current) || (hourlyError && !hourly);

  return (
    <motion.div
      className="glass-popover h-screen w-full flex flex-col p-4 overflow-hidden"
      initial={{ opacity: 0, scale: 0.97, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {locationName && (
        <p className="text-[12px] text-white/50 mb-2 truncate">{locationName}</p>
      )}

      {noLocations ? (
        <p className="text-[14px] text-white/70 my-auto text-center">{t("tray.noLocation")}</p>
      ) : failed ? (
        <div className="my-auto flex flex-col items-center gap-3 text-center">
          <p className="text-[14px] text-white/70">{t("tray.loadError")}</p>
          <button
            className="inline-flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white/90 transition-colors"
            onClick={() => {
              refetchCurrent();
              refetchHourly();
            }}
          >
            <RefreshCw size={12} />
            <span>{t("tray.retry")}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            {current ? (
              <>
                <div className="text-[56px] font-semibold leading-none tracking-[-0.025em] font-tabular">
                  {temp(current.temperature)}
                </div>
                <p className="text-[14px] text-white/70 mt-1">{t(wmoLabelKey(current.condition_code))}</p>
                <p className="text-[13px] text-white/40">
                  {t("tray.feelsLike", { value: temp(current.feels_like) })}
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
                    <p className="text-[13px] font-medium mt-0.5">{temp(h.temperature)}</p>
                    <p className="text-[11px] text-blue-400 mt-0.5">{Math.round(h.precip_probability)}%</p>
                  </motion.div>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="w-14 h-16 rounded-xl shrink-0" />
                ))}
          </div>
        </>
      )}

      <button
        className="mt-auto inline-flex items-center justify-center gap-1.5 text-[13px] text-white/50 hover:text-white/80 transition-colors"
        onClick={() => {
          invoke("open_dashboard").catch(() => {});
        }}
      >
        <span>{t("tray.openDashboard")}</span>
        <ArrowRight size={12} className="opacity-80" />
      </button>
    </motion.div>
  );
}
