import React, { useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { getCategoryById, getPriorityById } from "../constants/theme";
import { formatDueDate, isOverdue } from "../utils/date";
import SwipeableTaskRow from "./SwipeableTaskRow";
import ConfettiBurst from "./ConfettiBurst";

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const cat = getCategoryById(task.category);
  const pri = getPriorityById(task.priority);
  const overdue = isOverdue(task.dueDate, task.completed);

  const [confettiKey, setConfettiKey] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(task.completed ? 1 : 0)).current;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!task.completed) {
      setConfettiKey((k) => k + 1);
      Animated.sequence([
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 14,
      }).start();
    } else {
      Animated.spring(checkScale, { toValue: 0, useNativeDriver: true, speed: 30 }).start();
    }

    onToggle();
  };

  return (
    <SwipeableTaskRow onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)}>
      <Animated.View
        style={{
          transform: [{ scale }],
          shadowColor: "#2B2140",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
        className="mx-5 my-1.5"
      >
        <View className="relative bg-white rounded-3xl px-4 py-4 border border-black/5 flex-row items-start overflow-visible">
          <ConfettiBurst burstKey={confettiKey} />

          <Pressable
            onPress={handleToggle}
            hitSlop={12}
            className="w-9 h-9 rounded-2xl items-center justify-center mr-3 mt-0.5"
            style={{
              backgroundColor: task.completed ? cat.color : "#F4F2FA",
              borderWidth: 2,
              borderColor: task.completed ? cat.color : "#E4DFF0",
            }}
          >
            <Animated.Text
              style={{
                fontSize: 16,
                transform: [{ scale: checkScale }],
              }}
            >
              ✓
            </Animated.Text>
          </Pressable>

          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-1">
              <Text className="text-ink font-heading text-[15px] flex-1 mr-2" numberOfLines={2}>
                {task.title}
              </Text>
              <View
                className="rounded-full px-2 py-1 flex-row items-center"
                style={{ backgroundColor: pri.soft }}
              >
                <Text className="text-[10px] mr-0.5">{pri.emoji}</Text>
                <Text
                  className="font-heading text-[10px]"
                  style={{ color: pri.color }}
                >
                  {pri.label}
                </Text>
              </View>
            </View>

            {!!task.description && (
              <Text className="text-inkSoft font-bodyRegular text-[13px] mb-2 leading-[18px]" numberOfLines={2}>
                {task.description}
              </Text>
            )}

            <View className="flex-row items-center flex-wrap mt-1">
              <View
                className="flex-row items-center rounded-full px-2.5 py-1 mr-2 mb-1"
                style={{ backgroundColor: cat.soft }}
              >
                <Text className="text-[11px] mr-1">{cat.emoji}</Text>
                <Text
                  className="font-heading text-[11px]"
                  style={{ color: cat.color }}
                >
                  {cat.label}
                </Text>
              </View>

              {task.dueDate && (
                <View
                  className="flex-row items-center rounded-full px-2.5 py-1 mb-1"
                  style={{ backgroundColor: overdue ? "#FFE0E6" : "#F4F2FA" }}
                >
                  <Text className="text-[10px] mr-1">{overdue ? "⏰" : "🕐"}</Text>
                  <Text
                    className="font-heading text-[11px]"
                    style={{ color: overdue ? "#FF3B5C" : "#6B6285" }}
                  >
                    {formatDueDate(task.dueDate)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </SwipeableTaskRow>
  );
}
