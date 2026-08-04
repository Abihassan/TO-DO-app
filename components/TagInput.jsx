import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTags, getOrCreateTag } from "../store/tagsStore";
import { useAppTheme } from "../context/ThemeContext";

export default function TagInput({ tagIds, onChange }) {
  const { colors } = useAppTheme();
  const allTags = useTags();
  const [draft, setDraft] = useState("");

  const selectedTags = useMemo(
    () => tagIds.map((id) => allTags.find((t) => t.id === id)).filter(Boolean),
    [tagIds, allTags]
  );

  const suggestions = useMemo(() => {
    if (!draft.trim()) return [];
    const q = draft.trim().toLowerCase();
    return allTags.filter((t) => t.name.toLowerCase().includes(q) && !tagIds.includes(t.id)).slice(0, 5);
  }, [draft, allTags, tagIds]);

  function commitDraft() {
    const text = draft.trim();
    if (!text) return;
    const tag = getOrCreateTag(text);
    if (tag && !tagIds.includes(tag.id)) {
      onChange([...tagIds, tag.id]);
    }
    setDraft("");
  }

  function addExisting(tag) {
    if (!tagIds.includes(tag.id)) onChange([...tagIds, tag.id]);
    setDraft("");
  }

  function removeTag(id) {
    onChange(tagIds.filter((t) => t !== id));
  }

  return (
    <View>
      <View className="flex-row flex-wrap mb-2">
        {selectedTags.map((tag) => (
          <View
            key={tag.id}
            className="flex-row items-center rounded-full px-3 py-1.5 mr-2 mb-2"
            style={{ backgroundColor: colors.brandSoft }}
          >
            <Text style={{ color: colors.brand }} className="font-heading text-[12px] mr-1">
              #{tag.name}
            </Text>
            <Pressable onPress={() => removeTag(tag.id)} hitSlop={8}>
              <Ionicons name="close" size={13} color={colors.brand} />
            </Pressable>
          </View>
        ))}
      </View>

      <View
        className="flex-row items-center rounded-2xl border px-3"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Ionicons name="pricetag-outline" size={15} color={colors.textTertiary} />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commitDraft}
          placeholder="Add a tag…"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          className="flex-1 text-[14px] font-body py-3 ml-2"
          style={{ color: colors.textPrimary }}
        />
      </View>

      {suggestions.length > 0 && (
        <View
          className="rounded-2xl border mt-1.5 overflow-hidden"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          {suggestions.map((tag) => (
            <Pressable
              key={tag.id}
              onPress={() => addExisting(tag)}
              className="px-4 py-2.5"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Text style={{ color: colors.textPrimary }} className="font-body text-[13px]">
                #{tag.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
