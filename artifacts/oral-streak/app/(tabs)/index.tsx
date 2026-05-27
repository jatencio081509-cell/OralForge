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
import { ProgressRing } from "@/components/ProgressRing";
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
      Alert.alert("Badge Unlocked!", `You earned: ${badgeId.replace(/_/g, " ")}`);
      clearNewBadges();
    }
  }, [newBadges]);

  const tasks = [
    { label: "Morning Brush", icon: "sunny-outline", done: todayRecord.morningBrush },
    { label: "Night Brush", icon: "moon-outline", done: todayRecord.nightBrush },
    { label: "Floss", icon: "fitness-outline", done: todayRecord.floss },
    { label: "Mouthwash", icon: "water-outline", done: todayRecord.mouthwash },
  ];

  const completionCount = tasks.filter((t) => t.done).length;
  const allDone = completionCount === tasks.length;

  const morningDone = todayRecord.morningBrush;
  const nightDone = todayRecord.nightBrush;

  const handleBrushNow = (session: "morning" | "night") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(`/timer?session=${session}`);
  };

  const handleMissedSession = (session: "morning" | "night") => {
    router.push(`/missed-reflection?session=${session}`);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

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
            <Text
              style={[
                styles.greeting,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              {greeting}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              {completionCount}/{tasks.length} tasks completed today
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.smilePill,
              { backgroundColor: colors.gold + "18", borderColor: colors.gold + "33" },
            ]}
            onPress={() => router.push("/shop")}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14 }}>😊</Text>
            <Text
              style={[
                styles.smileCount,
                { color: colors.gold, fontFamily: "Inter_700Bold" },
              ]}
            >
              {state.smilePoints}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comeback Banner */}
        {state.isComeback && (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.warning + "18", borderColor: colors.warning + "33" },
            ]}
          >
            <Ionicons name="refresh-circle" size={18} color={colors.warning} />
            <Text
              style={[
                styles.bannerText,
                { color: colors.warning, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              Welcome back — let's restart your streak today.
            </Text>
          </View>
        )}

        {/* All done banner */}
        {allDone && (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" },
            ]}
          >
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text
              style={[
                styles.bannerText,
                { color: colors.primary, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              Full care day complete. Streak protected.
            </Text>
          </View>
        )}

        {/* Progress Ring + Streak card */}
        <View style={[styles.centerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Progress ring */}
          <View style={styles.ringRow}>
            <ProgressRing tasks={tasks} size={168} />
            <View style={styles.ringTaskList}>
              {tasks.map((task, i) => (
                <View key={i} style={styles.ringTask}>
                  <Ionicons
                    name={task.done ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={task.done ? colors.primary : colors.border}
                  />
                  <Text
                    style={[
                      styles.ringTaskLabel,
                      {
                        color: task.done ? colors.foreground : colors.mutedForeground,
                        fontFamily: task.done ? "Inter_500Medium" : "Inter_400Regular",
                      },
                    ]}
                  >
                    {task.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

          {/* Streaks */}
          <StreakDisplay
            brushingStreak={state.brushingStreak}
            fullCareStreak={state.fullCareStreak}
            compact
          />

          {/* Motivational */}
          <Text
            style={[
              styles.motivational,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            {motivationalMsg}
          </Text>
        </View>

        {/* Primary CTA */}
        {!morningDone && (
          <TouchableOpacity
            style={[styles.primaryCTA, { backgroundColor: colors.primary }]}
            onPress={() => handleBrushNow("morning")}
            activeOpacity={0.85}
          >
            <Ionicons name="sunny" size={22} color={colors.primaryForeground} />
            <Text
              style={[
                styles.primaryCTAText,
                { color: colors.primaryForeground, fontFamily: "Inter_700Bold" },
              ]}
            >
              Start Morning Brush
            </Text>
            <View
              style={[
                styles.ctaLockBadge,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
            >
              <Ionicons name="lock-closed" size={12} color={colors.primaryForeground} />
            </View>
          </TouchableOpacity>
        )}

        {morningDone && !nightDone && (
          <TouchableOpacity
            style={[styles.primaryCTA, { backgroundColor: colors.primary }]}
            onPress={() => handleBrushNow("night")}
            activeOpacity={0.85}
          >
            <Ionicons name="moon" size={22} color={colors.primaryForeground} />
            <Text
              style={[
                styles.primaryCTAText,
                { color: colors.primaryForeground, fontFamily: "Inter_700Bold" },
              ]}
            >
              Start Night Brush
            </Text>
            <View
              style={[
                styles.ctaLockBadge,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
            >
              <Ionicons name="lock-closed" size={12} color={colors.primaryForeground} />
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Tasks section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
          ]}
        >
          Today's Routine
        </Text>

        <TaskCard
          title="Morning Brush"
          subtitle="Full timer required"
          done={todayRecord.morningBrush}
          type="brush"
          onAction={() => handleBrushNow("morning")}
          iconName="sunny-outline"
        />
        <TaskCard
          title="Night Brush"
          subtitle="Full timer required"
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

        {/* Extra brush */}
        <TouchableOpacity
          style={[
            styles.extraBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push("/timer?session=extra")}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.mutedForeground} />
          <Text
            style={[
              styles.extraBtnText,
              { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
            ]}
          >
            Log Extra Brush Session
          </Text>
          <View style={[styles.tokenPill, { backgroundColor: colors.gold + "1a" }]}>
            <Ionicons name="shield-checkmark-outline" size={11} color={colors.gold} />
            <Text
              style={[
                styles.tokenText,
                { color: colors.gold, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              +Freeze Token
            </Text>
          </View>
        </TouchableOpacity>

        {/* Missed session buttons */}
        {(!todayRecord.morningBrush || !todayRecord.nightBrush) && (
          <View style={styles.missedRow}>
            {!todayRecord.morningBrush && (
              <TouchableOpacity
                style={[styles.missedBtn, { borderColor: colors.destructive + "44" }]}
                onPress={() => handleMissedSession("morning")}
              >
                <Ionicons name="alert-circle-outline" size={13} color={colors.destructive} />
                <Text
                  style={[
                    styles.missedText,
                    { color: colors.destructive, fontFamily: "Inter_500Medium" },
                  ]}
                >
                  Missed morning
                </Text>
              </TouchableOpacity>
            )}
            {!todayRecord.nightBrush && (
              <TouchableOpacity
                style={[styles.missedBtn, { borderColor: colors.destructive + "44" }]}
                onPress={() => handleMissedSession("night")}
              >
                <Ionicons name="alert-circle-outline" size={13} color={colors.destructive} />
                <Text
                  style={[
                    styles.missedText,
                    { color: colors.destructive, fontFamily: "Inter_500Medium" },
                  ]}
                >
                  Missed night
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bottom stats */}
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statNum,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              {state.totalFullDays}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              Total Full Days
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statNum,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              {state.xp}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              XP Level {state.level}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  greeting: { fontSize: 14, marginBottom: 2 },
  subtitle: { fontSize: 18 },
  smilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  smileCount: { fontSize: 15 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: 13 },
  centerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  ringRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  ringTaskList: { flex: 1, gap: 10 },
  ringTask: { flexDirection: "row", alignItems: "center", gap: 8 },
  ringTaskLabel: { fontSize: 13 },
  cardDivider: { height: StyleSheet.hairlineWidth },
  motivational: { fontSize: 13, fontStyle: "italic", lineHeight: 19 },
  primaryCTA: {
    height: 60,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  primaryCTAText: { fontSize: 18, flex: 1 },
  ctaLockBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 18, marginTop: 4 },
  extraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  extraBtnText: { flex: 1, fontSize: 13 },
  tokenPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },
  tokenText: { fontSize: 11 },
  missedRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  missedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  missedText: { fontSize: 12 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 4,
  },
  statItem: { alignItems: "center", gap: 2 },
  statNum: { fontSize: 22 },
  statLabel: { fontSize: 12 },
  divider: { width: 1, height: 32 },
});
