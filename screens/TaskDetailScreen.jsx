import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import {
  useTask,
  addTask,
  updateTask,
  deleteTask,
  duplicateTask,
  archiveTask,
  restoreTask,
  updateOccurrence,
} from "../store/tasksStore";
import { createRecurringTemplate, editRecurringSeries, useRecurringTemplates } from "../store/recurringStore";
import { createNewTask } from "../lib/schemas";
import NotesEditor from "../components/NotesEditor";
import ChecklistEditor from "../components/ChecklistEditor";
import TagInput from "../components/TagInput";
import CategoryPicker from "../components/CategoryPicker";
import PrioritySelector from "../components/PrioritySelector";
import RecurrencePicker from "../components/RecurrencePicker";

function formatDateTime(iso) {
  if (!iso) return "Not set";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function SectionLabel({ children, colors }) {
  return (
    <Text style={{ color: colors.textSecondary }} className="font-heading text-[11px] uppercase tracking-wide mb-2 mt-5">
      {children}
    </Text>
  );
}

function FieldRow({ icon, label, value, onPress, colors, danger }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl border px-4 py-3.5 mb-2 min-h-[44px]"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-center">
        <Ionicons name={icon} size={16} color={danger ? colors.danger : colors.textTertiary} />
        <Text style={{ color: colors.textPrimary }} className="font-body text-[14px] ml-2.5">
          {label}
        </Text>
      </View>
      <Text style={{ color: danger ? colors.danger : colors.textSecondary }} className="font-body text-[13px]">
        {value}
      </Text>
    </Pressable>
  );
}

