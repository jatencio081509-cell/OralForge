import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Task {
  label: string;
  icon: string;
  done: boolean;
}

interface ProgressRingProps {
  tasks: Task[];
  size?: number;
}

const STROKE_WIDTH = 14;
const GAP_DEG = 5;

export function ProgressRing({ tasks, size = 200 }: ProgressRingProps) {
  const colors = useColors();
  const radius = (size - STROKE_WIDTH * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const count = tasks.length;
  const segAngle = 360 / count;
  const gapAngle = GAP_DEG;
  const segLength = (circumference * (segAngle - gapAngle)) / 360;
  const gapLength = (circumference * gapAngle) / 360;

  const completedCount = tasks.filter((t) => t.done).length;
  const allDone = completedCount === count;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {tasks.map((task, i) => {
          const startDeg = i * segAngle - 90;
          const color = task.done ? colors.primary : colors.border;
          const dashOffset = -((circumference * startDeg) / 360);

          return (
            <G key={i}>
              {/* background track */}
              <Circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke={colors.muted}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={[segLength, circumference - segLength]}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
              {/* colored fill */}
              <Circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke={color}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={[segLength, circumference - segLength]}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </G>
          );
        })}
      </Svg>

      {/* Center content */}
      <View style={styles.center}>
        {allDone ? (
          <View
            style={[
              styles.checkCircle,
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <Ionicons name="checkmark" size={28} color={colors.primary} />
          </View>
        ) : (
          <>
            <Text
              style={[
                styles.fraction,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              {completedCount}/{count}
            </Text>
            <Text
              style={[
                styles.fractionLabel,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              done
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  fraction: {
    fontSize: 32,
    lineHeight: 36,
  },
  fractionLabel: {
    fontSize: 13,
  },
});
