

import { motion } from "framer-motion";
import { useSettingsStore } from "@/store/settingsStore";

interface CrescentMoonIconProps {
  size?: number;
  className?: string;
}

export function CrescentMoonIcon({ size = 72, className }: CrescentMoonIconProps) {
  const animated = useSettingsStore((s) => s.settings.animated_icons);

  const Wrap = animated ? motion.div : "div";
  const animProps = animated
    ? {
        animate: { y: [0, -2, 0, 1.5, 0], rotate: [-3, -1, -4, -2, -3] },
        transition: { duration: 12, repeat: Infinity, ease: "easeInOut" },
      }
    : {};

  return (
    <Wrap
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-block",
        filter: "drop-shadow(0 0 10px rgba(186,230,253,0.45))",
      }}
      {...(animProps as object)}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <radialGradient id="cm-body" cx="38%" cy="34%" r="72%">
            <stop offset="0%"  stopColor="#fefce8" />
            <stop offset="55%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <radialGradient id="cm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="rgba(253,224,71,0.35)" />
            <stop offset="60%" stopColor="rgba(253,224,71,0.08)" />
            <stop offset="100%" stopColor="rgba(253,224,71,0)" />
          </radialGradient>
          <mask id="cm-crescent">
            <rect width="100" height="100" fill="black" />
            <circle cx="50" cy="50" r="34" fill="white" />
            <circle cx="63" cy="42" r="30" fill="black" />
          </mask>
          <clipPath id="cm-clip">
            <circle cx="50" cy="50" r="34" />
          </clipPath>
        </defs>


        <circle cx="50" cy="50" r="46" fill="url(#cm-glow)" />


        <rect width="100" height="100" fill="url(#cm-body)" mask="url(#cm-crescent)" />


        <g clipPath="url(#cm-clip)" mask="url(#cm-crescent)" opacity="0.45">
          <circle cx="34" cy="44" r="3.4" fill="#92400e" />
          <circle cx="42" cy="62" r="2.4" fill="#92400e" />
          <circle cx="28" cy="58" r="1.8" fill="#92400e" />
          <circle cx="38" cy="32" r="1.4" fill="#92400e" />
          <circle cx="46" cy="48" r="1.2" fill="#92400e" />
        </g>


        <path
          d="M 30 30 Q 18 50 30 70"
          stroke="rgba(254,252,232,0.7)"
          strokeWidth="1.4"
          fill="none"
          opacity="0.6"
        />


        {animated && (
          <>
            <motion.circle
              cx="78" cy="32" r="1.2" fill="#fef3c7"
              animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 0.6] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="74" cy="68" r="0.9" fill="#fef3c7"
              animate={{ opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
            />
            <motion.circle
              cx="86" cy="52" r="0.8" fill="#fef3c7"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            />
          </>
        )}
      </svg>
    </Wrap>
  );
}
