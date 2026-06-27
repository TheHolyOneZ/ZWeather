

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import type { Location } from "@/types/location";
import { useQueryClient } from "@tanstack/react-query";
import type { CurrentWeather } from "@/types/weather";
import { useSettingsStore } from "@/store/settingsStore";
import { convertTemp, tempUnitSymbol } from "@/lib/units";
import { LayerSwitcher } from "@/components/map/LayerSwitcher";
import { MapTimeline } from "@/components/map/MapTimeline";
import { MapLegend } from "@/components/map/MapLegend";
import { PlaceSpotlight } from "@/components/map/PlaceSpotlight";
import { HoverReadout } from "@/components/map/HoverReadout";
import { createPrecipLayer } from "@/lib/mapLayers/precip";
import { createCloudsLayer } from "@/lib/mapLayers/clouds";
import { createWindLayer } from "@/lib/mapLayers/wind";
import { createTemperatureLayer } from "@/lib/mapLayers/temperature";
import type { Frame, LayerId, WeatherLayer } from "@/lib/mapLayers/types";

interface MapViewProps {
  locations: Location[];
  activeLocationId: string | null;
  onClose: () => void;
}

const FRAME_INTERVAL_MS = 700;

function buildLayer(id: LayerId): WeatherLayer {
  switch (id) {
    case "precip":      return createPrecipLayer();
    case "clouds":      return createCloudsLayer();
    case "wind":        return createWindLayer();
    case "temperature": return createTemperatureLayer();
  }
}

