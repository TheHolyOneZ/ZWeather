import { emit } from "@tauri-apps/api/event";


export const DATA_CHANGED_EVENT = "zw://data-changed";

export type DataChangedPayload = { keys: string[] };

export function broadcastDataChanged(...keys: string[]): void {
  emit(DATA_CHANGED_EVENT, { keys } satisfies DataChangedPayload).catch(() => {});
}
