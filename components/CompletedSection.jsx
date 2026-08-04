import React, { useRef, useState } from "react";
import { View, Text, Pressable, Animated, LayoutAnimation, Platform, UIManager } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCategory } from "../store/categoriesStore";
import { useAppTheme } from "../context/ThemeContext";
import SwipeableTaskRow from "./SwipeableTaskRow";

function CompletedRow({ task, onToggle, onDelete, colors }) {
  const navigation = useNavigation();
  const category = useCategory(task.categoryId);
  return (
    <SwipeableTaskRow onEdit={() => navigation.navigate("TaskDetail", { task })} onDelete={() => onDelete(task.id)}>
      <View
        className="mx-5 my-1 rounded-2xl border px-4 py-3 flex-row items-center opacity-70"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Pressable
          onPress={() => onToggle(task.id)}
          hitSlop={10}
          className="w-7 h-7 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: category?.color || colors.brand }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: true }}
          accessibilityLabel={`Mark "${task.title}" as not done`}
        >
          <Text className="text-white text-[13px]">✓</Text>
        </Pressable>
        <Text className="flex-1 text-slate-400 dark:text-slate-500 font-body text-[14px] line-through" numberOfLines={1}>
          {task.title || "Untitled task"}
        </Text>
        <View className="bg-mint/20 rounded-full px-2.5 py-1 ml-2">
          <Text className="text-mint font-heading text-[10px]">DONE 🎉</Text>
        </View>
      </View>
    </SwipeableTaskRow>
  );
}

export default function CompletedSection({ tasks, onToggle, onDelete }) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(true);
  const rotation = useRef(new Animated.Value(1)).current;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotation, { toValue: expanded ? 0 : 1, duration: 220, useNativeDriver: true }).start();
    setExpanded((e) => !e);
  };

  const rotateDeg = rotation.interpolate({ inputRange: [0, 1], outputRange: ["-90deg", "0deg"] });

  if (tasks.length === 0) return null;

  return (
    <View className="mt-2">
      <Pressable
        onPress={toggleExpanded}
        hitSlop={8}
        className="flex-row items-center justify-between mx-5 mb-2 mt-3 min-h-[44px]"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Completed tasks, ${tasks.length}. ${expanded ? "Expanded" : "Collapsed"}`}
      >
        <View className="flex-row items-center flex-1">
          <Text className="text-slate-900 dark:text-slate-100 font-heading text-[15px] mr-2">Completed</Text>
          <View className="bg-mint/20 rounded-full px-2.5 py-0.5 mr-3">
            <Text className="text-mint font-heading text-[11px]">{tasks.length}</Text>
          </View>
          <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.border }} />
        </View>
        <Animated.Text style={{ transform: [{ rotate: rotateDeg }], fontSize: 14, color: colors.textTertiary, marginLeft: 10 }}>
          ▼
        </Animated.Text>
      </Pressable>

      {expanded && (
        <View>
          {tasks.map((task) => (
            <CompletedRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} colors={colors} />
          ))}
        </View>
      )}
    </View>
  );
}
