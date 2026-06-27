import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface CinematicIntroProps {
  onComplete: () => void;
}


export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const { t } = useTranslation();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), 650),
      window.setTimeout(() => setStage(2), 1900),
      window.setTimeout(() => setStage(3), 3300),
      window.setTimeout(() => setStage(4), 4600),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") onComplete();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden cursor-pointer select-none"
      style={{ background: "#000" }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onClick={onComplete}
    >

      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{
          opacity: stage >= 1 ? 1 : 0,
          scale: stage >= 1 ? 1 : 0.85,
        }}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(139, 92, 246, 0.32), transparent 65%)," +
            "radial-gradient(ellipse 55% 45% at 28% 72%, rgba(56, 189, 248, 0.22), transparent 65%)," +
            "radial-gradient(ellipse 65% 45% at 72% 30%, rgba(244, 114, 182, 0.18), transparent 65%)",
          filter: "blur(40px)",
        }}
      />


      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          top: "50%",
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.55), transparent)",
          boxShadow: "0 0 22px 4px rgba(255,255,255,0.18)",
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{
          opacity: stage >= 1 && stage < 3 ? 1 : 0,
          scaleX: stage >= 1 ? 1 : 0,
        }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />


      {stage >= 3 && (
        <div className="absolute inset-0 pointer-events-none">
          {PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: "rgba(255,255,255,0.35)",
                filter: "blur(0.5px)",
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.7, 0], y: -40 }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}


      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.05, opacity: 0, filter: "blur(20px)" }}
          animate={{
            scale: stage >= 2 ? 1 : stage >= 1 ? 1.6 : 0.05,
            opacity: stage >= 1 ? 1 : 0,
            y: stage >= 2 ? -32 : 0,
            filter: stage >= 1 ? "blur(0px)" : "blur(20px)",
          }}
          transition={{ type: "spring", stiffness: 70, damping: 18, mass: 1.3 }}
          style={{ transformOrigin: "center" }}
        >
          <IntroScene size={stage >= 2 ? 150 : 220} />
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{
            opacity: stage >= 2 ? 1 : 0,
            y: stage >= 2 ? 0 : 24,
            filter: stage >= 2 ? "blur(0px)" : "blur(8px)",
          }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="text-[64px] font-extralight tracking-[-0.045em] text-white leading-none"
            style={{
              fontFamily: "system-ui, -apple-system, 'SF Pro Display', sans-serif",
              textShadow: "0 0 40px rgba(139,92,246,0.45)",
            }}
          >
            ZWeather
          </p>
        </motion.div>


        <motion.div
          className="h-px mt-4"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: stage >= 2 ? 96 : 0, opacity: stage >= 2 ? 1 : 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(167,139,250,0.85), transparent)",
          }}
        />

        <motion.p
          className="text-[13px] font-light text-white/55 mt-5 tracking-[0.18em] uppercase"
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: stage >= 3 ? 1 : 0,
            y: stage >= 3 ? 0 : 8,
          }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {t("intro.tagline")}
        </motion.p>
      </div>


      <motion.p
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-white/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 4 ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {t("intro.skipHint")}
      </motion.p>


      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </motion.div>
  );
}


function IntroScene({ size }: { size: number }) {
  const rays = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id="zw-sun-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#fef3c7" />
          <stop offset="55%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="zw-halo-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(251,191,36,0.55)" />
          <stop offset="60%"  stopColor="rgba(251,191,36,0.12)" />
          <stop offset="100%" stopColor="rgba(251,191,36,0)" />
        </radialGradient>
        <linearGradient id="zw-cloud-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>


      <motion.circle
        cx="58" cy="48" r="40"
        fill="url(#zw-halo-grad)"
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.12, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "58px 48px", transformBox: "fill-box" }}
      />


      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "58px 48px", transformBox: "fill-box" }}
      >
        {rays.map((deg, i) => {
          const long = i % 2 === 0;
          return (
            <line
              key={deg}
              x1="58" y1={long ? 22 : 26}
              x2="58" y2={long ? 16 : 21}
              stroke="#fcd34d"
              strokeWidth={long ? 1.6 : 1.1}
              strokeLinecap="round"
              opacity={long ? 0.95 : 0.65}
              transform={`rotate(${deg} 58 48)`}
            />
          );
        })}
      </motion.g>


      <motion.g
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "58px 48px", transformBox: "fill-box" }}
      >
        <circle cx="58" cy="48" r="15" fill="url(#zw-sun-grad)" />
        <circle cx="54" cy="44" r="4" fill="rgba(255,255,255,0.55)" />
      </motion.g>


      <motion.g
        animate={{ x: [-3.5, 3.5, -3.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M30 84
             Q30 72 42 72
             Q44 62 56 64
             Q66 58 74 68
             Q88 68 88 82
             Q88 92 78 92
             L38 92
             Q30 92 30 84 Z"
          fill="url(#zw-cloud-grad)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.6"
          style={{ filter: "drop-shadow(0 4px 12px rgba(15,23,42,0.45))" }}
        />
      </motion.g>
    </svg>
  );
}

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 73) % 100,
  y: 55 + ((i * 37) % 40),
  size: 1 + (i % 3),
  dur: 3.5 + ((i * 0.4) % 2.5),
  delay: (i * 0.27) % 3,
}));
