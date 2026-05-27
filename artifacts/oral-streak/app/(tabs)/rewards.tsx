import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
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
        <Text
          style={[
            styles.pageTitle,
            { color: colors.foreground, fontFamily: "Inter_700Bold" },
          ]}
        >
          Rewards
        </Text>

        {/* XP / Level */}
        <XPBar xp={state.xp} />

        {/* Smile Points + Shop CTA */}
        <TouchableOpacity
          style={[
            styles.shopCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => router.push("/shop")}
          activeOpacity={0.85}
        >
          <View style={[styles.shopLeft, { backgroundColor: colors.gold + "18", borderColor: colors.gold + "33" }]}>
            <Text style={{ fontSize: 30 }}>😊</Text>
          </View>
          <View style={styles.shopInfo}>
            <Text
              style={[
                styles.shopPointsNum,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              {state.smilePoints.toLocaleString()}
            </Text>
            <Text
              style={[
                styles.shopPointsLabel,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              Smile Points
            </Text>
            <Text
              style={[
                styles.shopDesc,
                { color: colors.primary, fontFamily: "Inter_500Medium" },
              ]}
            >
              Spend in the Shop →
            </Text>
          </View>
          <View>
            <View
              style={[
                styles.shopBadge,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Text
                style={[
                  styles.shopBadgeText,
                  { color: colors.primary, fontFamily: "Inter_600SemiBold" },
                ]}
              >
                {state.purchasedItems.length} owned
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Earning guide */}
        <View
          style={[
            styles.earnCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.earnTitle,
              { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            How to earn Smile Points
          </Text>
          {[
            { icon: "sunny-outline", text: "Morning brush — 10 pts", color: colors.gold },
            { icon: "moon-outline", text: "Night brush — 10 pts", color: colors.accent },
            { icon: "fitness-outline", text: "Floss — 5 pts", color: colors.primary },
            { icon: "water-outline", text: "Mouthwash — 5 pts", color: colors.primary },
            { icon: "checkmark-circle-outline", text: "Full care day bonus — 20 pts", color: "#9b59b6" },
            { icon: "add-circle-outline", text: "Extra brush session — 5 pts + Freeze Token", color: colors.warning },
          ].map((item, i) => (
            <View key={i} style={styles.earnRow}>
              <Ionicons name={item.icon as any} size={15} color={item.color} />
              <Text
                style={[
                  styles.earnText,
                  { color: colors.foreground, fontFamily: "Inter_400Regular" },
                ]}
              >
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Freeze Tokens */}
        <View
          style={[
            styles.tokenCard,
            { backgroundColor: colors.card, borderColor: "#9b59b6" + "44" },
          ]}
        >
          <View
            style={[
              styles.tokenIconBox,
              { backgroundColor: "#9b59b6" + "18" },
            ]}
          >
            <Ionicons name="shield-checkmark" size={28} color="#9b59b6" />
          </View>
          <View style={styles.tokenInfo}>
            <Text
              style={[
                styles.tokenCount,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              {state.freezeTokens}
            </Text>
            <Text
              style={[
                styles.tokenLabel,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              Freeze Tokens
            </Text>
            <Text
              style={[
                styles.tokenDesc,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              Earned from extra brush sessions. Protects your streak.
            </Text>
          </View>
        </View>

        {/* Badge collection */}
        <View style={styles.badgeHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            Badges
          </Text>
          <View style={[styles.badgeCountPill, { backgroundColor: colors.muted }]}>
            <Text
              style={[
                styles.badgeCount,
                { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
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
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  shopLeft: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  shopInfo: { flex: 1 },
  shopPointsNum: { fontSize: 28 },
  shopPointsLabel: { fontSize: 12, marginBottom: 4 },
  shopDesc: { fontSize: 13 },
  shopBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  shopBadgeText: { fontSize: 12 },
  earnCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  earnTitle: { fontSize: 15, marginBottom: 2 },
  earnRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  earnText: { fontSize: 13 },
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
  badgeHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 18, flex: 1 },
  badgeCountPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeCount: { fontSize: 13 },
});
