function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDueDate(iso) {
  if (!iso) return "No due date";
  const date = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isSameDay(date, now)) return `Today · ${time}`;
  if (isSameDay(date, tomorrow)) return `Tomorrow · ${time}`;

  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${dateStr} · ${time}`;
}

export function isOverdue(iso, completed) {
  if (!iso || completed) return false;
  return new Date(iso).getTime() < Date.now();
}

export function friendlyHeaderDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function greetingForHour() {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late, night owl";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Time to wind down";
}
