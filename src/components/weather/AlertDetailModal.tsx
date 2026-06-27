import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { WeatherAlert, AlertSeverity } from "@/types/alerts";
import { SEVERITY_ORDER } from "@/types/alerts";
import { formatTimeAt } from "@/lib/time";

interface AlertDetailModalProps {
  alerts: WeatherAlert[];
  utcOffsetSeconds: number;
  timeFormat: "24h" | "12h";
  onClose: () => void;
}

const SEVERITY_COLOR: Record<AlertSeverity, { bg: string; border: string; chipBg: string; chipFg: string; label: string }> = {
  extreme:  { bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.30)",  chipBg: "rgba(239,68,68,0.28)",  chipFg: "#fee2e2", label: "#fca5a5" },
  severe:   { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.28)", chipBg: "rgba(249,115,22,0.26)", chipFg: "#ffedd5", label: "#fdba74" },
  moderate: { bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.24)", chipBg: "rgba(251,191,36,0.22)", chipFg: "#fef3c7", label: "#fcd34d" },
  minor:    { bg: "rgba(250,204,21,0.05)", border: "rgba(250,204,21,0.20)", chipBg: "rgba(250,204,21,0.18)", chipFg: "#fef9c3", label: "#fde68a" },
};

export function AlertDetailModal({ alerts, utcOffsetSeconds, timeFormat, onClose }: AlertDetailModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sorted = [...alerts].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        className="relative glass-popover rounded-2xl w-full max-w-2xl max-h-[88vh] mx-4 flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >

        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <p className="text-[18px] font-semibold text-white/95 leading-tight">{t("alerts.activeTitle")}</p>
            <p className="text-[12px] text-white/50 mt-0.5">{t("alerts.activeCount", { count: alerts.length })}</p>
          </div>
          <button
            onClick={onClose}
            title={t("dayDetail.close")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
        </div>


        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {sorted.map((a) => {
            const c = SEVERITY_COLOR[a.severity];
            return (
              <div
                key={a.id}
                className="rounded-xl p-4"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: c.chipBg, color: c.chipFg }}
                  >
                    {t(`alerts.${a.severity}`, { defaultValue: a.severity })}
                  </span>
                  <p className="text-[14px] font-semibold leading-snug" style={{ color: c.label }}>
                    {a.title}
                  </p>
                </div>

                {a.areas.length > 0 && a.areas[0] && (
                  <p className="text-[11px] text-white/55 mb-2">
                    <span className="text-white/35 uppercase tracking-wider text-[9px] mr-1">{t("alerts.affectedAreas")}</span>
                    {a.areas.join(" · ")}
                  </p>
                )}

                {(a.issued > 0 || a.expires > 0) && (
                  <div className="flex items-center gap-3 mb-2 text-[10px] text-white/45 tabular-nums">
                    {a.issued > 0 && (
                      <span>
                        <span className="text-white/30 uppercase tracking-wider mr-1">{t("alerts.issued")}</span>
                        {formatTimeAt(a.issued, utcOffsetSeconds, { format: timeFormat })}
                      </span>
                    )}
                    {a.expires > 0 && (
                      <span>
                        <span className="text-white/30 uppercase tracking-wider mr-1">{t("alerts.expires")}</span>
                        {formatTimeAt(a.expires, utcOffsetSeconds, { format: timeFormat })}
                      </span>
                    )}
                  </div>
                )}

                {a.description && (
                  <p className="text-[12px] text-white/75 leading-relaxed whitespace-pre-line">
                    {a.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
