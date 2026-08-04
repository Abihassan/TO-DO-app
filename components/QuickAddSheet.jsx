import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../context/ThemeContext";
import { useCategories } from "../store/categoriesStore";
import { addTask } from "../store/tasksStore";
import { PRIORITY_ORDER, getPriorityMeta, getSoft } from "../constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function QuickAddSheet({ visible, onClose, onOpenDetail, defaultCategoryId = null }) {
  const { colors, scheme } = useAppTheme();
  const categories = useCategories();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    if (visible) {
      setTitle("");
      setCategoryId(defaultCategoryId);
      setPriority("medium");
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, defaultCategoryId]);

  function animateClose(then) {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => then && then());
  }

  function handleQuickAdd() {
    if (!title.trim()) return;
    const task = addTask({ title, categoryId, priority, dueDate: null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    animateClose(() => onClose(task));
  }

  function handleOpenFullDetail() {
    animateClose(() => onOpenDetail({ initialCategoryId: categoryId }));
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={() => animateClose(onClose)}>
      <Animated.View style={{ opacity: backdropOpacity }} className="flex-1">
        <Pressable className="flex-1" onPress={() => animateClose(onClose)}>
          <BlurView intensity={25} tint="dark" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.overlay }} />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateY }], backgroundColor: colors.bgApp }}
        className="absolute bottom-0 left-0 right-0 rounded-t-[32px] overflow-hidden"
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1.5 rounded-full" style={{ backgroundColor: colors.borderStrong }} />
          </View>

          <View className="px-6 pt-3">
            <TextInput
              autoFocus
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={handleQuickAdd}
              placeholder="What needs to get done?"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              className="rounded-2xl px-4 py-4 font-body text-[16px] mb-3 border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
            />

            <View className="flex-row mb-3">
              {PRIORITY_ORDER.map((p) => {
                const meta = getPriorityMeta(p);
                const active = priority === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    className="flex-1 mr-1.5 rounded-xl py-2.5 items-center border min-h-[40px] justify-center"
                    style={{
                      backgroundColor: active ? getSoft(meta, scheme) : colors.surface,
                      borderColor: active ? meta.color : colors.border,
                    }}
                  >
                    <Text className="font-heading text-[11px]" style={{ color: active ? meta.color : colors.textTertiary }}>
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row flex-wrap mb-4">
              {categories.slice(0, 6).map((cat) => {
                const active = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(active ? null : cat.id)}
                    className="flex-row items-center rounded-full px-3 py-2 mr-2 mb-2 border"
                    style={{ backgroundColor: active ? cat.color : colors.surface, borderColor: active ? cat.color : colors.border }}
                  >
                    <Ionicons name={cat.icon} size={12} color={active ? "#FFFFFF" : cat.color} />
                    <Text className="font-heading text-[11px] ml-1" style={{ color: active ? "#FFFFFF" : colors.textPrimary }}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleQuickAdd}
              disabled={!title.trim()}
              className="rounded-2xl py-4 items-center mb-2.5 min-h-[44px] justify-center"
              style={{ backgroundColor: title.trim() ? colors.brand : colors.borderStrong }}
            >
              <Text className="text-white font-heading text-[15px]">Add Task</Text>
            </Pressable>

            <Pressable onPress={handleOpenFullDetail} className="items-center py-3 mb-4 min-h-[44px] justify-center">
              <Text style={{ color: colors.textSecondary }} className="font-heading text-[13px]">
                More details (notes, due date, recurrence…)
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
