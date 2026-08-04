import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import { useTasks, useOccurrencesInRange } from "../store/tasksStore";
import { useCategories } from "../store/categoriesStore";
import { PRIORITY_ORDER, getPriorityMeta } from "../constants/theme";
import { isOverdue } from "../utils/date";
import { endOfMonth, endOfWeek, formatTimeAgo, getDayBucketKey, startOfDay, startOfMonth, startOfWeek } from "../lib/calendarMath";
import ProgressRing from "../components/ProgressRing";
import WeeklyChart from "../components/WeeklyChart";

function StatCard({ icon, label, value, color, colors }) {
  return (
    <View
      className="flex-1 rounded-2xl border px-4 py-3.5 mr-2 mb-2"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, minWidth: "47%" }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}22` }}>
          <Ionicons name={icon} size={15} color={color} />
        </View>
      </View>
      <Text style={{ color: colors.textPrimary }} className="font-display text-[22px]">
        {value}
      </Text>
      <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mt-0.5">
        {label}
      </Text>
    </View>
  );
}

function BreakdownBar({ icon, label, color, count, maxCount, colors }) {
  const pct = maxCount === 0 ? 0 : Math.max((count / maxCount) * 100, count > 0 ? 6 : 0);
  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center flex-1 mr-2">
          {icon && <Ionicons name={icon} size={13} color={color} style={{ marginRight: 6 }} />}
          <Text style={{ color: colors.textPrimary }} className="font-heading text-[12px]" numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={{ color: colors.textTertiary }} className="font-body text-[12px]">
          {count}
        </Text>
      </View>
      <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceInset }}>
        <View style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 999 }} />
      </View>
    </View>
  );
}

function ActivityRow({ task, colors }) {
  const completed = task.status === "completed";
  const timestamp = completed ? task.completedAt : task.updatedAt;
  const isNew = task.createdAt === task.updatedAt;
  const verb = completed ? "Completed" : isNew ? "Created" : "Updated";
  const icon = completed ? "checkmark-circle" : isNew ? "add-circle-outline" : "create-outline";
  const color = completed ? colors.success : colors.textTertiary;

  return (
    <View className="flex-row items-center px-5 py-2.5">
      <Ionicons name={icon} size={16} color={color} style={{ marginRight: 10 }} />
      <View className="flex-1">
        <Text style={{ color: colors.textPrimary }} className="font-body text-[13px]" numberOfLines={1}>
          {task.title || "Untitled task"}
        </Text>
        <Text style={{ color: colors.textTertiary }} className="font-body text-[11px] mt-0.5">
          {verb} · {formatTimeAgo(timestamp)}
        </Text>
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, scheme } = useAppTheme();
  const allTasks = useTasks();
  const categories = useCategories();

  const now = new Date();
  const ranges = useMemo(
    () => ({
      today: [startOfDay(now), new Date(startOfDay(now).getTime() + 86399999)],
      week: [startOfWeek(now, 1), endOfWeek(now, 1)],
      month: [startOfMonth(now), endOfMonth(now)],
      overdueWindow: [new Date(now.getTime() - 60 * 86400000), now],
      upcomingWindow: [new Date(now.getTime() + 1), new Date(now.getTime() + 7 * 86400000)],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getDayBucketKey()]
  );

  const todayOccurrences = useOccurrencesInRange(ranges.today[0].toISOString(), ranges.today[1].toISOString());
  const monthOccurrences = useOccurrencesInRange(ranges.month[0].toISOString(), ranges.month[1].toISOString());
  const overdueWindowOccurrences = useOccurrencesInRange(ranges.overdueWindow[0].toISOString(), ranges.overdueWindow[1].toISOString());
  const upcomingOccurrences = useOccurrencesInRange(ranges.upcomingWindow[0].toISOString(), ranges.upcomingWindow[1].toISOString());

  const todayCompleted = todayOccurrences.filter((t) => t.status === "completed").length;
  const overdueCount = overdueWindowOccurrences.filter((t) => isOverdue(t.dueDate, t.status === "completed")).length;
  const upcomingCount = upcomingOccurrences.filter((t) => t.status !== "completed").length;
  const completedThisMonth = monthOccurrences.filter((t) => t.status === "completed").length;

  const monthTotal = monthOccurrences.length;
  const monthPct = monthTotal === 0 ? 0 : Math.round((completedThisMonth / monthTotal) * 100);

  const activeRealTasks = useMemo(() => allTasks.filter((t) => t.status !== "archived"), [allTasks]);

  const categoryBreakdown = useMemo(() => {
    const counts = {};
    for (const t of activeRealTasks) {
      if (!t.categoryId) continue;
      counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
    }
    const withCounts = categories.map((c) => ({ ...c, count: counts[c.id] || 0 })).filter((c) => c.count > 0);
    const max = Math.max(...withCounts.map((c) => c.count), 1);
    return { rows: withCounts.sort((a, b) => b.count - a.count).slice(0, 6), max };
  }, [activeRealTasks, categories]);

  const priorityBreakdown = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const t of activeRealTasks) counts[t.priority] = (counts[t.priority] || 0) + 1;
    const max = Math.max(...Object.values(counts), 1);
    return { counts, max };
  }, [activeRealTasks]);

  const recentActivity = useMemo(
    () => [...allTasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8),
    [allTasks]
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b" style={{ borderColor: colors.border }}>
        <Text style={{ color: colors.textPrimary }} className="font-display text-[20px]">
          Insights
        </Text>
        <Pressable
          onPress={() => navigation.navigate("Settings")}
          hitSlop={8}
          className="w-9 h-9 rounded-full items-center justify-center border"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <Ionicons name="settings-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View className="flex-row flex-wrap px-5 pt-4">
          <StatCard icon="today-outline" label="Today" value={todayOccurrences.length} color={colors.brand} colors={colors} />
          <StatCard icon="arrow-forward-circle-outline" label="Upcoming (7d)" value={upcomingCount} color="#3B82F6" colors={colors} />
          <StatCard icon="alert-circle-outline" label="Overdue" value={overdueCount} color={colors.danger} colors={colors} />
          <StatCard icon="checkmark-circle-outline" label="Done today" value={todayCompleted} color={colors.success} colors={colors} />
        </View>

        <View
          className="mx-5 mt-1 mb-4 rounded-2xl border px-5 py-4 flex-row items-center justify-between"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View className="flex-1 pr-3">
            <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px]">
              Monthly progress
            </Text>
            <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mt-1">
              {completedThisMonth} of {monthTotal} tasks completed this month
            </Text>
          </View>
          <ProgressRing pct={monthPct} size={56} strokeWidth={6} />
        </View>

        <WeeklyChart />

        {categoryBreakdown.rows.length > 0 && (
          <View className="mx-5 mt-2 mb-4 rounded-2xl border px-5 py-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px] mb-3">
              By category
            </Text>
            {categoryBreakdown.rows.map((c) => (
              <BreakdownBar key={c.id} icon={c.icon} label={c.name} color={c.color} count={c.count} maxCount={categoryBreakdown.max} colors={colors} />
            ))}
          </View>
        )}

        <View className="mx-5 mb-4 rounded-2xl border px-5 py-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px] mb-3">
            By priority
          </Text>
          {PRIORITY_ORDER.slice()
            .reverse()
            .map((p) => {
              const meta = getPriorityMeta(p);
              return (
                <BreakdownBar
                  key={p}
                  icon={meta.icon}
                  label={meta.label}
                  color={meta.color}
                  count={priorityBreakdown.counts[p] || 0}
                  maxCount={priorityBreakdown.max}
                  colors={colors}
                />
              );
            })}
        </View>

        <View className="mb-2">
          <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px] mx-5 mb-1">
            Recent activity
          </Text>
          {recentActivity.length === 0 ? (
            <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mx-5">
              Nothing yet — create a task to get started.
            </Text>
          ) : (
            recentActivity.map((task) => <ActivityRow key={task.id} task={task} colors={colors} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}
