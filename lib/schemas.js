// ---------------------------------------------------------------------------
// Data model: defaults, ID generation, and structural validators.
//
// Every validator has the same shape expected by fileSystemStore.js:
//   (parsed) => { valid: boolean, sanitized: any, issues: string[] }
// For array-backed entities, `sanitized` drops individually-invalid records
// rather than failing the whole file, so one bad record can't take down the
// rest of your data.
// ---------------------------------------------------------------------------

let idCounter = 0;
export function generateId(prefix = "id") {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function isString(v) {
  return typeof v === "string";
}
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function isBoolean(v) {
  return typeof v === "boolean";
}
function isNumberOrNull(v) {
  return v === null || typeof v === "number";
}
function isStringOrNull(v) {
  return v === null || typeof v === "string";
}
function isArray(v) {
  return Array.isArray(v);
}

// Generic helper: validates an array, keeping only records that pass
// `isValidRecord`, and optionally normalizing each kept record.
function arrayValidator(isValidRecord, normalize = (x) => x) {
  return (parsed) => {
    if (!Array.isArray(parsed)) {
      return { valid: false, sanitized: [], issues: ["root value is not an array"] };
    }
    const sanitized = [];
    const issues = [];
    for (const record of parsed) {
      if (record && typeof record === "object" && isValidRecord(record)) {
        sanitized.push(normalize(record));
      } else {
        issues.push(`dropped invalid record: ${JSON.stringify(record).slice(0, 120)}`);
      }
    }
    return { valid: issues.length === 0, sanitized, issues };
  };
}

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------
export const PRIORITIES = ["low", "medium", "high", "critical"];
export const STATUSES = ["pending", "in_progress", "completed", "archived"];

export const DEFAULT_CATEGORY_ICONS = {
  Personal: { icon: "person-outline", color: "#7C3AED" },
  Work: { icon: "briefcase-outline", color: "#3B82F6" },
  Business: { icon: "trending-up-outline", color: "#0EA5E9" },
  Study: { icon: "school-outline", color: "#8B5CF6" },
  College: { icon: "library-outline", color: "#6366F1" },
  School: { icon: "book-outline", color: "#6366F1" },
  Meetings: { icon: "people-outline", color: "#F59E0B" },
  Projects: { icon: "layers-outline", color: "#F97316" },
  Coding: { icon: "code-slash-outline", color: "#14B8A6" },
  Development: { icon: "terminal-outline", color: "#0D9488" },
  Design: { icon: "color-palette-outline", color: "#EC4899" },
  Marketing: { icon: "megaphone-outline", color: "#F43F5E" },
  Finance: { icon: "cash-outline", color: "#22C55E" },
  Budget: { icon: "calculator-outline", color: "#16A34A" },
  Bills: { icon: "receipt-outline", color: "#65A30D" },
  Shopping: { icon: "cart-outline", color: "#F59E0B" },
  Groceries: { icon: "basket-outline", color: "#84CC16" },
  Health: { icon: "medkit-outline", color: "#FB7185" },
  Fitness: { icon: "barbell-outline", color: "#14B8A6" },
  Diet: { icon: "nutrition-outline", color: "#22C55E" },
  Medical: { icon: "pulse-outline", color: "#EF4444" },
  Appointments: { icon: "calendar-outline", color: "#3B82F6" },
  Travel: { icon: "airplane-outline", color: "#06B6D4" },
  Events: { icon: "sparkles-outline", color: "#A855F7" },
  Family: { icon: "home-outline", color: "#F97316" },
  Friends: { icon: "people-circle-outline", color: "#EC4899" },
  Home: { icon: "home-outline", color: "#F59E0B" },
  Cleaning: { icon: "sparkles-outline", color: "#38BDF8" },
  Maintenance: { icon: "construct-outline", color: "#78716C" },
  Goals: { icon: "flag-outline", color: "#7C3AED" },
  Habits: { icon: "repeat-outline", color: "#0EA5E9" },
  Reading: { icon: "book-outline", color: "#8B5CF6" },
  Writing: { icon: "create-outline", color: "#6366F1" },
  Learning: { icon: "bulb-outline", color: "#F59E0B" },
  Research: { icon: "search-outline", color: "#0EA5E9" },
  Entertainment: { icon: "film-outline", color: "#EC4899" },
  Hobbies: { icon: "color-wand-outline", color: "#A855F7" },
  Exercise: { icon: "walk-outline", color: "#14B8A6" },
  Meditation: { icon: "leaf-outline", color: "#22C55E" },
  Journaling: { icon: "journal-outline", color: "#6366F1" },
  Birthdays: { icon: "gift-outline", color: "#F43F5E" },
  Reminders: { icon: "alarm-outline", color: "#F59E0B" },
  Calls: { icon: "call-outline", color: "#22C55E" },
  Emails: { icon: "mail-outline", color: "#3B82F6" },
  Errands: { icon: "walk-outline", color: "#84CC16" },
  Miscellaneous: { icon: "ellipsis-horizontal-outline", color: "#94A3B8" },
};

export function createDefaultCategories() {
  return Object.entries(DEFAULT_CATEGORY_ICONS).map(([name, meta], index) => ({
    id: generateId("cat"),
    name,
    icon: meta.icon,
    color: meta.color,
    isCustom: false,
    isArchived: false,
    sortOrder: index,
    createdAt: nowIso(),
  }));
}

export const validateCategories = arrayValidator(
  (r) => isNonEmptyString(r.id) && isNonEmptyString(r.name) && isString(r.icon) && isString(r.color),
  (r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon || "pricetag-outline",
    color: r.color || "#94A3B8",
    isCustom: isBoolean(r.isCustom) ? r.isCustom : true,
    isArchived: isBoolean(r.isArchived) ? r.isArchived : false,
    sortOrder: typeof r.sortOrder === "number" ? r.sortOrder : 0,
    createdAt: isString(r.createdAt) ? r.createdAt : nowIso(),
  })
);

