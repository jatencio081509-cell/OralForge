import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { DayRecord } from "@/context/AppContext";
import { todayString } from "@/services/streakService";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 100;

  const historyMap: Record<string, DayRecord> = {};
  for (const r of state.history) {
    historyMap[r.date] = r;
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(v => v - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    const now = new Date();
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewYear(v => v + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const getDayColor = (dateStr: string): string => {
    const record = historyMap[dateStr];
    if (!record) return "transparent";
    switch (record.status) {
      case "complete": return colors.primary;
      case "partial": return colors.warning;
      case "missed": return colors.destructive;
      default: return "transparent";
    }
  };

  const selectedRecord = selectedDate ? historyMap[selectedDate] : null;

  const todayStr = todayString();
  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  // Build calendar grid cells
  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: formatDate(viewYear, viewMonth, d) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

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
          Habit Calendar
        </Text>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { label: "Complete", color: colors.primary },
            { label: "Partial", color: colors.warning },
            { label: "Missed", color: colors.destructive },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar card */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={isCurrentMonth}
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={isCurrentMonth ? colors.border : colors.foreground}
              />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaderRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={[styles.dayHeader, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                {d}
              </Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {cells.map((cell, i) => {
              if (!cell) return <View key={`empty-${i}`} style={styles.cell} />;
              const { day, dateStr } = cell;
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > todayStr;
              const dayColor = isFuture ? "transparent" : getDayColor(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.cell,
                    isToday && { borderColor: colors.primary, borderWidth: 2, borderRadius: 12 },
                    isSelected && { borderColor: colors.primary + "88", borderWidth: 1.5, borderRadius: 12 },
                  ]}
                  onPress={() => !isFuture && setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  disabled={isFuture}
                  activeOpacity={0.7}
                >
                  {dayColor !== "transparent" && (
                    <View style={[styles.dayDot, { backgroundColor: dayColor }]} />
                  )}
                  <Text
                    style={[
                      styles.dayNum,
                      {
                        color: isFuture ? colors.border : isToday ? colors.primary : colors.foreground,
                        fontFamily: isToday ? "Inter_700Bold" : "Inter_400Regular",
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Detail */}
        {selectedDate && (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.detailDate, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric",
              })}
            </Text>
            {selectedRecord ? (
              <>
                <View style={[styles.statusPill, { backgroundColor: selectedRecord.status === "complete" ? colors.primary + "22" : selectedRecord.status === "partial" ? colors.warning + "22" : colors.destructive + "22" }]}>
                  <Text style={[styles.statusText, { color: selectedRecord.status === "complete" ? colors.primary : selectedRecord.status === "partial" ? colors.warning : colors.destructive, fontFamily: "Inter_600SemiBold" }]}>
                    {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                  </Text>
                </View>
                <View style={styles.taskGrid}>
                  {[
                    { label: "Morning Brush", done: selectedRecord.morningBrush },
                    { label: "Night Brush", done: selectedRecord.nightBrush },
                    { label: "Floss", done: selectedRecord.floss },
                    { label: "Mouthwash", done: selectedRecord.mouthwash },
                  ].map((t) => (
                    <View key={t.label} style={styles.taskRow}>
                      <Ionicons
                        name={t.done ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={t.done ? colors.primary : colors.destructive}
                      />
                      <Text style={[styles.taskLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                        {t.label}
                      </Text>
                    </View>
                  ))}
                </View>
                {selectedRecord.extraBrushes > 0 && (
                  <Text style={[styles.extraText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    +{selectedRecord.extraBrushes} extra brush session{selectedRecord.extraBrushes > 1 ? "s" : ""}
                  </Text>
                )}
              </>
            ) : (
              <Text style={[styles.noDataText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                No data recorded for this day.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 14 },
  pageTitle: { fontSize: 28, marginBottom: 4 },
  legend: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
  calendarCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthTitle: { fontSize: 18 },
  dayHeaderRow: { flexDirection: "row" },
  dayHeader: { flex: 1, textAlign: "center", fontSize: 12, paddingVertical: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: 2,
  },
  dayDot: { position: "absolute", bottom: 4, width: 5, height: 5, borderRadius: 3 },
  dayNum: { fontSize: 14 },
  detailCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  detailDate: { fontSize: 17 },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 13 },
  taskGrid: { gap: 8 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  taskLabel: { fontSize: 14 },
  extraText: { fontSize: 13 },
  noDataText: { fontSize: 14 },
});
