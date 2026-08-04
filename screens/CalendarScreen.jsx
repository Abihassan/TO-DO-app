import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../context/ThemeContext";
import { useOccurrencesInRange, deleteTask, toggleTaskComplete } from "../store/tasksStore";
import { getPriorityMeta } from "../constants/theme";
import {
  addDays,
  addMonths,
  dateKey,
  endOfWeek,
  formatDayHeader,
  formatMonthYear,
  formatWeekRange,
  getMonthGridDays,
  isSameDay,
  startOfDay,
  startOfWeek,
  weekdayShort,
} from "../lib/calendarMath";
import TaskCard from "../components/TaskCard";
import EmptyState from "../components/EmptyState";
import FAB from "../components/FAB";
import RescheduleSheet from "../components/RescheduleSheet";

const VIEW_MODES = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
];

function DayDots({ occurrences, colors }) {
  const shown = occurrences.slice(0, 3);
  return (
    <View className="flex-row items-center justify-center mt-0.5" style={{ minHeight: 6 }}>
      {shown.map((o, i) => (
        <View
          key={o.id + i}
          className="rounded-full mx-[1px]"
          style={{ width: 4, height: 4, backgroundColor: getPriorityMeta(o.priority).color }}
        />
      ))}
      {occurrences.length > 3 && (
        <Text style={{ color: colors.textTertiary, fontSize: 8 }}>+{occurrences.length - 3}</Text>
      )}
    </View>
  );
}

