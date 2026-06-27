

import { useEffect, useReducer, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { recordComplete, recordSkip } from "@/lib/introPreference";

interface CinematicIntroProps {
  onFinish: () => void;
}

type Phase = "playing" | "dissolving" | "done";

export function CinematicIntro({ onFinish }: CinematicIntroProps) {
  const reduced = useReducedMotion();
  const [phase, dispatch] = useReducer(
    (s: Phase, a: Phase) => (s === "done" ? s : a),
    "playing",
  );
  const startedAt = useRef(performance.now());
  const finished = useRef(false);

  const finish = (skipped: boolean) => {
    if (finished.current) return;
    finished.current = true;
    if (skipped) recordSkip();
    else recordComplete();
    dispatch("dissolving");
    window.setTimeout(onFinish, reduced ? 220 : 360);
  };

  useEffect(() => {
    const total = reduced ? 600 : 5000;
    const timer = window.setTimeout(() => finish(false), total);
    return () => window.clearTimeout(timer);

  }, [reduced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);

  }, []);

  const onPointerDown = () => {
    if (performance.now() - startedAt.current < 300) return;
    finish(true);
  };

  if (reduced) {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: "#0a0e1a" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "dissolving" ? 0 : 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onPointerDown={onPointerDown}
      >
        <StaticBrandComposition />
        <SkipHint visible />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[9999] overflow-hidden cursor-pointer"
      style={{ background: "#04060b" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "dissolving" ? 0 : 1 }}
      transition={{ duration: phase === "dissolving" ? 0.36 : 0.5, ease: "easeOut" }}
      onPointerDown={onPointerDown}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.02 }}
        animate={
          phase === "dissolving"
            ? { scale: 1.08, filter: "blur(8px)" }
            : { scale: [1.02, 1.0, 1.04], filter: "blur(0px)" }
        }
        transition={{
          duration: phase === "dissolving" ? 0.36 : 5,
          times: phase === "dissolving" ? undefined : [0, 0.6, 1],
          ease: "easeOut",
        }}
      >
        <SkyGradient />
        <StarField />
        <DistantMoon />
        <SunWithRays />
        <LensFlare />
        <MountainRange />
        <DustMotes />
        <Wordmark />
      </motion.div>

      <Letterbox />
      <FilmGrain />
      <SkipHint visible />
    </motion.div>
  );
}


function SkyGradient() {


  const skies = [

    "radial-gradient(ellipse 120% 80% at 50% 110%, #1a1d3a 0%, #0a0d20 50%, #04060b 100%)",

    "radial-gradient(ellipse 120% 80% at 50% 110%, #3a2550 0%, #14132e 55%, #04060b 100%)",

    "radial-gradient(ellipse 140% 85% at 50% 100%, #f48a8a 0%, #6b3a7a 35%, #1a1d3a 75%, #04060b 100%)",

    "radial-gradient(ellipse 150% 95% at 50% 95%, #ffd28a 0%, #ff7e5f 25%, #b14a7a 55%, #2e2b5a 85%, #06091a 100%)",

    "radial-gradient(ellipse 160% 100% at 50% 95%, #fff4c2 0%, #ffc174 22%, #ff8a4c 45%, #c45a8a 72%, #3d3568 95%)",

    "radial-gradient(ellipse 180% 110% at 50% 100%, #fde9c4 0%, #f5b87a 15%, #d59ab8 35%, #8aa8d8 65%, #5a7bb8 100%)",
  ];

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ background: skies[0] }}
      animate={{ background: skies }}
      transition={{
        duration: 5,
        times: [0, 0.18, 0.36, 0.56, 0.74, 1],
        ease: "easeInOut",
      }}
    />
  );
}


function StarField() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0.4, 0] }}
      transition={{ duration: 5, times: [0, 0.18, 0.34, 0.5], ease: "easeOut" }}
    >
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r,
            height: s.r,
            filter: `drop-shadow(0 0 ${s.r * 1.6}px rgba(186,230,253,0.85))`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, s.peak, s.peak * 0.35, s.peak] }}
          transition={{
            duration: s.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
        />
      ))}
    </motion.div>
  );
}

