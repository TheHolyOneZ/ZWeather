import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, MapPin, RefreshCw } from "lucide-react";
import { useLocations } from "@/hooks/useLocations";
import { useLocationsStore } from "@/store/locationsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useSettings } from "@/hooks/useSettings";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { useTranslation } from "react-i18next";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { CinematicIntro } from "@/components/setup/CinematicIntro";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { LocationCard } from "@/components/weather/LocationCard";
import { HeroTemperature } from "@/components/weather/HeroTemperature";
import { HourlyStrip } from "@/components/weather/HourlyStrip";
import { TenDayList } from "@/components/weather/TenDayList";
import { AlertBanner } from "@/components/weather/AlertBanner";
import { AlertDetailModal } from "@/components/weather/AlertDetailModal";
import { ConditionBackground } from "@/components/weather/ConditionBackground";
import { AddLocationDialog } from "@/components/weather/AddLocationDialog";
import { tempToColor } from "@/components/weather/WeatherIcon";
import { HeroWeatherIcon } from "@/components/weather/HeroWeatherIcon";
import { HeroAnimation } from "@/components/weather/HeroAnimation";
import { MoonCard } from "@/components/weather/MoonCard";
import { MoonDetailModal } from "@/components/weather/MoonDetailModal";
import { WindCard } from "@/components/weather/WindCard";
import { TitleBar } from "@/components/layout/TitleBar";
import { MapView } from "@/views/MapView";
import { ActivityCard } from "@/components/weather/ActivityCard";
import { StatBar, TrendArrow, UvPill, HumidityIcon, ThermometerIcon, GaugeIcon, SunIcon, VisibilityIcon } from "@/components/weather/StatBox";
import { AirQualityCard } from "@/components/weather/AirQualityCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentWeather, useHourlyForecast, useDailyForecast, useAlerts, useAirQuality } from "@/hooks/useWeather";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";
import { useTrayTooltip } from "@/hooks/useTrayTooltip";
import { useTheme } from "@/hooks/useTheme";
import { useHorizontalWheel } from "@/hooks/useHorizontalWheel";
import { formatTimeAt, formatNowAt, formatDateLineAt } from "@/lib/time";
import { convertTemp, convertWind, formatPressure, tempUnitSymbol, windUnitLabel, type PressureUnit } from "@/lib/units";
import { wmoLabelKey } from "@/lib/wmo";
import type { GeocodingResult } from "@/types/location";