function ScopeSheet({ visible, onSelect, onCancel, colors }) {
  const options = [
    { key: "this", label: "This task only", desc: "Only this occurrence changes" },
    { key: "future", label: "This and future", desc: "Splits the series from here on" },
    { key: "all", label: "All occurrences", desc: "Every occurrence in this series" },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: colors.overlay }}
      >
        <View className="w-full rounded-3xl border p-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text style={{ color: colors.textPrimary }} className="font-heading text-[15px] px-3 pt-3 pb-2">
            Apply this change to…
          </Text>
          {options.map((opt) => (
            <Pressable key={opt.key} onPress={() => onSelect(opt.key)} className="px-3 py-3 rounded-2xl">
              <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px]">
                {opt.label}
              </Text>
              <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mt-0.5">
                {opt.desc}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={onCancel} className="px-3 py-3 mt-1">
            <Text style={{ color: colors.textTertiary }} className="font-heading text-[13px] text-center">
              Cancel
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function TaskDetailScreen({ route, navigation }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = route.params || {};
  const initialParamTask = params.task || null;
  const isVirtual = !!initialParamTask?.id?.startsWith?.("virtual_");

  const liveTask = useTask(!isVirtual ? initialParamTask?.id : null);
  const sourceTask = isVirtual ? initialParamTask : liveTask;
  const isNew = !initialParamTask;

  const [draft, setDraft] = useState(() => {
    if (initialParamTask) return { ...initialParamTask };
    return createNewTask({
      categoryId: params.initialCategoryId ?? null,
      dueDate: params.initialDueDate ?? null,
    });
  });
  const [recurrenceDraft, setRecurrenceDraft] = useState(null); // only used when creating a NEW recurring task
  const [isDirty, setIsDirty] = useState(false);
  const [scopeSheetVisible, setScopeSheetVisible] = useState(false);
  const pendingChangeRef = useRef(null);
  const saveTimer = useRef(null);

  const templates = useRecurringTemplates();
  const seriesTemplate = sourceTask?.recurringTemplateId
    ? templates.find((t) => t.id === sourceTask.recurringTemplateId)
    : null;

  // Keep the draft in sync if the underlying live task changes from elsewhere
  // (e.g. completed via swipe on the dashboard while this screen is mounted).
  useEffect(() => {
    if (sourceTask && !isDirty) {
      setDraft({ ...sourceTask });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceTask?.updatedAt]);

  const patchDraft = useCallback((patch) => {
    setIsDirty(true);
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  // Stable onChange handlers for the heavier child editors (NotesEditor
  // especially — see its own React.memo(Block) fix) so a stable prop
  // reference actually reaches them instead of a new arrow function created
  // on every keystroke-driven re-render of this screen.
  const handleNotesChange = useCallback((notes) => patchDraft({ notes }), [patchDraft]);
  const handleChecklistChange = useCallback((checklist) => patchDraft({ checklist }), [patchDraft]);
  const handleTagsChange = useCallback((tags) => patchDraft({ tags }), [patchDraft]);

  const commitPlainEdit = useCallback(
    (nextDraft) => {
      if (isNew) return; // new tasks are committed explicitly on first save, not auto-saved
      if (seriesTemplate) return; // recurring series edits go through the scope sheet instead
      if (isVirtual) {
        updateOccurrence(sourceTask, nextDraft);
      } else {
        updateTask(nextDraft.id, nextDraft);
      }
      setIsDirty(false);
    },
    [isNew, seriesTemplate, isVirtual, sourceTask]
  );

  // Debounced auto-save for plain (non-recurring) tasks — mirrors a modern
  // notes app's autosave. Recurring-series edits are committed explicitly
  // through the scope sheet instead (see requestScopedSave).
  useEffect(() => {
    if (isNew || seriesTemplate) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => commitPlainEdit(draft), 500);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function requestScopedSave() {
    pendingChangeRef.current = { ...draft };
    setScopeSheetVisible(true);
  }

  function handleScopeSelected(scope) {
    setScopeSheetVisible(false);
    const changes = pendingChangeRef.current;
    if (!changes || !seriesTemplate) return;

    if (scope === "this") {
      updateOccurrence(sourceTask, changes);
    } else {
      editRecurringSeries(seriesTemplate.id, sourceTask.occurrenceDate, scope, {
        title: changes.title,
        description: changes.description,
        notes: changes.notes,
        checklist: changes.checklist,
        priority: changes.priority,
        categoryId: changes.categoryId,
        tags: changes.tags,
        estimatedMinutes: changes.estimatedMinutes,
      });
    }
    setIsDirty(false);
    navigation.goBack();
  }

  function handleCreateSave() {
    if (!draft.title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (recurrenceDraft) {
      createRecurringTemplate({
        title: draft.title,
        description: draft.description,
        notes: draft.notes,
        checklist: draft.checklist,
        categoryId: draft.categoryId,
        priority: draft.priority,
        tags: draft.tags,
        estimatedMinutes: draft.estimatedMinutes,
        recurrence: recurrenceDraft,
        startDate: draft.dueDate || new Date().toISOString(),
      });
    } else {
      addTask(draft);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }

  function handleDelete() {
    if (!isNew && sourceTask && !isVirtual) deleteTask(sourceTask.id);
    navigation.goBack();
  }

  function handleDuplicate() {
    if (sourceTask && !isVirtual) {
      duplicateTask(sourceTask.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function handleArchiveToggle() {
    if (!sourceTask || isVirtual) return;
    if (sourceTask.status === "archived") restoreTask(sourceTask.id);
    else archiveTask(sourceTask.id);
    navigation.goBack();
  }

  // Date editing is done as a chained date -> time flow using single-mode
  // pickers, rather than trusting mode="datetime" to behave identically
  // cross-platform (Android's native picker is date-only or time-only by
  // OS convention; chaining is the option verified safe on both platforms).
  const [dateStage, setDateStage] = useState(null); // { target: "start"|"due", stage: "date"|"time" } | null

  function openDatePicker(target) {
    setDateStage({ target, stage: "date" });
  }

  function onDateStagePicked(event, selected) {
    if (event.type === "dismissed" || !selected || !dateStage) {
      setDateStage(null);
      return;
    }
    const field = dateStage.target === "start" ? "startDate" : "dueDate";
    const existing = draft[field] ? new Date(draft[field]) : new Date();

    if (dateStage.stage === "date") {
      const merged = new Date(selected);
      merged.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
      patchDraft({ [field]: merged.toISOString() });
      setDateStage({ target: dateStage.target, stage: "time" });
    } else {
      const base = draft[field] ? new Date(draft[field]) : new Date();
      base.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      patchDraft({ [field]: base.toISOString() });
      setDateStage(null);
    }
  }

  const checklistDone = draft.checklist.filter((c) => c.done).length;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgApp, paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <Text style={{ color: colors.textSecondary }} className="font-body text-[12px]">
          {isNew ? "New task" : isDirty ? "Editing…" : "Saved"}
        </Text>

        <View className="flex-row items-center">
          {!isNew && !isVirtual && (
            <>
              <Pressable onPress={handleDuplicate} hitSlop={10} className="w-10 h-10 items-center justify-center">
                <Ionicons name="copy-outline" size={19} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={handleArchiveToggle} hitSlop={10} className="w-10 h-10 items-center justify-center">
                <Ionicons
                  name={sourceTask?.status === "archived" ? "arrow-undo-outline" : "archive-outline"}
                  size={19}
                  color={colors.textSecondary}
                />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={10} className="w-10 h-10 items-center justify-center">
                <Ionicons name="trash-outline" size={19} color={colors.danger} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView className="px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <TextInput
            value={draft.title}
            onChangeText={(t) => patchDraft({ title: t })}
            placeholder="Task title"
            placeholderTextColor={colors.textTertiary}
            multiline
            className="font-display text-[24px] mt-4 mb-1"
            style={{ color: colors.textPrimary }}
          />
          <TextInput
            value={draft.description}
            onChangeText={(t) => patchDraft({ description: t })}
            placeholder="Add a short description…"
            placeholderTextColor={colors.textTertiary}
            multiline
            className="font-bodyRegular text-[14px] mb-2"
            style={{ color: colors.textSecondary }}
          />

          <View className="flex-row items-center mt-2">
            <Pressable
              onPress={() => patchDraft({ isPinned: !draft.isPinned })}
              hitSlop={8}
              className="flex-row items-center rounded-full px-3 py-2 mr-2 border"
              style={{
                backgroundColor: draft.isPinned ? colors.brandSoft : colors.surface,
                borderColor: draft.isPinned ? colors.brand : colors.border,
              }}
            >
              <Ionicons name="pin" size={13} color={draft.isPinned ? colors.brand : colors.textTertiary} />
              <Text
                className="font-heading text-[11px] ml-1"
                style={{ color: draft.isPinned ? colors.brand : colors.textTertiary }}
              >
                Pinned
              </Text>
            </Pressable>
            <Pressable
              onPress={() => patchDraft({ isFavorite: !draft.isFavorite })}
              hitSlop={8}
              className="flex-row items-center rounded-full px-3 py-2 border"
              style={{
                backgroundColor: draft.isFavorite ? colors.dangerSoft : colors.surface,
                borderColor: draft.isFavorite ? colors.danger : colors.border,
              }}
            >
              <Ionicons name="heart" size={13} color={draft.isFavorite ? colors.danger : colors.textTertiary} />
              <Text
                className="font-heading text-[11px] ml-1"
                style={{ color: draft.isFavorite ? colors.danger : colors.textTertiary }}
              >
                Favorite
              </Text>
            </Pressable>
          </View>

          <SectionLabel colors={colors}>Status</SectionLabel>
          <View className="flex-row mb-1">
            {[
              { key: "pending", label: "Pending", icon: "ellipse-outline" },
              { key: "in_progress", label: "In Progress", icon: "sync-outline" },
              { key: "completed", label: "Completed", icon: "checkmark-circle-outline" },
            ].map((s) => {
              const active = draft.status === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() =>
                    patchDraft({
                      status: s.key,
                      completedAt: s.key === "completed" ? new Date().toISOString() : null,
                    })
                  }
                  className="flex-1 mr-2 rounded-2xl py-3 items-center border min-h-[44px] justify-center"
                  style={{
                    backgroundColor: active ? colors.brandSoft : colors.surface,
                    borderColor: active ? colors.brand : colors.border,
                  }}
                >
                  <Ionicons name={s.icon} size={15} color={active ? colors.brand : colors.textTertiary} />
                  <Text className="font-heading text-[10px] mt-1" style={{ color: active ? colors.brand : colors.textTertiary }}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel colors={colors}>Priority</SectionLabel>
          <PrioritySelector value={draft.priority} onChange={(p) => patchDraft({ priority: p })} />

          <SectionLabel colors={colors}>Category</SectionLabel>
          <CategoryPicker
            value={draft.categoryId}
            onChange={(id) => patchDraft({ categoryId: id })}
            onManagePress={() => navigation.navigate("CategoryManager")}
          />

          <SectionLabel colors={colors}>Tags</SectionLabel>
          <TagInput tagIds={draft.tags} onChange={handleTagsChange} />

          <SectionLabel colors={colors}>Dates</SectionLabel>
          <FieldRow
            icon="play-outline"
            label="Start"
            value={formatDateTime(draft.startDate)}
            onPress={() => openDatePicker("start")}
            colors={colors}
          />
          <FieldRow
            icon="flag-outline"
            label="Due"
            value={formatDateTime(draft.dueDate)}
            onPress={() => openDatePicker("due")}
            colors={colors}
          />

          <SectionLabel colors={colors}>Time tracking</SectionLabel>
          <View className="flex-row">
            <View className="flex-1 mr-2 rounded-2xl border px-4 py-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text style={{ color: colors.textTertiary }} className="font-body text-[11px] mb-1">
                Estimated (min)
              </Text>
              <TextInput
                value={draft.estimatedMinutes != null ? String(draft.estimatedMinutes) : ""}
                onChangeText={(t) => patchDraft({ estimatedMinutes: t ? parseInt(t, 10) || 0 : null })}
                keyboardType="number-pad"
                placeholder="—"
                placeholderTextColor={colors.textTertiary}
                className="font-heading text-[15px]"
                style={{ color: colors.textPrimary }}
              />
            </View>
            <View className="flex-1 rounded-2xl border px-4 py-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text style={{ color: colors.textTertiary }} className="font-body text-[11px] mb-1">
                Actual (min)
              </Text>
              <TextInput
                value={draft.actualMinutes != null ? String(draft.actualMinutes) : ""}
                onChangeText={(t) => patchDraft({ actualMinutes: t ? parseInt(t, 10) || 0 : null })}
                keyboardType="number-pad"
                placeholder="—"
                placeholderTextColor={colors.textTertiary}
                className="font-heading text-[15px]"
                style={{ color: colors.textPrimary }}
              />
            </View>
          </View>

          <SectionLabel colors={colors}>
            Checklist{draft.checklist.length > 0 ? ` (${checklistDone}/${draft.checklist.length})` : ""}
          </SectionLabel>
          <ChecklistEditor items={draft.checklist} onChange={handleChecklistChange} />

          <SectionLabel colors={colors}>Repeat</SectionLabel>
          {seriesTemplate ? (
            <View className="rounded-2xl border px-4 py-3.5 mb-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text style={{ color: colors.textPrimary }} className="font-body text-[13px]">
                Part of a recurring series ({seriesTemplate.recurrence.freq})
              </Text>
              <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mt-1">
                Changes you make will ask whether to apply to this occurrence, this and future, or all.
              </Text>
            </View>
          ) : isNew ? (
            <RecurrencePicker value={recurrenceDraft} onChange={setRecurrenceDraft} />
          ) : (
            <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mb-2">
              Recurrence can only be set when a task is first created.
            </Text>
          )}

          <SectionLabel colors={colors}>Notes</SectionLabel>
          <NotesEditor value={draft.notes} onChange={handleNotesChange} />
        </ScrollView>
      </KeyboardAvoidingView>

      {(isNew || seriesTemplate) && (
        <View className="px-5 pb-6 pt-2 border-t" style={{ borderColor: colors.border, backgroundColor: colors.bgApp }}>
          <Pressable
            onPress={isNew ? handleCreateSave : requestScopedSave}
            className="rounded-2xl py-4 items-center min-h-[44px] justify-center"
            style={{ backgroundColor: colors.brand }}
          >
            <Text className="text-white font-heading text-[15px]">{isNew ? "Create Task" : "Save Changes"}</Text>
          </Pressable>
        </View>
      )}

      {dateStage && (
        <DateTimePicker
          value={
            (dateStage.target === "start" ? draft.startDate && new Date(draft.startDate) : draft.dueDate && new Date(draft.dueDate)) ||
            new Date()
          }
          mode={dateStage.stage}
          display={Platform.OS === "ios" ? (dateStage.stage === "date" ? "inline" : "spinner") : "default"}
          onChange={onDateStagePicked}
          themeVariant={colors.scheme}
        />
      )}

      <ScopeSheet
        visible={scopeSheetVisible}
        onSelect={handleScopeSelected}
        onCancel={() => setScopeSheetVisible(false)}
        colors={colors}
      />
    </View>
  );
}
