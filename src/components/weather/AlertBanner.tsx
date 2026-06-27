import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import type { WeatherAlert, AlertSeverity } from "@/types/alerts";
import { SEVERITY_ORDER } from "@/types/alerts";

interface AlertBannerProps {
  alerts: WeatherAlert[];
  onClick: () => void;
}

const SEVERITY_STYLE: Record<AlertSeverity, { bg: string; border: string; fg: string; chipBg: string; chipFg: string }> = {
  extreme: {
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.35)",
    fg: "#fca5a5",
    chipBg: "rgba(239,68,68,0.30)",
    chipFg: "#fee2e2",
  },
  severe: {
    bg: "rgba(249,115,22,0.10)",
    border: "rgba(249,115,22,0.32)",
    fg: "#fdba74",
    chipBg: "rgba(249,115,22,0.28)",
    chipFg: "#ffedd5",
  },
  moderate: {
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.28)",
    fg: "#fcd34d",
    chipBg: "rgba(251,191,36,0.22)",
    chipFg: "#fef3c7",
  },
  minor: {
    bg: "rgba(250,204,21,0.06)",
    border: "rgba(250,204,21,0.22)",
    fg: "#fde68a",
    chipBg: "rgba(250,204,21,0.18)",
    chipFg: "#fef9c3",
  },
};

export function AlertBanner({ alerts, onClick }: AlertBannerProps) {
  const { t } = useTranslation();
  if (alerts.length === 0) return null;

  const sorted = [...alerts].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const maxSev = sorted[0].severity;
  const style = SEVERITY_STYLE[maxSev];
  const headline = sorted[0].title;
  const shouldPulse = maxSev === "extreme" || maxSev === "severe";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="mx-4 mb-2 flex items-center gap-3 px-3.5 py-2 rounded-xl text-left group relative overflow-hidden"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}
    >

      {shouldPulse && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: style.bg }}
          animate={{ opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}


      <span className="shrink-0 relative" style={{ color: style.fg }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 1.5 L17 16 H1 Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.15"
          />
          <line x1="9" y1="7" x2="9" y2="11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="9" cy="13.8" r="0.85" fill="currentColor" />
        </svg>
      </span>

      <div className="min-w-0 flex-1 relative">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
            style={{ background: style.chipBg, color: style.chipFg }}
          >
            {t(`alerts.${maxSev}`, { defaultValue: maxSev })}
          </span>
          <p className="text-[12.5px] font-medium truncate" style={{ color: style.fg }}>
            {headline}
          </p>
        </div>
      </div>

      {alerts.length > 1 && (
        <span
          className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full relative"
          style={{ background: style.chipBg, color: style.chipFg }}
        >
          +{alerts.length - 1}
        </span>
      )}

      <ChevronRight size={14} className="shrink-0 opacity-50 group-hover:opacity-90 transition-opacity relative" style={{ color: style.fg }} />
    </motion.button>
  );
}
