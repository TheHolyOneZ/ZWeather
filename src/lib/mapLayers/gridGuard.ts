

import type L from "leaflet";
import type { BBox, GridSample } from "@/lib/openMeteoGrid";


export function viewportInsideGrid(view: BBox, grid: BBox, marginFrac = 0.0): boolean {
  const dLat = (grid.north - grid.south) * marginFrac;
  const dLon = (grid.east - grid.west) * marginFrac;
  return (
    view.south >= grid.south - dLat &&
    view.north <= grid.north + dLat &&
    view.west >= grid.west - dLon &&
    view.east <= grid.east + dLon
  );
}


export function createRefetchController(
  run: () => Promise<void>,
  opts: { debounceMs: number; urgentMs?: number } = { debounceMs: 1200, urgentMs: 60 },
) {
  const urgentMs = opts.urgentMs ?? 60;
  let timer: number | null = null;
  let inFlight = false;
  let pending = false;
  let pendingUrgent = false;
  let cancelled = false;

  function clearTimer() {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function fire() {
    timer = null;
    if (cancelled) return;
    if (inFlight) {

      pending = true;
      return;
    }
    inFlight = true;
    pending = false;
    pendingUrgent = false;
    Promise.resolve()
      .then(run)
      .catch(() => {})
      .finally(() => {
        inFlight = false;
        if (cancelled) return;
        if (pending) {
          pending = false;

          const ms = pendingUrgent ? urgentMs : opts.debounceMs;
          pendingUrgent = false;
          schedule(ms);
        }
      });
  }

  function schedule(ms: number) {
    if (cancelled) return;
    if (inFlight) {
      pending = true;
      if (ms <= urgentMs) pendingUrgent = true;
      return;
    }
    clearTimer();
    timer = window.setTimeout(fire, ms);
  }

  return {
    scheduleNormal() {
      schedule(opts.debounceMs);
    },
    scheduleUrgent() {
      schedule(urgentMs);
    },
    cancel() {
      cancelled = true;
      clearTimer();
      pending = false;
    },
  };
}


export function safeContainerToLatLng(map: L.Map, px: number, py: number): { lat: number; lng: number } | null {
  try {
    const ll = map.containerPointToLatLng([px, py]);
    if (!Number.isFinite(ll.lat) || !Number.isFinite(ll.lng)) return null;
    return { lat: ll.lat, lng: ll.lng };
  } catch {
    return null;
  }
}


export function viewEscapedGrid(view: BBox, grid: GridSample | null): boolean {
  if (!grid) return false;
  return !viewportInsideGrid(view, grid.bbox);
}
