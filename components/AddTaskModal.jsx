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
  ScrollView,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { categories, priorities } from "../constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AddTaskModal({ visible, onClose, onSubmit, editingTask }) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0].id);
  const [priority, setPriority] = useState("medium");
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description || "");
        setCategory(editingTask.category);
        setPriority(editingTask.priority);
      } else {
        setTitle("");
        setDescription("");
        setCategory(categories[0].id);
        setPriority("medium");
      }
      setTitleError(false);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, editingTask]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setTitleError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit({
      id: editingTask ? editingTask.id : undefined,
      title,
      description,
      category,
      priority,
      dueDate: editingTask ? editingTask.dueDate : null,
    });
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={{ opacity: backdropOpacity }} className="flex-1">
        <Pressable className="flex-1" onPress={handleClose}>
          <BlurView intensity={25} tint="dark" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(43,33,64,0.35)" }} />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateY }], maxHeight: SCREEN_HEIGHT * 0.9 }}
        className="absolute bottom-0 left-0 right-0 bg-cream rounded-t-[36px] overflow-hidden"
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1.5 rounded-full bg-inkFaint/40" />
          </View>

          <View className="flex-row items-center justify-between px-6 pt-3 pb-4">
            <Text className="text-ink font-display text-[21px]">
              {editingTask ? "Edit Quest ✏️" : "New Quest 🚀"}
            </Text>
            <Pressable
              onPress={handleClose}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-white items-center justify-center border border-black/5"
            >
              <Text className="text-inkSoft text-[14px]">✕</Text>
            </Pressable>
          </View>

          <ScrollView
            className="px-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-inkSoft font-heading text-[12px] mb-2 uppercase tracking-wide">
              Quest Title
            </Text>
            <TextInput
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (t.trim()) setTitleError(false);
              }}
              placeholder="e.g. Clean the room 🚀"
              placeholderTextColor="#A79FC0"
              className={`bg-white rounded-3xl px-4 py-4 text-ink font-body text-[15px] mb-1 border-2 ${
                titleError ? "border-priorityHigh" : "border-transparent"
              }`}
            />
            {titleError && (
              <Text className="text-priorityHigh font-body text-[12px] mb-2">
                Give your quest a title!
              </Text>
            )}

            <Text className="text-inkSoft font-heading text-[12px] mb-2 mt-4 uppercase tracking-wide">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add some details (optional)"
              placeholderTextColor="#A79FC0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-white rounded-3xl px-4 py-4 text-ink font-body text-[15px] mb-4 border-2 border-transparent min-h-[84px]"
            />

            <Text className="text-inkSoft font-heading text-[12px] mb-2 uppercase tracking-wide">
              Category
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {categories.map((cat) => {
                const active = category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    className="flex-row items-center rounded-2xl px-4 py-3 mr-2 mb-2 border-2"
                    style={{
                      backgroundColor: active ? cat.color : "#FFFFFF",
                      borderColor: active ? cat.color : "rgba(167,159,192,0.25)",
                    }}
                  >
                    <Text className="text-[15px] mr-1.5">{cat.emoji}</Text>
                    <Text
                      className="font-heading text-[13px]"
                      style={{ color: active ? "#FFFFFF" : "#2B2140" }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-inkSoft font-heading text-[12px] mb-2 uppercase tracking-wide">
              Priority
            </Text>
            <View className="flex-row mb-6">
              {priorities.map((p) => {
                const active = priority === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPriority(p.id)}
                    className="flex-1 mr-2 rounded-2xl py-3.5 items-center border-2"
                    style={{
                      backgroundColor: active ? p.soft : "#FFFFFF",
                      borderColor: active ? p.color : "rgba(167,159,192,0.25)",
                    }}
                  >
                    <Text className="text-[18px] mb-0.5">{p.emoji}</Text>
                    <Text
                      className="font-heading text-[12px]"
                      style={{ color: active ? p.color : "#6B6285" }}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View className="px-6 pt-2 pb-8">
            <Pressable onPress={handleSubmit}>
              <View
                className="rounded-3xl py-4 items-center"
                style={{ backgroundColor: "#7C3AED" }}
              >
                <Text className="text-white font-heading text-[15px]">
                  {editingTask ? "Save Changes 💾" : "Add Quest 🎯"}
                </Text>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
