

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface FreshnessBadgeProps {
  lastUpdatedMs: number;
  hasData: boolean;
  isError: boolean;
  refreshIntervalMs: number;
}

export function FreshnessBadge({
  lastUpdatedMs,
  hasData,
  isError,
  refreshIntervalMs,
}: FreshnessBadgeProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);


  if (!hasData && !isError) return null;

  const ageMs = lastUpdatedMs > 0 ? now - lastUpdatedMs : Number.POSITIVE_INFINITY;
  const offline = isError && !hasData;
  const stale = !offline && (isError || ageMs > refreshIntervalMs * 2);


  if (!offline && !stale && ageMs < 30_000) return null;

  const label = offline
    ? t("freshness.offline")
    : stale
      ? t("freshness.stale", { age: formatAge(ageMs, t) })
      : t("freshness.updated", { age: formatAge(ageMs, t) });

  const tone = offline
    ? "bg-rose-500/10 border-rose-400/25 text-rose-200"
    : stale
      ? "bg-amber-500/10 border-amber-400/25 text-amber-200"
      : "bg-white/[0.04] border-white/[0.06] text-white/55";

  const dotTone = offline
    ? "bg-rose-300"
    : stale
      ? "bg-amber-300"
      : "bg-emerald-300/70";

  return (
    <span
      className={`ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full border tabular-nums ${tone}`}
      title={offline ? t("freshness.offlineHint") : t("freshness.updatedHint", { time: new Date(lastUpdatedMs).toLocaleTimeString() })}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotTone}`} />
      <span className="text-[10px] tracking-wide">{label}</span>
    </span>
  );
}

function formatAge(ageMs: number, t: (k: string, opts?: Record<string, unknown>) => string): string {
  if (!Number.isFinite(ageMs) || ageMs < 0) return t("freshness.justNow");
  const sec = Math.floor(ageMs / 1000);
  if (sec < 60) return t("freshness.justNow");
  const min = Math.floor(sec / 60);
  if (min < 60) return t("freshness.minutesAgo", { count: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t("freshness.hoursAgo", { count: hr });
  const day = Math.floor(hr / 24);
  return t("freshness.daysAgo", { count: day });
}
