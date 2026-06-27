import { useEffect, useRef } from "react";
import type { WeatherAlert, AlertSeverity } from "@/types/alerts";
import { useSettingsStore } from "@/store/settingsStore";
import { ensurePermission, notifyMany } from "@/lib/notifications";

const SEEN_KEY = "zw-seen-alert-ids";
const MAX_SEEN_RETAINED = 200;

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    const arr = Array.from(seen).slice(-MAX_SEEN_RETAINED);
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
  } catch {

  }
}

export function useAlertNotifications(alerts: WeatherAlert[] | undefined) {
  const settings = useSettingsStore((s) => s.settings);
  const seenRef = useRef<Set<string> | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;
    if (!seenRef.current) seenRef.current = loadSeen();
    const seen = seenRef.current;

    const severityEnabled: Record<AlertSeverity, boolean> = {
      extreme: settings.notify_extreme,
      severe: settings.notify_severe,
      moderate: settings.notify_moderate,
      minor: settings.notify_minor,
    };

    const fresh = alerts.filter(
      (a) => !seen.has(a.id) && severityEnabled[a.severity],
    );
    if (fresh.length === 0) {


      let dirty = false;
      for (const a of alerts) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          dirty = true;
        }
      }
      if (dirty) saveSeen(seen);
      return;
    }

    if (runningRef.current) return;
    runningRef.current = true;

    (async () => {
      try {
        const perm = await ensurePermission();
        if (perm !== "granted") {


          return;
        }


        const ordered = [...fresh].sort(
          (a, b) =>
            SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
        );

        await notifyMany(
          ordered.map((a) => ({
            title: a.title,
            body: a.description,
          })),
          (count, firstTitle) => ({
            title: `${count} new weather alerts`,
            body: `${firstTitle} and ${count - 1} more — open ZWeather for details.`,
          }),
        );


        for (const a of ordered) seen.add(a.id);
        for (const a of alerts) seen.add(a.id);
        saveSeen(seen);
      } finally {
        runningRef.current = false;
      }
    })();
  }, [
    alerts,
    settings.notify_extreme,
    settings.notify_severe,
    settings.notify_moderate,
    settings.notify_minor,
  ]);
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  extreme: 0,
  severe: 1,
  moderate: 2,
  minor: 3,
};
