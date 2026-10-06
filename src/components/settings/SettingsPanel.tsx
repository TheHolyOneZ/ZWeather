import { useEffect, useState } from "react";
import { isIntroEnabled, setIntroEnabled } from "@/lib/introPreference";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Thermometer, Wind, Droplets, Gauge, Globe, Info, X, Eye, Palette, Sparkles, SunMoon, Bell, BellRing, RefreshCw, MonitorSmartphone, AlertTriangle, Wrench, RotateCcw } from "lucide-react";
import { AboutDialog } from "@/components/about/AboutDialog";
import { useTranslation } from "react-i18next";
import { useSettingsStore, type AppSettings } from "@/store/settingsStore";
import { useSettings } from "@/hooks/useSettings";
import { SettingPillGroup } from "./SettingPillGroup";
import { LanguageSelect } from "./LanguageSelect";
import { ToggleSwitch } from "./ToggleSwitch";
import { SettingSlider } from "./SettingSlider";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { sendTestNotification, type PermissionState } from "@/lib/notifications";

interface SettingsPanelProps {
  onClose: () => void;
}

type TimeFormat = AppSettings["time_format"];
type TempUnit = AppSettings["temp_unit"];
type WindUnit = AppSettings["wind_unit"];
type PrecipUnit = AppSettings["precip_unit"];
type PressureUnit = AppSettings["pressure_unit"];
type VisibilityUnit = AppSettings["visibility_unit"];
type Theme = AppSettings["theme"];
type TrayIconStyle = AppSettings["tray_icon_style"];

const TIME_OPTIONS: { value: TimeFormat; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "12h", label: "12h" },
];

const TEMP_OPTIONS: { value: TempUnit; label: string }[] = [
  { value: "C", label: "°C" },
  { value: "F", label: "°F" },
  { value: "K", label: "K" },
];

const WIND_OPTIONS: { value: WindUnit; label: string }[] = [
  { value: "kmh", label: "km/h" },
  { value: "mph", label: "mph" },
  { value: "ms", label: "m/s" },
  { value: "knots", label: "kn" },
];

const PRECIP_OPTIONS: { value: PrecipUnit; label: string }[] = [
  { value: "mm", label: "mm" },
  { value: "in", label: "in" },
];

const PRESSURE_OPTIONS: { value: PressureUnit; label: string }[] = [
  { value: "hpa", label: "hPa" },
  { value: "inhg", label: "inHg" },
  { value: "mmhg", label: "mmHg" },
];

const VISIBILITY_OPTIONS: { value: VisibilityUnit; label: string }[] = [
  { value: "km", label: "km" },
  { value: "mi", label: "mi" },
];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

const TRAY_STYLE_OPTIONS: { value: TrayIconStyle; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "icon", label: "Icon" },
  { value: "temp", label: "Temp" },
  { value: "none", label: "Off" },
];

