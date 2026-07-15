import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const TodoContext = createContext(null);

let idCounter = 100;
function nextId() {
  idCounter += 1;
  return `task-${idCounter}`;
}

function todayAt(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function inDaysAt(days, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const initialTasks = [
  {
    id: "task-1",
    title: "Complete math quest 📚",
    description: "Finish worksheet 4 — fractions & decimals",
    category: "school",
    priority: "high",
    dueDate: todayAt(16, 0),
    completed: false,
    createdAt: todayAt(8, 0),
  },
  {
    id: "task-2",
    title: "Clean the room 🚀",
    description: "Tidy the desk, make the bed, vacuum the floor",
    category: "chores",
    priority: "medium",
    dueDate: todayAt(18, 30),
    completed: false,
    createdAt: todayAt(8, 5),
  },
  {
    id: "task-3",
    title: "Walk the dog 🐶",
    description: "Take Biscuit around the block twice",
    category: "chores",
    priority: "low",
    dueDate: todayAt(19, 0),
    completed: false,
    createdAt: todayAt(8, 10),
  },
  {
    id: "task-4",
    title: "Beat the castle level 🏰",
    description: "Reach world 4 in Star Explorers",
    category: "gaming",
    priority: "low",
    dueDate: todayAt(20, 0),
    completed: false,
    createdAt: todayAt(8, 15),
  },
  {
    id: "task-5",
    title: "Practice free throws 🏀",
    description: "50 shots at the driveway hoop",
    category: "fitness",
    priority: "medium",
    dueDate: inDaysAt(1, 17, 0),
    completed: false,
    createdAt: todayAt(8, 20),
  },
  {
    id: "task-6",
    title: "Read a chapter book 📖",
    description: "At least 20 pages of the adventure novel",
    category: "school",
    priority: "medium",
    dueDate: inDaysAt(2, 20, 0),
    completed: false,
    createdAt: todayAt(8, 25),
  },
  {
    id: "task-7",
    title: "Morning stretch routine 🧘",
    description: "10 minutes of stretches before school",
    category: "fitness",
    priority: "low",
    dueDate: todayAt(7, 30),
    completed: true,
    createdAt: todayAt(6, 0),
  },
  {
    id: "task-8",
    title: "Feed the fish 🐠",
    description: "Morning and evening feeding",
    category: "chores",
    priority: "high",
    dueDate: todayAt(7, 0),
    completed: true,
    createdAt: todayAt(6, 5),
  },
];

const weeklyMockStats = [
  { day: "Mon", completed: 4, total: 6 },
  { day: "Tue", completed: 5, total: 5 },
  { day: "Wed", completed: 3, total: 7 },
  { day: "Thu", completed: 6, total: 6 },
  { day: "Fri", completed: 2, total: 5 },
  { day: "Sat", completed: 4, total: 4 },
  { day: "Sun", completed: 1, total: 3 },
];

export function TodoProvider({ children }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeCategory, setActiveCategory] = useState("all");

  const addTask = useCallback((draft) => {
    const newTask = {
      id: nextId(),
      title: draft.title.trim(),
      description: draft.description ? draft.description.trim() : "",
      category: draft.category,
      priority: draft.priority,
      dueDate: draft.dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((id, draft) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: draft.title.trim(),
              description: draft.description ? draft.description.trim() : "",
              category: draft.category,
              priority: draft.priority,
              dueDate: draft.dueDate || null,
            }
          : t
      )
    );
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleComplete = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const activeTasks = useMemo(() => {
    const list = tasks.filter((t) => !t.completed);
    if (activeCategory === "all") return list;
    return list.filter((t) => t.category === activeCategory);
  }, [tasks, activeCategory]);

  const completedTasks = useMemo(() => {
    const list = tasks.filter((t) => t.completed);
    if (activeCategory === "all") return list;
    return list.filter((t) => t.category === activeCategory);
  }, [tasks, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    tasks
      .filter((t) => !t.completed)
      .forEach((t) => {
        counts[t.category] = (counts[t.category] || 0) + 1;
      });
    return counts;
  }, [tasks]);

  const todayProgress = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, pct };
  }, [tasks]);

  const value = {
    tasks,
    activeTasks,
    completedTasks,
    activeCategory,
    setActiveCategory,
    categoryCounts,
    todayProgress,
    weeklyStats: weeklyMockStats,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodo() {
  const ctx = useContext(TodoContext);
  if (!ctx) {
    throw new Error("useTodo must be used within a TodoProvider");
  }
  return ctx;
}
