import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { getXPProgress } from "@/services/streakService";

interface XPBarProps {
  xp: number;
  compact?: boolean;
}

export function XPBar({ xp, compact = false }: XPBarProps) {
  const colors = useColors();
  const { level, progress, current, next } = getXPProgress(xp);
  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%` as any,
  }));

  const LEVEL_NAMES = [
    "", "Rookie", "Beginner", "Consistent", "Committed",
    "Dedicated", "Expert", "Champion", "Legend", "Master",
  ];

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={[styles.levelLabel, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
          Lv. {level}
        </Text>
        <View style={[styles.compactBar, { backgroundColor: colors.muted }]}>
          <Animated.View
            style={[styles.fill, barStyle, { backgroundColor: colors.gold }]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <View style={[styles.levelCircle, { backgroundColor: colors.gold + "22" }]}>
            <Text style={[styles.levelNumber, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
              {level}
            </Text>
          </View>
          <View>
            <Text style={[styles.levelTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Level {level}
            </Text>
            <Text style={[styles.levelName, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {LEVEL_NAMES[level] ?? "Legend"}
            </Text>
          </View>
        </View>
        <Text style={[styles.xpText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
          {xp} XP
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[styles.fill, barStyle, { backgroundColor: colors.gold }]}
        />
      </View>

      <View style={styles.range}>
        <Text style={[styles.rangeText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {current} XP
        </Text>
        <Text style={[styles.rangeText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {next} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumber: {
    fontSize: 18,
  },
  levelTitle: {
    fontSize: 15,
  },
  levelName: {
    fontSize: 12,
  },
  xpText: {
    fontSize: 16,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
  range: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeText: {
    fontSize: 11,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelLabel: {
    fontSize: 13,
  },
  compactBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
});
