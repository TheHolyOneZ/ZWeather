

const ENABLED_KEY = "zweather.intro.enabled";
const SKIP_STREAK_KEY = "zweather.intro.skipStreak";
const AUTO_DISABLE_THRESHOLD = 3;

export function isIntroEnabled(): boolean {
  const v = localStorage.getItem(ENABLED_KEY);

  return v !== "false";
}

export function setIntroEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
  if (enabled) localStorage.setItem(SKIP_STREAK_KEY, "0");
}

function getSkipStreak(): number {
  const v = parseInt(localStorage.getItem(SKIP_STREAK_KEY) ?? "0", 10);
  return Number.isFinite(v) ? v : 0;
}

export function recordSkip(): { autoDisabled: boolean } {
  const next = getSkipStreak() + 1;
  localStorage.setItem(SKIP_STREAK_KEY, String(next));
  if (next >= AUTO_DISABLE_THRESHOLD) {
    setIntroEnabled(false);
    return { autoDisabled: true };
  }
  return { autoDisabled: false };
}

export function recordComplete(): void {
  localStorage.setItem(SKIP_STREAK_KEY, "0");
}
