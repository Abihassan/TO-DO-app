import React, { useState, useCallback } from "react";
import { View, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTodo } from "../context/TodoContext";
import Header from "../components/Header";
import CategorySlider from "../components/CategorySlider";
import TaskCard from "../components/TaskCard";
import CompletedSection from "../components/CompletedSection";
import EmptyState from "../components/EmptyState";
import WeeklyChart from "../components/WeeklyChart";
import FAB from "../components/FAB";
import AddTaskModal from "../components/AddTaskModal";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const {
    activeTasks,
    completedTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
  } = useTodo();

  const openAdd = useCallback(() => {
    setEditingTask(null);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((task) => {
    setEditingTask(task);
    setModalVisible(true);
  }, []);

  const handleSubmit = useCallback(
    (draft) => {
      if (draft.id) {
        updateTask(draft.id, draft);
      } else {
        addTask(draft);
      }
    },
    [addTask, updateTask]
  );

  const handleDelete = useCallback(
    (id) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      deleteTask(id);
    },
    [deleteTask]
  );

  return (
    <View className="flex-1 bg-cream">
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <Header />
        <CategorySlider />

        <View className="mt-3">
          {activeTasks.length === 0 ? (
            <EmptyState />
          ) : (
            activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleComplete(task.id)}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>

        <CompletedSection
          tasks={completedTasks}
          onToggle={toggleComplete}
          onDelete={handleDelete}
        />

        <WeeklyChart />
      </ScrollView>

      <FAB onPress={openAdd} bottom={insets.bottom + 24} />

      <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        editingTask={editingTask}
      />
    </View>
  );
}