const API_LIST: { host: string; purposeKey: string }[] = [
  { host: "api.open-meteo.com",             purposeKey: "settings.apiOpenMeteoForecast" },
  { host: "air-quality-api.open-meteo.com", purposeKey: "settings.apiOpenMeteoAir" },
  { host: "geocoding-api.open-meteo.com",   purposeKey: "settings.apiOpenMeteoGeo" },
  { host: "api.weather.gov",                purposeKey: "settings.apiWeatherGov" },
  { host: "feeds.meteoalarm.org",           purposeKey: "settings.apiMeteoAlarm" },
  { host: "api.rainviewer.com",             purposeKey: "settings.apiRainViewer" },
  { host: "cartodb-basemaps.fastly.net",    purposeKey: "settings.apiCartoDB" },
];

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const { saveMutation } = useSettings();
  const { t } = useTranslation();
  const [aboutOpen, setAboutOpen] = useState(false);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    updateSetting(key, value);
    saveMutation.mutate({ ...settings, [key]: value });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(8, 8, 11, 0.42)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />

      <motion.div
        className="absolute top-0 right-0 bottom-0 w-[400px] glass-popover flex flex-col"
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >

        <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06] shrink-0">
          <div>
            <p className="text-[15px] font-semibold text-white/95 leading-none">{t("settings.title")}</p>
            <p className="text-[11px] text-white/45 mt-1 leading-none">{t("settings.subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/45 hover:text-white/85 hover:bg-white/[0.06] transition-colors"
            title={t("settings.close")}
          >
            <X size={15} />
          </button>
        </div>


        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          <SectionCard icon={<Gauge size={13} />} title={t("settings.sectionUnits")}>
            <SettingRow
              icon={<Clock size={14} />}
              label={t("settings.timeFormat")}
              description={t("settings.timeFormatDesc")}
            >
              <SettingPillGroup options={TIME_OPTIONS} value={settings.time_format} onChange={(v) => update("time_format", v)} />
            </SettingRow>
            <Divider />
            <SettingRow
              icon={<Thermometer size={14} />}
              label={t("settings.temperature")}
              description={t("settings.temperatureDesc")}
            >
              <SettingPillGroup options={TEMP_OPTIONS} value={settings.temp_unit} onChange={(v) => update("temp_unit", v)} />
            </SettingRow>
            <Divider />
            <SettingRow
              icon={<Wind size={14} />}
              label={t("settings.windSpeed")}
              description={t("settings.windSpeedDesc")}
            >
              <SettingPillGroup options={WIND_OPTIONS} value={settings.wind_unit} onChange={(v) => update("wind_unit", v)} />
            </SettingRow>
            <Divider />
            <SettingRow
              icon={<Droplets size={14} />}
              label={t("settings.precipitation")}
              description={t("settings.precipitationDesc")}
            >
              <SettingPillGroup options={PRECIP_OPTIONS} value={settings.precip_unit} onChange={(v) => update("precip_unit", v)} />
            </SettingRow>
            <Divider />
            <SettingRow
              icon={<GaugeMiniIcon />}
              label={t("settings.pressure")}
              description={t("settings.pressureDesc")}
            >
              <SettingPillGroup options={PRESSURE_OPTIONS} value={settings.pressure_unit} onChange={(v) => update("pressure_unit", v)} />
            </SettingRow>
            <Divider />
            <SettingRow
              icon={<Eye size={14} />}
              label={t("settings.visibility")}
              description={t("settings.visibilityDesc")}
            >
              <SettingPillGroup options={VISIBILITY_OPTIONS} value={settings.visibility_unit} onChange={(v) => update("visibility_unit", v)} />
            </SettingRow>
          </SectionCard>


          <SectionCard icon={<Palette size={13} />} title={t("settings.sectionAppearance")}>
            <SettingRow
              icon={<Palette size={14} />}
              label={t("settings.theme")}
              description={t("settings.themeDesc")}
            >
              <SettingPillGroup
                options={THEME_OPTIONS}
                value={settings.theme}
                onChange={(v) => {
                  if (v === "light" && settings.theme !== "light") {
                    if (!window.confirm(t("settings.lightThemeConfirm"))) return;
                  }
                  update("theme", v);
                }}
              />
              {settings.theme === "light" && (
                <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-400/85 px-2 py-1.5 rounded-lg bg-amber-400/[0.07] border border-amber-400/[0.20]">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>{t("settings.lightThemeWarn")}</span>
                </div>
              )}
            </SettingRow>
            <Divider />
            <SettingRow
              icon={<Sparkles size={14} />}
              label={t("settings.animatedBackground")}
              description={t("settings.animatedBackgroundDesc")}
            >
              <ToggleSwitch value={settings.animated_background} onChange={(v) => update("animated_background", v)} />
            </SettingRow>
            <Divider />
            <SettingRow
              icon={<Sparkles size={14} />}
              label={t("settings.animatedIcons")}
              description={t("settings.animatedIconsDesc")}
            >
              <ToggleSwitch value={settings.animated_icons} onChange={(v) => update("animated_icons", v)} />
            </SettingRow>
            <Divider />
            <SettingRow
              icon={<SunMoon size={14} />}
              label={t("settings.timeOfDayShift")}
              description={t("settings.timeOfDayShiftDesc")}
            >
              <ToggleSwitch value={settings.time_of_day_shift} onChange={(v) => update("time_of_day_shift", v)} />
            </SettingRow>
            <Divider />
            <CinematicIntroRow />
          </SectionCard>


          <SectionCard icon={<Bell size={13} />} title={t("settings.sectionNotifications")}>
            <NotificationStatusRow />
            <Divider />
            <SettingRow icon={<Bell size={14} />} label={t("settings.notifyExtreme")} description={t("settings.notifyExtremeDesc")}>
              <ToggleSwitch value={settings.notify_extreme} onChange={(v) => update("notify_extreme", v)} />
            </SettingRow>
            <Divider />
            <SettingRow icon={<Bell size={14} />} label={t("settings.notifySevere")} description={t("settings.notifySevereDesc")}>
              <ToggleSwitch value={settings.notify_severe} onChange={(v) => update("notify_severe", v)} />
            </SettingRow>
            <Divider />
            <SettingRow icon={<Bell size={14} />} label={t("settings.notifyModerate")} description={t("settings.notifyModerateDesc")}>
              <ToggleSwitch value={settings.notify_moderate} onChange={(v) => update("notify_moderate", v)} />
            </SettingRow>
            <Divider />
            <SettingRow icon={<Bell size={14} />} label={t("settings.notifyMinor")} description={t("settings.notifyMinorDesc")}>
              <ToggleSwitch value={settings.notify_minor} onChange={(v) => update("notify_minor", v)} />
            </SettingRow>
          </SectionCard>


          <SectionCard icon={<RefreshCw size={13} />} title={t("settings.sectionData")}>
            <SettingRow
              icon={<RefreshCw size={14} />}
              label={t("settings.refreshInterval")}
              description={t("settings.refreshIntervalDesc")}
            >
              <SettingSlider
                value={settings.refresh_interval_minutes}
                min={5}
                max={60}
                step={5}
                unit={t("settings.minutesShort")}
                onChange={(v) => update("refresh_interval_minutes", v)}
              />
            </SettingRow>
          </SectionCard>


          <SectionCard icon={<MonitorSmartphone size={13} />} title={t("settings.sectionTray")}>
            <SettingRow
              icon={<MonitorSmartphone size={14} />}
              label={t("settings.trayContent")}
              description={t("settings.trayContentDesc")}
            >
              <SettingPillGroup options={TRAY_STYLE_OPTIONS} value={settings.tray_icon_style} onChange={(v) => update("tray_icon_style", v)} />
            </SettingRow>
          </SectionCard>


          <SectionCard icon={<Globe size={13} />} title={t("settings.sectionLanguage")}>
            <SettingRow
              icon={<Globe size={14} />}
              label={t("settings.language")}
              description={t("settings.languageDesc")}
            >
              <LanguageSelect value={settings.language} onChange={(v) => update("language", v)} />
            </SettingRow>
          </SectionCard>


          <SectionCard icon={<Wrench size={13} />} title={t("settings.sectionDeveloper")}>
            <SettingRow
              icon={<RotateCcw size={14} />}
              label={t("settings.replaySetup")}
              description={t("settings.replaySetupDesc")}
            >
              <button
                onClick={() => {
                  if (!window.confirm(t("settings.replaySetupConfirm"))) return;
                  update("setup_complete", false);
                  onClose();
                }}
                className="h-8 px-3 rounded-lg text-[12px] font-medium text-white/85 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] transition-colors"
              >
                {t("settings.replaySetupBtn")}
              </button>
            </SettingRow>
          </SectionCard>


          <SectionCard icon={<Info size={13} />} title={t("settings.sectionAbout")}>
            <div className="px-3 py-3 space-y-2">
              <InfoRow label={t("settings.aboutVersion")} value="0.1.0" />
              <InfoRow label={t("settings.aboutBuilt")} value="Tauri + React" />
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                className="mt-2 w-full h-9 rounded-lg text-[12.5px] font-medium text-white/90 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] hover:border-white/[0.18] transition-colors flex items-center justify-center gap-2"
              >
                <Info size={13} />
                {t("settings.aboutOpenBtn")}
              </button>
            </div>
            <div className="px-3 pb-3">
              <p className="text-[10px] uppercase tracking-widest text-white/45 font-semibold mb-1.5">
                {t("settings.aboutApisTitle")}
              </p>
              <ul className="space-y-1.5">
                {API_LIST.map((api) => (
                  <ApiRow key={api.host} host={api.host} purpose={t(api.purposeKey)} />
                ))}
              </ul>
              <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                {t("settings.aboutApisNote")}
              </p>
            </div>
          </SectionCard>
        </div>
      </motion.div>

      <AnimatePresence>
        {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/[0.04] bg-white/[0.015]">
        <span className="text-white/55">{icon}</span>
        <p className="text-[10.5px] text-white/65 uppercase tracking-widest font-semibold">{title}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  description,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3.5 py-3">
      <div className="flex items-start gap-2.5 mb-2.5">
        <span className="text-white/55 mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-[13px] text-white/90 font-medium leading-tight">{label}</p>
          {description && (
            <p className="text-[11px] text-white/45 mt-0.5 leading-tight">{description}</p>
          )}
        </div>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/[0.04] mx-3.5" />;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-white/55">{label}</span>
      <span className="text-[12px] text-white/80 font-medium tabular-nums">{value}</span>
    </div>
  );
}

function NotificationStatusRow() {
  const { t } = useTranslation();
  const permission = useNotificationPermission();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; hint?: string } | null>(null);

  async function onTest() {
    setBusy(true);
    setResult(null);
    const res = await sendTestNotification({
      title: t("settings.notifyTestTitle"),
      body: t("settings.notifyTestBody"),
    });
    setResult({ ok: res.ok, hint: res.hint });
    setBusy(false);
  }

  return (
    <div className="px-3.5 py-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-white/55 mt-0.5"><BellRing size={14} /></span>
          <div className="min-w-0">
            <p className="text-[12.5px] text-white/90 font-medium leading-tight">
              {t("settings.notifyStatusLabel")}
            </p>
            <p className="text-[11px] text-white/45 leading-snug mt-0.5">
              {t("settings.notifyStatusDesc")}
            </p>
          </div>
        </div>
        <PermissionBadge state={permission} />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTest}
          disabled={busy}
          className="h-7 px-2.5 rounded-md text-[11.5px] font-medium text-white/85 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? t("settings.notifyTestBusy") : t("settings.notifyTestBtn")}
        </button>
        {result && (
          <span
            className={`text-[11px] leading-snug ${result.ok ? "text-emerald-300/85" : "text-amber-300/85"}`}
          >
            {result.ok ? t("settings.notifyTestOk") : (result.hint ?? t("settings.notifyTestFail"))}
          </span>
        )}
      </div>
    </div>
  );
}

