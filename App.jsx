import "./global.css";
import React, { useCallback } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
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
import { TodoProvider } from "./context/TodoContext";
import DashboardScreen from "./screens/DashboardScreen";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [balooLoaded] = useBaloo({ Baloo2_600SemiBold, Baloo2_700Bold });
  const [nunitoLoaded] = useNunito({ Nunito_400Regular, Nunito_600SemiBold });
  const fontsLoaded = balooLoaded && nunitoLoaded;

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  React.useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-inkSoft text-[13px] mt-4 font-body">
          Loading your quests…
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TodoProvider>
          <StatusBar style="light" />
          <DashboardScreen />
        </TodoProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