function MonthGrid({ selectedDate, onSelectDate, occurrencesByDay, colors }) {
  const days = useMemo(() => getMonthGridDays(selectedDate, 1), [selectedDate]);
  const visibleMonth = selectedDate.getMonth();
  const today = new Date();

  return (
    <View className="px-5">
      <View className="flex-row mb-2">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <View key={i} style={{ width: `${100 / 7}%` }} className="items-center">
            <Text style={{ color: colors.textTertiary }} className="font-heading text-[11px]">
              {d}
            </Text>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const key = dateKey(day);
          const inMonth = day.getMonth() === visibleMonth;
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const dayOccurrences = occurrencesByDay[key] || [];
          return (
            <Pressable
              key={key}
              onPress={() => onSelectDate(day)}
              style={{ width: `${100 / 7}%` }}
              className="items-center py-1.5 min-h-[44px] justify-center"
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isSelected ? colors.brand : isToday ? colors.brandSoft : "transparent",
                }}
              >
                <Text
                  className="font-heading text-[13px]"
                  style={{
                    color: isSelected ? "#FFFFFF" : !inMonth ? colors.textTertiary : isToday ? colors.brand : colors.textPrimary,
                    opacity: inMonth ? 1 : 0.4,
                  }}
                >
                  {day.getDate()}
                </Text>
              </View>
              <DayDots occurrences={dayOccurrences} colors={colors} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WeekStrip({ selectedDate, onSelectDate, occurrencesByDay, colors }) {
  const weekStart = useMemo(() => startOfWeek(selectedDate, 1), [selectedDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = new Date();

  return (
    <View className="flex-row px-5 mb-2">
      {days.map((day) => {
        const key = dateKey(day);
        const isToday = isSameDay(day, today);
        const isSelected = isSameDay(day, selectedDate);
        const count = (occurrencesByDay[key] || []).length;
        return (
          <Pressable
            key={key}
            onPress={() => onSelectDate(day)}
            style={{ width: `${100 / 7}%` }}
            className="items-center py-1 min-h-[44px] justify-center"
          >
            <Text style={{ color: colors.textTertiary }} className="font-body text-[10px] mb-1">
              {weekdayShort(day)}
            </Text>
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: isSelected ? colors.brand : isToday ? colors.brandSoft : "transparent" }}
            >
              <Text
                className="font-heading text-[13px]"
                style={{ color: isSelected ? "#FFFFFF" : isToday ? colors.brand : colors.textPrimary }}
              >
                {day.getDate()}
              </Text>
            </View>
            {count > 0 && (
              <View className="w-1 h-1 rounded-full mt-1" style={{ backgroundColor: isSelected ? colors.brand : colors.textTertiary }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, scheme } = useAppTheme();
  const [viewMode, setViewMode] = useState("month");
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [rescheduleTask, setRescheduleTask] = useState(null);
  const handleToggle = useCallback((task) => toggleTaskComplete(task), []);

  const fetchRange = useMemo(() => {
    if (viewMode === "month") {
      const days = getMonthGridDays(selectedDate, 1);
      return { start: days[0], end: days[days.length - 1] };
    }
    if (viewMode === "week") {
      return { start: startOfWeek(selectedDate, 1), end: endOfWeek(selectedDate, 1) };
    }
    return { start: startOfDay(selectedDate), end: startOfDay(selectedDate) };
  }, [viewMode, selectedDate]);

  const occurrences = useOccurrencesInRange(fetchRange.start.toISOString(), fetchRange.end.toISOString());

  const occurrencesByDay = useMemo(() => {
    const map = {};
    for (const o of occurrences) {
      if (!o.dueDate) continue;
      const key = dateKey(new Date(o.dueDate));
      if (!map[key]) map[key] = [];
      map[key].push(o);
    }
    return map;
  }, [occurrences]);

  const selectedDayTasks = useMemo(() => {
    const key = dateKey(selectedDate);
    return (occurrencesByDay[key] || []).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [occurrencesByDay, selectedDate]);

  function goToday() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(startOfDay(new Date()));
  }
  function goPrev() {
    if (viewMode === "month") setSelectedDate((d) => addMonths(d, -1));
    else if (viewMode === "week") setSelectedDate((d) => addDays(d, -7));
    else setSelectedDate((d) => addDays(d, -1));
  }
  function goNext() {
    if (viewMode === "month") setSelectedDate((d) => addMonths(d, 1));
    else if (viewMode === "week") setSelectedDate((d) => addDays(d, 7));
    else setSelectedDate((d) => addDays(d, 1));
  }

  function handleAddTask() {
    const dueDate = new Date(selectedDate);
    dueDate.setHours(9, 0, 0, 0);
    navigation.navigate("TaskDetail", { task: null, initialDueDate: dueDate.toISOString() });
  }

  const headerLabel =
    viewMode === "month"
      ? formatMonthYear(selectedDate)
      : viewMode === "week"
      ? formatWeekRange(startOfWeek(selectedDate, 1))
      : formatDayHeader(selectedDate);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View className="px-5 pt-2 pb-3 border-b" style={{ borderColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <Text style={{ color: colors.textPrimary }} className="font-display text-[20px]" numberOfLines={1}>
            {headerLabel}
          </Text>
          <View className="flex-row items-center">
            <Pressable onPress={goPrev} hitSlop={8} className="w-9 h-9 items-center justify-center">
              <Ionicons name="chevron-back" size={19} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={goToday} className="px-3 py-1.5 rounded-full border mx-1" style={{ borderColor: colors.border }}>
              <Text style={{ color: colors.textSecondary }} className="font-heading text-[11px]">
                Today
              </Text>
            </Pressable>
            <Pressable onPress={goNext} hitSlop={8} className="w-9 h-9 items-center justify-center">
              <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View className="flex-row rounded-2xl border p-1 self-start" style={{ borderColor: colors.border, backgroundColor: colors.surfaceInset }}>
          {VIEW_MODES.map((mode) => {
            const active = viewMode === mode.key;
            return (
              <Pressable
                key={mode.key}
                onPress={() => setViewMode(mode.key)}
                className="px-4 py-1.5 rounded-xl min-h-[36px] justify-center"
                style={{ backgroundColor: active ? colors.surface : "transparent" }}
              >
                <Text className="font-heading text-[12px]" style={{ color: active ? colors.brand : colors.textTertiary }}>
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {viewMode === "month" && (
          <View className="pt-3">
            <MonthGrid selectedDate={selectedDate} onSelectDate={setSelectedDate} occurrencesByDay={occurrencesByDay} colors={colors} />
          </View>
        )}
        {viewMode === "week" && (
          <View className="pt-3">
            <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} occurrencesByDay={occurrencesByDay} colors={colors} />
          </View>
        )}

        {viewMode !== "day" && (
          <View className="flex-row items-center px-5 mt-4 mb-1">
            <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px]">
              {isSameDay(selectedDate, new Date()) ? "Today" : formatDayHeader(selectedDate)}
            </Text>
            <View className="flex-1 h-[1px] ml-3" style={{ backgroundColor: colors.border }} />
          </View>
        )}

        <View className="mt-2">
          {selectedDayTasks.length === 0 ? (
            <EmptyState />
          ) : (
            selectedDayTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={deleteTask} onLongPress={setRescheduleTask} />
            ))
          )}
        </View>
      </ScrollView>

      <FAB onPress={handleAddTask} bottom={insets.bottom + 24} />

      <RescheduleSheet task={rescheduleTask} onClose={() => setRescheduleTask(null)} />
    </View>
  );
}