// ---------------------------------------------------------------------------
// Tags — lightweight, created ad hoc from the task editor
// ---------------------------------------------------------------------------
export const validateTags = arrayValidator(
  (r) => isNonEmptyString(r.id) && isNonEmptyString(r.name),
  (r) => ({
    id: r.id,
    name: r.name,
    color: isString(r.color) ? r.color : "#7C3AED",
    createdAt: isString(r.createdAt) ? r.createdAt : nowIso(),
  })
);

// ---------------------------------------------------------------------------
// Recurring templates — the "rule owner". Individual occurrences are either
// virtual (computed on the fly for display) or materialized into a real Task
// once they're edited or completed. See lib/recurrence.js.
// ---------------------------------------------------------------------------
export const RECUR_FREQ = ["daily", "weekdays", "weekly", "monthly", "yearly", "custom"];

export const validateRecurringTemplates = arrayValidator(
  (r) =>
    isNonEmptyString(r.id) &&
    isNonEmptyString(r.title) &&
    r.recurrence &&
    RECUR_FREQ.includes(r.recurrence.freq),
  (r) => ({
    id: r.id,
    title: r.title,
    description: isString(r.description) ? r.description : "",
    notes: isArray(r.notes) ? r.notes : [],
    checklist: isArray(r.checklist) ? r.checklist : [],
    categoryId: isStringOrNull(r.categoryId) ? r.categoryId : null,
    priority: PRIORITIES.includes(r.priority) ? r.priority : "medium",
    tags: isArray(r.tags) ? r.tags : [],
    estimatedMinutes: isNumberOrNull(r.estimatedMinutes) ? r.estimatedMinutes : null,
    recurrence: {
      freq: r.recurrence.freq,
      interval: typeof r.recurrence.interval === "number" ? r.recurrence.interval : 1,
      byWeekday: isArray(r.recurrence.byWeekday) ? r.recurrence.byWeekday : null,
      byMonthday: typeof r.recurrence.byMonthday === "number" ? r.recurrence.byMonthday : null,
      until: isStringOrNull(r.recurrence.until) ? r.recurrence.until : null,
      count: isNumberOrNull(r.recurrence.count) ? r.recurrence.count : null,
    },
    startDate: isString(r.startDate) ? r.startDate : nowIso(),
    isActive: isBoolean(r.isActive) ? r.isActive : true,
    createdAt: isString(r.createdAt) ? r.createdAt : nowIso(),
    updatedAt: isString(r.updatedAt) ? r.updatedAt : nowIso(),
  })
);

// ---------------------------------------------------------------------------
// Task — the core entity
// ---------------------------------------------------------------------------
export function createBlankNotesContent() {
  return [{ id: generateId("blk"), type: "paragraph", text: "" }];
}

