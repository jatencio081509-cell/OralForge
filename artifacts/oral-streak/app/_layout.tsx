import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import {
  configureNotificationHandler,
  requestNotificationPermissions,
  scheduleAllReminders,
} from "@/services/notificationService";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { state, loading, todayRecord } = useApp();
  const notifBootstrapped = useRef(false);

  // Onboarding redirect
  useEffect(() => {
    if (!loading && !state.settings.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [loading, state.settings.onboardingComplete]);

  // Set up notification handler and request permissions once
  useEffect(() => {
    if (loading || !state.settings.onboardingComplete) return;
    if (notifBootstrapped.current) return;
    notifBootstrapped.current = true;
    // Run entirely async — never block or crash the UI
    (async () => {
      try {
        configureNotificationHandler();
        await requestNotificationPermissions();
        await scheduleAllReminders(
          state.settings.morningReminderTime,
          state.settings.nightReminderTime,
          {
            morningBrush: todayRecord.morningBrush,
            nightBrush: todayRecord.nightBrush,
            floss: todayRecord.floss,
            mouthwash: todayRecord.mouthwash,
          }
        );
      } catch {
        // Notification bootstrap failure must never affect the app
      }
    })();
  }, [loading, state.settings.onboardingComplete]);

  // Reschedule night reminder when task completions or reminder times change
  const prevFloss = useRef(todayRecord.floss);
  const prevMouthwash = useRef(todayRecord.mouthwash);
  const prevMorning = useRef(todayRecord.morningBrush);
  const prevNight = useRef(todayRecord.nightBrush);
  const prevMorningTime = useRef(state.settings.morningReminderTime);
  const prevNightTime = useRef(state.settings.nightReminderTime);

  useEffect(() => {
    if (loading || !state.settings.onboardingComplete || !notifBootstrapped.current) return;

    const tasksChanged =
      prevFloss.current !== todayRecord.floss ||
      prevMouthwash.current !== todayRecord.mouthwash ||
      prevMorning.current !== todayRecord.morningBrush ||
      prevNight.current !== todayRecord.nightBrush;

    const timesChanged =
      prevMorningTime.current !== state.settings.morningReminderTime ||
      prevNightTime.current !== state.settings.nightReminderTime;

    if (!tasksChanged && !timesChanged) return;

    prevFloss.current = todayRecord.floss;
    prevMouthwash.current = todayRecord.mouthwash;
    prevMorning.current = todayRecord.morningBrush;
    prevNight.current = todayRecord.nightBrush;
    prevMorningTime.current = state.settings.morningReminderTime;
    prevNightTime.current = state.settings.nightReminderTime;

    // Fire and forget — wrapped in try/catch inside scheduleAllReminders already
    scheduleAllReminders(
      state.settings.morningReminderTime,
      state.settings.nightReminderTime,
      {
        morningBrush: todayRecord.morningBrush,
        nightBrush: todayRecord.nightBrush,
        floss: todayRecord.floss,
        mouthwash: todayRecord.mouthwash,
      }
    ).catch(() => {});
  }, [
    todayRecord.morningBrush,
    todayRecord.nightBrush,
    todayRecord.floss,
    todayRecord.mouthwash,
    state.settings.morningReminderTime,
    state.settings.nightReminderTime,
    loading,
    state.settings.onboardingComplete,
  ]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="timer"
        options={{
          headerShown: false,
          presentation: "modal",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="missed-reflection"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="shop"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
