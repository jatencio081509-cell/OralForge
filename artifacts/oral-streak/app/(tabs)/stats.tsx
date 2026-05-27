import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { DayRecord } from "@/context/AppContext";
import { todayString } from "@/services/streakService";

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconBox, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.statCardValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        {value}
      </Text>
      <Text style={[styles.statCardLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
    </View>
  );
}

function WeekBar({ record, index }: { record: DayRecord | null; index: number }) {
  const colors = useColors();
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() - (6 - index));
  const dayLetter = days[d.getDay()];

  const fillColor = record
    ? record.status === "complete"
      ? colors.primary
      : record.status === "partial"
      ? colors.warning
      : colors.destructive
    : colors.muted;

  const height = record
    ? record.status === "complete"
      ? 60
      : record.status === "partial"
      ? 36
      : 16
    : 8;

  return (
    <View style={styles.barWrapper}>
      <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.barFill, { backgroundColor: fillColor, height }]} />
      </View>
      <Text style={[styles.barLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
        {dayLetter}
      </Text>
    </View>
  );
}

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 100;

  const today = new Date();
  const todayStr = todayString();

  // Last 7 days
  const last7: Array<DayRecord | null> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const record = state.history.find((r) => r.date === dateStr) ?? null;
    last7.push(record);
  }

  // Weekly stats
  const last7Complete = last7.filter((r) => r?.status === "complete").length;
  const last7Partial = last7.filter((r) => r?.status === "partial").length;
  const last7Missed = last7.filter((r) => r?.status === "missed").length;
  const completionRate = Math.round((last7Complete / 7) * 100);

  // Weak habits detection
  const morningMisses = state.history.filter((r) => !r.morningBrush && r.date <= todayStr).length;
  const nightMisses = state.history.filter((r) => !r.nightBrush && r.date <= todayStr).length;
  const flossMisses = state.history.filter((r) => !r.floss && r.date <= todayStr).length;
  const mouthwashMisses = state.history.filter((r) => !r.mouthwash && r.date <= todayStr).length;

  const habits = [
    { name: "Morning Brush", misses: morningMisses },
    { name: "Night Brush", misses: nightMisses },
    { name: "Floss", misses: flossMisses },
    { name: "Mouthwash", misses: mouthwashMisses },
  ].sort((a, b) => b.misses - a.misses);

  const weakestHabit = habits[0];

  // Weekend vs weekday (last 30 days)
  const last30 = state.history.slice(-30);
  const weekendDays = last30.filter((r) => {
    const d = new Date(r.date + "T12:00:00");
    return d.getDay() === 0 || d.getDay() === 6;
  });
  const weekdayDays = last30.filter((r) => {
    const d = new Date(r.date + "T12:00:00");
    return d.getDay() > 0 && d.getDay() < 6;
  });
  const weekendRate = weekendDays.length
    ? Math.round((weekendDays.filter((r) => r.status === "complete").length / weekendDays.length) * 100)
    : 0;
  const weekdayRate = weekdayDays.length
    ? Math.round((weekdayDays.filter((r) => r.status === "complete").length / weekdayDays.length) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Progress Insights
        </Text>

        {/* Stat grid */}
        <View style={styles.statGrid}>
          <StatCard
            label="Brush Streak"
            value={`${state.brushingStreak}d`}
            icon="flame"
            color="#ff8c42"
          />
          <StatCard
            label="Full Care Streak"
            value={`${state.fullCareStreak}d`}
            icon="ribbon"
            color={colors.primary}
          />
          <StatCard
            label="Total Full Days"
            value={`${state.totalFullDays}`}
            icon="trophy"
            color={colors.gold}
          />
          <StatCard
            label="Freeze Tokens"
            value={`${state.freezeTokens}`}
            icon="shield-checkmark"
            color="#9b59b6"
          />
        </View>

        {/* Weekly bar chart */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Last 7 Days
          </Text>
          <View style={styles.barChart}>
            {last7.map((r, i) => (
              <WeekBar key={i} record={r} index={i} />
            ))}
          </View>
          <View style={styles.weekSummary}>
            <View style={styles.weekSummaryItem}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.weekSummaryText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {last7Complete} complete
              </Text>
            </View>
            <View style={styles.weekSummaryItem}>
              <View style={[styles.dot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.weekSummaryText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {last7Partial} partial
              </Text>
            </View>
            <View style={styles.weekSummaryItem}>
              <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
              <Text style={[styles.weekSummaryText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {last7Missed} missed
              </Text>
            </View>
          </View>
          <View style={[styles.completionRateBar, { backgroundColor: colors.surface }]}>
            <View style={[styles.completionRateFill, { backgroundColor: colors.primary, width: `${completionRate}%` as any }]} />
            <Text style={[styles.completionRateText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {completionRate}% completion this week
            </Text>
          </View>
        </View>

        {/* Weak habits */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Habit Patterns
          </Text>
          {habits.map((h, i) => {
            const total = state.history.filter((r) => r.date <= todayStr).length;
            const rate = total > 0 ? Math.round(((total - h.misses) / total) * 100) : 100;
            return (
              <View key={h.name} style={styles.habitRow}>
                <View style={styles.habitLabel}>
                  <Text style={[styles.habitName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    {h.name}
                  </Text>
                  <Text style={[styles.habitRate, { color: i === 0 ? colors.warning : colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    {rate}%
                  </Text>
                </View>
                <View style={[styles.habitBarTrack, { backgroundColor: colors.muted }]}>
                  <View style={[styles.habitBarFill, { backgroundColor: i === 0 ? colors.warning : colors.primary, width: `${rate}%` as any }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Weekend vs weekday */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Weekday vs Weekend
          </Text>
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <Text style={[styles.compareValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {weekdayRate}%
              </Text>
              <Text style={[styles.compareLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Weekdays
              </Text>
            </View>
            <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
            <View style={styles.compareItem}>
              <Text style={[styles.compareValue, { color: weekendRate < weekdayRate ? colors.warning : colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {weekendRate}%
              </Text>
              <Text style={[styles.compareLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Weekends
              </Text>
            </View>
          </View>
          {weekendRate < weekdayRate && weekdayRate > 0 && (
            <View style={[styles.insightBanner, { backgroundColor: colors.warning + "22" }]}>
              <Ionicons name="alert-circle" size={16} color={colors.warning} />
              <Text style={[styles.insightText, { color: colors.warning, fontFamily: "Inter_400Regular" }]}>
                Weekend drop-off detected. Stay consistent on Saturdays and Sundays.
              </Text>
            </View>
          )}
        </View>

        {/* Total sessions */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Lifetime Stats
          </Text>
          <View style={styles.lifetimeGrid}>
            {[
              { label: "Total Sessions", value: state.totalSessions },
              { label: "Extra Brushes", value: state.extraBrushesTotal },
              { label: "Total XP", value: state.xp },
              { label: "Badges Earned", value: state.unlockedBadges.length },
            ].map((item) => (
              <View key={item.label} style={[styles.lifetimeItem, { borderColor: colors.border }]}>
                <Text style={[styles.lifetimeValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {item.value}
                </Text>
                <Text style={[styles.lifetimeLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 14 },
  pageTitle: { fontSize: 28, marginBottom: 4 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47%",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statCardValue: { fontSize: 24 },
  statCardLabel: { fontSize: 12, textAlign: "center" },
  section: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 17 },
  barChart: { flexDirection: "row", gap: 6, alignItems: "flex-end", height: 80 },
  barWrapper: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: { width: "100%", height: 68, borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: 6 },
  barLabel: { fontSize: 11 },
  weekSummary: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  weekSummaryItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  weekSummaryText: { fontSize: 12 },
  completionRateBar: {
    height: 36,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 12,
    position: "relative",
  },
  completionRateFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 10,
  },
  completionRateText: { fontSize: 14, zIndex: 1 },
  habitRow: { gap: 6 },
  habitLabel: { flexDirection: "row", justifyContent: "space-between" },
  habitName: { fontSize: 14 },
  habitRate: { fontSize: 14 },
  habitBarTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  habitBarFill: { height: "100%", borderRadius: 4 },
  compareRow: { flexDirection: "row", alignItems: "center" },
  compareItem: { flex: 1, alignItems: "center", gap: 4 },
  compareValue: { fontSize: 32 },
  compareLabel: { fontSize: 13 },
  compareDivider: { width: 1, height: 48, marginHorizontal: 12 },
  insightBanner: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 10, alignItems: "flex-start" },
  insightText: { flex: 1, fontSize: 13, lineHeight: 19 },
  lifetimeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 1 },
  lifetimeItem: { width: "50%", padding: 12, borderWidth: 0.5, alignItems: "center", gap: 4 },
  lifetimeValue: { fontSize: 26 },
  lifetimeLabel: { fontSize: 12, textAlign: "center" },
});
