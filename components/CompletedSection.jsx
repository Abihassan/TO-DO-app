import React, { useRef, useState } from "react";
import { View, Text, Pressable, Animated, LayoutAnimation, Platform, UIManager } from "react-native";
import { getCategoryById } from "../constants/theme";
import SwipeableTaskRow from "./SwipeableTaskRow";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function CompletedRow({ task, onToggle, onDelete }) {
  const cat = getCategoryById(task.category);
  return (
    <SwipeableTaskRow onEdit={() => onToggle(task.id)} onDelete={() => onDelete(task.id)}>
      <View className="mx-5 my-1 bg-white/70 rounded-2xl px-4 py-3 border border-black/5 flex-row items-center opacity-70">
        <Pressable
          onPress={() => onToggle(task.id)}
          hitSlop={10}
          className="w-7 h-7 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: cat.color }}
        >
          <Text className="text-white text-[13px]">✓</Text>
        </Pressable>
        <Text
          className="flex-1 text-inkSoft font-body text-[14px] line-through"
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <View className="bg-mint/20 rounded-full px-2.5 py-1 ml-2">
          <Text className="text-mint font-heading text-[10px]">DONE 🎉</Text>
        </View>
      </View>
    </SwipeableTaskRow>
  );
}

export default function CompletedSection({ tasks, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const rotation = useRef(new Animated.Value(1)).current;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotation, {
      toValue: expanded ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    setExpanded((e) => !e);
  };

  const rotateDeg = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["-90deg", "0deg"],
  });

  if (tasks.length === 0) return null;

  return (
    <View className="mt-2">
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between mx-5 mb-2 mt-3"
      >
        <View className="flex-row items-center">
          <Text className="text-ink font-heading text-[15px] mr-2">
            Completed
          </Text>
          <View className="bg-mint/20 rounded-full px-2.5 py-0.5">
            <Text className="text-mint font-heading text-[11px]">
              {tasks.length}
            </Text>
          </View>
        </View>
        <Animated.Text
          style={{ transform: [{ rotate: rotateDeg }], fontSize: 14 }}
        >
          ▼
        </Animated.Text>
      </Pressable>

      {expanded && (
        <View>
          {tasks.map((task) => (
            <CompletedRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}
    </View>
  );
}
