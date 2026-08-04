import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { generateId } from "../lib/schemas";
import { parseInlineSegments, toggleMarkerOnSelection } from "../lib/inlineFormatting";
import { useAppTheme } from "../context/ThemeContext";

const BLOCK_TYPES = [
  { type: "paragraph", icon: "reorder-four-outline", label: "Text" },
  { type: "heading", icon: "text-outline", label: "Heading" },
  { type: "bulleted", icon: "list-outline", label: "Bullets" },
  { type: "numbered", icon: "list-circle-outline", label: "Numbered" },
  { type: "checklist", icon: "checkbox-outline", label: "Checklist" },
  { type: "quote", icon: "chatbox-outline", label: "Quote" },
  { type: "code", icon: "code-slash-outline", label: "Code" },
];

const MARKERS = [
  { marker: "**", icon: "B", a11y: "Bold" },
  { marker: "*", icon: "I", a11y: "Italic" },
  { marker: "__", icon: "U", a11y: "Underline" },
  { marker: "==", icon: "H", a11y: "Highlight" },
];

function BlockPreview({ block, colors }) {
  const segments = parseInlineSegments(block.text);
  return (
    <Text
      className={`text-[15px] leading-[22px] ${block.text ? "" : "opacity-40"}`}
      style={{ color: colors.textPrimary, fontFamily: block.type === "code" ? "monospace" : undefined }}
    >
      {block.text
        ? segments.map((seg, i) => (
            <Text
              key={i}
              style={{
                fontWeight: seg.bold ? "700" : "400",
                fontStyle: seg.italic ? "italic" : "normal",
                textDecorationLine: seg.underline ? "underline" : "none",
                backgroundColor: seg.highlight ? colors.brandSoft : "transparent",
              }}
            >
              {seg.text}
            </Text>
          ))
        : "Empty"}
    </Text>
  );
}

function BlockMarker({ block, index, colors }) {
  if (block.type === "bulleted") {
    return (
      <Text style={{ color: colors.textTertiary }} className="text-[15px] mr-2 mt-0.5">
        •
      </Text>
    );
  }
  if (block.type === "numbered") {
    return (
      <Text style={{ color: colors.textTertiary }} className="text-[13px] mr-2 mt-1 font-semibold">
        {index}.
      </Text>
    );
  }
  return null;
}

