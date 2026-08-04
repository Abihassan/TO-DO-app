import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../context/ThemeContext";
import { useCategories, addCategory, updateCategory, deleteCategory, countTasksByCategory } from "../store/categoriesStore";
import { useTasks } from "../store/tasksStore";

const COLOR_SWATCHES = [
  "#7C3AED", "#3B82F6", "#0EA5E9", "#14B8A6", "#22C55E", "#84CC16",
  "#F59E0B", "#F97316", "#FF6B35", "#EF4444", "#EC4899", "#A855F7",
  "#6366F1", "#78716C", "#94A3B8",
];

const ICON_CHOICES = [
  "briefcase-outline", "person-outline", "school-outline", "cash-outline",
  "cart-outline", "heart-outline", "barbell-outline", "medkit-outline",
  "airplane-outline", "home-outline", "flag-outline", "book-outline",
  "code-slash-outline", "color-palette-outline", "megaphone-outline",
  "calendar-outline", "call-outline", "mail-outline", "gift-outline",
  "sparkles-outline", "leaf-outline", "journal-outline", "construct-outline",
  "pricetag-outline",
];

function CategoryEditorModal({ visible, initial, onCancel, onSave, colors }) {
  const [name, setName] = useState(initial?.name || "");
  const [color, setColor] = useState(initial?.color || COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState(initial?.icon || ICON_CHOICES[0]);

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name || "");
      setColor(initial?.color || COLOR_SWATCHES[0]);
      setIcon(initial?.icon || ICON_CHOICES[0]);
    }
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.overlay }}>
        <View className="w-full rounded-3xl border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text style={{ color: colors.textPrimary }} className="font-heading text-[16px] mb-4">
            {initial ? "Edit category" : "New category"}
          </Text>

          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: color }}>
              <Ionicons name={icon} size={20} color="#FFFFFF" />
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Category name"
              placeholderTextColor={colors.textTertiary}
              className="flex-1 rounded-2xl border px-4 py-3 font-body text-[15px]"
              style={{ backgroundColor: colors.surfaceInset, borderColor: colors.border, color: colors.textPrimary }}
            />
          </View>

          <Text style={{ color: colors.textSecondary }} className="font-heading text-[11px] uppercase mb-2">
            Color
          </Text>
          <View className="flex-row flex-wrap mb-4">
            {COLOR_SWATCHES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                className="w-9 h-9 rounded-full mr-2 mb-2 items-center justify-center"
                style={{ backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.textPrimary }}
              />
            ))}
          </View>

          <Text style={{ color: colors.textSecondary }} className="font-heading text-[11px] uppercase mb-2">
            Icon
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
            {ICON_CHOICES.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                className="w-10 h-10 rounded-xl items-center justify-center mr-2"
                style={{ backgroundColor: icon === ic ? color : colors.surfaceInset }}
              >
                <Ionicons name={ic} size={17} color={icon === ic ? "#FFFFFF" : colors.textTertiary} />
              </Pressable>
            ))}
          </ScrollView>

          <View className="flex-row">
            <Pressable
              onPress={onCancel}
              className="flex-1 rounded-2xl py-3.5 items-center mr-2 border"
              style={{ borderColor: colors.border }}
            >
              <Text style={{ color: colors.textSecondary }} className="font-heading text-[14px]">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => name.trim() && onSave({ name: name.trim(), color, icon })}
              className="flex-1 rounded-2xl py-3.5 items-center"
              style={{ backgroundColor: colors.brand }}
            >
              <Text className="text-white font-heading text-[14px]">Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CategoryManagerScreen({ navigation }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const categories = useCategories();
  const tasks = useTasks();
  const counts = countTasksByCategory(tasks);

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function openCreate() {
    setEditingCategory(null);
    setEditorVisible(true);
  }
  function openEdit(cat) {
    setEditingCategory(cat);
    setEditorVisible(true);
  }
  function handleSave(fields) {
    if (editingCategory) updateCategory(editingCategory.id, fields);
    else addCategory(fields);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditorVisible(false);
  }
  function confirmDelete(id) {
    deleteCategory(id, null);
    setDeleteTarget(null);
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgApp, paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ color: colors.textPrimary }} className="font-heading text-[16px]">
          Categories
        </Text>
        <Pressable onPress={openCreate} hitSlop={10} className="w-10 h-10 items-center justify-center">
          <Ionicons name="add" size={24} color={colors.brand} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        {categories.map((cat) => (
          <View
            key={cat.id}
            className="flex-row items-center rounded-2xl border px-4 py-3.5 mb-2.5"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: cat.color }}>
              <Ionicons name={cat.icon} size={17} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary }} className="font-heading text-[14px]">
                {cat.name}
              </Text>
              <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mt-0.5">
                {counts[cat.id] || 0} active task{counts[cat.id] === 1 ? "" : "s"}
              </Text>
            </View>
            <Pressable onPress={() => openEdit(cat)} hitSlop={10} className="w-9 h-9 items-center justify-center">
              <Ionicons name="create-outline" size={17} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => setDeleteTarget(cat)} hitSlop={10} className="w-9 h-9 items-center justify-center">
              <Ionicons name="trash-outline" size={17} color={colors.danger} />
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={openCreate}
          className="flex-row items-center justify-center rounded-2xl border border-dashed px-4 py-4 mt-1 min-h-[44px]"
          style={{ borderColor: colors.borderStrong }}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary }} className="font-heading text-[13px] ml-2">
            New category
          </Text>
        </Pressable>
      </ScrollView>

      <CategoryEditorModal
        visible={editorVisible}
        initial={editingCategory}
        onCancel={() => setEditorVisible(false)}
        onSave={handleSave}
        colors={colors}
      />

      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.overlay }}>
          <View className="w-full rounded-3xl border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text style={{ color: colors.textPrimary }} className="font-heading text-[15px] mb-2">
              Delete "{deleteTarget?.name}"?
            </Text>
            <Text style={{ color: colors.textTertiary }} className="font-body text-[13px] mb-5">
              Tasks in this category will become uncategorized rather than being deleted.
            </Text>
            <View className="flex-row">
              <Pressable
                onPress={() => setDeleteTarget(null)}
                className="flex-1 rounded-2xl py-3.5 items-center mr-2 border"
                style={{ borderColor: colors.border }}
              >
                <Text style={{ color: colors.textSecondary }} className="font-heading text-[14px]">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(deleteTarget.id)}
                className="flex-1 rounded-2xl py-3.5 items-center"
                style={{ backgroundColor: colors.danger }}
              >
                <Text className="text-white font-heading text-[14px]">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
