import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PRIORITY_ORDER, getPriorityMeta, getSoft } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

export default function PrioritySelector({ value, onChange }) {
  const { colors, scheme } = useAppTheme();

  return (
    <View className="flex-row">
      {PRIORITY_ORDER.map((p) => {
        const meta = getPriorityMeta(p);
        const active = value === p;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            className="flex-1 mr-2 rounded-2xl py-3 items-center border-2 min-h-[44px] justify-center"
            style={{
              backgroundColor: active ? getSoft(meta, scheme) : colors.surface,
              borderColor: active ? meta.color : colors.border,
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${meta.label} priority`}
          >
            <Ionicons name={meta.icon} size={16} color={active ? meta.color : colors.textTertiary} />
            <Text
              className="font-heading text-[11px] mt-1"
              style={{ color: active ? meta.color : colors.textTertiary }}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
