export const categories = [
  {
    id: "school",
    label: "School",
    emoji: "📚",
    color: "#3B82F6",
    soft: "#DBEAFE",
    gradient: ["#60A5FA", "#3B82F6"],
  },
  {
    id: "chores",
    label: "Chores",
    emoji: "🏠",
    color: "#FF6B6B",
    soft: "#FFE3E3",
    gradient: ["#FF8A8A", "#FF6B6B"],
  },
  {
    id: "gaming",
    label: "Gaming",
    emoji: "🎮",
    color: "#7C3AED",
    soft: "#EDE3FE",
    gradient: ["#A78BFA", "#7C3AED"],
  },
  {
    id: "fitness",
    label: "Fitness",
    emoji: "🏅",
    color: "#14B8A6",
    soft: "#CCFBF1",
    gradient: ["#5EEAD4", "#14B8A6"],
  },
];

export const getCategoryById = (id) =>
  categories.find((c) => c.id === id) || categories[0];

export const priorities = [
  {
    id: "high",
    label: "High",
    emoji: "🔥",
    color: "#FF3B5C",
    soft: "#FFE0E6",
  },
  {
    id: "medium",
    label: "Medium",
    emoji: "⭐",
    color: "#FFB020",
    soft: "#FFF3D6",
  },
  {
    id: "low",
    label: "Low",
    emoji: "🌱",
    color: "#22C55E",
    soft: "#DCFCE7",
  },
];

export const getPriorityById = (id) =>
  priorities.find((p) => p.id === id) || priorities[1];

export const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
