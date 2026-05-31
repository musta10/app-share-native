import { Feather } from "@expo/vector-icons";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { UIProvider } from "@/context/UIContext";
import { useShareIntentSafe } from "@/utils/shareIntent";

SplashScreen.preventAutoHideAsync();

function OnboardingGate() {
  const { hydrated, onboarded } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const onWelcome = segments[0] === "welcome";
    if (!onboarded && !onWelcome) {
      router.replace("/welcome");
    } else if (onboarded && onWelcome) {
      router.replace("/(tabs)");
    }
  }, [hydrated, onboarded, segments]);

  return null;
}

/**
 * Captura URLs compartidas desde Instagram/YouTube/TikTok/etc. mediante el
 * "Share Intent" nativo de Android/iOS. Cuando el usuario pulsa "Compartir →
 * Share" en otra app, navegamos a la pantalla "+" con la URL pre-rellenada.
 *
 * Solo activo en development builds / APKs reales — en Expo Go el hook es no-op.
 */
function ShareIntentListener() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentSafe();
  const router = useRouter();
  const { hydrated, onboarded } = useApp();

  useEffect(() => {
    if (!hasShareIntent || !hydrated) return;
    if (!onboarded) return;
    const sharedUrl =
      shareIntent?.webUrl || shareIntent?.text || "";
    if (!sharedUrl) {
      resetShareIntent();
      return;
    }
    router.push({
      pathname: "/(tabs)/add",
      // _ts asegura que compartir el mismo URL dos veces dispare otra vez
      // el prefill (sin él, el ref de dedupe en add.jsx lo bloquearía).
      params: { sharedUrl, _ts: String(Date.now()) },
    });
    resetShareIntent();
  }, [hasShareIntent, shareIntent, hydrated, onboarded]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <OnboardingGate />
      <ShareIntentListener />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#08070d" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="welcome" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="song/[id]"
          options={{
            presentation: "card",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppProvider>
            <UIProvider>
              <StatusBar style="light" />
              <RootLayoutNav />
            </UIProvider>
          </AppProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
