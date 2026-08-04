import { useSyncExternalStore } from "react";
import { recurringTemplatesStore, tasksStore } from "../lib/db";
import { generateId } from "../lib/schemas";
import { splitSeriesForFutureEdit } from "../lib/recurrence";

function now() {
  return new Date().toISOString();
}

export function useRecurringTemplates() {
  return useSyncExternalStore(recurringTemplatesStore.subscribe, recurringTemplatesStore.getSnapshot);
}

export function createRecurringTemplate(draft) {
  const template = {
    id: generateId("rtpl"),
    title: draft.title,
    description: draft.description || "",
    notes: draft.notes || [],
    checklist: draft.checklist || [],
    categoryId: draft.categoryId ?? null,
    priority: draft.priority || "medium",
    tags: draft.tags || [],
    estimatedMinutes: draft.estimatedMinutes ?? null,
    recurrence: draft.recurrence,
    startDate: draft.startDate,
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  };
  recurringTemplatesStore.mutate((prev) => [...prev, template]);
  return template;
}

export function deactivateRecurringTemplate(id) {
  recurringTemplatesStore.mutate((prev) =>
    prev.map((t) => (t.id === id ? { ...t, isActive: false, updatedAt: now() } : t))
  );
}

export function deleteRecurringTemplate(id, { alsoDeleteMaterialized = false } = {}) {
  if (alsoDeleteMaterialized) {
    tasksStore.mutate((prev) => prev.filter((t) => t.recurringTemplateId !== id));
  }
  recurringTemplatesStore.mutate((prev) => prev.filter((t) => t.id !== id));
}

/**
 * Applies an edit to a recurring series with the requested scope:
 *  - "all"    -> patches the template directly (affects future virtual occurrences)
 *  - "future" -> splits the series at `occurrenceDateKey` (see recurrence.js)
 *  - "this"   -> caller should use updateOccurrence() from tasksStore instead;
 *                that path materializes just the one row and doesn't touch
 *                the template at all.
 */
export function editRecurringSeries(templateId, occurrenceDateKey, scope, changes) {
  const template = recurringTemplatesStore.getSnapshot().find((t) => t.id === templateId);
  if (!template) return null;

  if (scope === "all") {
    const updated = { ...template, ...changes, updatedAt: now() };
    recurringTemplatesStore.mutate((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
    return updated;
  }

  if (scope === "future") {
    const { updatedOldTemplate, newTemplate } = splitSeriesForFutureEdit(template, occurrenceDateKey, changes);
    recurringTemplatesStore.mutate((prev) => [
      ...prev.map((t) => (t.id === templateId ? updatedOldTemplate : t)),
      newTemplate,
    ]);
    return newTemplate;
  }

  return null;
}
