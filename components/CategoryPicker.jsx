import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCategories } from "../store/categoriesStore";
import { useAppTheme } from "../context/ThemeContext";

export default function CategoryPicker({ value, onChange, onManagePress }) {
  const { colors } = useAppTheme();
  const categories = useCategories();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
      <Pressable
        onPress={() => onChange(null)}
        className="flex-row items-center rounded-2xl px-3.5 py-2.5 mr-2 border min-h-[44px]"
        style={{
          backgroundColor: value === null ? colors.surfaceInset : colors.surface,
          borderColor: value === null ? colors.borderStrong : colors.border,
        }}
      >
        <Ionicons name="ban-outline" size={14} color={colors.textTertiary} />
        <Text style={{ color: colors.textSecondary }} className="font-heading text-[12px] ml-1.5">
          None
        </Text>
      </Pressable>

      {categories.map((cat) => {
        const active = value === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onChange(cat.id)}
            className="flex-row items-center rounded-2xl px-3.5 py-2.5 mr-2 border min-h-[44px]"
            style={{
              backgroundColor: active ? cat.color : colors.surface,
              borderColor: active ? cat.color : colors.border,
            }}
          >
            <Ionicons name={cat.icon} size={14} color={active ? "#FFFFFF" : cat.color} />
            <Text
              className="font-heading text-[12px] ml-1.5"
              style={{ color: active ? "#FFFFFF" : colors.textPrimary }}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}

      {onManagePress && (
        <Pressable
          onPress={onManagePress}
          className="flex-row items-center rounded-2xl px-3.5 py-2.5 border border-dashed min-h-[44px]"
          style={{ borderColor: colors.borderStrong }}
        >
          <Ionicons name="settings-outline" size={14} color={colors.textTertiary} />
          <Text style={{ color: colors.textTertiary }} className="font-heading text-[12px] ml-1.5">
            Manage
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
