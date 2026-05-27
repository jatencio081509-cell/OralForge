import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

type TimerState = "idle" | "running" | "done";
type SessionType = "morning" | "night" | "extra";

const SESSION_LABELS: Record<SessionType, string> = {
  morning: "Morning Brush",
  night: "Night Brush",
  extra: "Extra Session",
};

const SESSION_ICONS: Record<SessionType, keyof typeof import("@expo/vector-icons").Ionicons.glyphMap | string> = {
  morning: "sunny",
  night: "moon",
  extra: "add-circle",
};

const XP_EARNED: Record<SessionType, number> = {
  morning: 25,
  night: 25,
  extra: 10,
};

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ session: string }>();
  const session = (params.session ?? "morning") as SessionType;
  const { state, completeMorningBrush, completeNightBrush, addExtraBrush } = useApp();

  const durationSeconds = (state.settings.timerDuration ?? 2) * 60;

  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  // Use a ref to track interval so it never goes stale
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether completion has already been recorded (prevent double-fire)
  const completedRef = useRef(false);
  // Track last haptic milestone to avoid re-firing
  const lastHapticElapsed = useRef(0);

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Prevent back navigation while timer is running
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (timerState === "running") return true;
      return false;
    });
    return () => handler.remove();
  }, [timerState]);

  // Pulse animation — start/stop based on timerState
  useEffect(() => {
    if (timerState === "running") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 800, easing: Easing.inOut(Easing.sine) }),
          withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1.0, { duration: 200 });
    }
  }, [timerState]);

  // Side effects that react to secondsLeft changes (NEVER inside setState)
  useEffect(() => {
    if (timerState !== "running") return;

    const elapsed = durationSeconds - secondsLeft;

    // Haptic every 30 seconds elapsed (not on first tick)
    if (elapsed > 0 && elapsed % 30 === 0 && elapsed !== lastHapticElapsed.current) {
      lastHapticElapsed.current = elapsed;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    // Update ring progress animation
    const pct = elapsed / durationSeconds;
    progress.value = withTiming(pct, { duration: 900 });

    // Timer complete
    if (secondsLeft <= 0 && !completedRef.current) {
      completedRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTimerState("done");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // Award completion — safe to call here (outside setState updater)
      try {
        if (session === "morning") completeMorningBrush();
        else if (session === "night") completeNightBrush();
        else if (session === "extra") addExtraBrush();
      } catch {
        // Never let a context error crash the timer result screen
      }
    }
  }, [secondsLeft, timerState]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    } catch {}
    lastHapticElapsed.current = 0;
    completedRef.current = false;
    setSecondsLeft(durationSeconds);
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      // Simple pure decrement — no side effects here
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const handleCancel = () => {
    if (timerState === "running") {
      Alert.alert(
        "Cancel Session?",
        "The timer must fully complete for brushing to count. Your progress will be lost.",
        [
          { text: "Keep Brushing", style: "cancel" },
          {
            text: "Cancel",
            style: "destructive",
            onPress: () => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleDone = () => {
    router.back();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progressPercent = Math.min(
    100,
    ((durationSeconds - secondsLeft) / durationSeconds) * 100
  );

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + 0.7 * progress.value,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPad,
          paddingBottom: bottomPad,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        {timerState !== "running" ? (
          <TouchableOpacity onPress={handleCancel} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={[styles.sessionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {SESSION_LABELS[session]}
        </Text>
        {timerState === "running" ? (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={[styles.cancelText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.cancelBtn} />
        )}
      </View>

      {/* Main timer display */}
      <View style={styles.timerArea}>
        <Animated.View style={[styles.ringOuter, { borderColor: colors.primary + "33" }, ringStyle]}>
          <Animated.View style={[styles.ringMiddle, { borderColor: colors.primary + "55" }, pulseStyle]}>
            <View style={[styles.ringInner, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              {timerState === "done" ? (
                <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={SESSION_ICONS[session] as any}
                    size={28}
                    color={timerState === "running" ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.timerText,
                      {
                        color: timerState === "running" ? colors.primary : colors.foreground,
                        fontFamily: "Inter_700Bold",
                      },
                    ]}
                  >
                    {timeDisplay}
                  </Text>
                  {timerState === "running" && (
                    <Text style={[styles.brushingLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                      Keep brushing!
                    </Text>
                  )}
                </>
              )}
            </View>
          </Animated.View>
        </Animated.View>

        {timerState === "running" && (
          <View style={styles.progressInfo}>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${progressPercent}%` as any,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {Math.round(progressPercent)}% complete — do not exit
            </Text>
          </View>
        )}
      </View>

      {/* Bottom section */}
      <View style={styles.bottom}>
        {timerState === "idle" && (
          <>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                The timer must fully complete for your session to count. Do not exit during brushing.
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.metaBadge, { backgroundColor: colors.surface }]}>
                <Ionicons name="timer-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  {state.settings.timerDuration} minutes
                </Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: colors.surface }]}>
                <Ionicons name="pulse-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  Haptic every 30s
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              onPress={startTimer}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={22} color={colors.primaryForeground} />
              <Text style={[styles.startBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                Start Brushing
              </Text>
            </TouchableOpacity>
          </>
        )}

        {timerState === "running" && (
          <View style={[styles.runningInfo, { backgroundColor: colors.card }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Timer locked. Brush all surfaces thoroughly.
            </Text>
          </View>
        )}

        {timerState === "done" && (
          <>
            <View style={[styles.successCard, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              <View style={styles.successText}>
                <Text style={[styles.successTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  Session Complete!
                </Text>
                <Text style={[styles.successSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  +{XP_EARNED[session]} XP earned
                  {session === "extra" ? " • +1 Freeze Token" : ""}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              onPress={handleDone}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={22} color={colors.primaryForeground} />
              <Text style={[styles.startBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                Done
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  sessionLabel: { fontSize: 18 },
  cancelBtn: { width: 64, alignItems: "flex-end", justifyContent: "center" },
  cancelText: { fontSize: 15 },
  timerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 32,
  },
  ringOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringMiddle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timerText: {
    fontSize: 52,
    letterSpacing: -2,
    lineHeight: 56,
  },
  brushingLabel: { fontSize: 14 },
  progressInfo: { width: "100%", gap: 8 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 13, textAlign: "center" },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: "row", gap: 10 },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: { fontSize: 12 },
  startBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  startBtnText: { fontSize: 18 },
  runningInfo: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  successCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  successText: { flex: 1 },
  successTitle: { fontSize: 17 },
  successSub: { fontSize: 13 },
});
