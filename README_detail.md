# Todo — Local-First Productivity App

A complete, offline-first task and productivity manager for React Native
(Expo SDK 56). No backend, no database, no accounts — every piece of data
lives in an **in-memory cache backed by atomic JSON files** on-device, and
every feature (tasks, categories, tags, recurrence, calendar, weekly
tracking, search, analytics, CSV export) is built on that same foundation.

This document explains what every file does and, more importantly, how they
connect — so you can find your way around without having to reverse-engineer
it from scratch.

---

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo SDK 56 / React Native 0.85 / React 19.2 | Managed workflow, new architecture enabled |
| Styling | NativeWind v4 (Tailwind on native), class-based dark mode | `dark:` variants driven by `ThemeContext`, not just the OS |
| Navigation | `@react-navigation/native` + `native-stack` + `bottom-tabs` | See §5 |
| State/data | Hand-built (no Redux/Zustand) — `useSyncExternalStore` against module-level store singletons | Fine-grained reads at "thousands of tasks" scale without Context re-render cascades |
| Persistence | `expo-file-system` (SDK 56 class-based `File`/`Directory` API) | Atomic JSON file writes, no database |
| Fonts | `@expo-google-fonts/baloo-2` + `@expo-google-fonts/nunito` | Display + body faces |
| Icons | `@expo/vector-icons` (Ionicons) | |
| Dates | Hand-rolled (`lib/calendarMath.js`), no date-fns/moment | Kept dependency-free and unit-testable in plain Node |
| Sharing/export | `expo-sharing` | CSV export → native share sheet |

**Deliberately not used:** `expo-router` (removed — it forked from React
Navigation in SDK 56 and its mere presence blocks direct
`@react-navigation/*` imports), `expo-notifications` (removed per explicit
request — see §9), any backend/cloud SDK, any charting library (breakdowns
in Insights are hand-built bar lists, not a native chart dependency).

---

## 2. The core idea: in-memory cache + atomic JSON files

This is the single most important architectural decision in the app, and
almost everything else is built on top of it.

**`lib/fileSystemStore.js`** — a generic, framework-agnostic store engine.
For each entity (tasks, categories, …) it:
- Keeps an **in-memory `cache`** as the source of truth. Every read
  (`getSnapshot()`) is synchronous, straight from memory — disk is never
  touched on the read path.
- On every mutation, updates `cache` immediately (so the UI reflects the
  change instantly), notifies subscribers, and **debounces** a background
  write (500ms) so rapid edits coalesce into one disk write instead of many.
- Writes are **atomic**: write to `<name>.json.tmp` → copy the current good
  file to `<name>.json.bak` → move the temp file into place. A crash
  mid-write can't corrupt the primary file.
- On load, a corrupted primary file falls back to `.bak`; if both are bad,
  the corrupted file is **quarantined** (renamed, not deleted) and that
  entity resets to defaults. Array entities validate *per record*, so one
  malformed task drops just that task, not the whole list.
- **Self-healing writes**: if a write attempt collides with one already in
  flight, it's not silently dropped — the in-flight write's completion
  triggers an automatic retry.

This engine is unit-tested against an in-memory fake filesystem (not the
real one) — see §8.

**`lib/expoFileSystemAdapter.js`** — the real adapter, implementing the
handful of methods `fileSystemStore.js` needs (`exists`, `readText`,
`writeText`, `copy`, `moveOverwrite`, `quarantine`) using Expo SDK 56's
class-based `File`/`Directory` API. All app data lives under
`<documentDirectory>/data/`.

**`lib/db.js`** — instantiates one `fileSystemStore` per entity (9 total:
tasks, categories, tags, recurringTemplates, calendarEvents, notes,
attachments, settings — see §3), all sharing the same adapter/directory.
Exposes:
- `initDb()` — loads every store from disk; called once in `App.jsx` before
  anything renders.
