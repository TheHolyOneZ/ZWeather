import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatTimeAt } from "@/lib/time";
import { useSettingsStore } from "@/store/settingsStore";
import type { Frame } from "@/lib/mapLayers/types";

interface Props {
  frames: Frame[];
  frameIdx: number;
  setFrameIdx: (i: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  ready: boolean;
  utcOffsetSeconds: number;
}

export function MapTimeline({
  frames,
  frameIdx,
  setFrameIdx,
  playing,
  setPlaying,
  ready,
  utcOffsetSeconds,
}: Props) {
  const { t } = useTranslation();
  const timeFormat = useSettingsStore((s) => s.settings.time_format);

  const nowSec = Math.floor(Date.now() / 1000);
  const currentFrame = frames[frameIdx];
  const relativeMin = currentFrame ? Math.round((currentFrame.time - nowSec) / 60) : 0;
  const relativeLabel = !currentFrame
    ? "—"
    : Math.abs(relativeMin) < 5
    ? t("radar.now")
    : relativeMin > 0
    ? `+${relativeMin}m`
    : `${relativeMin}m`;

  const absoluteLabel = currentFrame
    ? formatTimeAt(currentFrame.time, utcOffsetSeconds, { format: timeFormat })
    : "—";

  const step = (dir: 1 | -1) => {
    setPlaying(false);
    setFrameIdx((frameIdx + dir + frames.length) % frames.length);
  };

  return (
    <div className="shrink-0 px-4 pt-3 pb-4 z-10">
      <div className="rounded-xl bg-black/65 border border-white/[0.08] backdrop-blur-md shadow-lg px-3 py-2.5 flex items-center gap-2">
        <button
          onClick={() => step(-1)}
          className="w-8 h-8 rounded-md flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
          title={t("radar.previous")}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={() => setPlaying(!playing)}
          disabled={!ready}
          className="w-9 h-8 rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 hover:brightness-110 disabled:from-white/[0.10] disabled:to-white/[0.10] disabled:hover:brightness-100 disabled:cursor-wait flex items-center justify-center text-white transition-all shadow-[0_2px_10px_rgba(124,58,237,0.35)] disabled:shadow-none"
          title={!ready ? t("radar.loading") : playing ? t("radar.pause") : t("radar.play")}
        >
          {!ready ? (
            <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white/85 animate-spin" />
          ) : playing ? (
            <Pause size={13} fill="currentColor" />
          ) : (
            <Play size={13} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <button
          onClick={() => step(1)}
          className="w-8 h-8 rounded-md flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
          title={t("radar.next")}
        >
          <ChevronRight size={15} />
        </button>


        <div className="flex-1 mx-2 relative h-7 flex items-center">
          <div className="absolute inset-x-0 h-px bg-white/[0.10]" />
          <div className="absolute inset-x-0 flex justify-between items-center">
            {frames.map((f, i) => {
              const isNow = Math.abs(f.time - nowSec) < 300;
              const isPast = f.time < nowSec;
              const tickTime = formatTimeAt(f.time, utcOffsetSeconds, { format: timeFormat });
              return (
                <button
                  key={f.time}
                  onClick={() => {
                    setPlaying(false);
                    setFrameIdx(i);
                  }}
                  className="group flex-1 h-7 flex items-center justify-center relative"
                  title={tickTime}
                >
                  <span
                    className="block rounded-full transition-all"
                    style={{
                      width: i === frameIdx ? 9 : isNow ? 5 : 3,
                      height: i === frameIdx ? 9 : isNow ? 5 : 3,
                      background:
                        i === frameIdx
                          ? "#a78bfa"
                          : isNow
                          ? "rgba(186,230,253,0.85)"
                          : isPast
                          ? "rgba(255,255,255,0.35)"
                          : "rgba(186,230,253,0.35)",
                      boxShadow: i === frameIdx ? "0 0 0 3px rgba(167,139,250,0.18)" : undefined,
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>


        <div className="shrink-0 text-right tabular-nums pl-2 border-l border-white/[0.06] ml-1 py-0.5 pr-1 min-w-[78px]">
          <p className="text-[9px] text-white/40 uppercase tracking-wider leading-none">
            {currentFrame && currentFrame.time < nowSec
              ? t("radar.past")
              : currentFrame && currentFrame.time > nowSec + 60
              ? t("radar.forecast")
              : t("radar.live")}
          </p>
          <p className="text-[13px] font-semibold text-white/95 leading-tight mt-1">{absoluteLabel}</p>
          <p className="text-[9px] text-white/40 leading-tight mt-0.5">{relativeLabel}</p>
        </div>
      </div>
    </div>
  );
}
