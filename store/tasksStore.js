import { useSyncExternalStore, useMemo } from "react";
import { tasksStore, recurringTemplatesStore } from "../lib/db";
import { createNewTask, generateId } from "../lib/schemas";
import { getOccurrencesInRange, materializeOccurrence } from "../lib/recurrence";

function now() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** All real (persisted) tasks — does not include virtual recurring occurrences. */
export function useTasks() {
  return useSyncExternalStore(tasksStore.subscribe, tasksStore.getSnapshot);
}

export function useTask(id) {
  const tasks = useTasks();
  return useMemo(() => tasks.find((t) => t.id === id) || null, [tasks, id]);
}

/**
 * Real + virtual task occurrences whose dueDate falls within [startISO, endISO]
 * (inclusive, day granularity) — the single source every calendar/weekly/
 * dashboard view should read from so recurring tasks show up everywhere
 * consistently.
 */
export function useOccurrencesInRange(startISO, endISO) {
  const tasks = useTasks();
  const templates = useSyncExternalStore(recurringTemplatesStore.subscribe, recurringTemplatesStore.getSnapshot);
  return useMemo(
    () => getOccurrencesInRange(tasks, templates, startISO, endISO),
    [tasks, templates, startISO, endISO]
  );
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function addTask(draft) {
  const task = createNewTask({ ...draft, createdAt: now(), updatedAt: now() });
  tasksStore.mutate((prev) => [task, ...prev]);
  return task;
}

export function updateTask(id, patch) {
  let updated = null;
  tasksStore.mutate((prev) =>
    prev.map((t) => {
      if (t.id !== id) return t;
      updated = { ...t, ...patch, updatedAt: now() };
      return updated;
    })
  );
  return updated;
}

export function deleteTask(id) {
  tasksStore.mutate((prev) => prev.filter((t) => t.id !== id));
}

/** Materializes a virtual occurrence (if needed) then applies `patch` to it. */
export function updateOccurrence(occurrenceOrId, patch) {
  const isVirtual = typeof occurrenceOrId === "object" && occurrenceOrId.id?.startsWith?.("virtual_");
  if (isVirtual) {
    const real = materializeOccurrence(occurrenceOrId, occurrenceOrId.occurrenceDate, {
      ...patch,
      updatedAt: now(),
    });
    tasksStore.mutate((prev) => [real, ...prev]);
    return real;
  }
  const id = typeof occurrenceOrId === "object" ? occurrenceOrId.id : occurrenceOrId;
  return updateTask(id, patch);
}

export function toggleTaskComplete(occurrenceOrId) {
  const isVirtual = typeof occurrenceOrId === "object" && occurrenceOrId.id?.startsWith?.("virtual_");
  const wasCompleted = typeof occurrenceOrId === "object" ? occurrenceOrId.status === "completed" : null;

  if (isVirtual) {
    // A virtual occurrence can only go from "not completed" -> "completed",
    // since it doesn't exist as a row until it's touched.
    const nowIso = now();
    return updateOccurrence(occurrenceOrId, {
      status: "completed",
      completedAt: nowIso,
      completionHistory: [...(occurrenceOrId.completionHistory || []), { date: occurrenceOrId.occurrenceDate, completedAt: nowIso }],
    });
  }

  const id = typeof occurrenceOrId === "object" ? occurrenceOrId.id : occurrenceOrId;
  let updated = null;
  tasksStore.mutate((prev) =>
    prev.map((t) => {
      if (t.id !== id) return t;
      const completing = t.status !== "completed";
      updated = {
        ...t,
        status: completing ? "completed" : "pending",
        completedAt: completing ? now() : null,
        completionHistory: completing
          ? [...t.completionHistory, { date: (t.occurrenceDate || t.dueDate || now()).slice(0, 10), completedAt: now() }]
          : t.completionHistory,
        updatedAt: now(),
      };
      return updated;
    })
  );
  return updated;
}

export function duplicateTask(id) {
  const tasks = tasksStore.getSnapshot();
  const original = tasks.find((t) => t.id === id);
  if (!original) return null;
  const copy = createNewTask({
    ...original,
    id: generateId("task"),
    title: `${original.title} (copy)`,
    status: "pending",
    completedAt: null,
    completionHistory: [],
    recurringTemplateId: null,
    occurrenceDate: null,
    createdAt: now(),
    updatedAt: now(),
  });
  tasksStore.mutate((prev) => [copy, ...prev]);
  return copy;
}

export function archiveTask(id) {
  return updateTask(id, { status: "archived", archivedAt: now() });
}

export function restoreTask(id) {
  return updateTask(id, { status: "pending", archivedAt: null });
}

export function bulkUpdateTasks(ids, patch) {
  const idSet = new Set(ids);
  tasksStore.mutate((prev) => prev.map((t) => (idSet.has(t.id) ? { ...t, ...patch, updatedAt: now() } : t)));
}

export function bulkDeleteTasks(ids) {
  const idSet = new Set(ids);
  tasksStore.mutate((prev) => prev.filter((t) => !idSet.has(t.id)));
}
