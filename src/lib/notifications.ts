

import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  type Options as PluginOptions,
} from "@tauri-apps/plugin-notification";
import { isLinux, isMacOS, isWindows } from "./platform";

export type PermissionState = "unknown" | "granted" | "denied" | "prompt";

const listeners = new Set<(s: PermissionState) => void>();
let cachedPermission: PermissionState = "unknown";
let permissionInflight: Promise<PermissionState> | null = null;

function setPermission(next: PermissionState) {
  if (cachedPermission === next) return;
  cachedPermission = next;
  listeners.forEach((cb) => cb(next));
}

export function getPermission(): PermissionState {
  return cachedPermission;
}

export function onPermissionChange(cb: (s: PermissionState) => void): () => void {
  listeners.add(cb);
  cb(cachedPermission);
  return () => listeners.delete(cb);
}


export async function refreshPermission(): Promise<PermissionState> {
  try {
    const granted = await isPermissionGranted();
    const state: PermissionState = granted ? "granted" : "prompt";
    setPermission(state);
    return state;
  } catch {


    setPermission("denied");
    return "denied";
  }
}


export async function ensurePermission(): Promise<PermissionState> {
  if (cachedPermission === "granted") return "granted";
  if (permissionInflight) return permissionInflight;

  permissionInflight = (async () => {
    try {
      let granted = await isPermissionGranted();
      if (!granted) {
        const perm = await requestPermission();
        granted = perm === "granted";
        const state: PermissionState = granted
          ? "granted"
          : perm === "denied"
            ? "denied"
            : "prompt";
        setPermission(state);
        return state;
      }
      setPermission("granted");
      return "granted";
    } catch {
      setPermission("denied");
      return "denied";
    } finally {
      permissionInflight = null;
    }
  })();

  return permissionInflight;
}

export interface NotifyInput {
  title: string;
  body: string;

  icon?: string;
}


export async function notify(input: NotifyInput): Promise<boolean> {
  const perm = await ensurePermission();
  if (perm !== "granted") return false;

  const opts: PluginOptions = {
    title: clip(input.title, 120),
    body: clip(input.body, 240),
    ...(input.icon ? { icon: input.icon } : {}),
  };

  try {
    await sendNotification(opts);
    return true;
  } catch (err) {

    console.warn("[notify] sendNotification failed", err);

    void refreshPermission();
    return false;
  }
}


export async function notifyMany(
  inputs: NotifyInput[],
  summary: (count: number, firstTitle: string) => NotifyInput,
): Promise<number> {
  if (inputs.length === 0) return 0;
  if (inputs.length <= 3) {
    let ok = 0;
    for (const n of inputs) {
      if (await notify(n)) ok += 1;
    }
    return ok;
  }
  const sent = await notify(summary(inputs.length, inputs[0].title));
  return sent ? 1 : 0;
}

export async function sendTestNotification(message: NotifyInput): Promise<{
  ok: boolean;
  permission: PermissionState;
  hint?: string;
}> {
  const perm = await ensurePermission();
  if (perm !== "granted") {
    return { ok: false, permission: perm, hint: permissionHint(perm) };
  }
  const ok = await notify(message);
  if (!ok) {
    return {
      ok: false,
      permission: cachedPermission,
      hint: deliveryHint(),
    };
  }
  return { ok: true, permission: "granted" };
}

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function permissionHint(state: PermissionState): string {
  if (isMacOS()) {
    return state === "denied"
      ? "macOS notifications are disabled. Open System Settings → Notifications → ZWeather to allow."
      : "macOS may have suppressed the prompt. Try again, or grant access in System Settings → Notifications.";
  }
  if (isWindows()) {
    return state === "denied"
      ? "Windows notifications are disabled. Open Settings → System → Notifications → ZWeather to allow."
      : "Windows may have suppressed the prompt. Check Focus assist and Notifications settings.";
  }
  if (isLinux()) {
    return "Linux requires a running notification daemon (e.g. dunst, mako, the GNOME/KDE built-in). If you don't see toasts, install or start one.";
  }
  return "Notifications were not granted.";
}

function deliveryHint(): string {
  if (isMacOS()) {
    return "Send failed. In dev mode (pnpm tauri dev) macOS often blocks notifications because the running binary is not the signed bundle — install via `pnpm tauri build` to verify.";
  }
  if (isWindows()) {
    return "Send failed. Windows requires the app's AppUserModelID to be registered — this only happens for the installed/bundled build, not a dev run.";
  }
  if (isLinux()) {
    return "Send failed. Make sure a notification daemon is running (dunst / mako / GNOME / KDE).";
  }
  return "Send failed.";
}
