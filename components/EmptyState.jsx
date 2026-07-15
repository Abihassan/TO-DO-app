import React from "react";
import { View, Text } from "react-native";

export default function EmptyState() {
  return (
    <View className="items-center justify-center px-10 py-14">
      <View className="w-24 h-24 rounded-[32px] bg-white items-center justify-center mb-5 border-2 border-black/5">
        <Text className="text-[40px]">🏝️</Text>
      </View>
      <Text className="text-ink font-display text-[18px] mb-2 text-center">
        All clear, Explorer!
      </Text>
      <Text className="text-inkSoft font-bodyRegular text-[13px] text-center leading-5 max-w-[240px]">
        No quests here yet. Tap the + button to start a new one!
      </Text>
    </View>
  );
}
