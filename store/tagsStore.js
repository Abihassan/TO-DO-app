import { useSyncExternalStore } from "react";
import { tagsStore, tasksStore } from "../lib/db";
import { generateId } from "../lib/schemas";

function now() {
  return new Date().toISOString();
}

export function useTags() {
  return useSyncExternalStore(tagsStore.subscribe, tagsStore.getSnapshot);
}

/** Finds an existing tag by name (case-insensitive) or creates a new one. */
export function getOrCreateTag(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = tagsStore.getSnapshot().find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;
  const tag = { id: generateId("tag"), name: trimmed, color: "#7C3AED", createdAt: now() };
  tagsStore.mutate((prev) => [...prev, tag]);
  return tag;
}

export function renameTag(id, name) {
  tagsStore.mutate((prev) => prev.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)));
}

export function deleteTag(id) {
  tasksStore.mutate((prev) => prev.map((t) => ({ ...t, tags: t.tags.filter((tagId) => tagId !== id) })));
  tagsStore.mutate((prev) => prev.filter((t) => t.id !== id));
}

export function countTasksByTag(tasks) {
  const counts = {};
  for (const t of tasks) {
    if (t.status === "archived") continue;
    for (const tagId of t.tags || []) {
      counts[tagId] = (counts[tagId] || 0) + 1;
    }
  }
  return counts;
}
