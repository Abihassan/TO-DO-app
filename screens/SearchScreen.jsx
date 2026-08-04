import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import { useTasks } from "../store/tasksStore";
import { useCategories } from "../store/categoriesStore";
import { useTags } from "../store/tagsStore";
import { useAttachments } from "../store/attachmentsStore";
import { getPriorityMeta } from "../constants/theme";
import { searchTasks } from "../lib/search";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import { formatDueDate } from "../utils/date";

const MATCH_LABELS = {
  title: "title",
  description: "description",
  notes: "notes",
  category: "category",
  tags: "tags",
  date: "date",
  attachment: "attachment",
};

function ResultRow({ result, colors, onPress }) {
  const { task, matchedIn } = result;
  const pri = getPriorityMeta(task.priority);
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border px-4 py-3.5 mx-5 mb-2 min-h-[44px]"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-start justify-between mb-1">
        <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px] flex-1 mr-2" numberOfLines={1}>
          {task.title || "Untitled task"}
        </Text>
        <View className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: pri.color }} />
      </View>
      {!!task.description && (
        <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mb-1.5" numberOfLines={1}>
          {task.description}
        </Text>
      )}
      <View className="flex-row items-center flex-wrap">
        {task.dueDate && (
          <Text style={{ color: colors.textTertiary }} className="font-body text-[11px] mr-2">
            {formatDueDate(task.dueDate)}
          </Text>
        )}
        <Text style={{ color: colors.brand }} className="font-body text-[11px]">
          Found in: {matchedIn.map((m) => MATCH_LABELS[m]).join(", ")}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [query, setQuery] = useState("");

  const tasks = useTasks();
  const categories = useCategories({ includeArchived: true });
  const tags = useTags();
  const attachments = useAttachments();

  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const tagsById = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);
  const attachmentsByTaskId = useMemo(() => {
    const map = {};
    for (const a of attachments) {
      if (!a.taskId) continue;
      if (!map[a.taskId]) map[a.taskId] = [];
      map[a.taskId].push(a);
    }
    return map;
  }, [attachments]);

  // The TextInput below is bound to `query` directly so typing itself never
  // stutters; only the (potentially expensive, over thousands of tasks and
  // their full notes content) search scan waits for typing to pause.
  const debouncedQuery = useDebouncedValue(query, 200);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return searchTasks(
      tasks.filter((t) => t.status !== "archived"),
      { categoriesById, tagsById, attachmentsByTaskId },
      debouncedQuery
    );
  }, [tasks, categoriesById, tagsById, attachmentsByTaskId, debouncedQuery]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgApp, paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View
          className="flex-1 flex-row items-center rounded-2xl border px-3.5 ml-1"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search titles, notes, tags, dates…"
            placeholderTextColor={colors.textTertiary}
            className="flex-1 py-3 ml-2 font-body text-[14px]"
            style={{ color: colors.textPrimary }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        {debouncedQuery.trim().length === 0 ? (
          <Text style={{ color: colors.textTertiary }} className="font-body text-[13px] text-center mt-10 px-10">
            Search across task titles, descriptions, notes, categories, tags, dates, and attachments.
          </Text>
        ) : results.length === 0 ? (
          <Text style={{ color: colors.textTertiary }} className="font-body text-[13px] text-center mt-10 px-10">
            No tasks match "{query}"
          </Text>
        ) : (
          <>
            <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] px-5 mb-2">
              {results.length} result{results.length === 1 ? "" : "s"}
            </Text>
            {results.map((r) => (
              <ResultRow
                key={r.task.id}
                result={r}
                colors={colors}
                onPress={() => navigation.navigate("TaskDetail", { task: r.task })}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