const Block = React.memo(function Block({
  block,
  index,
  isFocused,
  onFocus,
  onBlur,
  onChangeText,
  onSelectionChange,
  onToggleChecklist,
  colors,
}) {
  const isHeading = block.type === "heading";
  const isQuote = block.type === "quote";
  const isCode = block.type === "code";

  return (
    <View
      className={`flex-row items-start mb-1 ${isQuote ? "pl-3 border-l-4" : ""} ${
        isCode ? "rounded-xl px-3 py-2" : ""
      }`}
      style={{
        borderColor: isQuote ? colors.borderStrong : undefined,
        backgroundColor: isCode ? colors.surfaceInset : "transparent",
      }}
    >
      <BlockMarker block={block} index={index} colors={colors} />
      {block.type === "checklist" && (
        <Pressable
          onPress={() => onToggleChecklist(block.id)}
          hitSlop={10}
          className="w-6 h-6 rounded-lg border-2 items-center justify-center mr-2 mt-0.5"
          style={{
            backgroundColor: block.checked ? colors.brand : "transparent",
            borderColor: block.checked ? colors.brand : colors.borderStrong,
          }}
        >
          {block.checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </Pressable>
      )}

      <View className="flex-1">
        {isFocused ? (
          <TextInput
            autoFocus
            multiline
            value={block.text}
            onChangeText={(t) => onChangeText(block.id, t)}
            onSelectionChange={(e) => onSelectionChange(block.id, e.nativeEvent.selection)}
            onFocus={() => onFocus(block.id)}
            onBlur={onBlur}
            placeholder="Type something…"
            placeholderTextColor={colors.textTertiary}
            className={`text-[15px] leading-[22px] p-0 ${isHeading ? "font-heading text-[18px]" : ""} ${
              block.checked ? "line-through opacity-50" : ""
            }`}
            style={{ color: colors.textPrimary, fontFamily: isCode ? "monospace" : undefined }}
          />
        ) : (
          <Pressable onPress={() => onFocus(block.id)}>
            <View className={block.checked ? "opacity-50" : ""}>
              <BlockPreview block={block} colors={colors} />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
});

export default function NotesEditor({ value, onChange }) {
  const { colors } = useAppTheme();
  const blocks = value && value.length > 0 ? value : [{ id: generateId("blk"), type: "paragraph", text: "" }];
  const [focusedId, setFocusedId] = useState(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const focusedIndex = blocks.findIndex((b) => b.id === focusedId);
  const focusedBlock = focusedIndex >= 0 ? blocks[focusedIndex] : null;

  // Refs mirroring the latest render's values, so the callbacks below can
  // have a stable identity ([] deps) while still always acting on current
  // data — without this, every callback would need `blocks`/`focusedBlock`/
  // `selection` in its dependency array, which changes every keystroke and
  // recreates the callback every time, defeating Block's React.memo entirely.
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const focusedBlockRef = useRef(focusedBlock);
  focusedBlockRef.current = focusedBlock;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const focusedIdRef = useRef(focusedId);
  focusedIdRef.current = focusedId;

  const handleChangeText = useCallback(
    (id, text) => {
      onChange(blocksRef.current.map((b) => (b.id === id ? { ...b, text } : b)));
    },
    [onChange]
  );

  const handleSelectionChange = useCallback((id, sel) => {
    if (id === focusedIdRef.current) setSelection(sel);
  }, []);

  const handleToggleChecklist = useCallback(
    (id) => {
      onChange(blocksRef.current.map((b) => (b.id === id ? { ...b, checked: !b.checked } : b)));
    },
    [onChange]
  );

  const handleSetBlockType = useCallback(
    (type) => {
      const fb = focusedBlockRef.current;
      if (!fb) return;
      onChange(
        blocksRef.current.map((b) =>
          b.id === fb.id ? { ...b, type, checked: type === "checklist" ? !!b.checked : undefined } : b
        )
      );
    },
    [onChange]
  );

  const handleApplyMarker = useCallback(
    (marker) => {
      const fb = focusedBlockRef.current;
      if (!fb) return;
      const { text, cursor } = toggleMarkerOnSelection(fb.text, selectionRef.current, marker);
      onChange(blocksRef.current.map((b) => (b.id === fb.id ? { ...b, text } : b)));
      setSelection({ start: cursor, end: cursor });
    },
    [onChange]
  );

  const handleAddBlock = useCallback(() => {
    const newBlock = { id: generateId("blk"), type: "paragraph", text: "" };
    onChange([...blocksRef.current, newBlock]);
    setFocusedId(newBlock.id);
  }, [onChange]);

  const handleDeleteBlock = useCallback(() => {
    const fb = focusedBlockRef.current;
    if (!fb || blocksRef.current.length <= 1) return;
    onChange(blocksRef.current.filter((b) => b.id !== fb.id));
    setFocusedId(null);
  }, [onChange]);

  return (
    <View>
      {blocks.map((block, index) => {
        const numberedIndex =
          block.type === "numbered"
            ? blocks.slice(0, index + 1).filter((b) => b.type === "numbered").length
            : index;
        return (
          <Block
            key={block.id}
            block={block}
            index={numberedIndex}
            isFocused={block.id === focusedId}
            onFocus={setFocusedId}
            onBlur={() => {}}
            onChangeText={handleChangeText}
            onSelectionChange={handleSelectionChange}
            onToggleChecklist={handleToggleChecklist}
            colors={colors}
          />
        );
      })}

      <Pressable
        onPress={handleAddBlock}
        className="flex-row items-center mt-2 py-2"
        accessibilityRole="button"
        accessibilityLabel="Add block"
      >
        <Ionicons name="add-circle-outline" size={18} color={colors.textTertiary} />
        <Text style={{ color: colors.textTertiary }} className="font-body text-[13px] ml-1.5">
          Add block
        </Text>
      </Pressable>

      {focusedBlock && (
        <View
          className="flex-row items-center justify-between rounded-2xl border px-2 py-2 mt-1"
          style={{ backgroundColor: colors.surfaceInset, borderColor: colors.border }}
        >
          <View className="flex-row items-center flex-1">
            {BLOCK_TYPES.map((bt) => (
              <Pressable
                key={bt.type}
                onPress={() => handleSetBlockType(bt.type)}
                hitSlop={6}
                className="w-9 h-9 rounded-xl items-center justify-center mr-1"
                style={{ backgroundColor: focusedBlock.type === bt.type ? colors.brandSoft : "transparent" }}
                accessibilityLabel={bt.label}
              >
                <Ionicons
                  name={bt.icon}
                  size={16}
                  color={focusedBlock.type === bt.type ? colors.brand : colors.textTertiary}
                />
              </Pressable>
            ))}
          </View>
          <View className="flex-row items-center">
            {MARKERS.map((m) => (
              <Pressable
                key={m.marker}
                onPress={() => handleApplyMarker(m.marker)}
                hitSlop={6}
                className="w-8 h-8 rounded-lg items-center justify-center mr-0.5"
                accessibilityLabel={m.a11y}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 13 }}>{m.icon}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={handleDeleteBlock}
              hitSlop={6}
              disabled={blocks.length <= 1}
              className="w-8 h-8 rounded-lg items-center justify-center ml-1"
              accessibilityLabel="Delete block"
            >
              <Ionicons name="trash-outline" size={15} color={blocks.length <= 1 ? colors.border : colors.danger} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