export function Dashboard() {
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [showMoon, setShowMoon] = useState(false);
  const locationStripRef = useRef<HTMLDivElement>(null);
  useHorizontalWheel(locationStripRef);
  const timeFormat = useSettingsStore((s) => s.settings.time_format);
  const tempUnit = useSettingsStore((s) => s.settings.temp_unit);
  const windUnit = useSettingsStore((s) => s.settings.wind_unit);
  const pressureUnit = useSettingsStore((s) => s.settings.pressure_unit) as PressureUnit;
  const visibilityUnit = useSettingsStore((s) => s.settings.visibility_unit);
  const setupComplete = useSettingsStore((s) => s.settings.setup_complete);
  const tempSymbol = tempUnitSymbol(tempUnit);
  const { isSuccess: settingsLoaded } = useSettings();
  useLanguageSync();
  useTheme();
  const { t, i18n } = useTranslation();
  const showSetup = settingsLoaded && !setupComplete;
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (setupComplete) setIntroDone(false);
  }, [setupComplete]);
  const {
    data: locations,
    isLoading: locationsLoading,
    addMutation,
    removeMutation,
    setPrimaryMutation,
    reorderMutation,
  } = useLocations();
  const { activeLocationId, setActiveLocation, setLocations: setLocationsStore } = useLocationsStore();

  const { data: current, isLoading: weatherLoading, refetch: refetchWeather, dataUpdatedAt, isError: weatherIsError } = useCurrentWeather(activeLocationId);
  const refreshIntervalMinutes = useSettingsStore((s) => s.settings.refresh_interval_minutes);
  const { data: hourly } = useHourlyForecast(activeLocationId);
  const { data: daily } = useDailyForecast(activeLocationId);
  const { data: alerts } = useAlerts(activeLocationId);
  const { data: airQuality } = useAirQuality(activeLocationId);
  useAlertNotifications(alerts);


  const now = Date.now() / 1000;
  const isDay = current ? (now > current.sunrise && now < current.sunset) : true;
  const isEmpty = !locationsLoading && (!locations || locations.length === 0);
  const activeLocation = locations?.find((l) => l.id === activeLocationId);
  useTrayTooltip(current, activeLocation?.name);


  const todayForecast = daily?.[0];

  async function handleAdd(result: GeocodingResult) {
    await addMutation.mutateAsync({ lat: result.latitude, lon: result.longitude, name: result.display_name, geoId: result.geo_id });
    setShowAdd(false);
  }

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-[#08080b]">
      <ConditionBackground conditionCode={current?.condition_code ?? -1} isDay={isDay} />

      <div className="relative z-10 flex flex-col h-full">
        <TitleBar
          locationName={activeLocation?.name}
          tzAbbr={current?.timezone_abbreviation}
          tzOffsetSeconds={current?.utc_offset_seconds}
          onOpenSettings={() => setShowSettings(true)}
          onOpenRadar={locations && locations.length > 0 ? () => setShowRadar(true) : undefined}
          lastUpdatedMs={dataUpdatedAt}
          hasData={!!current}
          isError={weatherIsError}
          refreshIntervalMs={refreshIntervalMinutes * 60_000}
        />

        <AnimatePresence>
          {alerts && alerts.length > 0 && (
            <AlertBanner alerts={alerts} onClick={() => setShowAlerts(true)} />
          )}
        </AnimatePresence>


        <div ref={locationStripRef} className="flex items-center gap-2 px-4 pt-2 pb-3 shrink-0 overflow-x-auto no-scrollbar w-full max-w-[1600px] mx-auto">
          {locationsLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="w-28 h-10 rounded-xl shrink-0" />
            ))
          ) : locations && locations.length > 0 ? (
            <Reorder.Group
              axis="x"
              values={locations}
              onReorder={(newOrder) => {
                setLocationsStore(newOrder);
                reorderMutation.mutate(newOrder.map((l) => l.id));
              }}
              className="flex items-center gap-2"
            >
              {locations.map((loc) => (
                <Reorder.Item
                  key={loc.id}
                  value={loc}
                  className="shrink-0 cursor-grab active:cursor-grabbing"
                  whileDrag={{ scale: 1.05, zIndex: 20 }}
                >
                  <LocationCard
                    location={loc}
                    isActive={loc.id === activeLocationId}
                    onClick={() => setActiveLocation(loc.id)}
                    onSetPrimary={(id) => setPrimaryMutation.mutate(id)}
                    onRemove={(id) => removeMutation.mutate(id)}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : null}
          <motion.button
            className="shrink-0 h-10 w-10 rounded-xl border border-white/[0.08] hover:border-white/15 hover:bg-white/[0.04] flex items-center justify-center text-white/45 hover:text-white/85 transition-colors"
            onClick={() => setShowAdd(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }} title={t("actions.addLocation")}>
            <Plus size={15} />
          </motion.button>
        </div>


        <AnimatePresence>
          {isEmpty && (
            <motion.div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}>
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-2">
                <MapPin size={28} className="text-white/30" />
              </div>
              <div>
                <p className="text-[20px] font-semibold text-white/80 tracking-[-0.005em]">{t("empty.title")}</p>
                <p className="text-[14px] text-white/40 mt-1.5 max-w-xs">{t("empty.subtitle")}</p>
              </div>
              <motion.button
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium text-white"
                style={{ background: "var(--gradient-accent)" }}
                onClick={() => setShowAdd(true)} whileHover={{ y: -1, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}>
                <Plus size={15} /> {t("empty.addFirst")}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>


        {!isEmpty && (
          <div className="flex flex-1 gap-4 px-4 pb-4 overflow-hidden min-h-0 w-full max-w-[1600px] mx-auto">


            <div className="flex flex-col flex-1 gap-3 overflow-y-auto overflow-x-hidden min-w-0">


              <div className="glass rounded-2xl p-5 shrink-0 relative overflow-hidden">
                {current && <HeroAnimation conditionCode={current.condition_code} isDay={isDay} />}
                {weatherLoading || !current ? (
                  <div className="flex flex-col gap-2 relative">
                    <Skeleton className="h-16 w-32 rounded-xl" />
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-52 rounded-lg" />
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.26 }} className="relative">

                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <HeroTemperature value={convertTemp(current.temperature, tempUnit)} color={tempToColor(current.temperature)} unitSymbol={tempSymbol} />
                        <p className="text-[16px] text-white/70 mt-1.5 font-medium">{t(wmoLabelKey(current.condition_code))}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <HeroWeatherIcon code={current.condition_code} isDay={isDay} size={64} />

                        <div className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: `rotate(${current.wind_direction}deg)` }}>
                            <polygon points="7,1 11,12 7,9.5 3,12" fill="rgba(186,230,253,0.85)" />
                          </svg>
                          <span className="text-[12px] text-white/80 tabular-nums font-medium">
                            {Math.round(convertWind(current.wind_speed, windUnit))} {windUnitLabel(windUnit)}
                          </span>
                        </div>

                        <NextSunEvent
                          sunrise={current.sunrise}
                          sunset={current.sunset}
                          utcOffset={current.utc_offset_seconds}
                          timeFormat={timeFormat}
                        />
                      </div>
                    </div>


                    <LiveClockLine
                      utcOffset={current.utc_offset_seconds}
                      timeFormat={timeFormat}
                      locale={i18n.language}
                    />


                    {todayForecast && (
                      <p className="text-[14px] text-white/70 mt-2 font-medium">
                        {t("labels.high")}: <span className="text-white/95">{Math.round(convertTemp(todayForecast.temp_high, tempUnit))}{tempSymbol}</span>
                        <span className="mx-2 text-white/30">·</span>
                        {t("labels.low")}: <span className="text-white/95">{Math.round(convertTemp(todayForecast.temp_low, tempUnit))}{tempSymbol}</span>
                        <span className="mx-2 text-white/30">·</span>
                        {t("dayDetail.feelsShort")}: <span className="text-white/95">{Math.round(convertTemp(current.feels_like, tempUnit))}{tempSymbol}</span>
                      </p>
                    )}

                    <StatBar
                      items={[
                        {
                          label: t("stats.humidity"),
                          value: `${current.humidity}%`,
                          icon: <HumidityIcon />,
                        },
                        {
                          label: t("stats.dewPoint"),
                          value: `${Math.round(convertTemp(current.dew_point, tempUnit))}${tempSymbol}`,
                          icon: <ThermometerIcon />,
                        },
                        {
                          label: t("stats.pressure"),
                          value: formatPressure(current.pressure, pressureUnit),
                          icon: <GaugeIcon />,
                          accessory: <TrendArrow trend={current.pressure_trend} />,
                        },
                        {
                          label: t("stats.uvIndex"),
                          value: `${current.uv_index.toFixed(0)}`,
                          icon: <SunIcon />,
                          accessory: <UvPill uv={current.uv_index} />,
                        },
                        {
                          label: t("stats.visibility"),
                          value: visibilityUnit === "mi"
                            ? `${(current.visibility / 1609.34).toFixed(1)} mi`
                            : `${(current.visibility / 1000).toFixed(1)} km`,
                          icon: <VisibilityIcon />,
                        },
                      ]}
                    />


                    <button
                      className="mt-3 flex items-center gap-1.5 text-[12px] text-white/25 hover:text-white/55 transition-colors"
                      onClick={() => refetchWeather()}>
                      <RefreshCw size={11} /> {t("actions.refresh")}
                    </button>
                  </motion.div>
                )}
              </div>

              {airQuality && (
                <AirQualityCard
                  data={airQuality}
                  country={activeLocation?.display_name?.split(",").pop()?.trim()}
                />
              )}

              {hourly && <HourlyStrip hours={hourly} currentTemp={current?.temperature} utcOffsetSeconds={current?.utc_offset_seconds ?? 0} timeFormat={timeFormat} tempUnit={tempUnit} windUnit={windUnit} />}
              {daily && <TenDayList days={daily} allHourly={hourly} utcOffsetSeconds={current?.utc_offset_seconds ?? 0} timeFormat={timeFormat} tempUnit={tempUnit} windUnit={windUnit} locationId={activeLocationId} />}
            </div>


            <div className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto overflow-x-hidden">

              {current && (
                <div className="glass rounded-2xl p-4 shrink-0">
                  <p className="text-[11px] text-white/55 uppercase tracking-widest mb-3">{t("sections.sun")}</p>
                  <div className="flex justify-between text-[13px] mb-3">
                    <div>
                      <p className="text-[10px] text-white/55 uppercase tracking-wide">{t("sun.sunrise")}</p>
                      <p className="font-medium text-white/80 mt-0.5 tabular-nums">{formatTimeAt(current.sunrise, current.utc_offset_seconds, { format: timeFormat })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/55 uppercase tracking-wide">{t("sun.sunset")}</p>
                      <p className="font-medium text-white/80 mt-0.5 tabular-nums">{formatTimeAt(current.sunset, current.utc_offset_seconds, { format: timeFormat })}</p>
                    </div>
                  </div>
                  <DaylightBar sunrise={current.sunrise} sunset={current.sunset} now={now} />

                  <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-white/55 uppercase tracking-wide">{t("sun.dayLength")}</p>
                      <p className="text-[12px] font-medium text-white/70 tabular-nums">
                        {(() => {
                          const m = Math.round((current.sunset - current.sunrise) / 60);
                          return `${Math.floor(m / 60)}${t("time.hoursShort")} ${m % 60}${t("time.minutesShort")}`;
                        })()}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-white/55 uppercase tracking-wide">{t("sun.morningGolden")}</p>
                      <p className="text-[11px] text-amber-400/60 tabular-nums">
                        {formatTimeAt(current.sunrise, current.utc_offset_seconds, { format: timeFormat })} – {formatTimeAt(current.sunrise + 3600, current.utc_offset_seconds, { format: timeFormat })}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-white/55 uppercase tracking-wide">{t("sun.eveningGolden")}</p>
                      <p className="text-[11px] text-amber-400/60 tabular-nums">
                        {formatTimeAt(current.sunset - 3600, current.utc_offset_seconds, { format: timeFormat })} – {formatTimeAt(current.sunset, current.utc_offset_seconds, { format: timeFormat })}
                      </p>
                    </div>
                  </div>
                </div>
              )}


              {current && (
                <WindCard speed={current.wind_speed} direction={current.wind_direction} unit={windUnit} />
              )}


              <MoonCard onClick={() => setShowMoon(true)} />


              {current && <ActivityCard current={current} now={now} tempUnit={tempUnit} windUnit={windUnit} airQuality={airQuality} className="shrink-0" />}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && <AddLocationDialog onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showSetup && !introDone && (
          <CinematicIntro key="intro" onComplete={() => setIntroDone(true)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSetup && introDone && (
          <SetupWizard key="wizard" onComplete={() => {  }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAlerts && alerts && alerts.length > 0 && (
          <AlertDetailModal
            alerts={alerts}
            utcOffsetSeconds={current?.utc_offset_seconds ?? 0}
            timeFormat={timeFormat}
            onClose={() => setShowAlerts(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMoon && activeLocation && (
          <MoonDetailModal
            latitude={activeLocation.latitude}
            longitude={activeLocation.longitude}
            utcOffsetSeconds={current?.utc_offset_seconds ?? 0}
            timeFormat={timeFormat}
            locale={i18n.language}
            onClose={() => setShowMoon(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRadar && locations && (
          <MapView
            locations={locations}
            activeLocationId={activeLocationId}
            onClose={() => setShowRadar(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LiveClockLine({
  utcOffset,
  timeFormat,
  locale,
}: {
  utcOffset: number;
  timeFormat: "24h" | "12h";
  locale: string;
}) {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="text-[13px] text-white/30 mt-1 tabular-nums">
      {formatNowAt(utcOffset, { withSeconds: true, format: timeFormat })}
      <span className="ml-3">{formatDateLineAt(tick / 1000, utcOffset, locale)}</span>
    </p>
  );
}

function NextSunEvent({
  sunrise,
  sunset,
  utcOffset,
  timeFormat,
}: {
  sunrise: number;
  sunset: number;
  utcOffset: number;
  timeFormat: "24h" | "12h";
}) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 30_000);
    return () => clearInterval(id);
  }, []);

  let kind: "sunrise" | "sunset";
  let eventTime: number;
  if (now < sunrise) {
    kind = "sunrise";
    eventTime = sunrise;
  } else if (now < sunset) {
    kind = "sunset";
    eventTime = sunset;
  } else {
    kind = "sunrise";
    eventTime = sunrise + 86400;
  }
  const minsAway = Math.max(0, Math.round((eventTime - now) / 60));
  const h = Math.floor(minsAway / 60);
  const m = minsAway % 60;
  const inLabel = h > 0 ? `${h}${t("time.hoursShort")} ${m}${t("time.minutesShort")}` : `${m}${t("time.minutesShort")}`;
  const isRise = kind === "sunrise";
  return (
    <div className="flex items-center gap-1.5">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="9" r="3" fill={isRise ? "#fbbf24" : "#f97316"} />
        <path
          d={isRise ? "M4 9 L7 5 L10 9" : "M4 5 L7 9 L10 5"}
          stroke={isRise ? "#fde68a" : "#fed7aa"}
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="2" y1="12" x2="12" y2="12" stroke="color-mix(in srgb, var(--color-foreground) 40%, transparent)" strokeWidth="0.7" />
      </svg>
      <span className="text-[12px] text-white/80 tabular-nums font-medium">
        {formatTimeAt(eventTime, utcOffset, { format: timeFormat })}
      </span>
      <span className="text-[11px] text-white/45 tabular-nums">· {inLabel}</span>
    </div>
  );
}

function DaylightBar({ sunrise, sunset, now }: { sunrise: number; sunset: number; now: number }) {
  const { t } = useTranslation();
  const total = sunset - sunrise;
  const elapsed = Math.max(0, Math.min(total, now - sunrise));
  const pct = total > 0 ? (elapsed / total) * 100 : 0;
  const dayLength = Math.round(total / 60);
  const h = Math.floor(dayLength / 60);
  const m = dayLength % 60;

  return (
    <div>
      <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #fbbf24, #f97316)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="text-[11px] text-white/30 mt-1.5">
        {h}{t("time.hoursShort")} {m}{t("time.minutesShort")} {t("sun.ofDaylight")}
      </p>
    </div>
  );
}
