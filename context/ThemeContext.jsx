import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { getSemanticColors } from "../constants/theme";

const THEME_STORAGE_KEY = "@todo/theme-preference";
const VALID_PREFERENCES = ["light", "dark", "system"];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // NativeWind owns the actual `dark` class application + OS subscription.
  // `colorScheme` here is always the *resolved* value ("light" | "dark"),
  // even when the underlying preference is "system".
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();

  // `preference` is what the user actually picked (including "system"),
  // used to drive which pill is highlighted in <ThemeSelector />.
  const [preference, setPreferenceState] = useState("system");
  const [isThemeReady, setIsThemeReady] = useState(false);

  // Hydrate the saved preference once on mount, before the app UI renders,
  // so there is no flash of the wrong theme.
  useEffect(() => {
    let isMounted = true;

    (async () => {
      let initial = "system";
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (VALID_PREFERENCES.includes(stored)) {
          initial = stored;
        }
      } catch (error) {
        // Storage unavailable — fall back to following the OS setting.
        initial = "system";
      }

      setColorScheme(initial);
      if (isMounted) {
        setPreferenceState(initial);
        setIsThemeReady(true);
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPreference = useCallback(
    (next) => {
      if (!VALID_PREFERENCES.includes(next)) return;
      setPreferenceState(next);
      setColorScheme(next);
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {
        // Non-fatal: the in-memory preference still applies for this session.
      });
    },
    [setColorScheme]
  );

  const scheme = colorScheme === "dark" ? "dark" : "light";
  const colors = useMemo(() => getSemanticColors(scheme), [scheme]);

  const value = useMemo(
    () => ({
      preference, // "light" | "dark" | "system"
      setPreference,
      scheme, // resolved "light" | "dark"
      colors, // semantic token object for the resolved scheme
      isThemeReady,
    }),
    [preference, setPreference, scheme, colors, isThemeReady]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return ctx;
}
