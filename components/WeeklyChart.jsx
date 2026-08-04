import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useOccurrencesInRange } from "../store/tasksStore";
import { useAppTheme } from "../context/ThemeContext";
import { weekdayLabels } from "../constants/theme";
import { getDayBucketKey } from "../lib/calendarMath";

const BAR_COLORS = [
  ["#A78BFA", "#7C3AED"], ["#FFB4B4", "#FF6B6B"], ["#93C5FD", "#3B82F6"],
  ["#5EEAD4", "#14B8A6"], ["#FFE29A", "#FFC93C"], ["#86F5C0", "#22E584"],
  ["#F9A8D4", "#EC4899"],
];

const MAX_BAR_HEIGHT = 84;

function startOfWeek(date, weekStartsOn = 1) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function WeeklyChart({ weekStart: weekStartProp }) {
  const { colors, scheme } = useAppTheme();

  const weekStart = useMemo(() => weekStartProp || startOfWeek(new Date()), [weekStartProp, getDayBucketKey()]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekStart]);

  const occurrences = useOccurrencesInRange(weekStart.toISOString(), weekEnd.toISOString());

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const stats = useMemo(() => {
    return weekDays.map((day) => {
      const key = dateKey(day);
      const dayOccurrences = occurrences.filter((o) => o.dueDate && dateKey(new Date(o.dueDate)) === key);
      const completed = dayOccurrences.filter((o) => o.status === "completed").length;
      return { day: weekdayLabels[(day.getDay() + 6) % 7], date: day, total: dayOccurrences.length, completed };
    });
  }, [weekDays, occurrences]);

  const maxTotal = Math.max(...stats.map((d) => d.total), 1);
  const weekTotal = stats.reduce((sum, d) => sum + d.completed, 0);
  const isToday = (d) => dateKey(d) === dateKey(new Date());

  return (
    <View
      className="mx-5 mt-4 mb-2 rounded-2xl border px-5 py-5"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        shadowColor: colors.shadowColor,
        shadowOpacity: colors.shadowOpacity,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: scheme === "dark" ? 0 : 2,
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-slate-900 dark:text-slate-100 font-heading text-[15px]">This Week</Text>
          <Text className="text-slate-400 dark:text-slate-500 font-bodyRegular text-[12px] mt-0.5">
            {weekTotal} task{weekTotal === 1 ? "" : "s"} completed so far
          </Text>
        </View>
        <View className="bg-sunshine/20 rounded-full px-3 py-1.5">
          <Text className="text-sunshine font-heading text-[12px]">🏆 Nice!</Text>
        </View>
      </View>

      <View className="flex-row items-end justify-between" style={{ height: MAX_BAR_HEIGHT + 34 }}>
        {stats.map((d, i) => {
          const barHeight = d.total > 0 ? Math.max((d.completed / maxTotal) * MAX_BAR_HEIGHT, d.completed > 0 ? 6 : 0) : 0;
          const trackHeight = Math.max((d.total / maxTotal) * MAX_BAR_HEIGHT, d.total > 0 ? 6 : 0);
          return (
            <View key={d.day + i} className="items-center" style={{ width: 30 }}>
              <View
                className="w-full rounded-full justify-end overflow-hidden"
                style={{ height: MAX_BAR_HEIGHT, backgroundColor: colors.surfaceInset }}
              >
                <View
                  style={{
                    height: trackHeight,
                    opacity: scheme === "dark" ? 0.5 : 0.3,
                    backgroundColor: colors.borderStrong,
                    borderRadius: 999,
                  }}
                />
              </View>
              <LinearGradient
                colors={BAR_COLORS[i % BAR_COLORS.length]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={{ position: "absolute", bottom: 34, width: 16, height: barHeight, borderRadius: 999 }}
              />
              <Text
                className="font-body text-[11px] mt-2"
                style={{ color: isToday(d.date) ? colors.brand : colors.textSecondary, fontWeight: isToday(d.date) ? "700" : "400" }}
              >
                {d.day}
              </Text>
              <Text className="text-slate-900 dark:text-slate-100 font-heading text-[11px]">
                {d.completed}/{d.total}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