export function MapView({ locations, activeLocationId, onClose }: MapViewProps) {
  const { t } = useTranslation();
  const tempUnit = useSettingsStore((s) => s.settings.temp_unit);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<WeatherLayer | null>(null);
  const queryClient = useQueryClient();

  const [activeLayerId, setActiveLayerId] = useState<LayerId>("precip");
  const [activeLayer, setActiveLayer] = useState<WeatherLayer | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [layerReady, setLayerReady] = useState(false);
  const [layerLoaded, setLayerLoaded] = useState(0);
  const [layerTotal, setLayerTotal] = useState(0);
  const [currentLegend, setCurrentLegend] = useState(() => createPrecipLayer().getLegend());


  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const active = locations.find((l) => l.id === activeLocationId) ?? locations[0];
    const center: [number, number] = active ? [active.latitude, active.longitude] : [40, 0];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 6,


      minZoom: 4,
      maxZoom: 11,
      zoomControl: false,
      attributionControl: false,


      worldCopyJump: false,
    });

    L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png", {
      minZoom: 3,
      maxZoom: 11,
      subdomains: "abcd",
      attribution: "© OpenStreetMap, © CartoDB",
    }).addTo(map);


    L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_only_labels/{z}/{x}/{y}.png", {
      minZoom: 3,
      maxZoom: 11,
      subdomains: "abcd",
      pane: "shadowPane",
      opacity: 0.85,
    }).addTo(map);


    locations.forEach((loc) => {
      const cached = queryClient.getQueryData<CurrentWeather>(["weather", "current", loc.id]);
      const tempStr = cached
        ? `${Math.round(convertTemp(cached.temperature, tempUnit))}${tempUnitSymbol(tempUnit)}`
        : "—";
      const isActive = loc.id === activeLocationId;
      const shortName = loc.name.split(",")[0].trim();
      const dotColor = isActive ? "#a78bfa" : "#7dd3fc";

      const pinHtml = `
        <div style="position:relative;width:28px;height:28px;">
          <div style="
            position:absolute;inset:0;
            border-radius:50%;
            background:radial-gradient(circle, ${dotColor}55 0%, ${dotColor}00 65%);
            ${isActive ? "animation: zw-pulse 2.2s ease-in-out infinite;" : ""}
          "></div>
          <div style="
            position:absolute;top:50%;left:50%;
            width:10px;height:10px;
            transform:translate(-50%,-50%);
            border-radius:50%;
            background:${dotColor};
            box-shadow:0 0 0 2px rgba(10,10,16,0.85), 0 2px 6px rgba(0,0,0,0.5);
          "></div>
        </div>`;

      const pinIcon = L.divIcon({
        html: pinHtml,
        className: "zw-pin",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: pinIcon }).addTo(map);

      const labelHtml = `
        <span style="opacity:0.85;font-weight:600;">${escapeHtml(shortName)}</span>
        <span style="margin-left:6px;color:${dotColor};font-variant-numeric:tabular-nums;font-weight:700;">${tempStr}</span>`;

      marker.bindTooltip(labelHtml, {
        permanent: isActive,
        direction: "right",
        offset: [12, 0],
        className: `zw-label${isActive ? " zw-label-active" : ""}`,
      });
    });

    mapRef.current = map;


    const invalidateTimers = [120, 320].map((ms) =>
      window.setTimeout(() => map.invalidateSize({ animate: false }), ms),
    );

    return () => {
      invalidateTimers.forEach((id) => window.clearTimeout(id));
      layerRef.current?.unmount();
      layerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [locations, activeLocationId, queryClient, tempUnit]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;


    layerRef.current?.unmount();
    setFrames([]);
    setFrameIdx(0);
    setPlaying(false);
    setLayerReady(false);
    setLayerLoaded(0);
    setLayerTotal(0);

    const layer = buildLayer(activeLayerId);
    layerRef.current = layer;
    setActiveLayer(layer);
    setCurrentLegend(layer.getLegend());

    const offReady = layer.onReadyChange?.((s) => {
      setLayerReady(s.ready);
      setLayerLoaded(s.loaded);
      setLayerTotal(s.total);
    });
    const offFrames = layer.onFramesChange?.((f) => {
      setFrames(f);
      if (f.length > 0) {

        const nowSec = Math.floor(Date.now() / 1000);
        let idx = 0;
        for (let i = 0; i < f.length; i++) if (f[i].time <= nowSec) idx = i;
        setFrameIdx(idx);
      }
    });

    layer.mount(map);

    return () => {
      offReady?.();
      offFrames?.();
    };
  }, [activeLayerId]);


  useEffect(() => {
    layerRef.current?.setFrame?.(frameIdx);
  }, [frameIdx]);


  useEffect(() => {
    if (!playing || frames.length === 0 || !layerReady) return;
    const id = window.setInterval(() => {
      setFrameIdx((i) => (i + 1) % frames.length);
    }, FRAME_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, frames.length, layerReady]);


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (frames.length === 0) return;
      if (e.key === "ArrowLeft") {
        setPlaying(false);
        setFrameIdx((i) => (i - 1 + frames.length) % frames.length);
      } else if (e.key === "ArrowRight") {
        setPlaying(false);
        setFrameIdx((i) => (i + 1) % frames.length);
      } else if (e.key === " ") {
        e.preventDefault();
        if (layerReady) setPlaying((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, frames.length, layerReady]);

  const setFrameIdxStable = useCallback((i: number) => setFrameIdx(i), []);
  const setPlayingStable = useCallback((p: boolean) => setPlaying(p), []);

  const activeLocation = locations.find((l) => l.id === activeLocationId);
  const utcOffset = activeLocation
    ? queryClient.getQueryData<CurrentWeather>(["weather", "current", activeLocation.id])?.utc_offset_seconds ?? 0
    : 0;

  const hasFrames = frames.length > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        className="absolute inset-4 rounded-2xl overflow-hidden flex flex-col bg-[#0a0a10] border border-white/[0.08]"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >

        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-white/[0.08] flex items-center justify-center">
              <RadarGlyph />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white/95 leading-tight">{t("radar.title")}</p>
              <p className="text-[11px] text-white/45 leading-tight mt-0.5">
                {activeLocation?.name ?? "—"} · {t("radar.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-white/45 hover:text-white/85 hover:bg-white/[0.06] transition-colors"
            title={t("radar.close")}
          >
            <X size={15} />
          </button>
        </div>


        <div className="flex-1 relative" style={{ background: "#0a0a10" }}>
          <div ref={mapContainerRef} className="absolute inset-0" />

          {activeLocation && <PlaceSpotlight location={activeLocation} />}
          <LayerSwitcher active={activeLayerId} onChange={setActiveLayerId} />
          <HoverReadout map={mapRef.current} layer={activeLayer} />

          {!layerReady && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
              <div className="rounded-full px-3 py-1.5 bg-black/70 border border-white/[0.08] backdrop-blur-md shadow-lg flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-white/25 border-t-violet-400 animate-spin" />
                <span className="text-[11px] font-medium text-white/80 tabular-nums">
                  {t("radar.loading")}
                  {layerTotal > 1 ? ` ${layerLoaded}/${layerTotal}` : ""}
                </span>
              </div>
            </div>
          )}

          <MapLegend legend={currentLegend} />


          <div
            className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(10,10,16,0), rgba(10,10,16,0.6))" }}
          />
        </div>


        {hasFrames && (
          <MapTimeline
            frames={frames}
            frameIdx={frameIdx}
            setFrameIdx={setFrameIdxStable}
            playing={playing}
            setPlaying={setPlayingStable}
            ready={layerReady}
            utcOffsetSeconds={utcOffset}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

function RadarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.2"  stroke="rgba(167,139,250,0.30)" strokeWidth="1"   />
      <circle cx="8" cy="8" r="3.6"  stroke="rgba(167,139,250,0.55)" strokeWidth="1"   />
      <circle cx="8" cy="8" r="1.5"  fill="#a78bfa" />
      <path d="M8 8 L12.4 4.6"        stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
