import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { CurrentWeather } from "@/types/weather";
import { useSettingsStore } from "@/store/settingsStore";
import { convertTemp, tempUnitSymbol } from "@/lib/units";
import { wmoLabelKey } from "@/lib/wmo";
import { useTranslation } from "react-i18next";
import { isLinux } from "@/lib/platform";

export function useTrayTooltip(
  current: CurrentWeather | undefined,
  locationName: string | undefined,
) {
  const style = useSettingsStore((s) => s.settings.tray_icon_style);
  const tempUnit = useSettingsStore((s) => s.settings.temp_unit);
  const { t } = useTranslation();

  useEffect(() => {
    if (isLinux()) return;
    let tooltip = "ZWeather";
    if (current && style !== "none") {
      const tempStr = `${Math.round(convertTemp(current.temperature, tempUnit))}${tempUnitSymbol(tempUnit)}`;
      const condition = t(wmoLabelKey(current.condition_code));
      const loc = locationName ?? "";
      const head = loc ? `${loc} · ${condition}` : condition;
      switch (style) {
        case "both":
          tooltip = `${head} · ${tempStr}`;
          break;
        case "temp":
          tooltip = loc ? `${loc} · ${tempStr}` : tempStr;
          break;
        case "icon":
          tooltip = head;
          break;
      }
    }
    invoke("set_tray_tooltip", { tooltip }).catch(() => {});
  }, [current, locationName, style, tempUnit, t]);
}
