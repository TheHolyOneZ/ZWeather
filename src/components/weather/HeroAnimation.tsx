import { useMemo } from "react";
import { motion } from "framer-motion";
import { meteoconCloud } from "@/lib/meteocons";
import { useSettingsStore } from "@/store/settingsStore";

interface HeroAnimationProps {
  conditionCode: number;
  isDay: boolean;
}

type AnimKind =
  | "clear-day"
  | "clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "showers"
  | "freezing-rain"
  | "snow"
  | "snow-grains"
  | "thunderstorm"
  | "hail-storm";

function codeToAnim(code: number, isDay: boolean): AnimKind {
  if (code === 0) return isDay ? "clear-day" : "clear-night";
  if (code === 1 || code === 2) return isDay ? "partly-cloudy-day" : "partly-cloudy-night";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 55) return "drizzle";
  if (code === 56 || code === 57) return "freezing-rain";
  if (code === 61 || code === 63) return "rain";
  if (code === 65 || (code >= 80 && code <= 82)) return "showers";
  if (code === 66 || code === 67) return "freezing-rain";
  if (code === 71 || code === 73 || code === 75) return "snow";
  if (code === 77) return "snow-grains";
  if (code === 85 || code === 86) return "snow";
  if (code === 95) return "thunderstorm";
  if (code === 96 || code === 99) return "hail-storm";
  return "clear-day";
}

export function HeroAnimation({ conditionCode, isDay }: HeroAnimationProps) {
  const animatedIcons = useSettingsStore((s) => s.settings.animated_icons);
  const kind = codeToAnim(conditionCode, isDay);


  if (!animatedIcons) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 110% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%)",
        }}
      />
      {kind === "clear-day" && <ClearDayLayer />}
      {kind === "clear-night" && <ClearNightLayer />}
      {kind === "partly-cloudy-day" && <PartlyCloudyDayLayer />}
      {kind === "partly-cloudy-night" && <PartlyCloudyNightLayer />}
      {kind === "overcast" && <OvercastLayer />}
      {kind === "fog" && <FogLayer />}
      {kind === "drizzle" && <DrizzleLayer />}
      {kind === "rain" && <RainLayer />}
      {kind === "showers" && <ShowersLayer />}
      {kind === "freezing-rain" && <FreezingRainLayer />}
      {kind === "snow" && <SnowLayer />}
      {kind === "snow-grains" && <SnowGrainsLayer />}
      {kind === "thunderstorm" && <ThunderstormLayer />}
      {kind === "hail-storm" && <HailStormLayer />}
    </div>
  );
}


function parseRgba(input: string): { r: number; g: number; b: number; a: number } {
  const m = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (!m) return { r: 255, g: 255, b: 255, a: 1 };
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 };
}


function tintFilter(tint: string): string {
  const { r, g, b } = parseRgba(tint);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const brightness = 0.35 + luma * 0.75;
  const blueBias = b - (r + g) / 2;
  const hueShift = blueBias > 15 ? 200 : 0;
  const saturate = blueBias > 15 ? 0.5 : 0.6;
  return `brightness(${brightness.toFixed(2)}) saturate(${saturate}) ${hueShift ? `hue-rotate(${hueShift}deg)` : ""}`;
}


