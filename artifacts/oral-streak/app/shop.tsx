import React, { useState } from "react";
import {
  Alert,
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
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import {
  ALL_SHOP_ITEMS,
  SHOP_CATEGORIES,
  ShopCategory,
  ShopItem,
  getItemsByCategory,
} from "@/constants/shopItems";

function SmilePointsBadge({ points }: { points: number }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.spBadge,
        { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" },
      ]}
    >
      <Text style={{ fontSize: 16 }}>😊</Text>
      <Text
        style={[
          styles.spValue,
          { color: colors.gold, fontFamily: "Inter_700Bold" },
        ]}
      >
        {points.toLocaleString()}
      </Text>
      <Text
        style={[
          styles.spLabel,
          { color: colors.gold, fontFamily: "Inter_400Regular" },
        ]}
      >
        Smile Points
      </Text>
    </View>
  );
}

function ShopItemCard({
  item,
  owned,
  canAfford,
  onBuy,
}: {
  item: ShopItem;
  owned: boolean;
  canAfford: boolean;
  onBuy: () => void;
}) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: colors.card,
          borderColor: owned ? item.color + "55" : colors.border,
          borderWidth: owned ? 1.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.itemIcon,
          { backgroundColor: item.color + "18" },
        ]}
      >
        <Ionicons name={item.icon as any} size={26} color={item.color} />
      </View>
      <Text
        style={[
          styles.itemName,
          { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
        ]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      <Text
        style={[
          styles.itemDesc,
          { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
        ]}
        numberOfLines={2}
      >
        {item.description}
      </Text>

      {owned ? (
        <View
          style={[
            styles.ownedBadge,
            { backgroundColor: colors.primary + "18" },
          ]}
        >
          <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
          <Text
            style={[
              styles.ownedText,
              { color: colors.primary, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            Owned
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.buyBtn,
            {
              backgroundColor: canAfford ? colors.primary : colors.muted,
            },
          ]}
          onPress={onBuy}
          activeOpacity={0.8}
          disabled={!canAfford}
        >
          <Text style={{ fontSize: 13 }}>😊</Text>
          <Text
            style={[
              styles.buyBtnText,
              {
                color: canAfford ? colors.primaryForeground : colors.mutedForeground,
                fontFamily: "Inter_600SemiBold",
              },
            ]}
          >
            {item.cost}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, purchaseItem } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeCategory, setActiveCategory] = useState<ShopCategory>("themes");
  const items = getItemsByCategory(activeCategory);

  const handleBuy = (item: ShopItem) => {
    const owned = state.purchasedItems.includes(item.id);
    if (owned) return;

    if (state.smilePoints < item.cost) {
      Alert.alert(
        "Not enough Smile Points",
        `You need ${item.cost - state.smilePoints} more Smile Points. Complete daily routines to earn them!`
      );
      return;
    }

    Alert.alert(
      `Buy ${item.name}?`,
      `This costs ${item.cost} Smile Points. You have ${state.smilePoints}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            purchaseItem(item.id, item.cost);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.foreground, fontFamily: "Inter_700Bold" },
          ]}
        >
          Shop
        </Text>
        <SmilePointsBadge points={state.smilePoints} />
      </View>

      {/* How to earn */}
      <View
        style={[
          styles.earnBanner,
          { backgroundColor: colors.secondary, marginHorizontal: 16 },
        ]}
      >
        <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
        <Text
          style={[
            styles.earnText,
            { color: colors.primary, fontFamily: "Inter_400Regular" },
          ]}
        >
          Earn Smile Points by brushing, flossing, and completing full care days.
        </Text>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryList}
      >
        {SHOP_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryTab,
                {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon as any}
                size={15}
                color={isActive ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.categoryTabText,
                  {
                    color: isActive
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                    fontFamily: isActive ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Items grid */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const owned = state.purchasedItems.includes(item.id);
          const canAfford = state.smilePoints >= item.cost;
          return (
            <ShopItemCard
              key={item.id}
              item={item}
              owned={owned}
              canAfford={canAfford}
              onBuy={() => handleBuy(item)}
            />
          );
        })}
        <View style={{ height: bottomPad + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 22 },
  spBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  spValue: { fontSize: 15 },
  spLabel: { fontSize: 11 },
  earnBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  earnText: { flex: 1, fontSize: 12, lineHeight: 17 },
  categoryScroll: { flexGrow: 0 },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: "row",
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryTabText: { fontSize: 13 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 12,
  },
  itemCard: {
    width: "47%",
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  itemIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontSize: 14 },
  itemDesc: { fontSize: 12, lineHeight: 16, flex: 1 },
  ownedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  ownedText: { fontSize: 12 },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buyBtnText: { fontSize: 13 },
});
