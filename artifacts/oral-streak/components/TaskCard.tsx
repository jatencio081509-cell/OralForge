import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface TaskCardProps {
  title: string;
  subtitle: string;
  done: boolean;
  type: "brush" | "checkable";
  onAction: () => void;
  disabled?: boolean;
  iconName?: string;
}

export function TaskCard({
  title,
  subtitle,
  done,
  type,
  onAction,
  disabled = false,
  iconName = "water",
}: TaskCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (done || disabled) return;
    scale.value = withSpring(0.97, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction();
  };

  return (
    <Animated.View style={[animStyle]}>
      <TouchableOpacity
        activeOpacity={done ? 1 : 0.85}
        onPress={handlePress}
        disabled={done || disabled}
        style={[
          styles.card,
          {
            backgroundColor: done ? colors.secondary : colors.card,
            borderColor: done ? colors.primary : colors.border,
            borderWidth: done ? 1.5 : 1,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: done ? colors.primary + "22" : colors.surface }]}>
          <Ionicons
            name={done ? "checkmark-circle" : (iconName as any)}
            size={26}
            color={done ? colors.primary : colors.mutedForeground}
          />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              {
                color: done ? colors.primary : colors.foreground,
                fontFamily: "Inter_600SemiBold",
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            {done ? "Completed" : subtitle}
          </Text>
        </View>

        {!done && (
          <View
            style={[
              styles.actionBadge,
              {
                backgroundColor:
                  type === "brush" ? colors.primary : colors.accent,
              },
            ]}
          >
            <Ionicons
              name={type === "brush" ? "timer-outline" : "checkmark"}
              size={16}
              color={colors.primaryForeground}
            />
          </View>
        )}

        {done && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={colors.primary}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
  actionBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
