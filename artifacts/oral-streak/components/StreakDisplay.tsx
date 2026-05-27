import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface StreakDisplayProps {
  brushingStreak: number;
  fullCareStreak: number;
  compact?: boolean;
}

export function StreakDisplay({
  brushingStreak,
  fullCareStreak,
  compact = false,
}: StreakDisplayProps) {
  const colors = useColors();
  const flameScale = useSharedValue(1);

  useEffect(() => {
    if (brushingStreak > 0) {
      flameScale.value = withRepeat(
        withSequence(
          withSpring(1.12, { damping: 8 }),
          withSpring(1, { damping: 8 })
        ),
        -1,
        true
      );
    }
  }, [brushingStreak]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Animated.View style={flameStyle}>
          <Ionicons name="flame" size={20} color={brushingStreak > 0 ? "#ff8c42" : colors.mutedForeground} />
        </Animated.View>
        <Text style={[styles.compactCount, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {brushingStreak}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Animated.View style={flameStyle}>
          <Ionicons name="flame" size={36} color={brushingStreak > 0 ? "#ff8c42" : colors.mutedForeground} />
        </Animated.View>
        <Text style={[styles.streakNumber, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {brushingStreak}
        </Text>
        <Text style={[styles.streakLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Brush Streak
        </Text>
      </View>

      <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="ribbon" size={36} color={fullCareStreak > 0 ? colors.primary : colors.mutedForeground} />
        <Text style={[styles.streakNumber, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {fullCareStreak}
        </Text>
        <Text style={[styles.streakLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Full Care
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
  },
  streakCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  streakNumber: {
    fontSize: 36,
    lineHeight: 42,
  },
  streakLabel: {
    fontSize: 12,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  compactCount: {
    fontSize: 18,
  },
});
