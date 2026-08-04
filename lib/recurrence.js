// ---------------------------------------------------------------------------
// Recurring task engine.
//
// Model: a RecurringTemplate owns a rule + default field values. Occurrences
// are computed *virtually* (on the fly, not persisted) for display, unless
// an occurrence has been individually touched — completed or edited — in
// which case it's "materialized" into a real Task row (status/completion is
// per-occurrence, so it has to live somewhere real once it diverges from
// "just follow the template").
//
// Edit scopes:
//   - "this"        -> materialize just this occurrence and edit that row.
//   - "all"         -> edit the template itself (affects every future virtual
//                       occurrence; already-materialized rows are untouched,
//                       since they've deliberately diverged from the rule).
//   - "future"      -> split the series: cap the old template's `until` the
//                       day before this occurrence, and create a new template
//                       (a copy with the edits applied) starting from this
//                       occurrence onward. Mirrors how Google/Outlook calendar
//                       handle "this and following events".
// ---------------------------------------------------------------------------

import { generateId, createNewTask } from "./schemas";

function toDateOnly(isoOrDate) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonthsClamped(date, n, targetDay) {
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const lastDayOfTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, lastDayOfTargetMonth));
  return d;
}

function addYears(date, n) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + n);
  return d;
}

/**
 * Walks forward from the template's start date and yields every date that
 * matches the recurrence rule, restricted to [rangeStart, rangeEnd] and any
 * until/count limits on the rule itself. Dates are plain Date objects at
 * local midnight (day granularity — time-of-day is applied separately from
 * the template's startDate when building the occurrence's dueDate).
 */
export function expandOccurrenceDates(template, rangeStartISO, rangeEndISO) {
  const rule = template.recurrence;
  if (!rule || !rule.freq) return [];

  const seriesStart = toDateOnly(template.startDate);
  const rangeStart = toDateOnly(rangeStartISO);
  const rangeEnd = toDateOnly(rangeEndISO);
  const until = rule.until ? toDateOnly(rule.until) : null;
  const maxCount = typeof rule.count === "number" ? rule.count : Infinity;
  const interval = Math.max(1, rule.interval || 1);

  if (rangeEnd < seriesStart) return [];
  if (until && rangeStart > until) return [];

  const results = [];
  let occurrenceIndex = 0; // 0-based index of the occurrence within the whole series

  const effectiveEnd = until && until < rangeEnd ? until : rangeEnd;

  if (rule.freq === "daily") {
    let cursor = new Date(seriesStart);
    while (cursor <= effectiveEnd && occurrenceIndex < maxCount) {
      if (cursor >= rangeStart) results.push(new Date(cursor));
      cursor = addDays(cursor, interval);
      occurrenceIndex++;
    }
  } else if (rule.freq === "weekdays") {
    let cursor = new Date(seriesStart);
    let stepCount = 0;
    while (cursor <= effectiveEnd && occurrenceIndex < maxCount) {
      const day = cursor.getDay();
      const isWeekday = day !== 0 && day !== 6;
      if (isWeekday) {
        if (stepCount % interval === 0) {
          if (cursor >= rangeStart) results.push(new Date(cursor));
          occurrenceIndex++;
        }
        stepCount++;
      }
      cursor = addDays(cursor, 1);
    }
  } else if (rule.freq === "weekly" || rule.freq === "custom") {
    const weekdays =
      Array.isArray(rule.byWeekday) && rule.byWeekday.length > 0
        ? rule.byWeekday
        : [seriesStart.getDay()];
    // Walk week-by-week from the week containing seriesStart.
    const firstWeekStart = addDays(seriesStart, -seriesStart.getDay()); // preceding Sunday
    let weekIndex = 0;
    let cursorWeekStart = new Date(firstWeekStart);
    while (cursorWeekStart <= effectiveEnd && occurrenceIndex < maxCount) {
      if (weekIndex % interval === 0) {
        const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
        for (const wd of sortedWeekdays) {
          const candidate = addDays(cursorWeekStart, wd);
          if (candidate < seriesStart) continue;
          if (candidate > effectiveEnd) break;
          if (occurrenceIndex >= maxCount) break;
          if (candidate >= rangeStart) results.push(new Date(candidate));
          occurrenceIndex++;
        }
      }
      cursorWeekStart = addDays(cursorWeekStart, 7);
      weekIndex++;
    }
  } else if (rule.freq === "monthly") {
    const targetDay = typeof rule.byMonthday === "number" ? rule.byMonthday : seriesStart.getDate();
    let monthIndex = 0;
    while (occurrenceIndex < maxCount) {
      const candidate = addMonthsClamped(seriesStart, monthIndex * interval, targetDay);
      if (candidate > effectiveEnd) break;
      if (candidate >= seriesStart && candidate >= rangeStart) results.push(new Date(candidate));
      if (candidate >= seriesStart) occurrenceIndex++;
      monthIndex++;
      if (monthIndex > 1200) break; // safety valve against pathological ranges (100 years)
    }
  } else if (rule.freq === "yearly") {
    let yearIndex = 0;
    while (occurrenceIndex < maxCount) {
      const candidate = addYears(seriesStart, yearIndex * interval);
      if (candidate > effectiveEnd) break;
      if (candidate >= rangeStart) results.push(new Date(candidate));
      occurrenceIndex++;
      yearIndex++;
      if (yearIndex > 500) break; // safety valve
    }
  }

  return results;
}

