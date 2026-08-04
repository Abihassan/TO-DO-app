import { useSyncExternalStore, useMemo } from "react";
import { categoriesStore, tasksStore } from "../lib/db";
import { generateId } from "../lib/schemas";

function now() {
  return new Date().toISOString();
}

export function useCategories({ includeArchived = false } = {}) {
  const all = useSyncExternalStore(categoriesStore.subscribe, categoriesStore.getSnapshot);
  return useMemo(() => {
    const filtered = includeArchived ? all : all.filter((c) => !c.isArchived);
    return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [all, includeArchived]);
}

export function useCategory(id) {
  const categories = useCategories({ includeArchived: true });
  return useMemo(() => categories.find((c) => c.id === id) || null, [categories, id]);
}

export function addCategory({ name, icon, color }) {
  const all = categoriesStore.getSnapshot();
  const category = {
    id: generateId("cat"),
    name: name.trim(),
    icon: icon || "pricetag-outline",
    color: color || "#7C3AED",
    isCustom: true,
    isArchived: false,
    sortOrder: all.length,
    createdAt: now(),
  };
  categoriesStore.mutate((prev) => [...prev, category]);
  return category;
}

export function updateCategory(id, patch) {
  categoriesStore.mutate((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function reorderCategories(orderedIds) {
  categoriesStore.mutate((prev) => {
    const byId = new Map(prev.map((c) => [c.id, c]));
    return orderedIds
      .map((id, index) => (byId.has(id) ? { ...byId.get(id), sortOrder: index } : null))
      .filter(Boolean);
  });
}

/**
 * Deletes a category. Tasks referencing it are reassigned to `fallbackCategoryId`
 * (or left uncategorized if omitted) rather than silently orphaned or deleted.
 */
export function deleteCategory(id, fallbackCategoryId = null) {
  tasksStore.mutate((prev) =>
    prev.map((t) => (t.categoryId === id ? { ...t, categoryId: fallbackCategoryId, updatedAt: now() } : t))
  );
  categoriesStore.mutate((prev) => prev.filter((c) => c.id !== id));
}

export function archiveCategory(id) {
  updateCategory(id, { isArchived: true });
}

export function restoreCategory(id) {
  updateCategory(id, { isArchived: false });
}

export function countTasksByCategory(tasks) {
  const counts = {};
  for (const t of tasks) {
    if (!t.categoryId) continue;
    if (t.status === "archived") continue;
    counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
  }
  return counts;
}