export function createNewTask(overrides = {}) {
  const now = nowIso();
  return {
    id: generateId("task"),
    title: "",
    description: "",
    notes: createBlankNotesContent(),
    checklist: [],
    status: "pending",
    priority: "medium",
    categoryId: null,
    tags: [],
    startDate: null,
    dueDate: null,
    estimatedMinutes: null,
    actualMinutes: null,
    attachments: [],
    links: [],
    recurrence: null, // set on the template, not the task itself
    recurringTemplateId: null,
    occurrenceDate: null, // for materialized recurring occurrences (yyyy-mm-dd)
    isPinned: false,
    isFavorite: false,
    completionHistory: [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

export const validateTasks = arrayValidator(
  (r) => isNonEmptyString(r.id) && isString(r.title),
  (r) => ({
    id: r.id,
    title: r.title || "Untitled task",
    description: isString(r.description) ? r.description : "",
    notes: isArray(r.notes) && r.notes.length > 0 ? r.notes : createBlankNotesContent(),
    checklist: isArray(r.checklist) ? r.checklist : [],
    status: STATUSES.includes(r.status) ? r.status : "pending",
    priority: PRIORITIES.includes(r.priority) ? r.priority : "medium",
    categoryId: isStringOrNull(r.categoryId) ? r.categoryId : null,
    tags: isArray(r.tags) ? r.tags : [],
    startDate: isStringOrNull(r.startDate) ? r.startDate : null,
    dueDate: isStringOrNull(r.dueDate) ? r.dueDate : null,
    estimatedMinutes: isNumberOrNull(r.estimatedMinutes) ? r.estimatedMinutes : null,
    actualMinutes: isNumberOrNull(r.actualMinutes) ? r.actualMinutes : null,
    attachments: isArray(r.attachments) ? r.attachments : [],
    links: isArray(r.links) ? r.links : [],
    recurrence: r.recurrence && typeof r.recurrence === "object" ? r.recurrence : null,
    recurringTemplateId: isStringOrNull(r.recurringTemplateId) ? r.recurringTemplateId : null,
    occurrenceDate: isStringOrNull(r.occurrenceDate) ? r.occurrenceDate : null,
    isPinned: isBoolean(r.isPinned) ? r.isPinned : false,
    isFavorite: isBoolean(r.isFavorite) ? r.isFavorite : false,
    completionHistory: isArray(r.completionHistory) ? r.completionHistory : [],
    createdAt: isString(r.createdAt) ? r.createdAt : nowIso(),
    updatedAt: isString(r.updatedAt) ? r.updatedAt : nowIso(),
    completedAt: isStringOrNull(r.completedAt) ? r.completedAt : null,
    archivedAt: isStringOrNull(r.archivedAt) ? r.archivedAt : null,
  })
);

// ---------------------------------------------------------------------------
// Calendar events — distinct from tasks (no checklist/priority workflow;
// primarily a time-blocked entry). Schema defined now, UI lands in Phase 2.
// ---------------------------------------------------------------------------
export const validateCalendarEvents = arrayValidator(
  (r) => isNonEmptyString(r.id) && isNonEmptyString(r.title) && isString(r.startDate),
  (r) => ({
    id: r.id,
    title: r.title,
    description: isString(r.description) ? r.description : "",
    startDate: r.startDate,
    endDate: isStringOrNull(r.endDate) ? r.endDate : r.startDate,
    allDay: isBoolean(r.allDay) ? r.allDay : false,
    location: isString(r.location) ? r.location : "",
    categoryId: isStringOrNull(r.categoryId) ? r.categoryId : null,
    createdAt: isString(r.createdAt) ? r.createdAt : nowIso(),
    updatedAt: isString(r.updatedAt) ? r.updatedAt : nowIso(),
  })
);

// ---------------------------------------------------------------------------
// Standalone notes — freeform notes not attached to a task (journal-style).
// (Every task also carries its own `notes` rich content; this is separate.)
// ---------------------------------------------------------------------------
export const validateNotes = arrayValidator(
  (r) => isNonEmptyString(r.id),
  (r) => ({
    id: r.id,
    title: isString(r.title) ? r.title : "",
    content: isArray(r.content) && r.content.length > 0 ? r.content : createBlankNotesContent(),
    tags: isArray(r.tags) ? r.tags : [],
    isPinned: isBoolean(r.isPinned) ? r.isPinned : false,
    createdAt: isString(r.createdAt) ? r.createdAt : nowIso(),
    updatedAt: isString(r.updatedAt) ? r.updatedAt : nowIso(),
  })
);

// ---------------------------------------------------------------------------
// Attachments — metadata only. The picker UI is a later phase; the schema
// and store are ready for it (referenced by id from task.attachments).
// ---------------------------------------------------------------------------
export const validateAttachments = arrayValidator(
  (r) => isNonEmptyString(r.id) && isNonEmptyString(r.uri),
  (r) => ({
    id: r.id,
    uri: r.uri,
    name: isString(r.name) ? r.name : "attachment",
    type: isString(r.type) ? r.type : "application/octet-stream",
    size: typeof r.size === "number" ? r.size : 0,
    taskId: isStringOrNull(r.taskId) ? r.taskId : null,
    createdAt: isString(r.createdAt) ? r.createdAt : nowIso(),
  })
);

// ---------------------------------------------------------------------------
// Settings — a single object, not an array.
// ---------------------------------------------------------------------------
export function createDefaultSettings() {
  return {
    weekStartsOn: 1, // Monday
    defaultSortKey: "dueDate",
    lastCsvExportAt: null,
  };
}

export function validateSettings(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { valid: false, sanitized: createDefaultSettings(), issues: ["root value is not an object"] };
  }
  const defaults = createDefaultSettings();
  const sanitized = {
    weekStartsOn: typeof parsed.weekStartsOn === "number" ? parsed.weekStartsOn : defaults.weekStartsOn,
    defaultSortKey: isString(parsed.defaultSortKey) ? parsed.defaultSortKey : defaults.defaultSortKey,
    lastCsvExportAt: isStringOrNull(parsed.lastCsvExportAt) ? parsed.lastCsvExportAt : null,
  };
  return { valid: true, sanitized, issues: [] };
}