const STARS = Array.from({ length: 60 }, (_, i) => {
  const h = (i * 2654435761) >>> 0;
  const rand = (n: number) => ((h >> n) & 0xff) / 255;
  return {
    x: rand(0) * 100,
    y: rand(8) * 65,
    r: 0.8 + rand(16) * 1.6,
    peak: 0.5 + rand(0) * 0.5,
    dur: 2.4 + rand(8) * 2.6,
    delay: rand(16) * 2,
  };
});


function DistantMoon() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        top: "16%",
        left: "78%",
        width: 64,
        height: 64,
        filter: "drop-shadow(0 0 30px rgba(220,235,255,0.6))",
      }}
      initial={{ opacity: 0, y: -12 }}
      animate={{
        opacity: [0, 0.85, 0.85, 0],
        y: [-12, 0, 0, 8],
      }}
      transition={{
        duration: 5,
        times: [0, 0.12, 0.28, 0.42],
        ease: "easeOut",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <radialGradient id="ci-moon-disc" cx="40%" cy="36%" r="72%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e7eeff" />
            <stop offset="100%" stopColor="#b6c4e0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="32" fill="url(#ci-moon-disc)" />
        <circle cx="42" cy="44" r="4" fill="#c8d2e8" opacity="0.5" />
        <circle cx="58" cy="56" r="3" fill="#c8d2e8" opacity="0.4" />
        <circle cx="48" cy="60" r="2" fill="#c8d2e8" opacity="0.3" />
      </svg>
    </motion.div>
  );
}


function SunWithRays() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
      }}
      initial={{ x: -180, y: 340, opacity: 0 }}
      animate={{
        x: [-180, 60],
        y: [340, -10],
        opacity: [0, 0.4, 1, 1],
      }}
      transition={{
        duration: 5,
        x: { duration: 5, ease: [0.34, 0.05, 0.4, 1] },
        y: { duration: 5, ease: [0.34, 0.05, 0.4, 1] },
        opacity: { duration: 5, times: [0, 0.34, 0.6, 1], ease: "easeOut" },
      }}
    >


      <motion.div
        className="absolute rounded-full"
        style={{
          left: -260,
          top: -260,
          width: 520,
          height: 520,
          background:
            "conic-gradient(from 0deg, rgba(255,235,170,0) 0deg, rgba(255,235,170,0.22) 8deg, rgba(255,235,170,0) 22deg, rgba(255,235,170,0) 60deg, rgba(255,225,150,0.18) 68deg, rgba(255,225,150,0) 82deg, rgba(255,235,170,0) 120deg, rgba(255,225,150,0.2) 128deg, rgba(255,225,150,0) 142deg, rgba(255,235,170,0) 180deg, rgba(255,225,150,0.18) 188deg, rgba(255,225,150,0) 202deg, rgba(255,235,170,0) 240deg, rgba(255,225,150,0.2) 248deg, rgba(255,225,150,0) 262deg, rgba(255,235,170,0) 300deg, rgba(255,225,150,0.18) 308deg, rgba(255,225,150,0) 322deg, rgba(255,235,170,0) 360deg)",
          maskImage:
            "radial-gradient(circle, rgba(0,0,0,1) 8%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0) 80%)",
          WebkitMaskImage:
            "radial-gradient(circle, rgba(0,0,0,1) 8%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0) 80%)",
          filter: "blur(6px)",
        }}
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: [0, 0, 0.5, 0.75, 0.55], rotate: 360 }}
        transition={{
          opacity: { duration: 5, times: [0, 0.4, 0.62, 0.78, 1], ease: "easeOut" },
          rotate: { duration: 120, ease: "linear", repeat: Infinity },
        }}
      />


      <motion.div
        className="absolute rounded-full"
        style={{
          left: -160,
          top: -160,
          width: 320,
          height: 320,
          background:
            "radial-gradient(circle, rgba(255,225,150,0.55) 0%, rgba(255,180,100,0.25) 40%, rgba(255,140,80,0) 70%)",
        }}
        animate={{ scale: [0.9, 1.0, 1.15, 1.05] }}
        transition={{ duration: 5, times: [0, 0.4, 0.7, 1], ease: "easeOut" }}
      />


      <div
        className="absolute rounded-full"
        style={{
          left: -38,
          top: -38,
          width: 76,
          height: 76,
          background:
            "radial-gradient(circle, #fffbe6 0%, #ffe18a 45%, #ffb35a 80%, #ff8a4c 100%)",
          boxShadow:
            "0 0 60px rgba(255,220,140,0.9), 0 0 120px rgba(255,180,90,0.55)",
        }}
      />
    </motion.div>
  );
}


