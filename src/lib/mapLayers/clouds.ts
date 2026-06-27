

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
const MAX_ALPHA = 0.75;

export function createCloudsLayer(): WeatherLayer {
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
          let a = 0;
          if (ll) {
            const { fx, fy } = latLonToGrid(ll.lat, ll.lng, grid.bbox, grid.size);
            if (Number.isFinite(fx) && Number.isFinite(fy)) {
              const c = sample(grid.cloud, grid.size, fx, fy);
              if (Number.isFinite(c)) {
                a = Math.round((Math.max(0, Math.min(100, c)) / 100) * MAX_ALPHA * 255);
              }
            }
          }
          const i = (y * lw + x) * 4;
          data[i] = 235;
          data[i + 1] = 240;
          data[i + 2] = 250;
          data[i + 3] = a;
        }
      }
      lowCtx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(low, 0, 0, W, H);
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
  const onZoomEnd = () => controller.scheduleUrgent();
  const onResize = () => {
    resizeCanvas();
    if (grid) scheduleRedraw();
  };

  return {
    id: "clouds",
    async mount(m: L.Map) {
      map = m;
      canvas = createOverlayCanvas(m, 635);
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
        titleKey: "radar.legend.clouds",
        unitKey: "radar.legend.cloudUnit",
        stops: [
          { offset: 0,   color: "rgba(235,240,250,0)" },
          { offset: 0.5, color: "rgba(235,240,250,0.55)" },
          { offset: 1,   color: "rgba(235,240,250,0.9)" },
        ],
        ticks: [
          { offset: 0,   label: "radar.legend.thin" },
          { offset: 0.6, label: "radar.legend.thick" },
          { offset: 1,   label: "radar.legend.dense" },
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
      return { cloud: sample(grid.cloud, grid.size, fx, fy) };
    },
  };
}
