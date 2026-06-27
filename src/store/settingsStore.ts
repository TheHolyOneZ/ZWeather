import { create } from "zustand";

export interface AppSettings {
  temp_unit: "C" | "F" | "K";
  wind_unit: "kmh" | "mph" | "ms" | "knots";
  pressure_unit: "hpa" | "inhg" | "mmhg";
  precip_unit: "mm" | "in";
  visibility_unit: "km" | "mi";
  time_format: "24h" | "12h";
  refresh_interval_minutes: number;
  tray_icon_style: "both" | "icon" | "temp" | "none";
  notify_extreme: boolean;
  notify_severe: boolean;
  notify_moderate: boolean;
  notify_minor: boolean;
  animated_background: boolean;
  animated_icons: boolean;
  time_of_day_shift: boolean;
  theme: "dark" | "light" | "system";
  language: "en" | "de" | "fr" | "es" | "it";
  setup_complete: boolean;
}

const defaults: AppSettings = {
  temp_unit: "C",
  wind_unit: "kmh",
  pressure_unit: "hpa",
  precip_unit: "mm",
  visibility_unit: "km",
  time_format: "24h",
  refresh_interval_minutes: 15,
  tray_icon_style: "both",
  notify_extreme: true,
  notify_severe: true,
  notify_moderate: false,
  notify_minor: false,
  animated_background: true,
  animated_icons: true,
  time_of_day_shift: true,
  theme: "dark",
  language: "en",
  setup_complete: false,
};

interface SettingsStore {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaults,
  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) =>
    set((state) => ({ settings: { ...state.settings, [key]: value } })),
}));