function timeOfDayFrom(isoString) {
  if (!isoString) return { hours: 9, minutes: 0 };
  const d = new Date(isoString);
  return { hours: d.getHours(), minutes: d.getMinutes() };
}

function buildVirtualOccurrence(template, occurrenceDate) {
  const { hours, minutes } = timeOfDayFrom(template.startDate);
  const due = new Date(occurrenceDate);
  due.setHours(hours, minutes, 0, 0);

  return createNewTask({
    id: `virtual_${template.id}_${dateKey(occurrenceDate)}`,
    title: template.title,
    description: template.description,
    notes: template.notes,
    checklist: (template.checklist || []).map((item) => ({ ...item, done: false })),
    priority: template.priority,
    categoryId: template.categoryId,
    tags: template.tags,
    estimatedMinutes: template.estimatedMinutes,
    dueDate: due.toISOString(),
    recurringTemplateId: template.id,
    occurrenceDate: dateKey(occurrenceDate),
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  });
}

/**
 * Returns a merged, de-duplicated list of task-shaped objects for the given
 * date range: real standalone tasks whose dueDate falls in range, real
 * materialized occurrences, and virtual (not yet materialized) occurrences
 * for every active template. Virtual occurrences carry `id` values prefixed
 * `virtual_` — they are display-only and must be materialized before they
 * can be edited or completed.
 */
export function getOccurrencesInRange(tasks, templates, rangeStartISO, rangeEndISO) {
  const materializedKeys = new Set(
    tasks.filter((t) => t.recurringTemplateId && t.occurrenceDate).map((t) => `${t.recurringTemplateId}__${t.occurrenceDate}`)
  );

  const standaloneAndMaterialized = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = toDateOnly(t.dueDate);
    return d >= toDateOnly(rangeStartISO) && d <= toDateOnly(rangeEndISO);
  });

  const virtualOccurrences = [];
  for (const template of templates) {
    if (!template.isActive) continue;
    const dates = expandOccurrenceDates(template, rangeStartISO, rangeEndISO);
    for (const date of dates) {
      const key = `${template.id}__${dateKey(date)}`;
      if (materializedKeys.has(key)) continue; // already a real row, don't double it up
      virtualOccurrences.push(buildVirtualOccurrence(template, date));
    }
  }

  return [...standaloneAndMaterialized, ...virtualOccurrences].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

/** Turns a virtual occurrence into a real, persistable Task row. */
export function materializeOccurrence(virtualOrTemplate, occurrenceDateKey, overrides = {}) {
  const base = virtualOrTemplate.id?.startsWith?.("virtual_")
    ? virtualOrTemplate
    : buildVirtualOccurrence(virtualOrTemplate, new Date(occurrenceDateKey));
  return createNewTask({
    ...base,
    id: generateId("task"),
    ...overrides,
  });
}

/**
 * Implements the "this and future occurrences" edit scope: the old template
 * stops generating on the day before `occurrenceDateKey`, and a new template
 * (starting exactly at `occurrenceDateKey`) is created with `changes` applied.
 * Returns both so the caller can persist them in one go.
 */
export function splitSeriesForFutureEdit(template, occurrenceDateKey, changes) {
  const splitDate = new Date(occurrenceDateKey);
  const dayBefore = addDays(splitDate, -1);

  const updatedOldTemplate = {
    ...template,
    recurrence: { ...template.recurrence, until: dayBefore.toISOString() },
    updatedAt: new Date().toISOString(),
  };

  const newTemplate = {
    ...template,
    ...changes,
    id: generateId("rtpl"),
    startDate: splitDate.toISOString(),
    recurrence: { ...template.recurrence, ...(changes.recurrence || {}) },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { updatedOldTemplate, newTemplate };
}

export { dateKey, toDateOnly };
