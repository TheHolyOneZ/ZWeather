import { openUrl } from "@tauri-apps/plugin-opener";

export async function openExternal(url: string): Promise<void> {
  try {
    await openUrl(url);
  } catch (err) {
    console.warn("[openExternal] tauri opener failed, falling back to window.open", err);
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {

    }
  }
}
