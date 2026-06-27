export interface TimeFormatOpts {
  format?: "24h" | "12h";
  withSeconds?: boolean;
}

function shifted(unix: number, offsetSeconds: number): Date {
  return new Date((unix + offsetSeconds) * 1000);
}

export function formatTimeAt(unix: number, offsetSeconds: number, opts: TimeFormatOpts = {}): string {
  if (!unix) return "—";
  const { format = "24h", withSeconds = false } = opts;
  const d = shifted(unix, offsetSeconds);
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();
  const ss = d.getUTCSeconds();
  const mmStr = String(mm).padStart(2, "0");
  const ssStr = withSeconds ? `:${String(ss).padStart(2, "0")}` : "";
  if (format === "12h") {
    const period = hh >= 12 ? "pm" : "am";
    const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return `${h12}:${mmStr}${ssStr} ${period}`;
  }
  return `${String(hh).padStart(2, "0")}:${mmStr}${ssStr}`;
}

export function formatHourLabelAt(unix: number, offsetSeconds: number, format: "24h" | "12h" = "24h"): string {
  const hh = getHourAt(unix, offsetSeconds);
  if (format === "12h") {
    if (hh === 0) return "12am";
    if (hh === 12) return "12pm";
    return hh < 12 ? `${hh}am` : `${hh - 12}pm`;
  }
  return `${String(hh).padStart(2, "0")}:00`;
}

export function getHourAt(unix: number, offsetSeconds: number): number {
  return shifted(unix, offsetSeconds).getUTCHours();
}

export function getDateAt(unix: number, offsetSeconds: number): string {
  return shifted(unix, offsetSeconds).toISOString().slice(0, 10);
}

export function nowUnixAt(offsetSeconds: number): number {
  return Math.floor(Date.now() / 1000) + offsetSeconds;
}

export function formatNowAt(offsetSeconds: number, opts: TimeFormatOpts = {}): string {
  return formatTimeAt(Date.now() / 1000, offsetSeconds, opts);
}

export function formatDateLineAt(unix: number, offsetSeconds: number, locale = "en"): string {
  const d = shifted(unix, offsetSeconds);
  return d.toLocaleDateString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDayLength(sunrise: number, sunset: number): string {
  const m = Math.round((sunset - sunrise) / 60);
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function browserOffsetSeconds(): number {
  return -new Date().getTimezoneOffset() * 60;
}

export function isDayHour(unix: number, offsetSeconds: number): boolean {
  const h = getHourAt(unix, offsetSeconds);
  return h >= 6 && h < 20;
}
