import { GlassCard } from "@/components/ui/GlassCard";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { getMoonPhase } from "@/lib/moon";

const CRATERS = [
  { cx: 38, cy: 32, r: 4.2, op: 0.55, soft: true },
  { cx: 52, cy: 39, r: 3.0, op: 0.42 },
  { cx: 42, cy: 52, r: 5.1, op: 0.50, soft: true },
  { cx: 58, cy: 56, r: 3.2, op: 0.38 },
  { cx: 31, cy: 45, r: 2.4, op: 0.45 },
  { cx: 48, cy: 64, r: 2.0, op: 0.38 },
  { cx: 55, cy: 30, r: 1.6, op: 0.36 },
  { cx: 34, cy: 60, r: 2.2, op: 0.36 },
  { cx: 62, cy: 43, r: 1.8, op: 0.32 },
  { cx: 28, cy: 38, r: 1.2, op: 0.30 },
  { cx: 65, cy: 50, r: 1.0, op: 0.28 },
  { cx: 44, cy: 26, r: 1.4, op: 0.30 },
  { cx: 50, cy: 48, r: 1.1, op: 0.26 },
  { cx: 37, cy: 41, r: 0.9, op: 0.30 },
  { cx: 60, cy: 64, r: 1.3, op: 0.32 },
  { cx: 33, cy: 52, r: 0.8, op: 0.26 },
  { cx: 46, cy: 36, r: 0.7, op: 0.24 },
  { cx: 56, cy: 47, r: 0.9, op: 0.26 },
];

const STARS = [
  { cx: 6, cy: 12, r: 0.6, op: 0.7 },
  { cx: 84, cy: 18, r: 0.5, op: 0.55 },
  { cx: 12, cy: 78, r: 0.7, op: 0.8 },
  { cx: 78, cy: 82, r: 0.5, op: 0.6 },
  { cx: 88, cy: 50, r: 0.4, op: 0.5 },
  { cx: 4, cy: 48, r: 0.5, op: 0.65 },
  { cx: 70, cy: 8, r: 0.4, op: 0.5 },
  { cx: 20, cy: 6, r: 0.5, op: 0.6 },
];

