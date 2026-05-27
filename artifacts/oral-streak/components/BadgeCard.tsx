import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Badge } from "@/constants/badges";

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
}

export function BadgeCard({ badge, unlocked }: BadgeCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: unlocked ? colors.card : colors.surface,
          borderColor: unlocked ? badge.color + "44" : colors.border,
          opacity: unlocked ? 1 : 0.55,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: unlocked ? badge.color + "22" : colors.muted,
          },
        ]}
      >
        <Ionicons
          name={badge.iconName as any}
          size={28}
          color={unlocked ? badge.color : colors.mutedForeground}
        />
        {!unlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={14} color={colors.mutedForeground} />
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.name,
            {
              color: unlocked ? colors.foreground : colors.mutedForeground,
              fontFamily: "Inter_600SemiBold",
            },
          ]}
          numberOfLines={1}
        >
          {badge.name}
        </Text>
        <Text
          style={[
            styles.description,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
          numberOfLines={2}
        >
          {badge.description}
        </Text>
      </View>

      {unlocked && (
        <Ionicons name="checkmark-circle" size={20} color={badge.color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  lockOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
});
