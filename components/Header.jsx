import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProgressRing from "./ProgressRing";
import ThemeSelector from "./ThemeSelector";
import { friendlyHeaderDate, greetingForHour } from "../utils/date";
import { getDayBucketKey } from "../lib/calendarMath";
import { useOccurrencesInRange } from "../store/tasksStore";
import { useAppTheme } from "../context/ThemeContext";

function startEndOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function Header() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { start, end } = useMemo(startEndOfToday, [getDayBucketKey()]);
  const todayOccurrences = useOccurrencesInRange(start, end);

  const total = todayOccurrences.length;
  const completed = todayOccurrences.filter((t) => t.status === "completed").length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <View
      style={{ paddingTop: insets.top + 12 }}
      className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 pb-5"
    >
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 pr-3">
          <Text className="text-slate-400 dark:text-slate-500 font-bodyRegular text-[13px] mb-0.5">
            {greetingForHour()}
          </Text>
          <Text className="text-slate-900 dark:text-slate-100 font-display text-[22px]">Today's Tasks</Text>
        </View>
        <View className="flex-row items-center">
          <Pressable
            onPress={() => navigation.navigate("Search")}
            hitSlop={8}
            className="w-9 h-9 rounded-full items-center justify-center mr-1.5 border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            accessibilityRole="button"
            accessibilityLabel="Search tasks"
          >
            <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("Settings")}
            hitSlop={8}
            className="w-9 h-9 rounded-full items-center justify-center mr-2 border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={16} color={colors.textSecondary} />
          </Pressable>
          <ThemeSelector compact />
        </View>
      </View>

      <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-3">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center mb-1.5">
            <View className="w-2 h-2 rounded-full bg-grape mr-2" />
            <Text className="text-slate-900 dark:text-slate-100 font-heading text-[13px]">{friendlyHeaderDate()}</Text>
          </View>
          <Text className="text-slate-400 dark:text-slate-500 font-bodyRegular text-[12px]">
            {total === 0 ? "No tasks scheduled yet" : `${completed} of ${total} tasks done today`}
          </Text>
        </View>
        <View className="items-center">
          <ProgressRing pct={pct} size={56} strokeWidth={6} />
        </View>
      </View>
    </View>
  );
}
