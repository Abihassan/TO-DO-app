import { useSyncExternalStore, useMemo } from "react";
import { attachmentsStore } from "../lib/db";
import { generateId } from "../lib/schemas";

export function useAttachments() {
  return useSyncExternalStore(attachmentsStore.subscribe, attachmentsStore.getSnapshot);
}

export function useAttachmentsForTask(taskId) {
  const all = useAttachments();
  return useMemo(() => all.filter((a) => a.taskId === taskId), [all, taskId]);
}

export function addAttachment({ uri, name, type, size, taskId = null }) {
  const attachment = {
    id: generateId("att"),
    uri,
    name: name || "attachment",
    type: type || "application/octet-stream",
    size: size || 0,
    taskId,
    createdAt: new Date().toISOString(),
  };
  attachmentsStore.mutate((prev) => [...prev, attachment]);
  return attachment;
}

export function deleteAttachment(id) {
  attachmentsStore.mutate((prev) => prev.filter((a) => a.id !== id));
}

export function reassignAttachment(id, taskId) {
  attachmentsStore.mutate((prev) => prev.map((a) => (a.id === id ? { ...a, taskId } : a)));
}
