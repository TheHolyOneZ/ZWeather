import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Droplets, RefreshCw, Wind } from "lucide-react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useQueryClient } from "@tanstack/react-query";
import { useLocations } from "@/hooks/useLocations";
import { useLocationsStore } from "@/store/locationsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useAlerts, useCurrentWeather, useDailyForecast, useHourlyForecast } from "@/hooks/useWeather";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { useSettings } from "@/hooks/useSettings";
import { useTrayIcon } from "@/hooks/useTrayIcon";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";
import { Skeleton } from "@/components/ui/Skeleton";
import { WeatherIcon, tempToColor } from "@/components/weather/WeatherIcon";
import { DATA_CHANGED_EVENT, type DataChangedPayload } from "@/lib/crossWindow";
import { formatHourLabelAt, isDayHour } from "@/lib/time";
import { convertTemp, formatWind, tempUnitSymbol } from "@/lib/units";
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
  const { temp_unit: tempUnit, time_format: timeFormat, wind_unit: windUnit } = useSettingsStore((s) => s.settings);
  const { data: current, isError: currentError, refetch: refetchCurrent } = useCurrentWeather(locationId);
  const { data: hourly, isError: hourlyError, refetch: refetchHourly } = useHourlyForecast(locationId);
  const { data: daily } = useDailyForecast(locationId);
  const today = daily?.[0];
  const temp = (c: number) => `${Math.round(convertTemp(c, tempUnit))}${tempUnitSymbol(tempUnit)}`;

  const now = Date.now() / 1000;
  const start = hourly ? Math.max(0, hourly.findIndex((h) => h.time + 3600 > now)) : 0;
  const nextHours = hourly?.slice(start, start + 6) ?? [];
  const currentHourIndex = nextHours.findIndex(
    (h, i) => h.time <= now && (nextHours[i + 1]?.time ?? Infinity) > now,
  );

  const failed = (currentError && !current) || (hourlyError && !hourly);

  return (
    <motion.div
      className="glass-popover h-screen w-full flex flex-col p-4 overflow-hidden"
      initial={{ opacity: 0, scale: 0.97, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[13px] font-medium text-white/75 truncate">{locationName ?? "ZWeather"}</p>
      </div>

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
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5 mb-4">
            {current ? (
              <div className="flex items-center gap-3">
                <WeatherIcon
                  code={current.condition_code}
                  isDay={isDayHour(now, current.utc_offset_seconds)}
                  size={62}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[48px] font-semibold leading-none tracking-[-0.04em] font-tabular"
                    style={{ color: tempToColor(current.temperature) }}
                  >
                    {temp(current.temperature)}
                  </div>
                  <p className="text-[13px] text-white/75 mt-1 truncate">{t(wmoLabelKey(current.condition_code))}</p>
                  <p className="text-[11px] text-white/45 mt-0.5">
                    {t("tray.feelsLike", { value: temp(current.feels_like) })}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-[10px] text-white/55 shrink-0">
                  {today && (
                    <>
                      <span className="inline-flex items-center gap-1.5"><span className="font-semibold text-rose-300/80">{t("labels.high")}</span>{temp(today.temp_high)}</span>
                      <span className="inline-flex items-center gap-1.5"><span className="font-semibold text-sky-300/80">{t("labels.low")}</span>{temp(today.temp_low)}</span>
                    </>
                  )}
                  <span className="inline-flex items-center gap-1.5"><Droplets size={12} className="text-sky-300" />{current.humidity}%</span>
                  <span className="inline-flex items-center gap-1.5"><Wind size={12} className="text-teal-200" />{formatWind(current.wind_speed, windUnit)}</span>
                </div>
              </div>
            ) : (
              <Skeleton className="h-[92px] w-full rounded-xl" />
            )}
          </div>

          <section>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">{t("tray.nextHours")}</p>
              <span className="text-[10px] text-white/30">{t("tray.rainChance")}</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {hourly
                ? nextHours.map((h, i) => {
                    const isCurrentHour = i === currentHourIndex;
                    return (
                      <motion.div
                        key={h.time}
                        className={`zw-icon-host rounded-xl px-0.5 py-2 text-center transition-colors hover:bg-white/[0.075] ${isCurrentHour ? "bg-white/[0.10] ring-1 ring-white/15" : "bg-white/[0.045]"}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.08 + i * 0.04 }}
                      >
                        <p className={`text-[9px] leading-3 text-white/55 tabular-nums ${isCurrentHour ? "text-white/90 font-semibold" : ""}`}>
                          {isCurrentHour ? t("time.now") : formatHourLabelAt(h.time, current?.utc_offset_seconds ?? 0, timeFormat)}
                        </p>
                        <WeatherIcon code={h.condition_code} isDay={isDayHour(h.time, current?.utc_offset_seconds ?? 0)} size={30} idle />
                        <p className="text-[12px] font-semibold mt-1 tabular-nums" style={{ color: tempToColor(h.temperature) }}>{temp(h.temperature)}</p>
                        <span className="inline-flex items-center justify-center gap-0.5 text-[9px] leading-3 text-sky-200/80 tabular-nums">
                          <Droplets size={9} />{Math.round(h.precip_probability)}%
                        </span>
                      </motion.div>
                    );
                  })
                : Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[94px] rounded-xl" />
                  ))}
            </div>
          </section>
        </>
      )}

      <button
        className="mt-auto pt-3 border-t border-white/[0.07] inline-flex items-center justify-center gap-1.5 text-[12px] text-white/50 hover:text-white/80 transition-colors"
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
