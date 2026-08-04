// ---------------------------------------------------------------------------
// Priority metadata (4 levels). Categories are no longer a fixed set here —
// they're a full CRUD entity now (see store/categoriesStore.js); each
// category record already carries its own icon/color.
// ---------------------------------------------------------------------------
export const PRIORITY_META = {
  low: { label: "Low", icon: "leaf-outline", color: "#22C55E", soft: "#DCFCE7", softDark: "rgba(74,222,128,0.16)" },
  medium: { label: "Medium", icon: "flag-outline", color: "#FFB020", soft: "#FFF3D6", softDark: "rgba(251,191,36,0.18)" },
  high: { label: "High", icon: "alert-circle-outline", color: "#FF6B35", soft: "#FFE4D6", softDark: "rgba(255,107,53,0.2)" },
  critical: { label: "Critical", icon: "flame-outline", color: "#FF3B5C", soft: "#FFE0E6", softDark: "rgba(251,113,133,0.2)" },
};

export const PRIORITY_ORDER = ["low", "medium", "high", "critical"];

export function getPriorityMeta(priority) {
  return PRIORITY_META[priority] || PRIORITY_META.medium;
}

// Resolves the correct tinted background for a priority (or category, which
// shares the same soft/softDark shape) against the currently active scheme.
export const getSoft = (entry, scheme) => (scheme === "dark" ? entry.softDark : entry.soft);

export const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------------------------------------------------------------------------
// Semantic design tokens — surfaces, borders, text hierarchy, brand accents.
// These mirror the Tailwind `slate` scale used in className strings
// (e.g. `text-slate-900 dark:text-slate-100`) but as raw hex values, for the
// places NativeWind classes can't reach: SVG strokes, shadowColor,
// LinearGradient stops, and icon `color` props.
// ---------------------------------------------------------------------------
export const lightColors = {
  scheme: "light",
  bgApp: "#F8FAFC", // slate-50
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceInset: "#F1F5F9", // slate-100
  border: "#F1F5F9", // slate-100
  borderStrong: "#E2E8F0", // slate-200
  textPrimary: "#0F172A", // slate-900
  textSecondary: "#94A3B8", // slate-400 (metadata / muted)
  textTertiary: "#64748B", // slate-500
  overlay: "rgba(15,23,42,0.40)",
  brand: "#7C3AED", // grape
  brandSoft: "#EDE3FE",
  danger: "#EF4444",
  dangerSoft: "#FFE0E6",
  success: "#16A34A",
  progressTrack: "rgba(15,23,42,0.08)",
  shadowColor: "#0F172A",
  shadowOpacity: 0.08,
};

export const darkColors = {
  scheme: "dark",
  bgApp: "#0B1120", // near slate-950
  surface: "#151C2C", // elevated card, lighter than bgApp
  surfaceElevated: "#1B2436",
  surfaceInset: "#1E293B", // slate-800
  border: "#1E293B", // slate-800
  borderStrong: "#334155", // slate-700
  textPrimary: "#F1F5F9", // slate-100
  textSecondary: "#64748B", // slate-500 (metadata / muted, per spec)
  textTertiary: "#94A3B8", // slate-400
  overlay: "rgba(2,6,23,0.60)",
  brand: "#A78BFA", // lighter grape for contrast on dark surfaces
  brandSoft: "rgba(124,58,237,0.22)",
  danger: "#FB7185",
  dangerSoft: "rgba(251,113,133,0.18)",
  success: "#34D399",
  progressTrack: "rgba(241,245,249,0.12)",
  shadowColor: "#000000",
  shadowOpacity: 0, // flat elevation in dark mode; borders carry separation
};

export const getSemanticColors = (scheme) =>
  scheme === "dark" ? darkColors : lightColors;
