import React from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function EmptyState() {
  const { colors } = useAppTheme();

  return (
    <View className="items-center justify-center px-10 py-14">
      <View
        className="w-24 h-24 rounded-[32px] items-center justify-center mb-5 border"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Text className="text-[40px]">🏝️</Text>
      </View>
      <Text className="text-slate-900 dark:text-slate-100 font-display text-[18px] mb-2 text-center">
        All clear!
      </Text>
      <Text className="text-slate-400 dark:text-slate-500 font-bodyRegular text-[13px] text-center leading-5 max-w-[240px]">
        No tasks here yet. Tap the + button to start a new one!
      </Text>
    </View>
  );
}