function LensFlare() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none mix-blend-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0, 0.7, 0.9, 0.5] }}
      transition={{ duration: 5, times: [0, 0.5, 0.66, 0.78, 1], ease: "easeOut" }}
    >

      <motion.div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          top: "50%",
          height: 6,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(180,210,255,0) 30%, rgba(220,235,255,0.85) 50%, rgba(180,210,255,0) 70%, transparent 100%)",
          filter: "blur(3px)",
        }}
        initial={{ y: 340, scaleX: 0.4 }}
        animate={{ y: -10, scaleX: 1.0 }}
        transition={{ duration: 5, ease: [0.34, 0.05, 0.4, 1] }}
      />


      <motion.div
        className="absolute"
        style={{ left: "50%", top: "50%" }}
        initial={{ x: -180, y: 340 }}
        animate={{ x: 60, y: -10 }}
        transition={{ duration: 5, ease: [0.34, 0.05, 0.4, 1] }}
      >

        <div
          className="absolute rounded-full"
          style={{
            left: -90,
            top: -90,
            width: 180,
            height: 180,
            border: "1px solid rgba(255,240,200,0.35)",
            boxShadow: "inset 0 0 40px rgba(255,220,150,0.25)",
          }}
        />
      </motion.div>


      {[
        { x: 200, y: -80, size: 28, color: "rgba(186,230,253,0.55)" },
        { x: 320, y: -160, size: 18, color: "rgba(253,224,71,0.45)" },
        { x: 440, y: -240, size: 40, color: "rgba(244,114,182,0.35)" },
      ].map((g, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: "50%",
            width: g.size,
            height: g.size,
            marginLeft: g.x - g.size / 2,
            marginTop: g.y - g.size / 2,
            background: g.color,
            filter: "blur(3px)",
          }}
        />
      ))}
    </motion.div>
  );
}


function MountainRange() {
  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none">
      <Ridge
        viewBox="0 0 1600 240"
        path="M0 240 L0 130 C 120 110, 200 60, 320 80 S 520 170, 640 130 C 760 90, 860 30, 1000 70 S 1240 170, 1380 130 C 1480 100, 1560 80, 1600 90 L 1600 240 Z"
        top="62%"
        height={240}
        baseColor="#070918"
        warmColor="#3a1f2a"
        warmStart={0.42}
        warmPeak={0.7}
      />
      <Ridge
        viewBox="0 0 1600 200"
        path="M0 200 L0 130 C 100 100, 240 80, 360 110 S 580 180, 720 140 C 840 110, 940 60, 1100 100 S 1320 170, 1440 140 C 1520 120, 1580 110, 1600 115 L 1600 200 Z"
        top="72%"
        height={200}
        baseColor="#050714"
        warmColor="#5a2438"
        warmStart={0.5}
        warmPeak={0.74}
      />
      <Ridge
        viewBox="0 0 1600 180"
        path="M0 180 L0 120 C 140 90, 280 110, 420 100 S 660 160, 820 130 C 940 110, 1060 70, 1200 100 S 1420 160, 1560 130 L 1600 130 L 1600 180 Z"
        top="82%"
        height={180}
        baseColor="#02030a"
        warmColor="#2a0e1c"
        warmStart={0.55}
        warmPeak={0.78}
      />
    </div>
  );
}

function Ridge({
  viewBox,
  path,
  top,
  height,
  baseColor,
  warmColor,
  warmStart,
  warmPeak,
}: {
  viewBox: string;
  path: string;
  top: string;
  height: number;
  baseColor: string;
  warmColor: string;
  warmStart: number;
  warmPeak: number;
}) {
  return (
    <motion.svg
      className="absolute left-0 right-0 w-full"
      style={{ top, height }}
      viewBox={viewBox}
      preserveAspectRatio="none"
      initial={{ opacity: 0.85 }}
      animate={{ fill: [baseColor, baseColor, warmColor, warmColor, baseColor] }}
      transition={{
        duration: 5,
        times: [0, warmStart, warmPeak, warmPeak + 0.1, 1],
        ease: "easeInOut",
      }}
    >
      <motion.path
        d={path}
        animate={{ fill: [baseColor, baseColor, warmColor, warmColor, "#1a2a4a"] }}
        transition={{
          duration: 5,
          times: [0, warmStart, warmPeak, warmPeak + 0.1, 1],
          ease: "easeInOut",
        }}
      />
    </motion.svg>
  );
}


