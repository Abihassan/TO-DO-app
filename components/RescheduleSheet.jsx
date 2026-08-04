import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../context/ThemeContext";
import { updateOccurrence } from "../store/tasksStore";
import { addDays } from "../lib/calendarMath";

export default function RescheduleSheet({ task, onClose }) {
  const { colors } = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);
  const visible = !!task;

  function applyReschedule(newDate) {
    if (!task) return;
    const existing = task.dueDate ? new Date(task.dueDate) : new Date();
    const next = new Date(newDate);
    next.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateOccurrence(task, { dueDate: next.toISOString() });
    onClose();
  }

  function onPickerChange(event, selected) {
    setShowPicker(false);
    if (event.type === "dismissed" || !selected) return;
    applyReschedule(selected);
  }

  const options = [
    { label: "Today", icon: "today-outline", onPress: () => applyReschedule(new Date()) },
    { label: "Tomorrow", icon: "arrow-forward-outline", onPress: () => applyReschedule(addDays(new Date(), 1)) },
    { label: "Next week", icon: "calendar-outline", onPress: () => applyReschedule(addDays(new Date(), 7)) },
    { label: "Pick a date…", icon: "calendar-number-outline", onPress: () => setShowPicker(true) },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.overlay }}>
        <View className="w-full rounded-3xl border p-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px] px-3 pt-3 pb-1" numberOfLines={1}>
            Reschedule "{task?.title}"
          </Text>
          {options.map((opt) => (
            <Pressable key={opt.label} onPress={opt.onPress} className="flex-row items-center px-3 py-3 rounded-2xl">
              <Ionicons name={opt.icon} size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textPrimary }} className="font-body text-[14px] ml-3">
                {opt.label}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} className="px-3 py-3 mt-1">
            <Text style={{ color: colors.textTertiary }} className="font-heading text-[13px] text-center">
              Cancel
            </Text>
          </Pressable>
        </View>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={task?.dueDate ? new Date(task.dueDate) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onPickerChange}
          themeVariant={colors.scheme}
        />
      )}
    </Modal>
  );
}
