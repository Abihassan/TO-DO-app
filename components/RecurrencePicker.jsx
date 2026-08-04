import React from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

const FREQ_OPTIONS = [
  { key: null, label: "None" },
  { key: "daily", label: "Daily" },
  { key: "weekdays", label: "Weekdays" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "custom", label: "Custom days" },
];

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function Chip({ label, active, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      className="px-3.5 py-2 rounded-xl border mr-2 mb-2 min-h-[40px] items-center justify-center"
      style={{
        backgroundColor: active ? colors.brand : colors.surface,
        borderColor: active ? colors.brand : colors.border,
      }}
    >
      <Text
        className="font-heading text-[12px]"
        style={{ color: active ? "#FFFFFF" : colors.textPrimary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function RecurrencePicker({ value, onChange }) {
  const { colors } = useAppTheme();
  const rule = value; // null, or { freq, interval, byWeekday, byMonthday, until, count }

  function setFreq(freq) {
    if (!freq) {
      onChange(null);
      return;
    }
    onChange({
      freq,
      interval: rule?.interval || 1,
      byWeekday: freq === "weekly" || freq === "custom" ? rule?.byWeekday || [] : null,
      byMonthday: freq === "monthly" ? rule?.byMonthday || null : null,
      until: rule?.until || null,
      count: rule?.count || null,
    });
  }

  function toggleWeekday(day) {
    const current = rule?.byWeekday || [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    onChange({ ...rule, byWeekday: next });
  }

  function setInterval(n) {
    onChange({ ...rule, interval: Math.max(1, n) });
  }

  function setEndMode(mode) {
    if (mode === "never") onChange({ ...rule, until: null, count: null });
    else if (mode === "on") onChange({ ...rule, until: rule?.until || new Date().toISOString(), count: null });
    else if (mode === "after") onChange({ ...rule, until: null, count: rule?.count || 10 });
  }

  const endMode = rule?.count ? "after" : rule?.until ? "on" : "never";
  const showInterval = rule && rule.freq !== "weekdays";
  const showWeekdays = rule && (rule.freq === "weekly" || rule.freq === "custom");

  return (
    <View>
      <View className="flex-row flex-wrap">
        {FREQ_OPTIONS.map((opt) => (
          <Chip
            key={opt.label}
            label={opt.label}
            active={(rule?.freq || null) === opt.key}
            onPress={() => setFreq(opt.key)}
            colors={colors}
          />
        ))}
      </View>

      {rule && (
        <View
          className="rounded-2xl border p-4 mt-1"
          style={{ backgroundColor: colors.surfaceInset, borderColor: colors.border }}
        >
          {showInterval && (
            <View className="flex-row items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="font-body text-[13px] mr-2">
                Every
              </Text>
              <Pressable
                onPress={() => setInterval((rule.interval || 1) - 1)}
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Ionicons name="remove" size={14} color={colors.textPrimary} />
              </Pressable>
              <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px] mx-3">
                {rule.interval || 1}
              </Text>
              <Pressable
                onPress={() => setInterval((rule.interval || 1) + 1)}
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Ionicons name="add" size={14} color={colors.textPrimary} />
              </Pressable>
              <Text style={{ color: colors.textSecondary }} className="font-body text-[13px] ml-2">
                {rule.freq === "daily" && ((rule.interval || 1) === 1 ? "day" : "days")}
                {rule.freq === "weekly" && ((rule.interval || 1) === 1 ? "week" : "weeks")}
                {rule.freq === "custom" && ((rule.interval || 1) === 1 ? "week" : "weeks")}
                {rule.freq === "monthly" && ((rule.interval || 1) === 1 ? "month" : "months")}
                {rule.freq === "yearly" && ((rule.interval || 1) === 1 ? "year" : "years")}
              </Text>
            </View>
          )}

          {showWeekdays && (
            <View className="flex-row mb-3">
              {WEEKDAY_LABELS.map((label, day) => {
                const active = (rule.byWeekday || []).includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleWeekday(day)}
                    className="w-9 h-9 rounded-full items-center justify-center mr-1.5"
                    style={{ backgroundColor: active ? colors.brand : colors.surface }}
                  >
                    <Text
                      className="font-heading text-[12px]"
                      style={{ color: active ? "#FFFFFF" : colors.textSecondary }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={{ color: colors.textSecondary }} className="font-body text-[13px] mb-2">
            Ends
          </Text>
          <View className="flex-row flex-wrap">
            <Chip label="Never" active={endMode === "never"} onPress={() => setEndMode("never")} colors={colors} />
            <Chip label="After N times" active={endMode === "after"} onPress={() => setEndMode("after")} colors={colors} />
          </View>
          {endMode === "after" && (
            <View className="flex-row items-center mt-1">
              <TextInput
                value={String(rule.count || 10)}
                onChangeText={(t) => onChange({ ...rule, count: Math.max(1, parseInt(t, 10) || 1) })}
                keyboardType="number-pad"
                className="rounded-xl border px-3 py-2 font-body text-[13px] w-16 text-center"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
              />
              <Text style={{ color: colors.textSecondary }} className="font-body text-[13px] ml-2">
                occurrences
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