function ClearDayLayer() {
  return (
    <>
      <motion.div
        className="absolute top-[-45%] right-[-25%] w-[80%] h-[180%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.30) 0%, rgba(251,146,60,0.10) 35%, rgba(251,146,60,0.02) 60%, transparent 80%)",
          filter: "blur(8px)",
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[-20%] right-[5%] w-[45%] h-[110%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(253,224,71,0.18) 0%, transparent 65%)",
          filter: "blur(6px)",
          mixBlendMode: "screen",
        }}
        animate={{ x: [0, 14, -6, 0], y: [0, -8, 4, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-40%] left-[-25%] w-[65%] h-[130%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(14,165,233,0.14) 0%, rgba(56,189,248,0.04) 45%, transparent 70%)",
          filter: "blur(10px)",
        }}
        animate={{ x: [0, 10, 0], y: [0, -8, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-0 right-0 bottom-[10%] h-[25%]"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(251,191,36,0.06), transparent)",
          filter: "blur(4px)",
        }}
        animate={{ opacity: [0.4, 0.8, 0.4], y: [0, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      {DUST.map((d, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.s,
            height: d.s,
            background: "rgba(253, 230, 138, 0.7)",
            boxShadow: "0 0 6px rgba(253,230,138,0.5)",
          }}
          animate={{ y: [0, -14, 0], x: [0, d.dx, 0], opacity: [0.1, 0.85, 0.1] }}
          transition={{
            duration: 5 + (i % 4) * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.45,
          }}
        />
      ))}
      <motion.div
        className="absolute top-[20%] right-[35%] w-3 h-3 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(254,243,199,0.6), transparent 70%)", filter: "blur(2px)" }}
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.3, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[55%] right-[55%] w-2 h-2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(254,215,170,0.5), transparent 70%)", filter: "blur(1px)" }}
        animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.4, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
    </>
  );
}


