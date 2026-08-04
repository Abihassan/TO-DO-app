import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import ThemeSelector from "../components/ThemeSelector";
import { useTasks } from "../store/tasksStore";
import { useCategories } from "../store/categoriesStore";
import { useTags } from "../store/tagsStore";
import { useRecurringTemplates } from "../store/recurringStore";
import { useCalendarEvents } from "../store/calendarEventsStore";
import { useNotes } from "../store/notesStore";
import { useSettings, updateSettings } from "../store/settingsStore";
import {
  buildTaskRows,
  buildNoteRows,
  TASK_COLUMNS,
  CATEGORY_COLUMNS,
  TAG_COLUMNS,
  RECURRING_TEMPLATE_COLUMNS,
  CALENDAR_EVENT_COLUMNS,
  NOTE_COLUMNS,
} from "../lib/csvExport";
import { exportRowsAsCsv } from "../lib/runCsvExport";

function SectionLabel({ children, colors }) {
  return (
    <Text style={{ color: colors.textSecondary }} className="font-heading text-[11px] uppercase tracking-wide mb-2 mt-6 px-1">
      {children}
    </Text>
  );
}

function ExportRow({ label, count, onExport, colors }) {
  const [busy, setBusy] = useState(false);

  async function handlePress() {
    if (count === 0) {
      Alert.alert("Nothing to export", `You don't have any ${label.toLowerCase()} yet.`);
      return;
    }
    setBusy(true);
    try {
      await onExport();
    } catch (error) {
      Alert.alert("Export failed", error?.message || "Something went wrong while exporting.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={busy}
      className="flex-row items-center justify-between rounded-2xl border px-4 py-3.5 mb-2 min-h-[44px]"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-center">
        <Ionicons name="document-text-outline" size={16} color={colors.textTertiary} />
        <View className="ml-2.5">
          <Text style={{ color: colors.textPrimary }} className="font-body text-[14px]">
            {label}
          </Text>
          <Text style={{ color: colors.textTertiary }} className="font-body text-[11px] mt-0.5">
            {count} record{count === 1 ? "" : "s"}
          </Text>
        </View>
      </View>
      {busy ? <ActivityIndicator size="small" color={colors.brand} /> : <Ionicons name="share-outline" size={17} color={colors.brand} />}
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const settings = useSettings();

  const tasks = useTasks();
  const categories = useCategories({ includeArchived: true });
  const tags = useTags();
  const recurringTemplates = useRecurringTemplates();
  const calendarEvents = useCalendarEvents();
  const notes = useNotes();

  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const tagsById = Object.fromEntries(tags.map((t) => [t.id, t]));

  async function markExported() {
    updateSettings({ lastCsvExportAt: new Date().toISOString() });
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgApp, paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ color: colors.textPrimary }} className="font-heading text-[16px]">
          Settings
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        <SectionLabel colors={colors}>Appearance</SectionLabel>
        <ThemeSelector />

        <SectionLabel colors={colors}>Categories & Tags</SectionLabel>
        <Pressable
          onPress={() => navigation.navigate("CategoryManager")}
          className="flex-row items-center justify-between rounded-2xl border px-4 py-3.5 min-h-[44px]"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View className="flex-row items-center">
            <Ionicons name="pricetags-outline" size={16} color={colors.textTertiary} />
            <Text style={{ color: colors.textPrimary }} className="font-body text-[14px] ml-2.5">
              Manage categories
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>

        <SectionLabel colors={colors}>Export data (CSV)</SectionLabel>
        <Text style={{ color: colors.textTertiary }} className="font-body text-[12px] mb-3 px-1">
          Each export opens the share sheet so you can save or send the file — nothing leaves your device
          automatically.
          {settings.lastCsvExportAt ? ` Last export: ${new Date(settings.lastCsvExportAt).toLocaleString()}.` : ""}
        </Text>

        <ExportRow
          label="Tasks"
          count={tasks.length}
          colors={colors}
          onExport={async () => {
            await exportRowsAsCsv(buildTaskRows(tasks, categoriesById, tagsById), TASK_COLUMNS, "tasks");
            markExported();
          }}
        />
        <ExportRow
          label="Categories"
          count={categories.length}
          colors={colors}
          onExport={async () => {
            await exportRowsAsCsv(categories, CATEGORY_COLUMNS, "categories");
            markExported();
          }}
        />
        <ExportRow
          label="Tags"
          count={tags.length}
          colors={colors}
          onExport={async () => {
            await exportRowsAsCsv(tags, TAG_COLUMNS, "tags");
            markExported();
          }}
        />
        <ExportRow
          label="Recurring Tasks"
          count={recurringTemplates.length}
          colors={colors}
          onExport={async () => {
            await exportRowsAsCsv(recurringTemplates, RECURRING_TEMPLATE_COLUMNS, "recurring-tasks");
            markExported();
          }}
        />
        <ExportRow
          label="Calendar Events"
          count={calendarEvents.length}
          colors={colors}
          onExport={async () => {
            await exportRowsAsCsv(calendarEvents, CALENDAR_EVENT_COLUMNS, "calendar-events");
            markExported();
          }}
        />
        <ExportRow
          label="Notes"
          count={notes.length}
          colors={colors}
          onExport={async () => {
            await exportRowsAsCsv(buildNoteRows(notes), NOTE_COLUMNS, "notes");
            markExported();
          }}
        />

        <SectionLabel colors={colors}>About</SectionLabel>
        <View className="rounded-2xl border px-4 py-3.5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text style={{ color: colors.textSecondary }} className="font-body text-[12px] leading-5">
            All data is stored locally on this device as JSON files — nothing is sent to a server. Uninstalling the
            app removes this data, so export a CSV backup periodically if you'd like a copy elsewhere.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
