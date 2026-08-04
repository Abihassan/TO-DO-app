import { useSyncExternalStore, useMemo } from "react";
import { notesStore } from "../lib/db";
import { generateId, createBlankNotesContent } from "../lib/schemas";

function now() {
  return new Date().toISOString();
}

export function useNotes() {
  const all = useSyncExternalStore(notesStore.subscribe, notesStore.getSnapshot);
  return useMemo(
    () => [...all].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt)),
    [all]
  );
}

export function useNote(id) {
  const notes = useNotes();
  return useMemo(() => notes.find((n) => n.id === id) || null, [notes, id]);
}

export function addNote(draft = {}) {
  const note = {
    id: generateId("note"),
    title: draft.title || "",
    content: draft.content || createBlankNotesContent(),
    tags: draft.tags || [],
    isPinned: false,
    createdAt: now(),
    updatedAt: now(),
  };
  notesStore.mutate((prev) => [note, ...prev]);
  return note;
}

export function updateNote(id, patch) {
  notesStore.mutate((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)));
}

export function deleteNote(id) {
  notesStore.mutate((prev) => prev.filter((n) => n.id !== id));
}

export function toggleNotePinned(id) {
  notesStore.mutate((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
}
