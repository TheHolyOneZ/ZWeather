

import L from "leaflet";
import type { GridSample } from "@/lib/openMeteoGrid";
import { fetchGridSample, latLonToGrid, sample } from "@/lib/openMeteoGrid";
import { createOverlayCanvas, safeBounds, sizeOverlayCanvas } from "./canvasOverlay";
import {
  createRefetchController,
  safeContainerToLatLng,
  viewEscapedGrid,
} from "./gridGuard";
import type { LayerReadyState, WeatherLayer } from "./types";

const GRID_SIZE = 10;
const REFRESH_DEBOUNCE_MS = 1200;
const LOW_RES_SCALE = 0.25;
const OPACITY = 0.45;

const RAMP: [number, [number, number, number]][] = [
  [-30, [40,  60, 160]],
  [-15, [60, 130, 210]],
  [0,   [120, 200, 240]],
  [10,  [120, 220, 160]],
  [20,  [240, 220, 90]],
  [30,  [240, 130, 50]],
  [42,  [200, 40, 50]],
];

function colorAt(t: number): [number, number, number] {


  if (!Number.isFinite(t)) return [80, 80, 90];
  if (t <= RAMP[0][0]) return RAMP[0][1];
  if (t >= RAMP[RAMP.length - 1][0]) return RAMP[RAMP.length - 1][1];
  for (let i = 1; i < RAMP.length; i++) {
    const [hi, hiC] = RAMP[i];
    if (t <= hi) {
      const [lo, loC] = RAMP[i - 1];
      const k = (t - lo) / (hi - lo);
      return [
        loC[0] + (hiC[0] - loC[0]) * k,
        loC[1] + (hiC[1] - loC[1]) * k,
        loC[2] + (hiC[2] - loC[2]) * k,
      ];
    }
  }
  return RAMP[RAMP.length - 1][1];
}

export function createTemperatureLayer(): WeatherLayer {
  let map: L.Map | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let low: HTMLCanvasElement | null = null;
  let lowCtx: CanvasRenderingContext2D | null = null;
  let grid: GridSample | null = null;
  let redrawRaf: number | null = null;
  let ready: LayerReadyState = { ready: false, loaded: 0, total: 1 };
  const readyListeners = new Set<(s: LayerReadyState) => void>();

  function emitReady() {
    readyListeners.forEach((cb) => cb({ ...ready }));
  }

  function resizeCanvas() {
    if (!canvas || !map) return;
    sizeOverlayCanvas(canvas, map);
    if (low) {
      const size = map.getSize();
      low.width = Math.max(2, Math.floor(size.x * LOW_RES_SCALE));
      low.height = Math.max(2, Math.floor(size.y * LOW_RES_SCALE));
    }
  }

  function redraw() {
    if (!ctx || !canvas || !lowCtx || !low || !map || !grid) return;
    const lw = low.width;
    const lh = low.height;
    const W = canvas.width;
    const H = canvas.height;
    if (lw < 2 || lh < 2 || W < 2 || H < 2) return;
    try {
      const img = lowCtx.createImageData(lw, lh);
      const data = img.data;
      for (let y = 0; y < lh; y++) {
        for (let x = 0; x < lw; x++) {
          const px = (x / lw) * W;
          const py = (y / lh) * H;
          const ll = safeContainerToLatLng(map, px, py);
          let r = 80, g = 80, b = 90;
          if (ll) {
            const { fx, fy } = latLonToGrid(ll.lat, ll.lng, grid.bbox, grid.size);
            if (Number.isFinite(fx) && Number.isFinite(fy)) {
              const t = sample(grid.temp, grid.size, fx, fy);
              [r, g, b] = colorAt(t);
            }
          }
          const i = (y * lw + x) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 255;
        }
      }
      lowCtx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = OPACITY;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(low, 0, 0, W, H);
      ctx.globalAlpha = 1;
    } catch {


    }
  }

  function scheduleRedraw() {
    if (redrawRaf != null) return;
    redrawRaf = requestAnimationFrame(() => {
      redrawRaf = null;
      redraw();
    });
  }

  const controller = createRefetchController(async () => {
    if (!map) return;
    const isInitial = grid == null;
    if (isInitial) {
      ready.ready = false;
      emitReady();
    }
    try {
      const bbox = safeBounds(map);
      const next = await fetchGridSample(bbox, GRID_SIZE);
      if (!map) return;
      grid = next;
      ready = { ready: true, loaded: 1, total: 1 };
      emitReady();
      scheduleRedraw();
    } catch {
      if (isInitial && map) {
        ready = { ready: false, loaded: 0, total: 1 };
        emitReady();
      }
    }
  }, { debounceMs: REFRESH_DEBOUNCE_MS, urgentMs: 60 });

  const onMove = () => {
    resizeCanvas();
    if (grid) scheduleRedraw();
  };
  const onMoveEnd = () => {


    if (map && viewEscapedGrid(safeBounds(map), grid)) {
      controller.scheduleUrgent();
    } else {
      controller.scheduleNormal();
    }
  };
  const onZoomEnd = () => {


    controller.scheduleUrgent();
  };
  const onResize = () => {
    resizeCanvas();
    if (grid) scheduleRedraw();
  };

  return {
    id: "temperature",
    async mount(m: L.Map) {
      map = m;
      canvas = createOverlayCanvas(m, 640);
      ctx = canvas.getContext("2d");

      low = document.createElement("canvas");
      lowCtx = low.getContext("2d");

      resizeCanvas();

      m.on("move", onMove);
      m.on("moveend", onMoveEnd);
      m.on("zoomend", onZoomEnd);
      m.on("resize", onResize);

      controller.scheduleUrgent();
    },

    unmount() {
      controller.cancel();
      if (redrawRaf != null) cancelAnimationFrame(redrawRaf);
      redrawRaf = null;
      if (map) {
        map.off("move", onMove);
        map.off("moveend", onMoveEnd);
        map.off("zoomend", onZoomEnd);
        map.off("resize", onResize);
      }
      if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
      canvas = null;
      ctx = null;
      low = null;
      lowCtx = null;
      grid = null;
      map = null;
      readyListeners.clear();
    },

    getLegend() {
      return {
        titleKey: "radar.legend.temperature",
        unitKey: "radar.legend.temperatureUnit",
        stops: [
          { offset: 0,    color: "rgb(40,60,160)" },
          { offset: 0.2,  color: "rgb(60,130,210)" },
          { offset: 0.4,  color: "rgb(120,200,240)" },
          { offset: 0.55, color: "rgb(120,220,160)" },
          { offset: 0.7,  color: "rgb(240,220,90)" },
          { offset: 0.85, color: "rgb(240,130,50)" },
          { offset: 1,    color: "rgb(200,40,50)" },
        ],
        ticks: [
          { offset: 0,    label: "__TEMP_MIN__" },
          { offset: 0.5,  label: "__TEMP_MID__" },
          { offset: 1,    label: "__TEMP_MAX__" },
        ],
      };
    },

    onReadyChange(cb) {
      readyListeners.add(cb);
      cb({ ...ready });
      return () => readyListeners.delete(cb);
    },

    sampleAt(lat, lon) {
      if (!grid) return null;
      const { fx, fy } = latLonToGrid(lat, lon, grid.bbox, grid.size);
      if (!Number.isFinite(fx) || !Number.isFinite(fy)) return null;
      return { temp: sample(grid.temp, grid.size, fx, fy) };
    },
  };
}