function ClearNightLayer() {
  const stars = useMemo(
    () =>
      Array.from({ length: 38 }, (_, i) => ({
        x: (i * 31.7) % 100,
        y: (i * 47.3) % 90,
        s: 0.8 + ((i * 7) % 4) * 0.35,
        d: 1.5 + ((i * 13) % 5) * 0.7,
        delay: (i * 0.21) % 5,
        glow: (i * 5) % 3 === 0,
      })),
    [],
  );
  const shootingStars = useMemo(
    () =>
      Array.from({ length: 2 }, (_, i) => ({
        startX: 60 + i * 25,
        startY: 8 + i * 10,
        delay: 8 + i * 14,
        duration: 1.4,
        cycle: 22 + i * 5,


        trailAngle: -21,
      })),
    [],
  );
  return (
    <>
      <motion.div
        className="absolute top-[-30%] left-[5%] w-[75%] h-[140%]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)",
          filter: "blur(12px)",
          mixBlendMode: "screen",
        }}
        animate={{ opacity: [0.7, 1, 0.7], x: [0, 8, -4, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[20%] right-[10%] w-[50%] h-[80%]"
        style={{
          background: "radial-gradient(ellipse, rgba(167,139,250,0.14) 0%, transparent 70%)",
          filter: "blur(15px)",
          mixBlendMode: "screen",
        }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <div
        className="absolute"
        style={{
          top: "-10%",
          left: "20%",
          width: "70%",
          height: "120%",
          background:
            "linear-gradient(115deg, transparent 40%, rgba(186,230,253,0.05) 50%, transparent 60%)",
          transform: "rotate(-12deg)",
          mixBlendMode: "screen",
        }}
      />
      {stars.map((st, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            background: "rgba(241, 245, 249, 0.95)",
            boxShadow: st.glow
              ? "0 0 6px rgba(186,230,253,0.9), 0 0 12px rgba(99,102,241,0.4)"
              : "0 0 3px rgba(226,232,240,0.6)",
          }}
          animate={{ opacity: [0.15, 1, 0.15], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: st.d, repeat: Infinity, ease: "easeInOut", delay: st.delay }}
        />
      ))}
      {shootingStars.map((sh, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${sh.startX}%`, top: `${sh.startY}%` }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{

            x: [0, -27, -126, -180],
            y: [0, 10, 49, 70],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: sh.duration,
            repeat: Infinity,
            repeatDelay: sh.cycle,
            ease: "easeOut",
            delay: sh.delay,
            times: [0, 0.15, 0.7, 1],
          }}
        >


          <div
            style={{
              width: 70,
              height: 1.6,
              transform: `rotate(${sh.trailAngle}deg)`,
              transformOrigin: "0 50%",
              background:
                "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(186,230,253,0.92) 28%, transparent 100%)",
              filter: "drop-shadow(0 0 4px rgba(186,230,253,0.7))",
              borderRadius: 1,
            }}
          />
        </motion.div>
      ))}
    </>
  );
}


function PartlyCloudyDayLayer() {
  return (
    <>
      <motion.div
        className="absolute top-[-30%] right-[-15%] w-[60%] h-[150%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.20) 0%, rgba(251,146,60,0.05) 45%, transparent 70%)",
          filter: "blur(8px)",
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <DriftingCloud top="8%" left="-40%" width="55%" duration={70} delay={0} blur={3} opacity={0.6} kind="cumulus" tint="rgba(220,230,245,0.8)" shadow="rgba(0,0,0,0.2)" />
      <DriftingCloud top="35%" left="-30%" width="42%" duration={55} delay={8} blur={1.5} opacity={0.75} kind="cumulus" tint="rgba(230,240,250,0.9)" shadow="rgba(0,0,0,0.15)" />
      <DriftingCloud top="60%" left="-50%" width="48%" duration={85} delay={3} blur={5} opacity={0.45} kind="cumulus" tint="rgba(200,215,235,0.7)" />
    </>
  );
}

function PartlyCloudyNightLayer() {
  return (
    <>
      <motion.div
        className="absolute top-[-20%] left-[15%] w-[60%] h-[100%]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 65%)",
          filter: "blur(10px)",
        }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      {Array.from({ length: 14 }, (_, i) => ({
        x: (i * 31.7) % 100,
        y: (i * 47.3) % 70,
        s: 0.8 + ((i * 7) % 3) * 0.35,
        d: 1.5 + ((i * 13) % 4) * 0.7,
        delay: (i * 0.21) % 4,
      })).map((st, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            background: "rgba(241, 245, 249, 0.85)",
            boxShadow: "0 0 3px rgba(226,232,240,0.6)",
          }}
          animate={{ opacity: [0.15, 0.9, 0.15] }}
          transition={{ duration: st.d, repeat: Infinity, ease: "easeInOut", delay: st.delay }}
        />
      ))}
      <DriftingCloud top="20%" left="-35%" width="48%" duration={75} delay={0} blur={3} opacity={0.55} kind="cumulus" tint="rgba(70,80,110,0.85)" shadow="rgba(0,0,0,0.5)" />
      <DriftingCloud top="55%" left="-45%" width="55%" duration={95} delay={6} blur={5} opacity={0.45} kind="cumulus" tint="rgba(50,55,80,0.75)" />
    </>
  );
}


function OvercastLayer() {
  return (
    <>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(165,178,200,0.55) 0%, rgba(135,150,175,0.50) 50%, rgba(95,110,135,0.45) 100%)",
        }}
      />

      <motion.div
        className="absolute"
        style={{
          top: "-15%",
          right: "8%",
          width: "55%",
          height: "90%",
          background:
            "radial-gradient(ellipse, rgba(254,249,231,0.40) 0%, rgba(254,243,199,0.18) 30%, transparent 60%)",
          filter: "blur(22px)",
          mixBlendMode: "screen",
        }}
        animate={{ opacity: [0.55, 0.9, 0.55], x: [0, 22, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute"
        style={{
          top: "20%",
          left: "10%",
          width: "35%",
          height: "60%",
          background:
            "radial-gradient(ellipse, rgba(220,230,245,0.30) 0%, transparent 65%)",
          filter: "blur(28px)",
          mixBlendMode: "screen",
        }}
        animate={{ opacity: [0.4, 0.7, 0.4], x: [0, -16, 0] }}
        transition={{ duration: 55, repeat: Infinity, ease: "easeInOut", delay: 12 }}
      />

      <motion.div
        className="absolute"
        style={{
          top: "-25%",
          left: "-40%",
          width: "90%",
          height: "100%",
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(45,55,75,0.55) 0%, rgba(60,72,95,0.30) 40%, transparent 70%)",
          filter: "blur(25px)",
        }}
        animate={{ x: ["0%", "180%"], opacity: [0.7, 0.9, 0.7] }}
        transition={{
          x: { duration: 95, repeat: Infinity, ease: "linear" },
          opacity: { duration: 18, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="absolute"
        style={{
          top: "15%",
          left: "-60%",
          width: "100%",
          height: "85%",
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(55,68,92,0.50) 0%, rgba(70,82,105,0.25) 45%, transparent 72%)",
          filter: "blur(30px)",
        }}
        animate={{ x: ["0%", "180%"], opacity: [0.6, 0.85, 0.6] }}
        transition={{
          x: { duration: 130, repeat: Infinity, ease: "linear", delay: 8 },
          opacity: { duration: 22, repeat: Infinity, ease: "easeInOut", delay: 5 },
        }}
      />
      <motion.div
        className="absolute"
        style={{
          top: "35%",
          left: "-50%",
          width: "85%",
          height: "75%",
          background:
            "radial-gradient(ellipse 50% 45% at 50% 50%, rgba(40,52,75,0.55) 0%, transparent 68%)",
          filter: "blur(28px)",
        }}
        animate={{ x: ["0%", "180%"], opacity: [0.65, 0.85, 0.65] }}
        transition={{
          x: { duration: 110, repeat: Infinity, ease: "linear", delay: 25 },
          opacity: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 10 },
        }}
      />

      <motion.div
        className="absolute"
        style={{
          top: "5%",
          left: "-30%",
          width: "70%",
          height: "70%",
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(220,232,248,0.45) 0%, rgba(200,215,235,0.20) 40%, transparent 70%)",
          filter: "blur(20px)",
          mixBlendMode: "screen",
        }}
        animate={{ x: ["0%", "180%"], opacity: [0.5, 0.75, 0.5] }}
        transition={{
          x: { duration: 100, repeat: Infinity, ease: "linear", delay: 15 },
          opacity: { duration: 24, repeat: Infinity, ease: "easeInOut", delay: 8 },
        }}
      />
      <motion.div
        className="absolute"
        style={{
          top: "40%",
          left: "-40%",
          width: "80%",
          height: "60%",
          background:
            "radial-gradient(ellipse 50% 45% at 50% 50%, rgba(210,222,240,0.40) 0%, transparent 70%)",
          filter: "blur(22px)",
          mixBlendMode: "screen",
        }}
        animate={{ x: ["0%", "180%"], opacity: [0.4, 0.7, 0.4] }}
        transition={{
          x: { duration: 140, repeat: Infinity, ease: "linear", delay: 30 },
          opacity: { duration: 28, repeat: Infinity, ease: "easeInOut", delay: 18 },
        }}
      />

      <motion.div
        className="absolute left-0 right-0"
        style={{
          top: "45%",
          height: "12%",
          background:
            "linear-gradient(180deg, transparent, rgba(50,62,85,0.25) 50%, transparent)",
          filter: "blur(8px)",
        }}
        animate={{ opacity: [0.5, 0.9, 0.5], y: [0, 5, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-[35%]"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(30,42,65,0.40))",
        }}
      />
    </>
  );
}


function FogLayer() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(203,213,225,0.18) 0%, rgba(148,163,184,0.08) 50%, rgba(203,213,225,0.15) 100%)",
        }}
      />

      {[
        { y: 15, h: 30, op: 0.35, d: 32, delay: 0 },
        { y: 30, h: 35, op: 0.45, d: 26, delay: 2 },
        { y: 50, h: 40, op: 0.55, d: 38, delay: 1 },
        { y: 65, h: 32, op: 0.4, d: 30, delay: 4 },
        { y: 80, h: 28, op: 0.3, d: 36, delay: 3 },
      ].map((band, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: `${band.y}%`,
            left: "-30%",
            width: "160%",
            height: `${band.h}%`,
            background: `linear-gradient(180deg, transparent, rgba(203,213,225,${band.op * 0.7}) 50%, transparent)`,
            filter: "blur(8px)",
          }}
          animate={{ x: ["-8%", "8%", "-8%"], opacity: [band.op * 0.6, band.op, band.op * 0.6] }}
          transition={{ duration: band.d, repeat: Infinity, ease: "easeInOut", delay: band.delay }}
        />
      ))}
    </>
  );
}


function DrizzleLayer() {
  const drops = useMemo(
    () =>
      Array.from({ length: 38 }, (_, i) => ({
        x: (i * 23.7) % 100,
        delay: (i * 0.07) % 1.2,
        duration: 1.6 + ((i * 5) % 5) * 0.2,
        opacity: 0.25 + ((i * 11) % 4) * 0.06,
      })),
    [],
  );
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(100,116,139,0.18) 0%, rgba(71,85,105,0.10) 100%)",
        }}
      />
      <DriftingCloud top="-15%" left="-40%" width="70%" duration={80} delay={0} blur={5} opacity={0.55} kind="stratus" tint="rgba(140,155,175,0.85)" />
      <DriftingCloud top="0%" left="-45%" width="80%" duration={95} delay={3} blur={3} opacity={0.5} kind="stratus" tint="rgba(130,145,165,0.8)" />
      {drops.map((d, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${d.x}%`,
            top: "0%",
            width: 1,
            height: 4,
            background: `linear-gradient(180deg, transparent, rgba(186,230,253,${d.opacity}))`,
          }}
          animate={{ y: ["0%", "1400%"], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: d.duration,
            repeat: Infinity,
            ease: "linear",
            delay: d.delay,
            times: [0, 0.1, 0.9, 1],
          }}
        />
      ))}
    </>
  );
}


