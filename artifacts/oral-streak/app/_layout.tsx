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
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { SpotifyProvider } from "@/context/SpotifyContext";
import {
  configureNotificationHandler,
  requestNotificationPermissions,
  scheduleAllReminders,
} from "@/services/notificationService";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function NotificationSetup() {
  const { state, loading, todayRecord } = useApp();
  const notifRef = useRef(false);

  useEffect(() => {
    if (!loading && !state.settings.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [loading, state.settings.onboardingComplete]);

  useEffect(() => {
    if (loading || !state.settings.onboardingComplete || notifRef.current) return;
    notifRef.current = true;
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
      } catch {}
    })();
  }, [loading, state.settings.onboardingComplete]);

  const pFloss = useRef(todayRecord.floss);
  const pMouthwash = useRef(todayRecord.mouthwash);
  const pMorning = useRef(todayRecord.morningBrush);
  const pNight = useRef(todayRecord.nightBrush);
  const pMorningTime = useRef(state.settings.morningReminderTime);
  const pNightTime = useRef(state.settings.nightReminderTime);

  useEffect(() => {
    if (loading || !state.settings.onboardingComplete || !notifRef.current) return;
    const tasks =
      pFloss.current !== todayRecord.floss ||
      pMouthwash.current !== todayRecord.mouthwash ||
      pMorning.current !== todayRecord.morningBrush ||
      pNight.current !== todayRecord.nightBrush;
    const times =
      pMorningTime.current !== state.settings.morningReminderTime ||
      pNightTime.current !== state.settings.nightReminderTime;
    if (!tasks && !times) return;
    pFloss.current = todayRecord.floss;
    pMouthwash.current = todayRecord.mouthwash;
    pMorning.current = todayRecord.morningBrush;
    pNight.current = todayRecord.nightBrush;
    pMorningTime.current = state.settings.morningReminderTime;
    pNightTime.current = state.settings.nightReminderTime;
    scheduleAllReminders(state.settings.morningReminderTime, state.settings.nightReminderTime, {
      morningBrush: todayRecord.morningBrush,
      nightBrush: todayRecord.nightBrush,
      floss: todayRecord.floss,
      mouthwash: todayRecord.mouthwash,
    }).catch(() => {});
  }, [
    todayRecord.morningBrush, todayRecord.nightBrush,
    todayRecord.floss, todayRecord.mouthwash,
    state.settings.morningReminderTime, state.settings.nightReminderTime,
    loading, state.settings.onboardingComplete,
  ]);

  return null;
}

/**
 * Uses expo-router's "protected routes" pattern:
 * conditionally render screens based on auth state.
 * When a screen group disappears, expo-router auto-redirects.
 */
function RootLayoutNav() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  return (
    <AppProvider>
      <SpotifyProvider>
        <NotificationSetup />
        <Stack screenOptions={{ headerShown: false }}>
          {isSignedIn ? (
            // Authenticated screens
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="timer" options={{ presentation: "modal", gestureEnabled: false }} />
              <Stack.Screen name="missed-reflection" options={{ presentation: "modal" }} />
              <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
              <Stack.Screen name="shop" options={{ presentation: "card" }} />
            </>
          ) : (
            // Unauthenticated — only auth screens
            <Stack.Screen name="(auth)" />
          )}
        </Stack>
      </SpotifyProvider>
    </AppProvider>
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
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
