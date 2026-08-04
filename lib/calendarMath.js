const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addMonths(date, n) {
  const d = new Date(date);
  d.setDate(1); // avoid month-length overflow (e.g. Jan 31 + 1 month skipping to March)
  d.setMonth(d.getMonth() + n);
  return d;
}

export function startOfWeek(date, weekStartsOn = 1) {
  const d = startOfDay(date);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  return addDays(d, -diff);
}

export function endOfWeek(date, weekStartsOn = 1) {
  return endOfDay(addDays(startOfWeek(date, weekStartsOn), 6));
}

export function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Full calendar-grid days for a month view: complete weeks only (so the
 * grid is always a rectangle), including the leading/trailing days that
 * belong to adjacent months.
 */
export function getMonthGridDays(monthDate, weekStartsOn = 1) {
  const firstOfMonth = startOfMonth(monthDate);
  const lastOfMonth = endOfMonth(monthDate);
  const gridStart = startOfWeek(firstOfMonth, weekStartsOn);
  const gridEnd = endOfWeek(lastOfMonth, weekStartsOn);

  const days = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function formatMonthYear(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekRange(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startStr = `${MONTH_NAMES[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()}`;
  const endStr = sameMonth
    ? `${weekEnd.getDate()}`
    : `${MONTH_NAMES[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getDate()}`;
  return `${startStr}–${endStr}, ${weekEnd.getFullYear()}`;
}

export function formatDayHeader(date) {
  return `${WEEKDAY_SHORT[date.getDay()]}, ${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

export function weekdayShort(date) {
  return WEEKDAY_SHORT[date.getDay()];
}

/**
 * A cheap string that changes once per calendar day (local time) — use as a
 * useMemo dependency for "now"-relative windows (today/this-week/this-month)
 * so they refresh once a day instead of being frozen forever at mount time
 * with `useMemo(fn, [])`. Recomputing this itself is trivial (one Date +
 * one toDateString call), so it's fine to call on every render.
 */
export function getDayBucketKey() {
  return new Date().toDateString();
}

/** Relative-time formatting for activity feeds: "Just now" / "5m ago" / "3h ago" / "2d ago" / falls back to a date. */
export function formatTimeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));

  if (diffSec < 45) return "Just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}
