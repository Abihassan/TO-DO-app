function containsQuery(text, q) {
  return typeof text === "string" && text.toLowerCase().includes(q);
}

function notesContainQuery(blocks, q) {
  if (!Array.isArray(blocks)) return false;
  return blocks.some((b) => containsQuery(b.text, q));
}

function dateMatchesQuery(iso, q) {
  if (!iso) return false;
  const d = new Date(iso);
  const variants = [
    d.toISOString().slice(0, 10), // 2026-08-05
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }).toLowerCase(), // aug 5, 2026
    d.toLocaleDateString(undefined, { month: "long", day: "numeric" }).toLowerCase(), // august 5
  ];
  return variants.some((v) => v.includes(q));
}

/**
 * @returns tasks whose title, description, notes, category name, tag names,
 *   due/start date, or attachment names match `query` (case-insensitive
 *   substring match). Each result carries a `matchedIn` array describing
 *   which field(s) matched, for a "found in: notes" style hint in the UI.
 */
export function searchTasks(tasks, { categoriesById = {}, tagsById = {}, attachmentsByTaskId = {} }, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results = [];
  for (const t of tasks) {
    const matchedIn = [];
    if (containsQuery(t.title, q)) matchedIn.push("title");
    if (containsQuery(t.description, q)) matchedIn.push("description");
    if (notesContainQuery(t.notes, q)) matchedIn.push("notes");
    if (t.categoryId && containsQuery(categoriesById[t.categoryId]?.name, q)) matchedIn.push("category");
    if ((t.tags || []).some((id) => containsQuery(tagsById[id]?.name, q))) matchedIn.push("tags");
    if (dateMatchesQuery(t.dueDate, q) || dateMatchesQuery(t.startDate, q)) matchedIn.push("date");
    if ((attachmentsByTaskId[t.id] || []).some((a) => containsQuery(a.name, q))) matchedIn.push("attachment");

    if (matchedIn.length > 0) results.push({ task: t, matchedIn });
  }
  return results;
}
