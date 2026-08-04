import { useSyncExternalStore } from "react";
import { settingsStore } from "../lib/db";

export function useSettings() {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot);
}

export function updateSettings(patch) {
  settingsStore.mutate((prev) => ({ ...prev, ...patch }));
}
