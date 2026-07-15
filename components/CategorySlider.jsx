import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { categories } from "../constants/theme";
import { useTodo } from "../context/TodoContext";

export default function CategorySlider() {
  const { activeCategory, setActiveCategory, categoryCounts } = useTodo();

  const totalActive = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  const handleSelect = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 10 }}
      className="mt-5 mb-1"
    >
      <Pressable onPress={() => handleSelect("all")} className="relative">
        <View
          className={`px-4 py-3 rounded-3xl border-2 flex-row items-center ${
            activeCategory === "all"
              ? "bg-grape border-grape"
              : "bg-white border-inkFaint/20"
          }`}
          style={{
            shadowColor: "#7C3AED",
            shadowOpacity: activeCategory === "all" ? 0.3 : 0,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: activeCategory === "all" ? 4 : 0,
          }}
        >
          <Text className="text-[16px] mr-1.5">🌈</Text>
          <Text
            className={`font-heading text-[13px] ${
              activeCategory === "all" ? "text-white" : "text-ink"
            }`}
          >
            All Quests
          </Text>
        </View>
        {totalActive > 0 && (
          <View className="absolute -top-2 -right-2 bg-coral rounded-full min-w-[22px] h-[22px] items-center justify-center px-1 border-2 border-cream">
            <Text className="text-white font-heading text-[10px]">
              {totalActive}
            </Text>
          </View>
        )}
      </Pressable>

      {categories.map((cat) => {
        const active = activeCategory === cat.id;
        const count = categoryCounts[cat.id] || 0;
        return (
          <Pressable
            key={cat.id}
            onPress={() => handleSelect(cat.id)}
            className="relative"
          >
            <View
              className="px-4 py-3 rounded-3xl border-2 flex-row items-center"
              style={{
                backgroundColor: active ? cat.color : "#FFFFFF",
                borderColor: active ? cat.color : "rgba(167,159,192,0.2)",
                shadowColor: cat.color,
                shadowOpacity: active ? 0.3 : 0,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: active ? 4 : 0,
              }}
            >
              <Text className="text-[16px] mr-1.5">{cat.emoji}</Text>
              <Text
                className="font-heading text-[13px]"
                style={{ color: active ? "#FFFFFF" : "#2B2140" }}
              >
                {cat.label}
              </Text>
            </View>
            {count > 0 && (
              <View
                className="absolute -top-2 -right-2 rounded-full min-w-[22px] h-[22px] items-center justify-center px-1 border-2 border-cream"
                style={{ backgroundColor: cat.color }}
              >
                <Text className="text-white font-heading text-[10px]">
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
