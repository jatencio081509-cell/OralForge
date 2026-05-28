import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useSpotify } from "@/context/SpotifyContext";
import { useAuth } from "@clerk/expo";
import { clearState } from "@/services/storageService";
import { formatTime12h } from "@/utils/timeFormat";

// 24h values displayed as 12h
const MORNING_TIMES = [
  "05:00", "05:30", "06:00", "06:30", "07:00",
  "07:30", "08:00", "08:30", "09:00",
];
const NIGHT_TIMES = [
  "19:00", "19:30", "20:00", "20:30", "21:00",
  "21:30", "22:00", "22:30", "23:00",
];

function TimePicker({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: open ? "transparent" : colors.border }]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.7}
      >
        <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
          <Ionicons name={icon as any} size={17} color={colors.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
          {label}
        </Text>
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            {formatTime12h(value)}
          </Text>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.mutedForeground}
          />
        </View>
      </TouchableOpacity>
      {open && (
        <View style={[styles.timeGrid, { borderBottomColor: colors.border }]}>
          {options.map((t) => {
            const isSelected = t === value;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.timeChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.muted,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { onChange(t); setOpen(false); }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    {
                      color: isSelected ? colors.primaryForeground : colors.foreground,
                      fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {formatTime12h(t)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function SettingRow({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value?: string;
  icon: string;
  iconColor?: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: (iconColor ?? colors.primary) + "18" }]}>
        <Ionicons name={icon as any} size={17} color={iconColor ?? colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
      {value && (
        <Text style={[styles.settingValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {value}
        </Text>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, updateSettings } = useApp();
  const spotify = useSpotify();
  const { signOut } = useAuth();

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
          <View style={[styles.settingRow, { borderBottomColor: "transparent" }]}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="timer-outline" size={17} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              Duration
            </Text>
            <View style={styles.timerToggle}>
              {([2, 3] as const).map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.timerOption,
                    {
                      backgroundColor:
                        settings.timerDuration === mins ? colors.primary : colors.muted,
                    },
                  ]}
                  onPress={() => updateSettings({ timerDuration: mins })}
                >
                  <Text
                    style={[
                      styles.timerOptionText,
                      {
                        color:
                          settings.timerDuration === mins
                            ? colors.primaryForeground
                            : colors.mutedForeground,
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}
                  >
                    {mins} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Reminders */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          REMINDERS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TimePicker
            label="Morning"
            icon="sunny-outline"
            value={settings.morningReminderTime}
            options={MORNING_TIMES}
            onChange={(v) => updateSettings({ morningReminderTime: v, wakeTime: v })}
          />
          <TimePicker
            label="Night"
            icon="moon-outline"
            value={settings.nightReminderTime}
            options={NIGHT_TIMES}
            onChange={(v) => updateSettings({ nightReminderTime: v, sleepTime: v })}
          />
        </View>

        {/* Behavior */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          BEHAVIOR RULES
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="shield-checkmark-outline" size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                Strict Streak Mode
              </Text>
              <Text style={[styles.settingSubLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Streak breaks if any brushing is missed
              </Text>
            </View>
            <View style={[styles.onBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.onText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>ON</Text>
            </View>
          </View>
          <View style={[styles.settingRow, { borderBottomColor: "transparent" }]}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="refresh-circle-outline" size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                Comeback Mode
              </Text>
              <Text style={[styles.settingSubLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Softer reminders after a broken streak
              </Text>
            </View>
            <View style={[styles.onBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.onText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>ON</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          YOUR PROGRESS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow label="Total XP" value={`${state.xp} XP`} icon="star-outline" iconColor={colors.gold} />
          <SettingRow label="Badges Unlocked" value={`${state.unlockedBadges.length} / 10`} icon="ribbon-outline" />
          <SettingRow label="Total Sessions" value={`${state.totalSessions}`} icon="analytics-outline" />
          <SettingRow
            label="Offline Storage"
            value="Active"
            icon="cloud-offline-outline"
            iconColor={colors.accent}
          />
        </View>

        {/* Spotify */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          MUSIC
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: "transparent" }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#1DB95418" }]}>
              <Ionicons name={"logo-spotify" as any} size={17} color="#1DB954" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                Spotify
              </Text>
              <Text style={[styles.settingSubLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {spotify.isConnected
                  ? "Connected — shows now playing during brushing"
                  : !spotify.hasClientId
                  ? "Add EXPO_PUBLIC_SPOTIFY_CLIENT_ID to enable"
                  : "Connect to see now playing while you brush"}
              </Text>
            </View>
            {spotify.hasClientId ? (
              spotify.isConnecting ? (
                <ActivityIndicator size="small" color="#1DB954" />
              ) : spotify.isConnected ? (
                <TouchableOpacity
                  style={[styles.spotifyBtn, { backgroundColor: "#1DB95418", borderColor: "#1DB954" }]}
                  onPress={() =>
                    Alert.alert("Disconnect Spotify", "Stop showing now playing during brushing?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Disconnect", style: "destructive", onPress: spotify.disconnect },
                    ])
                  }
                >
                  <Text style={[styles.spotifyBtnText, { color: "#1DB954" }]}>Connected</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.spotifyBtn, { backgroundColor: "#1DB954", borderColor: "#1DB954" }]}
                  onPress={spotify.connect}
                >
                  <Text style={[styles.spotifyBtnText, { color: "white" }]}>Connect</Text>
                </TouchableOpacity>
              )
            ) : null}
          </View>
        </View>

        {/* Danger */}
        <Text style={[styles.sectionLabel, { color: colors.destructive, fontFamily: "Inter_600SemiBold" }]}>
          DANGER ZONE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={() =>
              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: () => signOut() },
              ])
            }
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.destructive + "18" }]}>
              <Ionicons name="log-out-outline" size={17} color={colors.destructive} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
              Sign Out
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: "transparent" }]}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.destructive + "18" }]}>
              <Ionicons name="trash-outline" size={17} color={colors.destructive} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
              Reset All Data
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>

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
  sectionLabel: { fontSize: 12, letterSpacing: 0.8, marginTop: 8, marginLeft: 4 },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  settingLabel: { flex: 1, fontSize: 15 },
  settingSubLabel: { fontSize: 12, marginTop: 1 },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  settingValue: { fontSize: 14 },
  timerToggle: { flexDirection: "row", gap: 6 },
  timerOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  timerOptionText: { fontSize: 13 },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  timeChipText: { fontSize: 13 },
  onBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  onText: { fontSize: 12 },
  version: { textAlign: "center", fontSize: 12, marginTop: 8, paddingBottom: 8 },
  spotifyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  spotifyBtnText: { fontSize: 13, fontWeight: "600" },
});
