import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import type { CurrentWeather } from "@/types/weather";
import { useSettingsStore } from "@/store/settingsStore";
import { convertTemp, tempUnitSymbol } from "@/lib/units";
import { wmoLabelKey } from "@/lib/wmo";
import { meteoconUrlFill, wmoToMeteocon } from "@/lib/meteocons";
import { isLinux } from "@/lib/platform";

const SIZE = 32;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(64, 64);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawTemp(ctx: CanvasRenderingContext2D, text: string, maxSize: number, alignRight: boolean) {
  let size = maxSize;
  do {
    ctx.font = `700 ${size}px "Segoe UI", system-ui, sans-serif`;
    if (ctx.measureText(text).width <= SIZE - 1) break;
    size -= 1;
  } while (size > 8);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = alignRight ? "right" : "center";
  const x = alignRight ? SIZE - 0.5 : SIZE / 2;
  const y = alignRight ? SIZE - 1 : SIZE / 2 + size * 0.36;


  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, size / 6);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x, y);
}

async function renderIcon(
  current: CurrentWeather,
  style: "both" | "icon" | "temp",
  tempText: string,
): Promise<Uint8ClampedArray> {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  if (style !== "temp") {
    const now = Date.now() / 1000;
    const isDay = now > current.sunrise && now < current.sunset;
    const img = await loadImage(meteoconUrlFill(wmoToMeteocon(current.condition_code, isDay)));


    if (style === "icon") ctx.drawImage(img, -7, -7, SIZE + 14, SIZE + 14);
    else ctx.drawImage(img, -8, -9, SIZE + 8, SIZE + 8);
  }

  if (style !== "icon") drawTemp(ctx, tempText, style === "temp" ? 24 : 17, style === "both");

  return ctx.getImageData(0, 0, SIZE, SIZE).data;
}

export function useTrayIcon(current: CurrentWeather | undefined, locationName: string | undefined) {
  const style = useSettingsStore((s) => s.settings.tray_icon_style);
  const tempUnit = useSettingsStore((s) => s.settings.temp_unit);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    const temp = current ? Math.round(convertTemp(current.temperature, tempUnit)) : 0;
    const tempStr = `${temp}${tempUnitSymbol(tempUnit)}`;

    if (!isLinux()) {
      let tooltip = "ZWeather";
      if (current && style !== "none") {
        const condition = t(wmoLabelKey(current.condition_code));
        const loc = locationName ?? "";
        tooltip = [loc, condition, tempStr].filter(Boolean).join(" · ");
      }
      invoke("set_tray_tooltip", { tooltip }).catch(() => {});
    }

    if (!current || style === "none") {
      invoke("set_tray_icon", { rgba: null, width: 0, height: 0 }).catch(() => {});
      return;
    }

    const iconText = style === "temp" && Math.abs(temp) < 100 ? `${temp}°` : `${temp}`;
    renderIcon(current, style, iconText)
      .then((pixels) => {
        if (cancelled) return;
        return invoke("set_tray_icon", { rgba: Array.from(pixels), width: SIZE, height: SIZE });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [current, locationName, style, tempUnit, t]);
}
