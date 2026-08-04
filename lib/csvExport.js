// ---------------------------------------------------------------------------
// CSV generation. Kept dependency-free and pure so the escaping logic is
// easy to unit test — malformed CSV escaping is a classic source of subtly
// corrupted exports (a stray comma or quote in a task title silently
// shifting every column after it).
// ---------------------------------------------------------------------------

function escapeCsvField(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsQuoting = /[",\n\r]/.test(str);
  if (!needsQuoting) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * @param {object[]} rows
 * @param {{ key: string, header: string, format?: (row: object) => any }[]} columns
 * @returns {string} CSV text, CRLF line endings, UTF-8 BOM prefixed (for
 *   clean rendering of special characters when opened directly in Excel).
 */
export function toCsv(rows, columns) {
  const headerLine = columns.map((c) => escapeCsvField(c.header)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.format ? c.format(row) : row[c.key];
        return escapeCsvField(raw);
      })
      .join(",")
  );
  const BOM = "\uFEFF";
  return BOM + [headerLine, ...lines].join("\r\n") + "\r\n";
}

function isoOrEmpty(value) {
  if (!value) return "";
  try {
    return new Date(value).toISOString();
  } catch {
    return "";
  }
}

function flattenNotesToText(blocks) {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .map((b) => (b.type === "checklist" ? `[${b.checked ? "x" : " "}] ${b.text}` : b.text))
    .filter(Boolean)
    .join(" | ");
}

export function buildTaskRows(tasks, categoriesById, tagsById) {
  return tasks.map((t) => ({
    ...t,
    categoryName: t.categoryId ? categoriesById[t.categoryId]?.name || "" : "",
    tagNames: (t.tags || []).map((id) => tagsById[id]?.name).filter(Boolean).join("; "),
    notesText: flattenNotesToText(t.notes),
    checklistText: (t.checklist || []).map((c) => `[${c.done ? "x" : " "}] ${c.text}`).join(" | "),
  }));
}

export const TASK_COLUMNS = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title" },
  { key: "description", header: "Description" },
  { key: "notesText", header: "Notes" },
  { key: "checklistText", header: "Checklist" },
  { key: "status", header: "Status" },
  { key: "priority", header: "Priority" },
  { key: "categoryName", header: "Category" },
  { key: "tagNames", header: "Tags" },
  { key: "startDate", header: "Start Date", format: (r) => isoOrEmpty(r.startDate) },
  { key: "dueDate", header: "Due Date", format: (r) => isoOrEmpty(r.dueDate) },
  { key: "estimatedMinutes", header: "Estimated Minutes" },
  { key: "actualMinutes", header: "Actual Minutes" },
  { key: "isPinned", header: "Pinned" },
  { key: "isFavorite", header: "Favorite" },
  { key: "createdAt", header: "Created At", format: (r) => isoOrEmpty(r.createdAt) },
  { key: "updatedAt", header: "Updated At", format: (r) => isoOrEmpty(r.updatedAt) },
  { key: "completedAt", header: "Completed At", format: (r) => isoOrEmpty(r.completedAt) },
];

export const CATEGORY_COLUMNS = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "color", header: "Color" },
  { key: "icon", header: "Icon" },
  { key: "isCustom", header: "Custom" },
  { key: "isArchived", header: "Archived" },
  { key: "createdAt", header: "Created At", format: (r) => isoOrEmpty(r.createdAt) },
];

export const TAG_COLUMNS = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "createdAt", header: "Created At", format: (r) => isoOrEmpty(r.createdAt) },
];

export const CALENDAR_EVENT_COLUMNS = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title" },
  { key: "description", header: "Description" },
  { key: "startDate", header: "Start Date", format: (r) => isoOrEmpty(r.startDate) },
  { key: "endDate", header: "End Date", format: (r) => isoOrEmpty(r.endDate) },
  { key: "allDay", header: "All Day" },
  { key: "location", header: "Location" },
];

export const RECURRING_TEMPLATE_COLUMNS = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title" },
  { key: "freq", header: "Frequency", format: (r) => r.recurrence?.freq || "" },
  { key: "interval", header: "Interval", format: (r) => r.recurrence?.interval ?? "" },
  { key: "byWeekday", header: "Weekdays", format: (r) => (r.recurrence?.byWeekday || []).join(";") },
  { key: "byMonthday", header: "Month Day", format: (r) => r.recurrence?.byMonthday ?? "" },
  { key: "until", header: "Until", format: (r) => isoOrEmpty(r.recurrence?.until) },
  { key: "count", header: "Count", format: (r) => r.recurrence?.count ?? "" },
  { key: "startDate", header: "Start Date", format: (r) => isoOrEmpty(r.startDate) },
  { key: "isActive", header: "Active" },
];

export const NOTE_COLUMNS = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title" },
  { key: "contentText", header: "Content" },
  { key: "isPinned", header: "Pinned" },
  { key: "createdAt", header: "Created At", format: (r) => isoOrEmpty(r.createdAt) },
  { key: "updatedAt", header: "Updated At", format: (r) => isoOrEmpty(r.updatedAt) },
];

export function buildNoteRows(notes) {
  return notes.map((n) => ({ ...n, contentText: flattenNotesToText(n.content) }));
}