function RainLayer() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(71,85,105,0.22) 0%, rgba(30,41,59,0.15) 100%)",
        }}
      />
      <DriftingCloud top="-20%" left="-40%" width="75%" duration={70} delay={0} blur={5} opacity={0.65} kind="stratus" tint="rgba(110,125,150,0.9)" />
      <DriftingCloud top="-5%" left="-50%" width="85%" duration={90} delay={4} blur={3} opacity={0.6} kind="stratus" tint="rgba(95,110,135,0.85)" />
      <RainParticles density={20} skew={-12} speed={1.05} length={14} thickness={1} opacity={0.45} />
      <RainParticles density={14} skew={-12} speed={1.4} length={10} thickness={0.7} opacity={0.25} blur={1.2} />
    </>
  );
}


function ShowersLayer() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(30,41,59,0.40) 0%, rgba(15,23,42,0.25) 100%)",
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(56,189,248,0.12) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <DriftingCloud top="-25%" left="-50%" width="95%" duration={50} delay={0} blur={4} opacity={0.85} kind="storm" tint="rgba(70,85,110,0.95)" shadow="rgba(0,0,0,0.5)" />
      <DriftingCloud top="-10%" left="-60%" width="100%" duration={65} delay={5} blur={2} opacity={0.75} kind="storm" tint="rgba(85,95,120,0.9)" />

      <RainParticles density={28} skew={-18} speed={0.55} length={22} thickness={1.4} opacity={0.55} />
      <RainParticles density={22} skew={-18} speed={0.75} length={18} thickness={1} opacity={0.35} blur={0.8} />
      <RainParticles density={16} skew={-18} speed={1.1} length={12} thickness={0.7} opacity={0.22} blur={1.6} />

      <SplashDots />
    </>
  );
}


