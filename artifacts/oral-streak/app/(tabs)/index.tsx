import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { TaskCard } from "@/components/TaskCard";
import { StreakDisplay } from "@/components/StreakDisplay";
import { XPBar } from "@/components/XPBar";
import { getMotivationalMessage } from "@/constants/motivational";
import { todayString } from "@/services/streakService";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, todayRecord, completeFloss, completeMouthwash, newBadges, clearNewBadges } = useApp();
  const [motivationalMsg] = useState(() =>
    getMotivationalMessage(state.brushingStreak, state.isComeback)
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 100;

  useEffect(() => {
    if (newBadges.length > 0) {
      const badgeId = newBadges[0];
      Alert.alert("Badge Unlocked!", `You earned a new badge: ${badgeId.replace(/_/g, " ")}`);
      clearNewBadges();
    }
  }, [newBadges]);

  const completionCount = [
    todayRecord.morningBrush,
    todayRecord.nightBrush,
    todayRecord.floss,
    todayRecord.mouthwash,
  ].filter(Boolean).length;

  const totalTasks = 4;
  const allDone = completionCount === totalTasks;

  const handleBrushNow = (session: "morning" | "night") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(`/timer?session=${session}`);
  };

  const handleMissedSession = (session: "morning" | "night") => {
    router.push(`/missed-reflection?session=${session}`);
  };

  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.day, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {dayOfWeek}
            </Text>
            <Text style={[styles.date, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {dateStr}
            </Text>
          </View>
          <View style={[styles.completionPill, { backgroundColor: allDone ? colors.primary + "22" : colors.card }]}>
            <Text style={[styles.completionText, { color: allDone ? colors.primary : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              {completionCount}/{totalTasks}
            </Text>
          </View>
        </View>

        {/* Comeback Mode Banner */}
        {state.isComeback && (
          <View style={[styles.comebackBanner, { backgroundColor: colors.warning + "22", borderColor: colors.warning + "44" }]}>
            <Ionicons name="refresh-circle" size={20} color={colors.warning} />
            <Text style={[styles.comebackText, { color: colors.warning, fontFamily: "Inter_600SemiBold" }]}>
              Comeback Mode — rebuild your streak today
            </Text>
          </View>
        )}

        {/* All Done Banner */}
        {allDone && (
          <View style={[styles.allDoneBanner, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={[styles.allDoneText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              Perfect day! All tasks complete.
            </Text>
          </View>
        )}

        {/* Motivational message */}
        <Text style={[styles.motivational, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {motivationalMsg}
        </Text>

        {/* Streaks */}
        <StreakDisplay
          brushingStreak={state.brushingStreak}
          fullCareStreak={state.fullCareStreak}
        />

        {/* XP Bar */}
        <View style={{ marginTop: 12 }}>
          <XPBar xp={state.xp} compact />
        </View>

        {/* Today's Tasks */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Today's Routine
        </Text>

        <TaskCard
          title="Morning Brush"
          subtitle="2-3 min timer required"
          done={todayRecord.morningBrush}
          type="brush"
          onAction={() => handleBrushNow("morning")}
          iconName="sunny-outline"
        />

        <TaskCard
          title="Night Brush"
          subtitle="2-3 min timer required"
          done={todayRecord.nightBrush}
          type="brush"
          onAction={() => handleBrushNow("night")}
          iconName="moon-outline"
        />

        <TaskCard
          title="Floss"
          subtitle="Once per day"
          done={todayRecord.floss}
          type="checkable"
          onAction={completeFloss}
          iconName="fitness-outline"
        />

        <TaskCard
          title="Mouthwash"
          subtitle="Once per day"
          done={todayRecord.mouthwash}
          type="checkable"
          onAction={completeMouthwash}
          iconName="water-outline"
        />

        {/* Extra Brush CTA */}
        <TouchableOpacity
          style={[styles.extraBrushBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/timer?session=extra")}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.mutedForeground} />
          <Text style={[styles.extraBrushText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Log Extra Brush Session
          </Text>
          <View style={[styles.tokenPill, { backgroundColor: colors.gold + "22" }]}>
            <Ionicons name="shield-checkmark-outline" size={12} color={colors.gold} />
            <Text style={[styles.tokenText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
              +Token
            </Text>
          </View>
        </TouchableOpacity>

        {/* Missed Session */}
        {(!todayRecord.morningBrush || !todayRecord.nightBrush) && (
          <View style={styles.missedRow}>
            {!todayRecord.morningBrush && (
              <TouchableOpacity
                style={[styles.missedBtn, { borderColor: colors.destructive + "44" }]}
                onPress={() => handleMissedSession("morning")}
              >
                <Ionicons name="alert-circle-outline" size={14} color={colors.destructive} />
                <Text style={[styles.missedBtnText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
                  Missed morning
                </Text>
              </TouchableOpacity>
            )}
            {!todayRecord.nightBrush && (
              <TouchableOpacity
                style={[styles.missedBtn, { borderColor: colors.destructive + "44" }]}
                onPress={() => handleMissedSession("night")}
              >
                <Ionicons name="alert-circle-outline" size={14} color={colors.destructive} />
                <Text style={[styles.missedBtnText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
                  Missed night
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats footer */}
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {state.totalFullDays}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Full Days
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {state.freezeTokens}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Freeze Tokens
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {state.totalSessions}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Sessions
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  day: {
    fontSize: 14,
    marginBottom: 2,
  },
  date: {
    fontSize: 24,
  },
  completionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completionText: {
    fontSize: 16,
  },
  comebackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  comebackText: {
    fontSize: 14,
    flex: 1,
  },
  allDoneBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  allDoneText: {
    fontSize: 14,
    flex: 1,
  },
  motivational: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  extraBrushBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  extraBrushText: {
    flex: 1,
    fontSize: 14,
  },
  tokenPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tokenText: {
    fontSize: 11,
  },
  missedRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  missedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  missedBtnText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 4,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statNum: {
    fontSize: 22,
  },
  statLabel: {
    fontSize: 11,
  },
  divider: {
    width: 1,
    height: 32,
  },
});
