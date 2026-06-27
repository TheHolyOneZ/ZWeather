import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface StatItem {
  label: string;
  value: string;
  icon: ReactNode;
  accessory?: ReactNode;
}

export function StatBar({ items }: { items: StatItem[] }) {
  return (
    <div className="mt-4 rounded-2xl bg-white/[0.035] border border-white/[0.07] backdrop-blur-xl overflow-hidden flex divide-x divide-white/[0.06]">
      {items.map((item, i) => (
        <div key={i} className="flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-white/65">
            {item.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-white/45 uppercase tracking-wider truncate leading-none">{item.label}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <p className="text-[16px] font-semibold text-white/95 tabular-nums leading-none">{item.value}</p>
              {item.accessory}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendArrow({ trend }: { trend: "rising" | "falling" | "steady" }) {
  const light = typeof document !== "undefined"
    && document.documentElement.getAttribute("data-theme") === "light";
  const color =
    trend === "rising" ? (light ? "#15803d" : "#86efac")
    : trend === "falling" ? (light ? "#b91c1c" : "#fca5a5")
    : "color-mix(in srgb, var(--color-foreground) 40%, transparent)";

  if (trend === "steady") {
    return (
      <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-label="steady">
        <path d="M1 5h8M7 3l2 2-2 2" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const rising = trend === "rising";
  return (
    <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-label={trend}>
      <path
        d={rising ? "M5 9V1M2 4l3-3 3 3" : "M5 1v8M2 6l3 3 3-3"}
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UvPill({ uv }: { uv: number }) {
  const { t } = useTranslation();
  const v = Math.round(uv);
  let label: string;
  let bg: string;
  let fg: string;
  if (v < 3) { label = t("uvShort.low");           bg = "rgba(74, 222, 128, 0.14)"; fg = "#86efac"; }
  else if (v < 6) { label = t("uvShort.mod");      bg = "rgba(251, 191, 36, 0.14)"; fg = "#fcd34d"; }
  else if (v < 8) { label = t("uvShort.high");     bg = "rgba(251, 146, 60, 0.16)"; fg = "#fdba74"; }
  else if (v < 11) { label = t("uvShort.veryHigh"); bg = "rgba(248, 113, 113, 0.16)"; fg = "#fca5a5"; }
  else { label = t("uvShort.extreme");             bg = "rgba(192, 132, 252, 0.18)"; fg = "#d8b4fe"; }

  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}

export function HumidityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.8C12 2.8 5.5 10 5.5 15.3C5.5 18.9 8.4 21.5 12 21.5C15.6 21.5 18.5 18.9 18.5 15.3C18.5 10 12 2.8 12 2.8Z"
        fill="#7dd3fc" fillOpacity="0.18"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path
        d="M9 14.5C9 16.3 10.3 17.7 12 17.7"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.55"
      />
    </svg>
  );
}

export function ThermometerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 4.5a2 2 0 014 0v10a3.5 3.5 0 11-4 0v-10z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M12 7v7.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="2.4" fill="#f87171" fillOpacity="0.85" />
      <path d="M15 8h1.5M15 11h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function GaugeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3.5 17a8.5 8.5 0 0117 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 17L16.5 10.5" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.6" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4">
        <path d="M4.8 13.7l0.9 0.5" />
        <path d="M19.2 13.7l-0.9 0.5" />
        <path d="M8 10.5l0.7 0.8" />
        <path d="M16 10.5l-0.7 0.8" />
        <path d="M12 9.3v1" />
      </g>
    </svg>
  );
}

export function VisibilityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.2" fill="#fbbf24" fillOpacity="0.25" stroke="#fbbf24" strokeWidth="1.5" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2.5v2.5" />
        <path d="M12 19v2.5" />
        <path d="M2.5 12h2.5" />
        <path d="M19 12h2.5" />
        <path d="M5.2 5.2l1.8 1.8" />
        <path d="M17 17l1.8 1.8" />
        <path d="M18.8 5.2L17 7" />
        <path d="M7 17l-1.8 1.8" />
      </g>
    </svg>
  );
}
