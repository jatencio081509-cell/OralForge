import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const STEPS = ["welcome", "schedule", "timer", "ready"] as const;
type Step = (typeof STEPS)[number];

const PRESET_TIMES = [
  "05:00", "05:30", "06:00", "06:30", "07:00",
  "07:30", "08:00", "08:30", "09:00",
];

const SLEEP_TIMES = [
  "20:00", "20:30", "21:00", "21:30", "22:00",
  "22:30", "23:00", "23:30", "00:00",
];

function TimeSelector({
  times,
  selected,
  onSelect,
}: {
  times: string[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.timeGrid}>
      {times.map((t) => {
        const isSelected = t === selected;
        return (
          <TouchableOpacity
            key={t}
            style={[
              styles.timeOption,
              {
                backgroundColor: isSelected ? colors.primary : colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(t);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.timeOptionText,
                {
                  color: isSelected ? colors.primaryForeground : colors.foreground,
                  fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState<Step>("welcome");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("22:00");
  const [timerDuration, setTimerDuration] = useState<2 | 3>(2);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex]);
    }
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOnboarding({
      wakeTime,
      sleepTime,
      morningReminderTime: wakeTime,
      nightReminderTime: sleepTime,
      timerDuration,
      onboardingComplete: true,
    });
    router.replace("/(tabs)");
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPad + 16,
          paddingBottom: bottomPad + 16,
        },
      ]}
    >
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` as any }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === "welcome" && (
          <View style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="water" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Welcome to OralStreak
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Build the world's most underrated habit — consistent oral hygiene. Strict tracking. Verified brushing. Real streaks.
            </Text>
            <View style={styles.rulesList}>
              {[
                { icon: "timer-outline", text: "Brushing requires a full timer — no shortcuts" },
                { icon: "flame-outline", text: "Streaks break if you miss — no forgiveness" },
                { icon: "trophy-outline", text: "Earn XP, badges, and freeze tokens" },
                { icon: "calendar-outline", text: "Track your history with a habit calendar" },
              ].map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={[styles.ruleIcon, { backgroundColor: colors.card }]}>
                    <Ionicons name={rule.icon as any} size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.ruleText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {rule.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === "schedule" && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Set Your Schedule
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Choose your wake-up and bedtime. We'll set your reminders accordingly.
            </Text>

            <Text style={[styles.timeLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Wake Time
            </Text>
            <TimeSelector
              times={PRESET_TIMES}
              selected={wakeTime}
              onSelect={setWakeTime}
            />

            <Text style={[styles.timeLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Bedtime
            </Text>
            <TimeSelector
              times={SLEEP_TIMES}
              selected={sleepTime}
              onSelect={setSleepTime}
            />
          </View>
        )}

        {step === "timer" && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Brushing Timer
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Dentists recommend 2 minutes. Go for 3 if you want that extra clean. This cannot be changed mid-session.
            </Text>

            <View style={styles.timerOptions}>
              {([2, 3] as const).map((mins) => {
                const isSelected = timerDuration === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.timerOption,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTimerDuration(mins);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.timerMins, { color: isSelected ? colors.primaryForeground : colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      {mins}
                    </Text>
                    <Text style={[styles.timerUnit, { color: isSelected ? colors.primaryForeground : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      minutes
                    </Text>
                    {mins === 2 && (
                      <View style={[styles.recBadge, { backgroundColor: isSelected ? colors.primaryForeground + "22" : colors.primary + "22" }]}>
                        <Text style={[styles.recText, { color: isSelected ? colors.primaryForeground : colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                          Recommended
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === "ready" && (
          <View style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              You're All Set
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Your journey to perfect oral health starts now. Brush twice daily, floss, and use mouthwash to keep your streak alive.
            </Text>

            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Ionicons name="sunny-outline" size={16} color={colors.primary} />
                <Text style={[styles.summaryText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                  Morning reminder at {wakeTime}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="moon-outline" size={16} color={colors.primary} />
                <Text style={[styles.summaryText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                  Night reminder at {sleepTime}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="timer-outline" size={16} color={colors.primary} />
                <Text style={[styles.summaryText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                  {timerDuration}-minute brushing timer
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={step === "ready" ? handleFinish : goNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
            {step === "ready" ? "Start OralStreak" : "Continue"}
          </Text>
          <Ionicons name={step === "ready" ? "checkmark" : "arrow-forward"} size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressTrack: { height: 4, marginHorizontal: 24, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
  stepContent: { gap: 16 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  stepTitle: { fontSize: 28, lineHeight: 34 },
  stepDesc: { fontSize: 15, lineHeight: 22 },
  rulesList: { gap: 10 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  ruleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ruleText: { flex: 1, fontSize: 14 },
  timeLabel: { fontSize: 16, marginBottom: -8 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  timeOptionText: { fontSize: 14 },
  timerOptions: { flexDirection: "row", gap: 14 },
  timerOption: { flex: 1, padding: 20, borderRadius: 18, borderWidth: 2, alignItems: "center", gap: 4 },
  timerMins: { fontSize: 48 },
  timerUnit: { fontSize: 14 },
  recBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  recText: { fontSize: 11 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryText: { fontSize: 14 },
  footer: { paddingHorizontal: 24, paddingTop: 16 },
  nextBtn: { height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  nextBtnText: { fontSize: 18 },
});