function FreezingRainLayer() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(100,116,139,0.25) 0%, rgba(15,23,42,0.15) 100%)",
        }}
      />
      <DriftingCloud top="-15%" left="-45%" width="80%" duration={80} delay={0} blur={4} opacity={0.7} kind="stratus" tint="rgba(140,155,180,0.9)" />
      <RainParticles density={18} skew={-8} speed={0.9} length={16} thickness={1.1} opacity={0.45} color="rgba(186,230,253,1)" />

      {Array.from({ length: 14 }, (_, i) => ({
        x: (i * 41) % 100,
        delay: (i * 0.21) % 2,
        duration: 1.8 + ((i * 7) % 4) * 0.3,
      })).map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: "0%",
            width: 2.5,
            height: 2.5,
            background: "rgba(224,242,254,0.95)",
            boxShadow: "0 0 3px rgba(186,230,253,0.6)",
          }}
          animate={{ y: ["0%", "1400%"] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
        />
      ))}
    </>
  );
}


function SnowLayer() {
  const layers = useMemo(
    () =>
      [
        { count: 10, speedMin: 11, speedMax: 14, size: 2, opacity: 0.45, blur: 1.6, drift: 14 },
        { count: 14, speedMin: 7, speedMax: 10, size: 3.5, opacity: 0.7, blur: 0.6, drift: 22 },
        { count: 10, speedMin: 5, speedMax: 7, size: 5, opacity: 0.92, blur: 0, drift: 30 },
      ].map((cfg, layerIdx) => ({
        ...cfg,
        flakes: Array.from({ length: cfg.count }, (_, i) => ({
          x: (i * (41 + layerIdx * 9)) % 100,
          delay: (i * 0.31) % 5,
          duration: cfg.speedMin + ((i * 5) % 5) * ((cfg.speedMax - cfg.speedMin) / 5),
          driftDir: i % 2 === 0 ? 1 : -1,
          rotateDir: i % 3 === 0 ? 1 : -1,
          shape: i % 3,
        })),
      })),
    [],
  );
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(186,230,253,0.10) 0%, rgba(30,41,59,0.10) 100%)",
        }}
      />
      <DriftingCloud top="-20%" left="-45%" width="80%" duration={90} delay={0} blur={6} opacity={0.55} kind="stratus" tint="rgba(180,200,220,0.85)" />
      {layers.map((layer, li) => (
        <div
          key={li}
          className="absolute inset-0"
          style={{ filter: layer.blur ? `blur(${layer.blur}px)` : undefined }}
        >
          {layer.flakes.map((f, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${f.x}%`,
                top: "-8%",
                width: layer.size,
                height: layer.size,
              }}
              animate={{
                y: ["0%", "1400%"],
                x: [0, f.driftDir * layer.drift, 0, -f.driftDir * layer.drift, 0],
                rotate: f.rotateDir * 360,
              }}
              transition={{
                y: { duration: f.duration, repeat: Infinity, ease: "linear", delay: f.delay },
                x: { duration: f.duration / 2, repeat: Infinity, ease: "easeInOut", delay: f.delay },
                rotate: { duration: 8, repeat: Infinity, ease: "linear", delay: f.delay },
              }}
            >
              <Snowflake size={layer.size} opacity={layer.opacity} variant={f.shape} />
            </motion.div>
          ))}
        </div>
      ))}
    </>
  );
}

function Snowflake({ size, opacity, variant }: { size: number; opacity: number; variant: number }) {
  const color = `rgba(241,250,254,${opacity})`;
  const glow = size >= 4 ? "drop-shadow(0 0 3px rgba(186,230,253,0.5))" : undefined;
  if (variant === 0) {

    return (
      <svg width={size * 3} height={size * 3} viewBox="0 0 30 30" style={{ filter: glow, transform: "translate(-33%, -33%)" }}>
        {[0, 60, 120].map((deg) => (
          <line key={deg} x1="15" y1="2" x2="15" y2="28" stroke={color} strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${deg} 15 15)`} />
        ))}
        <circle cx="15" cy="15" r="1.5" fill={color} />
      </svg>
    );
  }
  if (variant === 1) {

    return (
      <svg width={size * 3} height={size * 3} viewBox="0 0 30 30" style={{ filter: glow, transform: "translate(-33%, -33%)" }}>
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const r = (deg * Math.PI) / 180;
          return <circle key={deg} cx={15 + 10 * Math.cos(r)} cy={15 + 10 * Math.sin(r)} r="1.2" fill={color} />;
        })}
        <circle cx="15" cy="15" r="1.5" fill={color} />
      </svg>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: glow,
      }}
    />
  );
}


