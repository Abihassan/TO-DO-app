import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTodo } from "../context/TodoContext";

const BAR_COLORS = [
  ["#A78BFA", "#7C3AED"],
  ["#FFB4B4", "#FF6B6B"],
  ["#93C5FD", "#3B82F6"],
  ["#5EEAD4", "#14B8A6"],
  ["#FFE29A", "#FFC93C"],
  ["#86F5C0", "#22E584"],
  ["#F9A8D4", "#EC4899"],
];

const MAX_BAR_HEIGHT = 84;

export default function WeeklyChart() {
  const { weeklyStats } = useTodo();
  const maxTotal = Math.max(...weeklyStats.map((d) => d.total), 1);
  const weekTotal = weeklyStats.reduce((sum, d) => sum + d.completed, 0);

  return (
    <View className="mx-5 mt-4 mb-2 bg-white rounded-3xl px-5 py-5 border border-black/5" style={{
      shadowColor: "#2B2140",
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    }}>
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-ink font-heading text-[15px]">
            Weekly Quest Log 📊
          </Text>
          <Text className="text-inkSoft font-bodyRegular text-[12px] mt-0.5">
            {weekTotal} quests completed this week
          </Text>
        </View>
        <View className="bg-sunshine/20 rounded-full px-3 py-1.5">
          <Text className="text-sunshine font-heading text-[12px]">🏆 Nice!</Text>
        </View>
      </View>

      <View className="flex-row items-end justify-between" style={{ height: MAX_BAR_HEIGHT + 34 }}>
        {weeklyStats.map((d, i) => {
          const barHeight = Math.max((d.completed / maxTotal) * MAX_BAR_HEIGHT, 6);
          const trackHeight = Math.max((d.total / maxTotal) * MAX_BAR_HEIGHT, 6);
          return (
            <View key={d.day} className="items-center" style={{ width: 30 }}>
              <View
                className="w-full rounded-full bg-cream justify-end overflow-hidden"
                style={{ height: MAX_BAR_HEIGHT }}
              >
                <View style={{ height: trackHeight, opacity: 0.3, backgroundColor: "#E4DFF0", borderRadius: 999 }} />
              </View>
              <LinearGradient
                colors={BAR_COLORS[i % BAR_COLORS.length]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={{
                  position: "absolute",
                  bottom: 34,
                  width: 16,
                  height: barHeight,
                  borderRadius: 999,
                }}
              />
              <Text className="text-inkFaint font-body text-[11px] mt-2">
                {d.day}
              </Text>
              <Text className="text-ink font-heading text-[11px]">
                {d.completed}/{d.total}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
