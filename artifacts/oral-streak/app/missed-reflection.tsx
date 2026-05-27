import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const MISSED_REASONS = [
  { id: "forgot", label: "I forgot", icon: "hourglass-outline" },
  { id: "traveling", label: "Was traveling", icon: "airplane-outline" },
  { id: "fell_asleep", label: "Fell asleep early", icon: "bed-outline" },
  { id: "sick", label: "Was feeling sick", icon: "medkit-outline" },
  { id: "busy", label: "Too busy", icon: "flash-outline" },
  { id: "no_supplies", label: "Didn't have supplies", icon: "bag-outline" },
  { id: "other", label: "Other reason", icon: "chatbubble-ellipses-outline" },
];

export default function MissedReflectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ session: string }>();
  const session = params.session ?? "morning";
  const { logMissedReason } = useApp();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sessionLabel = session === "morning" ? "Morning Brush" : "Night Brush";

  const handleSelectReason = (reasonId: string) => {
    Haptics.selectionAsync();
    setSelectedReason(reasonId);
  };

  const handleSubmit = () => {
    if (!selectedReason) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logMissedReason(session, selectedReason);
    setSubmitted(true);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Missed Session
        </Text>
        {submitted && (
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={26} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!submitted ? (
          <>
            {/* Streak warning */}
            <View style={[styles.warningCard, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}>
              <Ionicons name="alert-circle" size={24} color={colors.destructive} />
              <View style={styles.warningText}>
                <Text style={[styles.warningTitle, { color: colors.destructive, fontFamily: "Inter_700Bold" }]}>
                  Streak Impact
                </Text>
                <Text style={[styles.warningDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Missing {sessionLabel} has broken your brushing streak. Rebuild it starting today.
                </Text>
              </View>
            </View>

            <Text style={[styles.question, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Why did you miss your {sessionLabel}?
            </Text>
            <Text style={[styles.subtext, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Reflection helps build better habits. This is required.
            </Text>

            <View style={styles.reasonsList}>
              {MISSED_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonCard,
                      {
                        backgroundColor: isSelected ? colors.primary + "22" : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => handleSelectReason(reason.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.reasonIcon, { backgroundColor: isSelected ? colors.primary + "33" : colors.surface }]}>
                      <Ionicons
                        name={reason.icon as any}
                        size={20}
                        color={isSelected ? colors.primary : colors.mutedForeground}
                      />
                    </View>
                    <Text
                      style={[
                        styles.reasonLabel,
                        {
                          color: isSelected ? colors.primary : colors.foreground,
                          fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                        },
                      ]}
                    >
                      {reason.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: selectedReason ? colors.primary : colors.muted,
                  opacity: selectedReason ? 1 : 0.5,
                },
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason}
              activeOpacity={0.85}
            >
              <Text style={[styles.submitBtnText, { color: selectedReason ? colors.primaryForeground : colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                Submit
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successView}>
            <View style={[styles.successIcon, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Reflection logged
            </Text>
            <Text style={[styles.successDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Self-awareness is the first step. Now make today count — your streak needs rebuilding.
            </Text>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleClose}
              activeOpacity={0.85}
            >
              <Text style={[styles.submitBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                Back to Home
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 22 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  warningText: { flex: 1 },
  warningTitle: { fontSize: 15, marginBottom: 2 },
  warningDesc: { fontSize: 13, lineHeight: 19 },
  question: { fontSize: 22, lineHeight: 30 },
  subtext: { fontSize: 14, marginTop: -8 },
  reasonsList: { gap: 10 },
  reasonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  reasonIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  reasonLabel: { flex: 1, fontSize: 15 },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitBtnText: { fontSize: 17 },
  successView: { alignItems: "center", gap: 16, paddingTop: 40 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 24 },
  successDesc: { fontSize: 15, textAlign: "center", lineHeight: 22, paddingHorizontal: 20 },
});