function SnowGrainsLayer() {
  const grains = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        x: (i * 17.3) % 100,
        delay: (i * 0.09) % 2,
        duration: 2.5 + ((i * 5) % 5) * 0.3,
        drift: i % 2 === 0 ? 6 : -6,
      })),
    [],
  );
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(200,215,235,0.15) 0%, rgba(30,41,59,0.10) 100%)",
        }}
      />
      <DriftingCloud top="-15%" left="-45%" width="80%" duration={75} delay={0} blur={5} opacity={0.6} kind="stratus" tint="rgba(180,195,215,0.85)" />
      {grains.map((g, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${g.x}%`,
            top: "-5%",
            width: 1.4,
            height: 1.4,
            background: "rgba(224,242,254,0.85)",
          }}
          animate={{ y: ["0%", "1400%"], x: [0, g.drift, 0] }}
          transition={{
            y: { duration: g.duration, repeat: Infinity, ease: "linear", delay: g.delay },
            x: { duration: g.duration / 3, repeat: Infinity, ease: "easeInOut", delay: g.delay },
          }}
        />
      ))}
    </>
  );
}


function ThunderstormLayer() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.5) 0%, rgba(30,27,75,0.3) 100%)",
        }}
      />
      <DriftingCloud top="-30%" left="-50%" width="100%" duration={45} delay={0} blur={4} opacity={0.95} kind="storm" tint="rgba(40,45,70,0.95)" shadow="rgba(0,0,0,0.6)" />
      <DriftingCloud top="-15%" left="-60%" width="105%" duration={60} delay={3} blur={2} opacity={0.85} kind="storm" tint="rgba(55,60,85,0.9)" />
      <RainParticles density={26} skew={-15} speed={0.65} length={20} thickness={1.3} opacity={0.5} />
      <RainParticles density={20} skew={-15} speed={0.85} length={16} thickness={0.9} opacity={0.3} blur={1.2} />
      <LightningBolt />
    </>
  );
}


function HailStormLayer() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(30,27,75,0.3) 100%)",
        }}
      />
      <DriftingCloud top="-30%" left="-50%" width="100%" duration={45} delay={0} blur={4} opacity={0.95} kind="storm" tint="rgba(40,45,70,0.95)" shadow="rgba(0,0,0,0.6)" />
      <RainParticles density={18} skew={-12} speed={0.7} length={16} thickness={1} opacity={0.4} />

      {Array.from({ length: 20 }, (_, i) => ({
        x: (i * 29) % 100,
        delay: (i * 0.13) % 1.5,
        duration: 1.2 + ((i * 5) % 4) * 0.25,
        size: 3 + (i % 3) * 0.8,
      })).map((h, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${h.x}%`,
            top: "-5%",
            width: h.size,
            height: h.size,
            background: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(186,230,253,0.7) 70%)",
            boxShadow: "0 0 4px rgba(186,230,253,0.7), inset -1px -1px 1px rgba(56,189,248,0.5)",
          }}
          animate={{ y: ["0%", "1400%"], rotate: 360 }}
          transition={{
            y: { duration: h.duration, repeat: Infinity, ease: "linear", delay: h.delay },
            rotate: { duration: 4, repeat: Infinity, ease: "linear", delay: h.delay },
          }}
        />
      ))}
      <LightningBolt />
    </>
  );
}


