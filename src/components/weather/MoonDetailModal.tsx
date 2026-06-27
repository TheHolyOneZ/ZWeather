import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BreathingMoon } from "./RealisticMoon";
import {
  formatDistance,
  getMoonGeometry,
  getMoonPhase,
  moonRiseSet,
  moonZodiac,
  upcomingPhases,
} from "@/lib/moon";
import { formatTimeAt, formatDateLineAt } from "@/lib/time";

interface MoonDetailModalProps {
  latitude: number;
  longitude: number;
  utcOffsetSeconds: number;
  timeFormat: "24h" | "12h";
  locale: string;
  onClose: () => void;
}

const PHASE_EMOJI: Record<string, string> = {
  new: "🌑",
  firstQ: "🌓",
  full: "🌕",
  lastQ: "🌗",
};

export function MoonDetailModal({
  latitude,
  longitude,
  utcOffsetSeconds,
  timeFormat,
  locale,
  onClose,
}: MoonDetailModalProps) {
  const { t } = useTranslation();


  const { phase, illumination, ageDays, labelKey } = useMemo(() => getMoonPhase(new Date()), []);
  const geom = useMemo(() => getMoonGeometry(new Date()), []);
  const riseSet = useMemo(
    () => moonRiseSet(new Date(), latitude, longitude),
    [latitude, longitude],
  );
  const phases = useMemo(() => upcomingPhases(new Date(), 4), []);
  const zodiac = useMemo(() => moonZodiac(new Date()), []);


  const libration = Math.sin(ageDays / 27.3 * Math.PI * 2) * 4;
  const apparentScale = 0.94 + 0.12 * (1 - geom.perigeeApogeeT);

  const perigeeApogeeLabel =
    geom.perigeeApogeeT < 0.25
      ? t("moon.nearPerigee")
      : geom.perigeeApogeeT > 0.75
        ? t("moon.nearApogee")
        : t("moon.midRange");

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        className="relative glass-popover rounded-2xl w-full max-w-3xl max-h-[88vh] mx-4 flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >

        <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
          <div>
            <p className="text-[11px] text-white/45 uppercase tracking-widest">
              {t("sections.moon")}
            </p>
            <p className="text-[20px] font-semibold text-white/95 leading-tight mt-1">
              {t(labelKey)}
            </p>
            <p className="text-[13px] text-white/55 mt-0.5">
              {formatDateLineAt(Date.now() / 1000, utcOffsetSeconds, locale)}
            </p>
          </div>
          <button
            onClick={onClose}
            title={t("dayDetail.close")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
        </div>


        <div className="overflow-y-auto px-5 py-5 flex flex-col gap-5">

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative shrink-0">

              <div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(255,250,225,0.10), rgba(0,0,0,0) 70%)",
                }}
              />
              <BreathingMoon
                phase={phase}
                size={280}
                librationDeg={libration}
                apparentScale={apparentScale}
              />
            </div>

            <div className="flex-1 w-full flex flex-col gap-3">
              <Stat
                big
                label={t("moon.illuminationLabel")}
                value={`${illumination}%`}
                hint={t(labelKey)}
              />
              <Stat
                big
                label={t("moon.ageLabel")}
                value={t("moon.daysShort", { n: ageDays.toFixed(1) })}
                hint={t("moon.ageHint")}
              />
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label={t("moon.distanceLabel")}
                  value={`${formatDistance(geom.distance)} km`}
                  hint={perigeeApogeeLabel}
                />
                <Stat
                  label={t("moon.angularDiameter")}
                  value={`${geom.angularDiameterArcmin.toFixed(2)}′`}
                  hint={t("moon.arcminutes")}
                />
              </div>
            </div>
          </div>


          <div>
            <p className="text-[11px] text-white/55 uppercase tracking-widest mb-2">
              {t("moon.orbit")}
            </p>
            <div className="relative h-2 rounded-full overflow-hidden bg-white/[0.05]">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, rgba(244,180,80,0.6), rgba(120,140,180,0.45) 50%, rgba(80,100,160,0.6))",
                }}
              />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#0c1018] shadow"
                initial={{ left: "50%" }}
                animate={{ left: `${geom.perigeeApogeeT * 100}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 20 }}
                style={{ transform: "translate(-50%, -50%)" }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-white/50 uppercase tracking-wider">
              <span>{t("moon.perigee")} · {formatDistance(356500)} km</span>
              <span>{t("moon.apogee")} · {formatDistance(406700)} km</span>
            </div>
          </div>


          <div>
            <p className="text-[11px] text-white/55 uppercase tracking-widest mb-2">
              {t("moon.visibilityToday")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <TimeStat
                label={t("moon.moonrise")}
                time={riseSet.rise}
                utcOffsetSeconds={utcOffsetSeconds}
                timeFormat={timeFormat}
                color="#f5d28a"
              />
              <TimeStat
                label={t("moon.transit")}
                time={riseSet.transit}
                utcOffsetSeconds={utcOffsetSeconds}
                timeFormat={timeFormat}
                color="#e8e4d0"
              />
              <TimeStat
                label={t("moon.moonset")}
                time={riseSet.set}
                utcOffsetSeconds={utcOffsetSeconds}
                timeFormat={timeFormat}
                color="#9aa8c8"
              />
            </div>
          </div>


          <div>
            <p className="text-[11px] text-white/55 uppercase tracking-widest mb-2">
              {t("moon.upcoming")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {phases.map((p, i) => {
                const daysFromNow = Math.max(0, (p.time - Date.now() / 1000) / 86400);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div
                      className="text-[22px] leading-none"
                      style={{ filter: "drop-shadow(0 0 6px rgba(255,240,200,0.25))" }}
                    >
                      {PHASE_EMOJI[p.kind]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/90 font-medium">{t(p.labelKey)}</p>
                      <p className="text-[11px] text-white/50">
                        {formatDateLineAt(p.time, utcOffsetSeconds, locale)}
                      </p>
                    </div>
                    <span className="text-[11px] text-white/55 tabular-nums shrink-0">
                      {daysFromNow < 1
                        ? t("moon.today")
                        : t("moon.inDays", { n: Math.round(daysFromNow) })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>


          <div className="flex items-center gap-4 rounded-xl px-4 py-3 bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[28px] leading-none" style={{ color: "#e8d6a0" }}>
              {zodiac.symbol}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/45 uppercase tracking-widest">
                {t("moon.constellation")}
              </p>
              <p className="text-[14px] text-white/90 font-medium leading-tight mt-0.5">
                {t(`zodiac.${zodiac.signKey}`)}
              </p>
              <p className="text-[11px] text-white/45 mt-0.5">
                {t("moon.eclipticLongitude")}: {zodiac.lon.toFixed(1)}°
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  hint,
  big = false,
}: {
  label: string;
  value: string;
  hint?: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl px-3 py-2.5 bg-white/[0.03] border border-white/[0.06]">
      <p className="text-[10px] text-white/45 uppercase tracking-widest">{label}</p>
      <p
        className={`tabular-nums font-semibold text-white/95 leading-none mt-1 ${
          big ? "text-[22px]" : "text-[16px]"
        }`}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-white/50 mt-1">{hint}</p>}
    </div>
  );
}

function TimeStat({
  label,
  time,
  utcOffsetSeconds,
  timeFormat,
  color,
}: {
  label: string;
  time: number | undefined;
  utcOffsetSeconds: number;
  timeFormat: "24h" | "12h";
  color: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl px-3 py-2.5 bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <p className="text-[10px] text-white/45 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-[16px] tabular-nums font-semibold text-white/95 leading-none mt-1.5">
        {time !== undefined
          ? formatTimeAt(time, utcOffsetSeconds, { format: timeFormat })
          : t("moon.notVisible")}
      </p>
    </div>
  );
}
