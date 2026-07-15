import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProgressRing from "./ProgressRing";
import { friendlyHeaderDate, greetingForHour } from "../utils/date";
import { useTodo } from "../context/TodoContext";

export default function Header() {
  const insets = useSafeAreaInsets();
  const { todayProgress } = useTodo();

  return (
    <LinearGradient
      colors={["#A78BFA", "#7C3AED", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top + 12 }}
      className="rounded-b-[36px] px-6 pb-7"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center mb-1">
            <Text className="text-[26px] mr-1">✨</Text>
            <Text className="text-white/90 font-body text-[14px]">
              {greetingForHour()}, Explorer!
            </Text>
          </View>
          <Text className="text-white font-display text-[26px] mb-3">
            Today's Quests
          </Text>
          <View className="flex-row items-center">
            <View className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center mr-2">
              <Text className="text-[13px] mr-1">📅</Text>
              <Text className="text-white font-body text-[12px]">
                {friendlyHeaderDate()}
              </Text>
            </View>
            <View className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center">
              <Text className="text-[13px] mr-1">🔥</Text>
              <Text className="text-white font-body text-[12px]">
                {todayProgress.completed} done today
              </Text>
            </View>
          </View>
        </View>

        <View className="items-center">
          <ProgressRing pct={todayProgress.pct} />
          <Text className="text-white/80 font-body text-[11px] mt-1.5">
            {todayProgress.completed}/{todayProgress.total}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