interface DriftingCloudProps {
  top: string;
  left: string;
  width: string;
  duration: number;
  delay: number;
  blur: number;
  opacity: number;
  kind: "cumulus" | "stratus" | "storm";
  tint: string;
  shadow?: string;
}
function DriftingCloud({ top, left, width, duration, delay, blur, opacity, kind, tint }: DriftingCloudProps) {

  const height = kind === "stratus" ? "32%" : "55%";
  const { a } = parseRgba(tint);
  return (
    <motion.div
      className="absolute"
      style={{
        top, left, width, height,
        opacity: opacity * a,
        backgroundImage: `url(${meteoconCloud()})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        filter: `${tintFilter(tint)}${blur ? ` blur(${blur}px)` : ""}`,
      }}
      animate={{ x: ["0%", "180%"] }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    />
  );
}


interface RainParticlesProps {
  density: number;
  skew: number;
  speed: number;
  length: number;
  thickness: number;
  opacity: number;
  blur?: number;
  color?: string;
}
function RainParticles({ density, skew, speed, length, thickness, opacity, blur, color = "rgba(147,197,253,1)" }: RainParticlesProps) {
  const drops = useMemo(
    () =>
      Array.from({ length: density }, (_, i) => ({
        x: (i * 53.7) % 100,
        delay: (i * 0.09) % 1.4,
        duration: speed + ((i * 7) % 5) * (speed * 0.15),
      })),
    [density, speed],
  );
  return (
    <div className="absolute inset-0" style={{ filter: blur ? `blur(${blur}px)` : undefined }}>
      {drops.map((d, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${d.x}%`,
            top: "-12%",
            width: thickness,
            height: length,
            background: `linear-gradient(180deg, transparent, ${color.replace("1)", `${opacity})`)})`,
            transform: `skewX(${skew}deg)`,
          }}
          animate={{ y: ["0%", "1400%"] }}
          transition={{ duration: d.duration, repeat: Infinity, ease: "linear", delay: d.delay }}
        />
      ))}
    </div>
  );
}


