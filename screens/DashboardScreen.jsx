import React, { useCallback, useMemo, useState } from "react";
import { View, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../context/ThemeContext";
import { useTasks, useOccurrencesInRange, deleteTask, toggleTaskComplete } from "../store/tasksStore";
import { getDayBucketKey } from "../lib/calendarMath";
import Header from "../components/Header";
import CategorySlider from "../components/CategorySlider";
import TaskCard from "../components/TaskCard";
import CompletedSection from "../components/CompletedSection";
import EmptyState from "../components/EmptyState";
import WeeklyChart from "../components/WeeklyChart";
import FAB from "../components/FAB";
import QuickAddSheet from "../components/QuickAddSheet";
import { PRIORITY_ORDER } from "../constants/theme";

// Dashboard's active-task window. Narrowed from an earlier 60-past/180-future
// (240 days!) to 14-past/30-future: still generous enough to surface recently-
// overdue and near-term upcoming work, but a *lot* less recurrence-expansion
// work to redo on every single task mutation anywhere in the app. Genuinely
// old overdue items or farther-future planning belong on the Calendar/Search
// screens, which is exactly what those are for.
function getDashboardWindow() {
  const start = new Date();
  start.setDate(start.getDate() - 14);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + 30);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { scheme } = useAppTheme();
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  const allTasks = useTasks();
  // Depends on the day-bucket key (not []), so this window quietly refreshes
  // once a day instead of freezing "today" at whenever the app first mounted.
  const { start, end } = useMemo(getDashboardWindow, [getDayBucketKey()]);
  const datedOccurrences = useOccurrencesInRange(start, end);

  const undatedTasks = useMemo(
    () => allTasks.filter((t) => !t.dueDate && !t.recurringTemplateId && t.status !== "archived"),
    [allTasks]
  );

  const allVisible = useMemo(() => {
    const merged = [...datedOccurrences, ...undatedTasks];
    return activeCategoryId ? merged.filter((t) => t.categoryId === activeCategoryId) : merged;
  }, [datedOccurrences, undatedTasks, activeCategoryId]);

  const activeTasks = useMemo(() => {
    const list = allVisible.filter((t) => t.status !== "completed" && t.status !== "archived");
    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const aOverdue = a.dueDate && new Date(a.dueDate) < new Date();
      const bOverdue = b.dueDate && new Date(b.dueDate) < new Date();
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return PRIORITY_ORDER.indexOf(b.priority) - PRIORITY_ORDER.indexOf(a.priority);
    });
  }, [allVisible]);

  const completedTasks = useMemo(
    () => allVisible.filter((t) => t.status === "completed").sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)),
    [allVisible]
  );

  const handleDelete = useCallback((id) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteTask(id);
  }, []);

  // Stable across renders so FlatList/TaskCard don't see a "new" toggle
  // handler on every keystroke elsewhere in the app — takes the task itself
  // so the caller doesn't need to pre-bind a per-item closure.
  const handleToggle = useCallback((task) => toggleTaskComplete(task), []);

  const handleQuickAddClose = useCallback(() => {
    setQuickAddVisible(false);
  }, []);

  const handleOpenFullDetail = useCallback(
    ({ initialCategoryId }) => {
      setQuickAddVisible(false);
      navigation.navigate("TaskDetail", { task: null, initialCategoryId });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => <TaskCard task={item} onToggle={handleToggle} onDelete={handleDelete} />,
    [handleToggle, handleDelete]
  );

  const listHeader = useMemo(
    () => (
      <>
        <Header />
        <CategorySlider activeCategoryId={activeCategoryId} onSelectCategory={setActiveCategoryId} />
        <View className="h-3" />
      </>
    ),
    [activeCategoryId]
  );

  const listFooter = useMemo(
    () => (
      <>
        <CompletedSection tasks={completedTasks} onToggle={(id) => toggleTaskComplete(id)} onDelete={handleDelete} />
        <WeeklyChart />
      </>
    ),
    [completedTasks, handleDelete]
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* FlatList (not ScrollView+map) so only the visible rows + a small
          buffer are ever mounted at once — needed for "thousands of tasks,
          no noticeable slowdown" to actually hold up. Header/CategorySlider
          and Completed/WeeklyChart ride along as list header/footer so the
          whole screen still scrolls as one unit. */}
      <FlatList
        data={activeTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
      />

      <FAB onPress={() => setQuickAddVisible(true)} bottom={insets.bottom + 24} />

      <QuickAddSheet
        visible={quickAddVisible}
        onClose={handleQuickAddClose}
        onOpenDetail={handleOpenFullDetail}
        defaultCategoryId={activeCategoryId}
      />
    </View>
  );
}