function DustMotes() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none mix-blend-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0, 0.7, 0.5] }}
      transition={{ duration: 5, times: [0, 0.45, 0.7, 1], ease: "easeOut" }}
    >
      {MOTES.map((m, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.r,
            height: m.r,
            background: "rgba(255,235,180,0.9)",
            filter: `blur(${m.r * 0.4}px) drop-shadow(0 0 ${m.r * 2}px rgba(255,220,150,0.8))`,
          }}
          animate={{ y: [0, -40], opacity: [0, 0.9, 0] }}
          transition={{
            duration: m.dur,
            repeat: Infinity,
            ease: "easeOut",
            delay: m.delay,
          }}
        />
      ))}
    </motion.div>
  );
}

const MOTES = Array.from({ length: 18 }, (_, i) => {
  const h = (i * 1597463007) >>> 0;
  const rand = (n: number) => ((h >> n) & 0xff) / 255;
  return {
    x: rand(0) * 100,
    y: 30 + rand(8) * 60,
    r: 2 + rand(16) * 3,
    dur: 3.5 + rand(8) * 2.5,
    delay: rand(0) * 4,
  };
});


function Wordmark() {
  const letters = "ZWeather".split("");
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <div
        className="flex"
        style={{
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        }}
      >
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            className="text-white text-[56px] font-semibold tracking-[-0.025em] leading-none"
            style={{
              textShadow:
                "0 2px 24px rgba(255,200,140,0.6), 0 0 60px rgba(255,170,90,0.35)",
            }}
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.9,
              delay: 2.8 + i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {ch}
          </motion.span>
        ))}
      </div>
      <motion.p
        className="mt-4 text-[11px] tracking-[0.42em] uppercase text-white/70"
        style={{ textShadow: "0 0 16px rgba(255,200,140,0.5)" }}
        initial={{ opacity: 0, y: 8, letterSpacing: "0.2em" }}
        animate={{ opacity: 0.8, y: 0, letterSpacing: "0.42em" }}
        transition={{ duration: 1.2, delay: 3.6, ease: "easeOut" }}
      >
        Your sky, at a glance
      </motion.p>
    </div>
  );
}


function Letterbox() {
  return (
    <>
      <motion.div
        className="absolute left-0 right-0 top-0 bg-black pointer-events-none"
        initial={{ height: 0 }}
        animate={{ height: ["0%", "8%", "8%", "0%"] }}
        transition={{ duration: 5, times: [0, 0.12, 0.86, 1], ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-0 right-0 bottom-0 bg-black pointer-events-none"
        initial={{ height: 0 }}
        animate={{ height: ["0%", "8%", "8%", "0%"] }}
        transition={{ duration: 5, times: [0, 0.12, 0.86, 1], ease: "easeInOut" }}
      />
    </>
  );
}


function FilmGrain() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay"
      style={{ opacity: 0.12 }}
    >
      <filter id="ci-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1
                  0 0 0 0 1
                  0 0 0 0 1
                  0 0 0 0.6 0"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#ci-grain)" />
    </svg>
  );
}


function StaticBrandComposition() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-full"
        style={{
          width: 80,
          height: 80,
          background:
            "radial-gradient(circle, #fffbe6 0%, #ffe18a 45%, #ffb35a 80%, #ff8a4c 100%)",
          boxShadow: "0 0 60px rgba(255,220,140,0.8)",
        }}
      />
      <h1
        className="text-white text-[36px] font-semibold tracking-[-0.025em] leading-none mt-2"
        style={{
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        }}
      >
        ZWeather
      </h1>
      <p className="text-[11px] tracking-[0.4em] uppercase text-white/60">
        Your sky, at a glance
      </p>
    </div>
  );
}


function SkipHint({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute bottom-5 right-6 pointer-events-none select-none z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 0.6 : 0 }}
      transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 text-[11px] tracking-wider uppercase text-white/80">
        <span>Skip</span>
        <kbd
          className="px-1.5 py-0.5 rounded border border-white/25 text-[9px] tracking-normal"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          Esc
        </kbd>
      </div>
    </motion.div>
  );
}
