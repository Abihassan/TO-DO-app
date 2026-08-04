import React, { useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { getPriorityMeta, getSoft } from "../constants/theme";
import { useCategory } from "../store/categoriesStore";
import { formatDueDate, isOverdue } from "../utils/date";
import { useAppTheme } from "../context/ThemeContext";
import SwipeableTaskRow from "./SwipeableTaskRow";
import ConfettiBurst from "./ConfettiBurst";

function TaskCard({ task, onToggle, onDelete, onLongPress }) {
  const navigation = useNavigation();
  const { colors, scheme } = useAppTheme();
  const category = useCategory(task.categoryId);
  const pri = getPriorityMeta(task.priority);
  const overdue = isOverdue(task.dueDate, task.status === "completed");
  const isCompleted = task.status === "completed";
  const checklistTotal = task.checklist?.length || 0;
  const checklistDone = task.checklist?.filter((c) => c.done).length || 0;

  const [confettiKey, setConfettiKey] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const contentOpacity = useRef(new Animated.Value(isCompleted ? 0.6 : 1)).current;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isCompleted) {
      setConfettiKey((k) => k + 1);
      Animated.sequence([
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 14 }).start();
      Animated.timing(contentOpacity, { toValue: 0.6, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.spring(checkScale, { toValue: 0, useNativeDriver: true, speed: 30 }).start();
      Animated.timing(contentOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }
    onToggle(task);
  };

  return (
    <SwipeableTaskRow
      onEdit={() => navigation.navigate("TaskDetail", { task })}
      onDelete={() => onDelete(task.id)}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          shadowColor: colors.shadowColor,
          shadowOpacity: colors.shadowOpacity,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: scheme === "dark" ? 0 : 3,
        }}
        className="mx-5 my-1.5"
      >
        <ConfettiBurst burstKey={confettiKey} />

        <View
          className="relative overflow-hidden rounded-2xl border flex-row items-start"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View className="absolute left-0 top-0 bottom-0" style={{ width: 5, backgroundColor: pri.color }} />

          <Pressable
            onPress={() => navigation.navigate("TaskDetail", { task })}
            onLongPress={onLongPress ? () => onLongPress(task) : undefined}
            delayLongPress={350}
            className="flex-1"
          >
            <Animated.View style={{ opacity: contentOpacity }} className="flex-1 flex-row items-start pl-5 pr-4 py-4">
              <Pressable
                onPress={handleToggle}
                hitSlop={12}
                className="w-9 h-9 rounded-2xl items-center justify-center mr-3 mt-0.5"
                style={{
                  backgroundColor: isCompleted ? (category?.color || colors.brand) : colors.surfaceInset,
                  borderWidth: 2,
                  borderColor: isCompleted ? (category?.color || colors.brand) : colors.borderStrong,
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isCompleted }}
                accessibilityLabel={`Mark "${task.title}" as ${isCompleted ? "not done" : "done"}`}
              >
                <Animated.Text style={{ fontSize: 16, transform: [{ scale: checkScale }] }}>✓</Animated.Text>
              </Pressable>

              <View className="flex-1">
                <View className="flex-row items-start justify-between mb-1">
                  <Text
                    className={`font-heading text-[15px] flex-1 mr-2 ${
                      isCompleted ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-900 dark:text-slate-100"
                    }`}
                    numberOfLines={2}
                  >
                    {task.title || "Untitled task"}
                  </Text>
                  {task.isPinned && <Ionicons name="pin" size={13} color={colors.brand} />}
                  {task.isFavorite && <Ionicons name="heart" size={13} color={colors.danger} style={{ marginLeft: 4 }} />}
                </View>

                {!!task.description && (
                  <Text
                    className="text-slate-400 dark:text-slate-500 font-bodyRegular text-[13px] mb-2 leading-[18px]"
                    numberOfLines={2}
                  >
                    {task.description}
                  </Text>
                )}

                <View className="flex-row items-center flex-wrap mt-1">
                  {task.status === "in_progress" && (
                    <View className="flex-row items-center rounded-full px-2.5 py-1 mr-2 mb-1" style={{ backgroundColor: colors.brandSoft }}>
                      <Ionicons name="sync-outline" size={10} color={colors.brand} />
                      <Text className="font-heading text-[11px] ml-1" style={{ color: colors.brand }}>
                        In Progress
                      </Text>
                    </View>
                  )}
                  <View className="rounded-full px-2.5 py-1 mr-2 mb-1" style={{ backgroundColor: getSoft(pri, scheme) }}>
                    <Text className="font-heading text-[11px]" style={{ color: pri.color }}>
                      {pri.label}
                    </Text>
                  </View>

                  {category && (
                    <View
                      className="flex-row items-center rounded-full px-2.5 py-1 mr-2 mb-1"
                      style={{ backgroundColor: `${category.color}22` }}
                    >
                      <Ionicons name={category.icon} size={11} color={category.color} />
                      <Text className="font-heading text-[11px] ml-1" style={{ color: category.color }}>
                        {category.name}
                      </Text>
                    </View>
                  )}

                  {checklistTotal > 0 && (
                    <View
                      className="flex-row items-center rounded-full px-2.5 py-1 mr-2 mb-1"
                      style={{ backgroundColor: colors.surfaceInset }}
                    >
                      <Ionicons name="checkbox-outline" size={11} color={colors.textTertiary} />
                      <Text className="font-heading text-[11px] ml-1" style={{ color: colors.textTertiary }}>
                        {checklistDone}/{checklistTotal}
                      </Text>
                    </View>
                  )}

                  {task.dueDate && (
                    <View
                      className="flex-row items-center rounded-full px-2.5 py-1 mb-1"
                      style={{ backgroundColor: overdue ? colors.dangerSoft : colors.surfaceInset }}
                    >
                      <Ionicons name="time-outline" size={11} color={overdue ? colors.danger : colors.textTertiary} />
                      <Text
                        className="font-heading text-[11px] ml-1"
                        style={{ color: overdue ? colors.danger : colors.textTertiary }}
                      >
                        {formatDueDate(task.dueDate)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          </Pressable>
        </View>
      </Animated.View>
    </SwipeableTaskRow>
  );
}

export default React.memo(TaskCard);
