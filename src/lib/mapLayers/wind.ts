

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
const PARTICLE_COUNT = 700;
const MAX_AGE = 90;
const FADE_ALPHA = 0.94;
const SPEED_SCALE = 0.05;
const MAX_STEP_PX = 8;
const REFRESH_DEBOUNCE_MS = 1200;

interface Particle {
  x: number;
  y: number;
  age: number;
  speed: number;
}

export function createWindLayer(): WeatherLayer {
  let map: L.Map | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let grid: GridSample | null = null;
  let particles: Particle[] = [];
  let rafId: number | null = null;
  let visibilityHidden = false;
  let ready: LayerReadyState = { ready: false, loaded: 0, total: 1 };
  const readyListeners = new Set<(s: LayerReadyState) => void>();

  function emitReady() {
    readyListeners.forEach((cb) => cb({ ...ready }));
  }

  function resizeCanvas() {
    if (!canvas || !map) return;
    sizeOverlayCanvas(canvas, map);
  }

  function spawnParticle(p: Particle) {
    if (!canvas) return;
    p.x = Math.random() * canvas.width;
    p.y = Math.random() * canvas.height;
    p.age = Math.floor(Math.random() * MAX_AGE);
    p.speed = 0;
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => {
      const p: Particle = { x: 0, y: 0, age: 0, speed: 0 };
      spawnParticle(p);
      return p;
    });
  }

  function step() {
    rafId = null;
    if (!ctx || !canvas || !map || !grid || visibilityHidden) {
      rafId = requestAnimationFrame(step);
      return;
    }
    const W = canvas.width;
    const H = canvas.height;
    if (W < 2 || H < 2) {
      rafId = requestAnimationFrame(step);
      return;
    }

    try {
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = `rgba(0,0,0,${FADE_ALPHA})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";

      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";

      for (const p of particles) {

        if (
          !Number.isFinite(p.x) || !Number.isFinite(p.y) ||
          p.x < 0 || p.y < 0 || p.x > W || p.y > H ||
          p.age >= MAX_AGE
        ) {
          spawnParticle(p);
          continue;
        }

        const ll = safeContainerToLatLng(map, p.x, p.y);
        if (!ll) {
          spawnParticle(p);
          continue;
        }

        const { fx, fy } = latLonToGrid(ll.lat, ll.lng, grid.bbox, grid.size);
        if (!Number.isFinite(fx) || !Number.isFinite(fy)) {
          spawnParticle(p);
          continue;
        }

        const u = sample(grid.windU, grid.size, fx, fy);
        const v = sample(grid.windV, grid.size, fx, fy);
        if (!Number.isFinite(u) || !Number.isFinite(v)) {
          spawnParticle(p);
          continue;
        }

        const speed = Math.hypot(u, v);


        let dx = u * SPEED_SCALE;
        let dy = -v * SPEED_SCALE;
        const stepMag = Math.hypot(dx, dy);
        if (stepMag > MAX_STEP_PX) {
          const k = MAX_STEP_PX / stepMag;
          dx *= k;
          dy *= k;
        }

        const nx = p.x + dx;
        const ny = p.y + dy;

        const hue = 195 - Math.min(195, speed * 3);
        ctx.strokeStyle = `hsla(${hue}, 90%, 65%, 0.85)`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        p.x = nx;
        p.y = ny;
        p.age += 1;
        p.speed = speed;

        if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) spawnParticle(p);
      }
    } catch {

    }

    rafId = requestAnimationFrame(step);
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
    } catch {
      if (isInitial && map) {
        ready = { ready: false, loaded: 0, total: 1 };
        emitReady();
      }
    }
  }, { debounceMs: REFRESH_DEBOUNCE_MS, urgentMs: 60 });

  const onMove = () => {
    resizeCanvas();
  };
  const onMoveEnd = () => {
    if (map && viewEscapedGrid(safeBounds(map), grid)) {
      controller.scheduleUrgent();


      initParticles();
    } else {
      controller.scheduleNormal();
    }
  };
  const onZoomEnd = () => {
    controller.scheduleUrgent();
    initParticles();
  };
  const onResize = () => {
    resizeCanvas();
    initParticles();
  };
  const onVisibilityChange = () => {
    visibilityHidden = document.hidden;
  };

  return {
    id: "wind",
    async mount(m: L.Map) {
      map = m;
      canvas = createOverlayCanvas(m, 650);
      ctx = canvas.getContext("2d");
      resizeCanvas();
      initParticles();

      m.on("move", onMove);
      m.on("moveend", onMoveEnd);
      m.on("zoomend", onZoomEnd);
      m.on("resize", onResize);
      document.addEventListener("visibilitychange", onVisibilityChange);

      controller.scheduleUrgent();
      if (rafId == null) rafId = requestAnimationFrame(step);
    },

    unmount() {
      controller.cancel();
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
      if (map) {
        map.off("move", onMove);
        map.off("moveend", onMoveEnd);
        map.off("zoomend", onZoomEnd);
        map.off("resize", onResize);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
      canvas = null;
      ctx = null;
      grid = null;
      particles = [];
      map = null;
      readyListeners.clear();
    },

    getLegend() {
      return {
        titleKey: "radar.legend.wind",
        unitKey: "radar.legend.windUnit",
        stops: [
          { offset: 0,    color: "hsl(195, 90%, 65%)" },
          { offset: 0.25, color: "hsl(170, 90%, 65%)" },
          { offset: 0.5,  color: "hsl(120, 90%, 65%)" },
          { offset: 0.75, color: "hsl(45, 90%, 65%)" },
          { offset: 1,    color: "hsl(0, 90%, 65%)" },
        ],
        ticks: [
          { offset: 0,    label: "radar.legend.calm" },
          { offset: 0.4,  label: "radar.legend.breeze" },
          { offset: 0.75, label: "radar.legend.gale" },
          { offset: 1,    label: "radar.legend.storm" },
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
      const u = sample(grid.windU, grid.size, fx, fy);
      const v = sample(grid.windV, grid.size, fx, fy);
      if (!Number.isFinite(u) || !Number.isFinite(v)) return null;
      const windSpeed = Math.hypot(u, v);
      const bearingTo = (Math.atan2(u, v) * 180) / Math.PI;
      const windDir = (bearingTo + 180 + 360) % 360;
      return { windSpeed, windDir };
    },
  };
}
