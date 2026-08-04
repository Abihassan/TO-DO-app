import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useCategories, countTasksByCategory } from "../store/categoriesStore";
import { useTasks } from "../store/tasksStore";
import { useAppTheme } from "../context/ThemeContext";

export default function CategorySlider({ activeCategoryId, onSelectCategory }) {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const categories = useCategories();
  const tasks = useTasks();
  const counts = countTasksByCategory(tasks);
  const totalActive = tasks.filter((t) => t.status !== "completed" && t.status !== "archived").length;

  const handleSelect = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectCategory(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 10 }}
      className="mt-4 mb-1"
    >
      <Pressable
        onPress={() => handleSelect(null)}
        className="relative min-h-[44px]"
        accessibilityRole="button"
        accessibilityState={{ selected: activeCategoryId === null }}
        accessibilityLabel="All tasks"
      >
        <View
          className={`px-4 py-3 rounded-2xl border flex-row items-center min-h-[44px] ${
            activeCategoryId === null ? "bg-grape border-grape" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
          }`}
          style={{
            shadowColor: colors.shadowColor,
            shadowOpacity: activeCategoryId === null ? 0.25 : 0,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: activeCategoryId === null ? 4 : 0,
          }}
        >
          <Ionicons name="apps-outline" size={15} color={activeCategoryId === null ? "#FFFFFF" : colors.textPrimary} />
          <Text
            className={`font-heading text-[13px] ml-1.5 ${activeCategoryId === null ? "text-white" : "text-slate-900 dark:text-slate-100"}`}
          >
            All Tasks
          </Text>
        </View>
        {totalActive > 0 && (
          <View className="absolute -top-2 -right-2 bg-coral rounded-full min-w-[22px] h-[22px] items-center justify-center px-1 border-2" style={{ borderColor: colors.bgApp }}>
            <Text className="text-white font-heading text-[10px]">{totalActive}</Text>
          </View>
        )}
      </Pressable>

      {categories.map((cat) => {
        const active = activeCategoryId === cat.id;
        const count = counts[cat.id] || 0;
        return (
          <Pressable
            key={cat.id}
            onPress={() => handleSelect(cat.id)}
            className="relative min-h-[44px]"
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${cat.name} tasks`}
          >
            <View
              className="px-4 py-3 rounded-2xl border flex-row items-center min-h-[44px]"
              style={{
                backgroundColor: active ? cat.color : colors.surface,
                borderColor: active ? cat.color : colors.border,
                shadowColor: cat.color,
                shadowOpacity: active ? 0.25 : 0,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: active ? 4 : 0,
              }}
            >
              <Ionicons name={cat.icon} size={14} color={active ? "#FFFFFF" : cat.color} />
              <Text className="font-heading text-[13px] ml-1.5" style={{ color: active ? "#FFFFFF" : colors.textPrimary }}>
                {cat.name}
              </Text>
            </View>
            {count > 0 && (
              <View
                className="absolute -top-2 -right-2 rounded-full min-w-[22px] h-[22px] items-center justify-center px-1 border-2"
                style={{ backgroundColor: cat.color, borderColor: colors.bgApp }}
              >
                <Text className="text-white font-heading text-[10px]">{count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => navigation.navigate("CategoryManager")}
        className="flex-row items-center rounded-2xl px-4 py-3 border border-dashed min-h-[44px]"
        style={{ borderColor: colors.borderStrong }}
      >
        <Ionicons name="settings-outline" size={14} color={colors.textTertiary} />
        <Text style={{ color: colors.textTertiary }} className="font-heading text-[13px] ml-1.5">
          Manage
        </Text>
      </Pressable>
    </ScrollView>
  );
}
