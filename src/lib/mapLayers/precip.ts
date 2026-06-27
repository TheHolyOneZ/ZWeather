import { createTileTimelineLayer } from "./rainviewer";
import type { WeatherLayer } from "./types";


const COLOR_SCHEME = 4;
const SMOOTH = 1;
const SNOW_OVERLAY = 1;

export function createPrecipLayer(): WeatherLayer {
  return createTileTimelineLayer({
    id: "precip",
    manifestUrl: "https://api.rainviewer.com/public/weather-maps.json",
    buildTileUrl: (host, path) =>
      `${host}${path}/256/{z}/{x}/{y}/${COLOR_SCHEME}/${SMOOTH}_${SNOW_OVERLAY}.png`,
    framePickerPast: (d) => d.radar?.past ?? [],
    framePickerFuture: (d) => d.radar?.nowcast ?? [],


    preloadAll: false,
    legend: {
      titleKey: "radar.legend.precipitation",
      unitKey: "radar.legend.precipitationUnit",
      stops: [
        { offset: 0,    color: "#00ecec" },
        { offset: 0.14, color: "#019ff4" },
        { offset: 0.28, color: "#0300f4" },
        { offset: 0.42, color: "#02fd02" },
        { offset: 0.57, color: "#fdf802" },
        { offset: 0.71, color: "#fd9500" },
        { offset: 0.85, color: "#fd0000" },
        { offset: 1,    color: "#fc00ff" },
      ],
      ticks: [
        { offset: 0,    label: "radar.legend.light" },
        { offset: 0.4,  label: "radar.legend.moderate" },
        { offset: 0.7,  label: "radar.legend.heavy" },
        { offset: 1,    label: "radar.legend.extreme" },
      ],
    },
  });
}