function SplashDots() {
  const splashes = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: (i * 11.3) % 100,
        delay: (i * 0.21) % 2,
        duration: 0.6,
      })),
    [],
  );
  return (
    <>
      {splashes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${s.x}%`,
            bottom: "5%",
            width: 8,
            height: 1,
            borderRadius: "50%",
            background: "rgba(186,230,253,0.6)",
          }}
          animate={{ scale: [0.3, 1.6, 0.3], opacity: [0, 0.7, 0] }}
          transition={{ duration: s.duration, repeat: Infinity, repeatDelay: 1.5 + i * 0.1, delay: s.delay, ease: "easeOut" }}
        />
      ))}
    </>
  );
}


function LightningBolt() {
  return (
    <>
      <motion.svg
        className="absolute top-[5%] left-[35%]"
        width="30%" height="90%" viewBox="0 0 60 200"
        style={{ mixBlendMode: "screen" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 1, 0, 0.6, 0, 0, 0, 0, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.4, 0.42, 0.45, 0.48, 0.51, 0.54, 0.6, 0.8, 0.95, 1],
        }}
      >
        <defs>
          <filter id="bolt-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M30 0 L24 60 L34 60 L18 130 L30 130 L12 200"
          stroke="#fef3c7"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#bolt-glow)"
        />
        <path
          d="M34 60 L42 90 L36 90 L46 120"
          stroke="#fde68a"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
          filter="url(#bolt-glow)"
        />
      </motion.svg>
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(254,243,199,1)" }}
        animate={{ opacity: [0, 0, 0, 0.18, 0, 0.08, 0, 0, 0, 0, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.4, 0.42, 0.45, 0.48, 0.51, 0.54, 0.6, 0.8, 0.95, 1],
        }}
      />
      <motion.div
        className="absolute left-0 right-0 bottom-0 h-[40%]"
        style={{ background: "linear-gradient(0deg, rgba(254,243,199,0.18), transparent)" }}
        animate={{ opacity: [0, 0, 0, 1, 0, 0.4, 0, 0, 0, 0, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.4, 0.42, 0.45, 0.48, 0.51, 0.54, 0.6, 0.8, 0.95, 1],
        }}
      />
    </>
  );
}

const DUST = [
  { x: 14, y: 22, s: 2, dx: 8 },
  { x: 28, y: 60, s: 1.5, dx: -6 },
  { x: 55, y: 35, s: 2, dx: 10 },
  { x: 72, y: 78, s: 1.5, dx: -8 },
  { x: 88, y: 30, s: 2, dx: 6 },
  { x: 40, y: 80, s: 1.5, dx: -10 },
  { x: 22, y: 45, s: 1.2, dx: 5 },
  { x: 65, y: 18, s: 1.8, dx: -7 },
  { x: 8, y: 70, s: 1.5, dx: 9 },
  { x: 50, y: 55, s: 1.3, dx: -5 },
];
