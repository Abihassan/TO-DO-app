import { createFileStore } from "./fileSystemStore";
import { createExpoFileSystemAdapter } from "./expoFileSystemAdapter";
import {
  validateTasks,
  validateCategories,
  validateTags,
  validateRecurringTemplates,
  validateCalendarEvents,
  validateNotes,
  validateAttachments,
  validateSettings,
  createDefaultCategories,
  createDefaultSettings,
} from "./schemas";

// A single adapter, shared by every store — each store tells it which
// filename (within the same app-private data/ directory) to operate on.
const adapter = createExpoFileSystemAdapter();

function warn(message, meta) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(`[db:${message}]`, meta || "");
  }
}

export const tasksStore = createFileStore({
  name: "tasks",
  adapter,
  defaultValue: [],
  validate: validateTasks,
  onWarning: warn,
});

export const categoriesStore = createFileStore({
  name: "categories",
  adapter,
  defaultValue: createDefaultCategories(),
  validate: validateCategories,
  onWarning: warn,
});

export const tagsStore = createFileStore({
  name: "tags",
  adapter,
  defaultValue: [],
  validate: validateTags,
  onWarning: warn,
});

export const recurringTemplatesStore = createFileStore({
  name: "recurringTemplates",
  adapter,
  defaultValue: [],
  validate: validateRecurringTemplates,
  onWarning: warn,
});

export const calendarEventsStore = createFileStore({
  name: "calendarEvents",
  adapter,
  defaultValue: [],
  validate: validateCalendarEvents,
  onWarning: warn,
});

export const notesStore = createFileStore({
  name: "notes",
  adapter,
  defaultValue: [],
  validate: validateNotes,
  onWarning: warn,
});

export const attachmentsStore = createFileStore({
  name: "attachments",
  adapter,
  defaultValue: [],
  validate: validateAttachments,
  onWarning: warn,
});

export const settingsStore = createFileStore({
  name: "settings",
  adapter,
  defaultValue: createDefaultSettings(),
  validate: validateSettings,
  onWarning: warn,
});

export const allStores = [
  tasksStore,
  categoriesStore,
  tagsStore,
  recurringTemplatesStore,
  calendarEventsStore,
  notesStore,
  attachmentsStore,
  settingsStore,
];

let initPromise = null;

/** Loads every store from disk into memory. Call once at boot, before render. */
export function initDb() {
  if (!initPromise) {
    initPromise = Promise.all(allStores.map((s) => s.load()));
  }
  return initPromise;
}

/** Forces any pending debounced writes to flush immediately. */
export function flushDb() {
  return Promise.all(allStores.map((s) => s.flush()));
}
