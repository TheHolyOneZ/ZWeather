import { useEffect, useRef } from "react";
import i18n from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settingsStore";
import { api } from "@/lib/api";
import { broadcastDataChanged } from "@/lib/crossWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";


const isDashboard = getCurrentWindow().label === "main";

export function useLanguageSync() {
  const language = useSettingsStore((s) => s.settings.language);
  const qc = useQueryClient();
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    if (isDashboard && lastSynced.current !== null && lastSynced.current !== language) {
      api.refreshLocationNames(language)
        .then(() => {
          qc.invalidateQueries({ queryKey: ["locations"] });
          broadcastDataChanged("locations");
        })
        .catch(() => {  });
    }
    lastSynced.current = language;
  }, [language, qc]);
}
