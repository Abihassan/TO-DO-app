import React from "react";
import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../context/ThemeContext";

const OPTIONS = [
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
  { key: "system", label: "Auto", icon: "phone-portrait-outline" },
];

/**
 * Segmented Light / Dark / System control.
 *
 * @param {boolean} compact - icon-only segments (for placement in a top bar).
 *   When false, each segment also shows its label (for a settings screen).
 */
export default function ThemeSelector({ compact = false }) {
  const { preference, setPreference, colors } = useAppTheme();

  const handleSelect = (key) => {
    if (key === preference) return;
    Haptics.selectionAsync();
    setPreference(key);
  };

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="App theme"
      className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 self-start"
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => handleSelect(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt.label} theme`}
            hitSlop={4}
            className={`min-w-[44px] min-h-[44px] items-center justify-center rounded-xl flex-row px-3 ${
              active
                ? "bg-white dark:bg-slate-900"
                : "bg-transparent"
            }`}
            style={
              active
                ? {
                    shadowColor: colors.shadowColor,
                    shadowOpacity: colors.scheme === "dark" ? 0 : 0.08,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: colors.scheme === "dark" ? 0 : 1,
                  }
                : null
            }
          >
            <Ionicons
              name={opt.icon}
              size={16}
              color={active ? colors.brand : colors.textTertiary}
            />
            {!compact && (
              <Text
                className={`ml-1.5 font-heading text-[12px] ${
                  active
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {opt.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