function PermissionBadge({ state }: { state: PermissionState }) {
  const { t } = useTranslation();
  const tone = state === "granted"
    ? "bg-emerald-400/12 text-emerald-300 border-emerald-400/25"
    : state === "denied"
      ? "bg-rose-400/12 text-rose-300 border-rose-400/25"
      : "bg-white/[0.06] text-white/65 border-white/[0.10]";
  const labelKey: Record<PermissionState, string> = {
    granted: "settings.notifyPermGranted",
    denied: "settings.notifyPermDenied",
    prompt: "settings.notifyPermPrompt",
    unknown: "settings.notifyPermUnknown",
  };
  return (
    <span
      className={`shrink-0 text-[10.5px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border ${tone}`}
    >
      {t(labelKey[state])}
    </span>
  );
}

function ApiRow({ host, purpose }: { host: string; purpose: string }) {
  return (
    <li className="flex items-start justify-between gap-3 leading-tight">
      <code className="text-[11px] text-white/75 font-mono break-all">{host}</code>
      <span className="text-[11px] text-white/45 text-right shrink-0 max-w-[55%]">{purpose}</span>
    </li>
  );
}

function CinematicIntroRow() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<boolean>(() => isIntroEnabled());
  return (
    <SettingRow
      icon={<Sparkles size={14} />}
      label={t("settings.cinematicIntro")}
      description={t("settings.cinematicIntroDesc")}
    >
      <ToggleSwitch
        value={enabled}
        onChange={(v) => {
          setEnabled(v);
          setIntroEnabled(v);
        }}
      />
    </SettingRow>
  );
}

function GaugeMiniIcon() {

  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 9a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7" y1="9" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="7" cy="9" r="0.8" fill="currentColor" />
    </svg>
  );
}
