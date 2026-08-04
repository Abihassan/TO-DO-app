import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { generateId } from "../lib/schemas";
import { useAppTheme } from "../context/ThemeContext";

export default function ChecklistEditor({ items, onChange }) {
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState("");
  const doneCount = items.filter((i) => i.done).length;

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { id: generateId("chk"), text, done: false, sortOrder: items.length }]);
    setDraft("");
  }

  function toggleItem(id) {
    onChange(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function updateItemText(id, text) {
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  }

  function deleteItem(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <View>
      {items.length > 0 && (
        <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mb-2">
          {doneCount} of {items.length} done
        </Text>
      )}

      {items.map((item) => (
        <View key={item.id} className="flex-row items-center mb-2">
          <Pressable
            onPress={() => toggleItem(item.id)}
            hitSlop={10}
            className="w-6 h-6 rounded-lg border-2 items-center justify-center mr-2.5"
            style={{
              backgroundColor: item.done ? colors.brand : "transparent",
              borderColor: item.done ? colors.brand : colors.borderStrong,
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done }}
          >
            {item.done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </Pressable>
          <TextInput
            value={item.text}
            onChangeText={(t) => updateItemText(item.id, t)}
            className={`flex-1 text-[14px] font-body py-1 ${item.done ? "line-through opacity-50" : ""}`}
            style={{ color: colors.textPrimary }}
          />
          <Pressable onPress={() => deleteItem(item.id)} hitSlop={10} className="w-8 h-8 items-center justify-center">
            <Ionicons name="close" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>
      ))}

      <View className="flex-row items-center mt-1">
        <View
          className="w-6 h-6 rounded-lg border-2 items-center justify-center mr-2.5"
          style={{ borderColor: colors.border }}
        />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addItem}
          placeholder="Add a subtask…"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          className="flex-1 text-[14px] font-body py-1"
          style={{ color: colors.textPrimary }}
        />
        {draft.trim().length > 0 && (
          <Pressable onPress={addItem} hitSlop={10} className="w-8 h-8 items-center justify-center">
            <Ionicons name="add-circle" size={20} color={colors.brand} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
