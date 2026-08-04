import "./global.css";
import React, { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator, Text, AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts as useBaloo,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
} from "@expo-google-fonts/baloo-2";
import {
  useFonts as useNunito,
  Nunito_400Regular,
  Nunito_600SemiBold,
} from "@expo-google-fonts/nunito";
import { ThemeProvider, useAppTheme } from "./context/ThemeContext";
import { initDb, flushDb } from "./lib/db";
import RootNavigator from "./navigation/RootNavigator";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Rendered *inside* ThemeProvider so the loading state itself is
// theme-aware (no flash of the wrong background while everything hydrates).
function AppContent() {
  const { isThemeReady, colors } = useAppTheme();
  const [dbReady, setDbReady] = useState(false);

  const [balooLoaded] = useBaloo({ Baloo2_600SemiBold, Baloo2_700Bold });
  const [nunitoLoaded] = useNunito({ Nunito_400Regular, Nunito_600SemiBold });
  const fontsLoaded = balooLoaded && nunitoLoaded;
  const appReady = fontsLoaded && isThemeReady && dbReady;

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initDb();
      if (mounted) setDbReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Flush any pending debounced writes whenever the app is backgrounded or
  // closed, so an edit made seconds before switching apps is never lost.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        flushDb().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, []);

  const hideSplash = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  useEffect(() => {
    hideSplash();
  }, [hideSplash]);

  if (!appReady) {
    return (
      <View style={{ backgroundColor: colors.bgApp }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={{ color: colors.textSecondary }} className="text-[13px] mt-4 font-body">
          Loading your tasks…
        </Text>
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
