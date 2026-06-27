import L from "leaflet";
import type { Frame, LayerId, LayerReadyState, LegendSpec, WeatherLayer } from "./types";

interface RainViewerResponse {
  host: string;
  radar?: { past: Frame[]; nowcast: Frame[] };
  satellite?: { infrared: Frame[] };
}

interface Opts {
  id: LayerId;
  manifestUrl: string;

  buildTileUrl: (host: string, path: string) => string;
  legend: LegendSpec;
  framePickerPast: (data: RainViewerResponse) => Frame[];
  framePickerFuture?: (data: RainViewerResponse) => Frame[];

  opacity?: number;
  fadeMs?: number;


  preloadAll?: boolean;
}

const TILE_SIZE = 256;

export function createTileTimelineLayer(opts: Opts): WeatherLayer {
  let map: L.Map | null = null;
  let host: string | null = null;
  let frames: Frame[] = [];
  let preloadLayers: L.TileLayer[] = [];
  let activeLayer: L.TileLayer | null = null;
  let ready: LayerReadyState = { ready: false, loaded: 0, total: 0 };
  const readyListeners = new Set<(s: LayerReadyState) => void>();
  const frameListeners = new Set<(f: Frame[]) => void>();
  const targetOpacity = opts.opacity ?? 0.65;
  const fadeMs = opts.fadeMs ?? 220;
  const preloadAll = opts.preloadAll ?? true;
  let currentFrameIdx = -1;

  function emitReady() {
    readyListeners.forEach((cb) => cb({ ...ready }));
  }
  function emitFrames() {
    frameListeners.forEach((cb) => cb(frames.slice()));
  }

  function tileUrl(frame: Frame): string {
    return opts.buildTileUrl(host!, frame.path);
  }

  return {
    id: opts.id,
    async mount(m: L.Map) {
      map = m;
      ready = { ready: false, loaded: 0, total: 0 };
      emitReady();

      try {
        const res = await fetch(opts.manifestUrl);
        const data = (await res.json()) as RainViewerResponse;
        host = data.host;
        const past = opts.framePickerPast(data);
        const future = opts.framePickerFuture ? opts.framePickerFuture(data) : [];
        frames = [...past, ...future];
        emitFrames();


        if (frames.length === 0) {
          ready = { ready: true, loaded: 0, total: 0 };
          emitReady();
          return;
        }


        const defaultIdx = Math.max(0, past.length - 1);

        if (preloadAll) {

          preloadLayers = frames.map((frame) => {
            const layer = L.tileLayer(tileUrl(frame), {
              opacity: 0,
              minZoom: 0,
              maxZoom: 11,
              maxNativeZoom: 10,
              tileSize: TILE_SIZE,
            });
            layer.once("load", () => {
              ready.loaded += 1;
              if (ready.loaded === frames.length) ready.ready = true;
              emitReady();
            });
            layer.addTo(m);
            return layer;
          });
          ready.total = frames.length;
          emitReady();
          this.setFrame?.(defaultIdx);
        } else {


          ready = { ready: false, loaded: 0, total: 1 };
          emitReady();
          this.setFrame?.(defaultIdx);
        }
      } catch {
        ready = { ready: false, loaded: 0, total: 0 };
        emitReady();
      }
    },

    unmount() {
      if (!map) return;
      preloadLayers.forEach((l) => map!.removeLayer(l));
      preloadLayers = [];
      if (activeLayer) {
        map.removeLayer(activeLayer);
        activeLayer = null;
      }
      readyListeners.clear();
      frameListeners.clear();
      frames = [];
      host = null;
      map = null;
      currentFrameIdx = -1;
    },

    setFrame(idx: number) {
      if (!map || !host || frames.length === 0) return;
      if (idx === currentFrameIdx) return;
      const frame = frames[idx];
      if (!frame) return;
      currentFrameIdx = idx;

      const newLayer = L.tileLayer(tileUrl(frame), {
        opacity: 0,
        minZoom: 0,
        maxZoom: 11,
        maxNativeZoom: 10,
        tileSize: TILE_SIZE,
        keepBuffer: 4,
      }).addTo(map);


      if (!preloadAll && !ready.ready) {
        ready = { ready: true, loaded: 1, total: 1 };
        emitReady();
      }

      const oldLayer = activeLayer;
      const start = performance.now();
      const animate = (now: number) => {
        const p = Math.min(1, (now - start) / fadeMs);
        newLayer.setOpacity(targetOpacity * p);
        if (oldLayer) oldLayer.setOpacity(targetOpacity * (1 - p));
        if (p < 1) {
          requestAnimationFrame(animate);
        } else {
          if (oldLayer && map) map.removeLayer(oldLayer);
          activeLayer = newLayer;
        }
      };
      requestAnimationFrame(animate);
    },

    getFrames() {
      return frames.slice();
    },

    getLegend() {
      return opts.legend;
    },

    onReadyChange(cb) {
      readyListeners.add(cb);
      cb({ ...ready });
      return () => readyListeners.delete(cb);
    },

    onFramesChange(cb) {
      frameListeners.add(cb);
      cb(frames.slice());
      return () => frameListeners.delete(cb);
    },
  };
}
