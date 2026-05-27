import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { clearState } from "@/services/storageService";

function SettingRow({
  label,
  value,
  onPress,
  icon,
  iconColor,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  icon: string;
  iconColor?: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: (iconColor ?? colors.primary) + "22" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor ?? colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {value}
          </Text>
        )}
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function TimePickerRow({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const colors = useColors();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    if (/^\d{2}:\d{2}$/.test(draft)) {
      onChange(draft);
    } else {
      setDraft(value);
    }
    setEditing(false);
  };

  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + "22" }]}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            keyboardType="numbers-and-punctuation"
            style={[styles.timeInput, { color: colors.foreground, borderColor: colors.primary, fontFamily: "Inter_500Medium" }]}
            placeholder="HH:MM"
            placeholderTextColor={colors.mutedForeground}
            maxLength={5}
            autoFocus
            onBlur={save}
            onSubmitEditing={save}
          />
        </View>
      ) : (
        <TouchableOpacity onPress={() => setEditing(true)}>
          <Text style={[styles.settingValue, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            {value}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, updateSettings } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 100;

  const { settings } = state;

  const handleResetData = () => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all your progress, streaks, and history. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearState();
            Alert.alert("Data reset. Please restart the app.");
          },
        },
      ]
    );
  };

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
          Settings
        </Text>

        {/* Timer */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          TIMER
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="timer-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              Timer Duration
            </Text>
            <View style={styles.timerToggle}>
              {([2, 3] as const).map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.timerOption,
                    {
                      backgroundColor: settings.timerDuration === mins ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => updateSettings({ timerDuration: mins })}
                >
                  <Text
                    style={[
                      styles.timerOptionText,
                      {
                        color: settings.timerDuration === mins ? colors.primaryForeground : colors.mutedForeground,
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Schedule */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          SCHEDULE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TimePickerRow
            label="Wake Time"
            icon="sunny-outline"
            value={settings.wakeTime}
            onChange={(v) => updateSettings({ wakeTime: v, morningReminderTime: v })}
          />
          <TimePickerRow
            label="Sleep Time"
            icon="moon-outline"
            value={settings.sleepTime}
            onChange={(v) => updateSettings({ sleepTime: v, nightReminderTime: v })}
          />
          <TimePickerRow
            label="Morning Reminder"
            icon="notifications-outline"
            value={settings.morningReminderTime}
            onChange={(v) => updateSettings({ morningReminderTime: v })}
          />
          <TimePickerRow
            label="Night Reminder"
            icon="notifications-outline"
            value={settings.nightReminderTime}
            onChange={(v) => updateSettings({ nightReminderTime: v })}
          />
        </View>

        {/* App info */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          APP
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            label="Total XP"
            value={`${state.xp} XP`}
            icon="star-outline"
            iconColor={colors.gold}
          />
          <SettingRow
            label="Badges Unlocked"
            value={`${state.unlockedBadges.length} / 10`}
            icon="ribbon-outline"
            iconColor={colors.primary}
          />
          <SettingRow
            label="Total Sessions"
            value={`${state.totalSessions}`}
            icon="analytics-outline"
          />
        </View>

        {/* Danger zone */}
        <Text style={[styles.sectionLabel, { color: colors.destructive, fontFamily: "Inter_600SemiBold" }]}>
          DANGER ZONE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.destructive + "22" }]}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
              Reset All Data
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          OralStreak v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 8 },
  pageTitle: { fontSize: 28, marginBottom: 8 },
  sectionLabel: { fontSize: 12, letterSpacing: 1, marginTop: 8, marginLeft: 4 },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingLabel: { flex: 1, fontSize: 15 },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  settingValue: { fontSize: 14 },
  timerToggle: { flexDirection: "row", gap: 6 },
  timerOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  timerOptionText: { fontSize: 13 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 15,
    minWidth: 60,
    textAlign: "center",
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  version: { textAlign: "center", fontSize: 12, marginTop: 8, paddingBottom: 8 },
});
