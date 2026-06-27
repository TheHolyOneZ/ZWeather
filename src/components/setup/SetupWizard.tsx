import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useSettingsStore, type AppSettings } from "@/store/settingsStore";
import { useSettings } from "@/hooks/useSettings";
import { SettingPillGroup } from "@/components/settings/SettingPillGroup";
import { LanguageSelect } from "@/components/settings/LanguageSelect";

interface SetupWizardProps {
  onComplete: () => void;
}

type TimeFormat = AppSettings["time_format"];
type TempUnit = AppSettings["temp_unit"];
type WindUnit = AppSettings["wind_unit"];
type Language = AppSettings["language"];

const TIME_OPTIONS: { value: TimeFormat; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "12h", label: "12h (AM/PM)" },
];

const TEMP_OPTIONS: { value: TempUnit; label: string }[] = [
  { value: "C", label: "°C" },
  { value: "F", label: "°F" },
];

const WIND_OPTIONS: { value: WindUnit; label: string }[] = [
  { value: "kmh", label: "km/h" },
  { value: "mph", label: "mph" },
  { value: "ms", label: "m/s" },
];

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const settings = useSettingsStore((s) => s.settings);
  const { saveMutation } = useSettings();
  const { t } = useTranslation();

  const [timeFormat, setTimeFormat] = useState<TimeFormat>(settings.time_format);
  const [tempUnit, setTempUnit] = useState<TempUnit>(settings.temp_unit);
  const [windUnit, setWindUnit] = useState<WindUnit>(settings.wind_unit);
  const [language, setLanguage] = useState<Language>(settings.language);

  async function persist(complete: boolean) {
    await saveMutation.mutateAsync({
      ...settings,
      time_format: timeFormat,
      temp_unit: tempUnit,
      wind_unit: windUnit,
      language,
      setup_complete: complete,
    });
    onComplete();
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ background: "rgba(8, 8, 11, 0.78)", backdropFilter: "blur(16px)" }}
    >
      <motion.div
        className="glass-popover rounded-2xl w-full max-w-[420px] p-6"
        initial={{ y: 16, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <p className="text-[20px] font-semibold text-white/95 tracking-[-0.01em]">{t("setup.title")}</p>
        <p className="text-[13px] text-white/45 mt-1.5 leading-snug">
          {t("setup.subtitle")}
        </p>

        <div className="mt-6 space-y-5">
          <Section label={t("setup.timeFormat")}>
            <SettingPillGroup options={TIME_OPTIONS} value={timeFormat} onChange={setTimeFormat} />
          </Section>

          <Section label={t("setup.temperature")}>
            <SettingPillGroup options={TEMP_OPTIONS} value={tempUnit} onChange={setTempUnit} />
          </Section>

          <Section label={t("setup.windSpeed")}>
            <SettingPillGroup options={WIND_OPTIONS} value={windUnit} onChange={setWindUnit} />
          </Section>

          <Section label={t("setup.language")}>
            <LanguageSelect value={language} onChange={setLanguage} />
          </Section>
        </div>

        <div className="mt-7 flex flex-col items-center gap-2">
          <motion.button
            className="w-full h-10 rounded-xl text-[14px] font-medium text-white"
            style={{ background: "var(--gradient-accent)" }}
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            onClick={() => persist(true)}
            disabled={saveMutation.isPending}
          >
            {t("setup.continue")}
          </motion.button>
          <button
            className="text-[12px] text-white/35 hover:text-white/70 transition-colors"
            onClick={() => persist(true)}
            disabled={saveMutation.isPending}
          >
            {t("setup.skip")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  );
}
