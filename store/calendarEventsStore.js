import { useSyncExternalStore, useMemo } from "react";
import { calendarEventsStore } from "../lib/db";
import { generateId } from "../lib/schemas";

function now() {
  return new Date().toISOString();
}

export function useCalendarEvents() {
  return useSyncExternalStore(calendarEventsStore.subscribe, calendarEventsStore.getSnapshot);
}

export function useCalendarEventsInRange(startISO, endISO) {
  const all = useCalendarEvents();
  return useMemo(() => {
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    return all.filter((e) => {
      const eventStart = new Date(e.startDate).getTime();
      const eventEnd = new Date(e.endDate || e.startDate).getTime();
      return eventStart <= end && eventEnd >= start;
    });
  }, [all, startISO, endISO]);
}

export function addCalendarEvent(draft) {
  const event = {
    id: generateId("evt"),
    title: draft.title,
    description: draft.description || "",
    startDate: draft.startDate,
    endDate: draft.endDate || draft.startDate,
    allDay: !!draft.allDay,
    location: draft.location || "",
    categoryId: draft.categoryId ?? null,
    createdAt: now(),
    updatedAt: now(),
  };
  calendarEventsStore.mutate((prev) => [...prev, event]);
  return event;
}

export function updateCalendarEvent(id, patch) {
  calendarEventsStore.mutate((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: now() } : e)));
}

export function deleteCalendarEvent(id) {
  calendarEventsStore.mutate((prev) => prev.filter((e) => e.id !== id));
}

/** Moves an event to a new start date, preserving its original duration. */
export function rescheduleCalendarEvent(id, newStartISO) {
  calendarEventsStore.mutate((prev) =>
    prev.map((e) => {
      if (e.id !== id) return e;
      const duration = new Date(e.endDate || e.startDate).getTime() - new Date(e.startDate).getTime();
      const newStart = new Date(newStartISO);
      const newEnd = new Date(newStart.getTime() + Math.max(0, duration));
      return { ...e, startDate: newStart.toISOString(), endDate: newEnd.toISOString(), updatedAt: now() };
    })
  );
}
