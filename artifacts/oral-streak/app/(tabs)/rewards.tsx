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
import { XPBar } from "@/components/XPBar";
import { BadgeCard } from "@/components/BadgeCard";
import { ALL_BADGES } from "@/constants/badges";

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 100;

  const unlockedCount = state.unlockedBadges.length;
  const totalCount = ALL_BADGES.length;

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
          Rewards
        </Text>

        {/* XP / Level */}
        <XPBar xp={state.xp} />

        {/* Freeze Tokens */}
        <View style={[styles.tokenCard, { backgroundColor: colors.card, borderColor: "#9b59b6" + "44" }]}>
          <View style={[styles.tokenIconBox, { backgroundColor: "#9b59b6" + "22" }]}>
            <Ionicons name="shield-checkmark" size={28} color="#9b59b6" />
          </View>
          <View style={styles.tokenInfo}>
            <Text style={[styles.tokenCount, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {state.freezeTokens}
            </Text>
            <Text style={[styles.tokenLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Freeze Tokens
            </Text>
            <Text style={[styles.tokenDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Earned by completing extra brushing sessions. Protects your streak.
            </Text>
          </View>
        </View>

        {/* Reward Shop teaser */}
        <View style={[styles.shopCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="storefront-outline" size={22} color={colors.mutedForeground} />
          <View style={styles.shopInfo}>
            <Text style={[styles.shopTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Reward Shop
            </Text>
            <Text style={[styles.shopDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Spend your points to unlock themes, sounds, and UI styles. Coming soon.
            </Text>
          </View>
          <View style={[styles.pointsPill, { backgroundColor: colors.gold + "22" }]}>
            <Text style={[styles.pointsText, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
              {state.points ?? 0}
            </Text>
            <Text style={[styles.pointsLabel, { color: colors.gold, fontFamily: "Inter_400Regular" }]}>
              pts
            </Text>
          </View>
        </View>

        {/* Badge collection */}
        <View style={styles.badgeHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Badges
          </Text>
          <View style={[styles.badgeCountPill, { backgroundColor: colors.muted }]}>
            <Text style={[styles.badgeCount, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              {unlockedCount}/{totalCount}
            </Text>
          </View>
        </View>

        {ALL_BADGES.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            unlocked={state.unlockedBadges.includes(badge.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 14 },
  pageTitle: { fontSize: 28, marginBottom: 4 },
  tokenCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 14,
  },
  tokenIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenInfo: { flex: 1 },
  tokenCount: { fontSize: 32 },
  tokenLabel: { fontSize: 14, marginBottom: 2 },
  tokenDesc: { fontSize: 12, lineHeight: 17 },
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  shopInfo: { flex: 1 },
  shopTitle: { fontSize: 15, marginBottom: 2 },
  shopDesc: { fontSize: 12, lineHeight: 17 },
  pointsPill: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  pointsText: { fontSize: 18 },
  pointsLabel: { fontSize: 11 },
  badgeHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 18, flex: 1 },
  badgeCountPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeCount: { fontSize: 13 },
});
