

import L from "leaflet";
import type { BBox } from "@/lib/openMeteoGrid";

export function createOverlayCanvas(map: L.Map, zIndex: number): HTMLCanvasElement {
  const canvas = L.DomUtil.create("canvas") as HTMLCanvasElement;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = String(zIndex);
  map.getContainer().appendChild(canvas);
  return canvas;
}

export function sizeOverlayCanvas(canvas: HTMLCanvasElement, map: L.Map) {
  const size = map.getSize();
  canvas.width = size.x;
  canvas.height = size.y;
  canvas.style.width = `${size.x}px`;
  canvas.style.height = `${size.y}px`;
}


export function safeBounds(map: L.Map): BBox {
  const b = map.getBounds();
  return {
    south: Math.max(-85, b.getSouth()),
    north: Math.min(85, b.getNorth()),
    west: Math.max(-180, b.getWest()),
    east: Math.min(180, b.getEast()),
  };
}
