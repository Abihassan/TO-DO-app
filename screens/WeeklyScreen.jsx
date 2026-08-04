import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../context/ThemeContext";
import { useOccurrencesInRange, deleteTask, toggleTaskComplete } from "../store/tasksStore";
import {
  addDays,
  dateKey,
  endOfWeek,
  formatWeekRange,
  isSameDay,
  startOfWeek,
  weekdayShort,
} from "../lib/calendarMath";
import { isOverdue } from "../utils/date";
import TaskCard from "../components/TaskCard";
import WeeklyChart from "../components/WeeklyChart";
import RescheduleSheet from "../components/RescheduleSheet";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { key: "dueDate", label: "Time" },
  { key: "priority", label: "Priority" },
];

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

export default function WeeklyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, scheme } = useAppTheme();
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("dueDate");
  const [rescheduleTask, setRescheduleTask] = useState(null);
  const handleToggle = useCallback((task) => toggleTaskComplete(task), []);

  const weekStart = useMemo(() => startOfWeek(weekAnchor, 1), [weekAnchor]);
  const weekEnd = useMemo(() => endOfWeek(weekAnchor, 1), [weekAnchor]);
  const occurrences = useOccurrencesInRange(weekStart.toISOString(), weekEnd.toISOString());

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const dayGroups = useMemo(() => {
    return days.map((day) => {
      const key = dateKey(day);
      let dayTasks = occurrences.filter((o) => o.dueDate && dateKey(new Date(o.dueDate)) === key);

      if (statusFilter === "overdue") {
        dayTasks = dayTasks.filter((t) => isOverdue(t.dueDate, t.status === "completed"));
      } else if (statusFilter !== "all") {
        dayTasks = dayTasks.filter((t) => t.status === statusFilter);
      }

      dayTasks = [...dayTasks].sort((a, b) => {
        if (sortKey === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      const allDayTasks = occurrences.filter((o) => o.dueDate && dateKey(new Date(o.dueDate)) === key);
      const completed = allDayTasks.filter((t) => t.status === "completed").length;
      const total = allDayTasks.length;

      return { day, key, tasks: dayTasks, completed, total };
    });
  }, [days, occurrences, statusFilter, sortKey]);

  const weekTotal = dayGroups.reduce((sum, g) => sum + g.total, 0);
  const weekCompleted = dayGroups.reduce((sum, g) => sum + g.completed, 0);

  function goPrevWeek() {
    setWeekAnchor((d) => addDays(d, -7));
  }
  function goNextWeek() {
    setWeekAnchor((d) => addDays(d, 7));
  }
  function goThisWeek() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeekAnchor(new Date());
  }

  function handleAddForDay(day) {
    const due = new Date(day);
    due.setHours(9, 0, 0, 0);
    navigation.navigate("TaskDetail", { task: null, initialDueDate: due.toISOString() });
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View className="px-5 pt-2 pb-3 border-b" style={{ borderColor: colors.border }}>
        <View className="flex-row items-center justify-between">
          <Text style={{ color: colors.textPrimary }} className="font-display text-[20px]">
            {formatWeekRange(weekStart)}
          </Text>
          <View className="flex-row items-center">
            <Pressable onPress={goPrevWeek} hitSlop={8} className="w-9 h-9 items-center justify-center">
              <Ionicons name="chevron-back" size={19} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={goThisWeek} className="px-3 py-1.5 rounded-full border mx-1" style={{ borderColor: colors.border }}>
              <Text style={{ color: colors.textSecondary }} className="font-heading text-[11px]">
                This week
              </Text>
            </Pressable>
            <Pressable onPress={goNextWeek} hitSlop={8} className="w-9 h-9 items-center justify-center">
              <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <WeeklyChart weekStart={weekStart} />

        <View className="mx-5 mb-1 flex-row items-center justify-between">
          <Text style={{ color: colors.textSecondary }} className="font-body text-[12px]">
            {weekTotal === 0 ? "No tasks this week" : `${weekCompleted} of ${weekTotal} complete (${Math.round((weekCompleted / weekTotal) * 100)}%)`}
          </Text>
          <Pressable
            onPress={() => setSortKey(sortKey === "dueDate" ? "priority" : "dueDate")}
            className="flex-row items-center rounded-full px-3 py-1.5 border"
            style={{ borderColor: colors.border }}
          >
            <Ionicons name="swap-vertical-outline" size={12} color={colors.textTertiary} />
            <Text style={{ color: colors.textTertiary }} className="font-heading text-[11px] ml-1">
              {SORT_OPTIONS.find((s) => s.key === sortKey).label}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          className="mb-3 mt-2"
        >
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setStatusFilter(f.key)}
                className="px-3.5 py-2 rounded-full border min-h-[36px] justify-center"
                style={{ backgroundColor: active ? colors.brand : colors.surface, borderColor: active ? colors.brand : colors.border }}
              >
                <Text className="font-heading text-[12px]" style={{ color: active ? "#FFFFFF" : colors.textSecondary }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {dayGroups.map((group) => {
          const pct = group.total === 0 ? 0 : Math.round((group.completed / group.total) * 100);
          const today = isSameDay(group.day, new Date());
          return (
            <View key={group.key} className="mb-1">
              <View className="flex-row items-center justify-between px-5 mb-1.5 mt-3">
                <View className="flex-row items-center">
                  <Text
                    className="font-heading text-[13px]"
                    style={{ color: today ? colors.brand : colors.textPrimary }}
                  >
                    {weekdayShort(group.day)} {group.day.getDate()}
                  </Text>
                  {today && (
                    <View className="rounded-full px-2 py-0.5 ml-2" style={{ backgroundColor: colors.brandSoft }}>
                      <Text style={{ color: colors.brand }} className="font-heading text-[9px]">
                        TODAY
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center">
                  {group.total > 0 && (
                    <Text style={{ color: colors.textTertiary }} className="font-body text-[11px] mr-2">
                      {group.completed}/{group.total} · {pct}%
                    </Text>
                  )}
                  <Pressable onPress={() => handleAddForDay(group.day)} hitSlop={8} className="w-6 h-6 items-center justify-center">
                    <Ionicons name="add-circle-outline" size={17} color={colors.textTertiary} />
                  </Pressable>
                </View>
              </View>

              {group.tasks.length === 0 ? (
                <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] px-5 mb-1">
                  {group.total === 0 ? "Nothing scheduled" : "No tasks match this filter"}
                </Text>
              ) : (
                group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={deleteTask}
                    onLongPress={setRescheduleTask}
                  />
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      <RescheduleSheet task={rescheduleTask} onClose={() => setRescheduleTask(null)} />
    </View>
  );
}