- `flushDb()` — forces all pending debounced writes immediately; called on
  app background/inactive (`App.jsx`'s `AppState` listener) so an edit made
  seconds before switching apps is never lost.
- `resetAllData()` — wipes every store back to defaults (categories
  reseeded, everything else emptied), flushing immediately. Powers
  Settings' "Clear All Data".

---

## 3. Data model — `lib/schemas.js`

Nine entities. Every one has a default-value factory, a structural
validator (used by `fileSystemStore` on load), and — for array entities — a
`format`/salvage step that drops individually-invalid records rather than
failing the whole file.

- **Task** — the core entity. `title, description, notes (rich block
  array), checklist, status (pending/in_progress/completed/archived),
  priority (low/medium/high/critical), categoryId, tags, startDate, dueDate,
  estimatedMinutes, actualMinutes, attachments, links, recurringTemplateId,
  occurrenceDate, isPinned, isFavorite, completionHistory, timestamps`.
  (No `reminder` field — removed along with the notification feature.)
- **Category** — `name, icon, color, isCustom, isArchived, sortOrder`. Seeded
  with ~44 defaults (`DEFAULT_CATEGORY_ICONS` in `schemas.js`) covering
  Work/Personal/Health/Finance/etc., all editable/deletable via
  `CategoryManagerScreen`.
- **Tag** — lightweight, `name` + `color`, created ad hoc from the task
  editor (`getOrCreateTag` in `store/tagsStore.js`).
- **RecurringTemplate** — owns a recurrence rule + default field values for
  a series. See §4.
- **CalendarEvent** — `title, startDate, endDate, allDay, location,
  categoryId`. Schema + store exist; no dedicated calendar-event UI yet
  (the Calendar screen shows *tasks*, not events — see §7 limitations).
- **Note** — standalone freeform notes (not attached to a task), same rich
  block content shape as `task.notes`.
- **Attachment** — metadata only (`uri, name, type, size, taskId`). Store
  exists; no file-picker UI yet.
- **Settings** — a single object (not an array): `weekStartsOn,
  defaultSortKey, lastCsvExportAt`.

`generateId(prefix)` and `createNewTask(overrides)` (also in `schemas.js`)
are the two functions almost everything else calls to construct new
records.

---

## 4. Recurrence engine — `lib/recurrence.js`

A `RecurringTemplate` owns the rule (`daily / weekdays / weekly / monthly /
yearly / custom`, interval, weekday/monthday selection, `until`/`count`)
plus default field values. Individual occurrences are **virtual** (computed
on the fly for display, never persisted, id prefixed `virtual_`) until
they're completed or individually edited, at which point they **materialize**
into a real `Task` row (`materializeOccurrence`).

- `expandOccurrenceDates(template, rangeStart, rangeEnd)` — the date-math
  core. Handles month-length clamping (the 31st on a 30-day month lands on
  the 30th), `until`/`count` boundaries.
- `getOccurrencesInRange(tasks, templates, rangeStart, rangeEnd)` — merges
  real tasks + materialized occurrences + virtual occurrences for a date
  range, de-duplicated. **This is the single function every date-aware
  screen reads through** (Dashboard, Calendar, Weekly, Insights) — see §7.
- Edit scopes, exposed via `store/recurringStore.js`'s `editRecurringSeries`:
  - **This occurrence** → materializes just that row.
  - **This and future** → `splitSeriesForFutureEdit` caps the old template's
    `until` the day before, creates a new template from that date with the
    edit applied (same approach Google/Outlook Calendar use).
  - **All occurrences** → edits the template directly.

Tested with 26 assertions covering every frequency, boundary conditions, and
series-splitting — see §8.

---

## 5. Navigation — `navigation/RootNavigator.jsx`

```
Stack (native-stack)
 ├─ MainTabs (bottom-tabs)
 │   ├─ Tasks      → screens/DashboardScreen.jsx
 │   ├─ Calendar   → screens/CalendarScreen.jsx
 │   ├─ Weekly     → screens/WeeklyScreen.jsx
 │   └─ Insights   → screens/InsightsScreen.jsx
 ├─ TaskDetail       (modal) → screens/TaskDetailScreen.jsx
 ├─ CategoryManager  (modal) → screens/CategoryManagerScreen.jsx
 ├─ Search           (modal) → screens/SearchScreen.jsx
 └─ Settings         (modal) → screens/SettingsScreen.jsx
```

Tab bar colors/theme come from `useAppTheme()`. `TaskDetail` is reached from
almost everywhere (`TaskCard`, `SearchScreen` results, the FAB/QuickAddSheet
"more details" path) via `navigation.navigate("TaskDetail", { task })` —
`task` can be a real task, a virtual occurrence, or `null` (create mode).

---

## 6. Theming — `context/ThemeContext.jsx` + `constants/theme.js`

Light / Dark / System, persisted via `AsyncStorage` (the *only* thing
AsyncStorage is used for — all real app data goes through the file-store
engine in §2, not AsyncStorage).

- `ThemeProvider` wraps NativeWind's `useColorScheme()`. On mount, reads the
  saved preference, calls `setColorScheme()`, and only then flips
  `isThemeReady` — `App.jsx` gates rendering on this so there's no flash of
  the wrong theme.
- `useAppTheme()` — the hook nearly every component calls — returns
  `{ preference, scheme, colors, setPreference }`. `colors` is the semantic
  token object (`bgApp, surface, surfaceInset, border, textPrimary,
  textSecondary, brand, danger, …`) for raw hex values Tailwind classes
  can't reach (SVG strokes, `shadowColor`, gradients, icon `color` props).
  Tailwind's own `slate-*` scale (available by default via `theme.extend`)
  is used directly in `className` strings for everything else.
- `components/ThemeSelector.jsx` — the segmented Light/Dark/Auto control,
  `compact` prop for the header, full-size version in Settings.

---

## 7. How a screen actually gets its data — the read path

Every date-aware screen follows the same pattern, which is worth
understanding once rather than per-screen:

```
useTasks() / useOccurrencesInRange(startISO, endISO)   [store/tasksStore.js]
        │
        ├─ useSyncExternalStore(tasksStore.subscribe, tasksStore.getSnapshot)
        │        → raw, real, persisted tasks
        │
        └─ getOccurrencesInRange(tasks, templates, start, end)  [lib/recurrence.js]
                 → real tasks with dueDate in range
                 + materialized recurring occurrences
                 + virtual (not-yet-touched) recurring occurrences
                 → one merged, sorted array
```

- **`DashboardScreen`** (Tasks tab): a 44-day window (14 past / 30 future —
  narrowed from an original 240-day window that was recomputing recurrence
  expansion on every mutation, a real perf fix — see the bug-fix history in
  git/commit context if you have it). Renders via `FlatList` (not
  `ScrollView`+`.map()`) so only visible rows mount — needed for "thousands
  of tasks, no noticeable slowdown" to actually hold.
- **`CalendarScreen`**: Month/Week/Day views, fetch range depends on view
  mode (full month grid / one week / one day).
- **`WeeklyScreen`**: always exactly 7 days, grouped by day, with status
  filter chips and a sort toggle.
- **`InsightsScreen`**: several parallel range queries (today, this month,
  a 60-day overdue-detection window, next-7-days upcoming) for the stat
  cards, plus category/priority breakdowns computed over real (non-virtual)
  tasks only.
- **`SearchScreen`**: doesn't use `getOccurrencesInRange` at all — searches
  real persisted tasks directly via `lib/search.js`, debounced 200ms
  (`lib/useDebouncedValue.js`) so typing stays responsive at scale.

All of the above "now"-relative windows depend on `getDayBucketKey()`
(`lib/calendarMath.js` — returns `new Date().toDateString()`) rather than an
empty dependency array, so they refresh once a day instead of freezing
"today" at whenever the screen first mounted.

---

## 8. File-by-file reference

### Root
| File | Purpose |
|---|---|
| `App.jsx` | Entry point. Wraps `ThemeProvider` → `AppContent`, which loads fonts, calls `initDb()`, calls `flushDb()` on app background, and gates rendering (themed loading screen) until fonts+theme+data are all ready. Renders `RootNavigator`. |
| `app.json` | Expo config. `userInterfaceStyle: "automatic"` (required for System theme to see the real OS setting). No `expo-router` plugin. |
| `package.json` | Dependencies — see §1 for the notable inclusions/exclusions. |
| `babel.config.js` / `metro.config.js` | NativeWind + Reanimated babel/metro wiring. |
| `tailwind.config.js` | `darkMode: "class"`; brand colors (`grape`, `mint`, `sunshine`, etc.) under `theme.extend`. |
| `global.css` | The three `@tailwind` directives NativeWind needs. |

### `lib/` — framework-agnostic logic (most of it unit-tested)
| File | Purpose |
|---|---|
| `fileSystemStore.js` | The atomic-write store engine — §2. |
| `expoFileSystemAdapter.js` | Real filesystem adapter for the above. |
| `db.js` | Instantiates all 9 stores; `initDb`/`flushDb`/`resetAllData`. |
| `schemas.js` | Data model, defaults, validators — §3. |
| `recurrence.js` | Recurrence engine — §4. |
| `calendarMath.js` | Date grid math: week/month boundaries, month-grid generation, relative time formatting (`formatTimeAgo`), `getDayBucketKey`. |
| `csvExport.js` | Pure CSV generation: escaping, UTF-8 BOM, ISO 8601 dates, per-entity column specs. |
| `runCsvExport.js` | RN-specific glue: writes the CSV to a temp file (`expo-file-system`) and opens the share sheet (`expo-sharing`). |
| `search.js` | Matching logic for global search (title/description/notes/category/tags/date/attachments). |
| `inlineFormatting.js` | Markdown-lite parser for the notes editor's bold/italic/underline/highlight. |
| `useDebouncedValue.js` | Small reusable debounce hook (used by `SearchScreen`). |

### `store/` — React hooks + actions over `lib/db.js`
Each file pairs `useSyncExternalStore`-based read hooks with plain
(non-hook) action functions — actions are just imported and called directly
from event handlers, no dispatch/reducer layer.
| File | Exposes |
|---|---|
| `tasksStore.js` | `useTasks`, `useTask(id)`, `useOccurrencesInRange`; `addTask`, `updateTask`, `deleteTask`, `updateOccurrence` (materializes virtuals), `toggleTaskComplete`, `duplicateTask`, `archiveTask`/`restoreTask`, `bulkUpdateTasks`/`bulkDeleteTasks`. |
| `categoriesStore.js` | `useCategories`, `useCategory`; full CRUD + `countTasksByCategory`. Deleting a category reassigns its tasks rather than deleting them. |
| `tagsStore.js` | `useTags`, `getOrCreateTag`, `renameTag`, `deleteTag`, `countTasksByTag`. |
| `recurringStore.js` | `useRecurringTemplates`, `createRecurringTemplate`, `deactivateRecurringTemplate`, `deleteRecurringTemplate`, `editRecurringSeries` (this/future/all scoping). |
| `calendarEventsStore.js` | `useCalendarEvents`, `useCalendarEventsInRange`, full CRUD, `rescheduleCalendarEvent`. |
| `notesStore.js` | `useNotes`, `useNote`, full CRUD, `toggleNotePinned`. |
| `attachmentsStore.js` | `useAttachments`, `useAttachmentsForTask`, `addAttachment`, `deleteAttachment`, `reassignAttachment`. |
| `settingsStore.js` | `useSettings`, `updateSettings`. |

### `screens/`
| File | Purpose |
|---|---|
| `DashboardScreen.jsx` | Tasks tab. Category-filtered, virtualized active list + collapsible completed section + embedded `WeeklyChart`. |
| `CalendarScreen.jsx` | Month/Week/Day views; tap a day for its agenda; long-press a task to reschedule (`RescheduleSheet`). |
| `WeeklyScreen.jsx` | Full week, grouped by day, status filter chips, sort toggle, per-day + week-wide completion tracking. |
| `InsightsScreen.jsx` | Stat cards (today/upcoming/overdue/done), monthly progress ring, category/priority breakdown bars, recent-activity feed. |
| `TaskDetailScreen.jsx` | The full task editor — every field, notes, checklist, recurrence (with this/future/all scope sheet), auto-save for plain edits. |
| `CategoryManagerScreen.jsx` | Full category CRUD with icon/color pickers. |
| `SearchScreen.jsx` | Global search, debounced. |
| `SettingsScreen.jsx` | Theme selector (full), category manager shortcut, CSV export per entity, **Danger Zone → Clear All Data**. |

### `components/`
| File | Purpose |
|---|---|
| `Header.jsx` | Top bar on the Tasks tab: greeting, search/settings icons, `ThemeSelector`, today's progress badge. |
| `CategorySlider.jsx` | Horizontal category filter chips with live task-count badges. |
| `TaskCard.jsx` | The task row used everywhere (Dashboard/Calendar/Weekly/Search). `React.memo`'d — see the perf notes below. |
| `SwipeableTaskRow.jsx` | Swipe-to-edit / swipe-to-delete wrapper (`react-native-gesture-handler`), used by `TaskCard` and `CompletedSection`. |
| `CompletedSection.jsx` | Collapsible "Completed" list. |
| `NotesEditor.jsx` | Block-based rich notes editor — headings/lists/checklists/quotes/code + selection-aware bold/italic/underline/highlight toolbar. `React.memo`'d per-block. |
| `ChecklistEditor.jsx` | Subtask/checklist editor. |
| `TagInput.jsx` | Tag input with autocomplete + create-on-the-fly. |
| `PrioritySelector.jsx` | 4-level priority picker. |
| `CategoryPicker.jsx` | Category picker for the task editor. |
| `RecurrencePicker.jsx` | Frequency/interval/weekday/end-condition picker. |
| `RescheduleSheet.jsx` | "Today / Tomorrow / Next week / Pick a date" action sheet. |
| `QuickAddSheet.jsx` | Fast-capture bottom sheet from the FAB (title + category + priority), with a "more details" path into `TaskDetailScreen`. |
| `ProgressRing.jsx` | Animated SVG completion ring (Header, Insights). |
| `WeeklyChart.jsx` | 7-bar completion chart; accepts an optional `weekStart` prop so it's reused by Dashboard (fixed, current week), Insights (same), and `WeeklyScreen` (navigable). |
| `FAB.jsx` | Floating action button. |
| `ThemeSelector.jsx` | Light/Dark/Auto segmented control — §6. |
| `EmptyState.jsx` | Shared empty-state illustration. |
| `ConfettiBurst.jsx` | Celebration animation on task completion. |

### `context/`, `constants/`, `utils/`
| File | Purpose |
|---|---|
| `context/ThemeContext.jsx` | §6. |
| `constants/theme.js` | `PRIORITY_META` (4 levels), semantic `lightColors`/`darkColors` tokens, `getSoft()` helper for tinted badge backgrounds. |
| `utils/date.js` | Simple formatting (`formatDueDate`, `isOverdue`, `friendlyHeaderDate`, `greetingForHour`) — the older, simpler sibling of `lib/calendarMath.js`. |

---

## 9. Notable decisions & things intentionally *not* built yet

- **No push notifications** — removed by request. The app never used
  remote push in the first place (local-only scheduling, which is why it
  was safe under Expo Go's SDK 53+ push removal) — it's now removed
  entirely, including the `reminder` field on tasks/templates.
- **Notes editor is markdown-lite, not true WYSIWYG** — no tables or inline
  images. A native rich-text component (e.g. `@10play/tentap-editor`) would
  need on-device testing to verify safely, which wasn't available while
  building this.
- **Calendar reschedule is long-press, not drag-and-drop** — a deliberate
  call; drag gesture *feel* can't be verified without a device, and a
  plausible-but-wrong gesture implementation is worse than a reliable
  alternative that does the same job.
- **Attachment picker UI, calendar-event UI, and bulk multi-select UI**
  don't exist yet — their schemas and store CRUD functions do
  (`bulkUpdateTasks`/`bulkDeleteTasks`, `attachmentsStore`,
  `calendarEventsStore`), ready for a screen to be built on top.
- **No unified cross-field filter/sort sheet** — per-screen chips (category
  on Dashboard, status+sort on Weekly) cover the common cases instead.

---

## 10. Verification performed

Pure logic is unit-tested in plain Node (no device needed) — genuinely run,
not just asserted:

| Suite | Assertions | Covers |
|---|---|---|
| `fileSystemStore` | 17 | Atomic writes, debounce coalescing, backup recovery, total-corruption fallback + quarantine, partial-record salvage, write-failure retry, write-collision self-healing |
| `recurrence` | 26 | Every frequency, month-length clamping, `until`/`count` boundaries, virtual/materialized merge, series-splitting |
| `calendarMath` | 21 | Week/month boundaries, month-grid generation, leap years, relative time |
| `csvExport` | 12 | Comma/quote/newline escaping, BOM, CRLF, ISO 8601 dates |
| `search` | 10 | Matching across every searchable field |
| `inlineFormatting` | 11 | Bold/italic/underline/highlight parsing and toggling |

Plus, across the whole project: a full Babel syntax pass, a relative-import
resolution pass, and an AST-based check that every named/default import
matches a real export in its target module — all clean at last check (55
files, ~149 imports).

**What this can't cover**, since there's no device/simulator available in
the environment this was built in: actual on-screen rendering, gesture
feel, animation smoothness, and native module behavior (file system,
share sheet, date picker) on real iOS/Android. Test on-device before
relying on it for anything important.

---

## 11. Setup

```bash
npm install
npx expo start -c
```

If you hit a Metro bundling error referencing `Bundler.js`/`transformFile`,
that's an environment/dependency-resolution issue, not app code — delete
`node_modules` + `package-lock.json`, reinstall, and run `npx expo-doctor`
to check for version mismatches before starting again.