function MoonSVG({ phase }: { phase: number }) {
  const size = 72;
  const vb = 90;
  const r = 26;
  const cx = vb / 2;
  const cy = vb / 2;

  const isWaxing = phase < 0.5;
  const normalized = phase <= 0.5 ? phase * 2 : (phase - 0.5) * 2;
  const ex = r * Math.cos(normalized * Math.PI);
  const sweep = isWaxing ? 0 : 1;
  const innerSweep = phase < 0.25 || phase > 0.75 ? 0 : 1;
  const isNew = phase <= 0.03 || phase >= 0.97;
  const isFull = phase >= 0.47 && phase <= 0.53;

  const litPath = `
    M ${cx} ${cy - r}
    A ${r} ${r} 0 0 ${isWaxing ? 1 : 0} ${cx} ${cy + r}
    A ${Math.abs(ex)} ${r} 0 ${sweep} ${innerSweep} ${cx} ${cy - r}
    Z
  `;

  return (
    <motion.div
      animate={{ y: [0, -2.2, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: size }}
      className="shrink-0"
    >
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${vb} ${vb}`}
        animate={{ rotate: [-0.9, 0.9, -0.9] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <radialGradient id="moonBody" cx="38%" cy="32%" r="78%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="35%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#a8b0bd" />
            <stop offset="100%" stopColor="#6b7280" />
          </radialGradient>
          <radialGradient id="moonRim" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0.55)" />
          </radialGradient>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(186,200,230,0.30)" />
            <stop offset="50%" stopColor="rgba(186,200,230,0.10)" />
            <stop offset="100%" stopColor="rgba(186,200,230,0)" />
          </radialGradient>
          <radialGradient id="moonHighlight" cx="32%" cy="28%" r="35%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id="darkBody" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0b1220" />
          </radialGradient>
          <radialGradient id="craterShade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(40,38,48,0.85)" />
            <stop offset="60%" stopColor="rgba(80,78,90,0.55)" />
            <stop offset="100%" stopColor="rgba(120,118,130,0)" />
          </radialGradient>
          <radialGradient id="craterDark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(20,18,28,0.95)" />
            <stop offset="100%" stopColor="rgba(70,68,80,0)" />
          </radialGradient>

          <filter id="terminatorBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.35" />
          </filter>

          <filter id="surfaceTexture" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>

          {!isNew && !isFull && (
            <clipPath id="litClip">
              <path d={litPath} />
            </clipPath>
          )}
          <clipPath id="moonClip">
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>


        {STARS.map((s, i) => (
          <motion.circle
            key={`star-${i}`}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="#e0e7ff"
            animate={{ opacity: [s.op * 0.4, s.op, s.op * 0.4] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          />
        ))}


        <motion.circle
          cx={cx}
          cy={cy}
          r={38}
          fill="url(#moonGlow)"
          animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.04, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />


        <circle cx={cx} cy={cy} r={r} fill="url(#darkBody)" />


        {isFull && (
          <g>
            <circle cx={cx} cy={cy} r={r} fill="url(#moonBody)" />
            <g clipPath="url(#moonClip)">
              <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} filter="url(#surfaceTexture)" />
              {CRATERS.map((c, i) => (
                <g key={i}>
                  <circle cx={c.cx} cy={c.cy} r={c.r} fill={c.soft ? "url(#craterShade)" : "url(#craterDark)"} opacity={c.op} />
                  <circle cx={c.cx - c.r * 0.25} cy={c.cy - c.r * 0.25} r={c.r * 0.6} fill="rgba(255,255,255,0.08)" />
                </g>
              ))}
              <circle cx={cx} cy={cy} r={r} fill="url(#moonHighlight)" />
              <circle cx={cx} cy={cy} r={r} fill="url(#moonRim)" />
            </g>
          </g>
        )}


        {!isNew && !isFull && (
          <>
            <g clipPath="url(#litClip)" filter="url(#terminatorBlur)">
              <circle cx={cx} cy={cy} r={r} fill="url(#moonBody)" />
              <g clipPath="url(#moonClip)">
                <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} filter="url(#surfaceTexture)" />
                {CRATERS.map((c, i) => (
                  <g key={i}>
                    <circle cx={c.cx} cy={c.cy} r={c.r} fill={c.soft ? "url(#craterShade)" : "url(#craterDark)"} opacity={c.op} />
                    <circle cx={c.cx - c.r * 0.25} cy={c.cy - c.r * 0.25} r={c.r * 0.6} fill="rgba(255,255,255,0.08)" />
                  </g>
                ))}
                <circle cx={cx} cy={cy} r={r} fill="url(#moonHighlight)" />
              </g>
            </g>
            <circle cx={cx} cy={cy} r={r} fill="url(#moonRim)" />
          </>
        )}


        {!isFull && !isNew && (
          <g clipPath="url(#moonClip)">
            <circle cx={cx} cy={cy} r={r} fill="rgba(99,120,160,0.06)" />
          </g>
        )}


        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
      </motion.svg>
    </motion.div>
  );
}

interface MoonCardProps {
  onClick?: () => void;
}

export function MoonCard({ onClick }: MoonCardProps = {}) {
  const { t } = useTranslation();
  const moon = getMoonPhase(new Date());

  return (
    <GlassCard
      className={`p-3 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <MoonSVG phase={moon.phase} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-white/55 uppercase tracking-widest">{t("sections.moon")}</p>
          <p className="text-[14px] font-medium text-white/90 leading-tight mt-0.5">{t(moon.labelKey)}</p>
          <p className="text-[11px] text-white/55 leading-tight mt-0.5">{t("moon.illuminated", { pct: moon.illumination })}</p>
          {onClick && (
            <p className="text-[10px] text-white/35 leading-tight mt-1">{t("moon.tapForDetails")}</p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
