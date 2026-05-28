import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  withSpring,
} from "react-native-reanimated";
import Svg, { Circle, G, Defs, LinearGradient, Stop } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

import { useApp } from "@/context/AppContext";
import { useSpotify } from "@/context/SpotifyContext";

type TimerState = "idle" | "running" | "paused" | "done";
type SessionType = "morning" | "night" | "extra";

const SESSION_LABELS: Record<SessionType, string> = {
  morning: "Morning Brush",
  night: "Night Brush",
  extra: "Extra Session",
};

const SESSION_COLORS: Record<SessionType, string> = {
  morning: "#FFB347",
  night: "#8B7FFF",
  extra: "#00b896",
};

const QUADRANTS = [
  { label: "Top Left", short: "TL", icon: "🦷" },
  { label: "Top Right", short: "TR", icon: "🦷" },
  { label: "Bot Left", short: "BL", icon: "🦷" },
  { label: "Bot Right", short: "BR", icon: "🦷" },
];

const RING_SIZE = 240;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRingSvg({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) {
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  return (
    <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </LinearGradient>
      </Defs>
      {/* Background track */}
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={STROKE}
        fill="none"
      />
      {/* Progress arc */}
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ session: string }>();
  const session = (params.session ?? "morning") as SessionType;

  const { state, completeMorningBrush, completeNightBrush, addExtraBrush } = useApp();
  const spotify = useSpotify();

  const durationSeconds = (state.settings.timerDuration ?? 2) * 60;
  const quadrantDuration = durationSeconds / 4;
  const accentColor = SESSION_COLORS[session];

  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [svgProgress, setSvgProgress] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const lastTickRef = useRef(0);

  const tickSound = useRef<Audio.Sound | null>(null);
  const startSound = useRef<Audio.Sound | null>(null);
  const successSound = useRef<Audio.Sound | null>(null);

  const pulse = useSharedValue(1);
  const doneScale = useSharedValue(0.8);
  const doneOpacity = useSharedValue(0);

  const topPad = Platform.OS === "web" ? 60 : insets.top;

  const elapsed = durationSeconds - secondsLeft;
  const currentQuadrant = Math.min(3, Math.floor(elapsed / quadrantDuration));
  const progressInQuadrant =
    (elapsed % quadrantDuration) / quadrantDuration;

  // Block back during run
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (timerState === "running") return true;
      return false;
    });
    return () => sub.remove();
  }, [timerState]);

  // Load sounds
  useEffect(() => {
    const load = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const [{ sound: tick }, { sound: start }, { sound: success }] =
          await Promise.all([
            Audio.Sound.createAsync(require("../assets/sounds/tick.mp3")),
            Audio.Sound.createAsync(require("../assets/sounds/start.mp3")),
            Audio.Sound.createAsync(require("../assets/sounds/success.mp3")),
          ]);
        tickSound.current = tick;
        startSound.current = start;
        successSound.current = success;
      } catch {}
    };
    load();
    return () => {
      tickSound.current?.unloadAsync();
      startSound.current?.unloadAsync();
      successSound.current?.unloadAsync();
    };
  }, []);

  // Breathing pulse while running
  useEffect(() => {
    if (timerState === "running") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000 })
        ),
        -1
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 300 });
    }
  }, [timerState]);

  // Timer tick
  useEffect(() => {
    if (timerState !== "running") return;

    const elapsed = durationSeconds - secondsLeft;
    setSvgProgress(elapsed / durationSeconds);

    // Quadrant tick every quadrantDuration seconds
    if (elapsed > 0 && elapsed % quadrantDuration === 0 && elapsed !== lastTickRef.current) {
      lastTickRef.current = elapsed;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      tickSound.current?.replayAsync().catch(() => {});
    }

    if (secondsLeft <= 0 && !completedRef.current) {
      completedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimerState("done");
      setSvgProgress(1);

      successSound.current?.replayAsync().catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      doneScale.value = withSpring(1, { damping: 12, stiffness: 150 });
      doneOpacity.value = withTiming(1, { duration: 400 });

      try {
        if (session === "morning") completeMorningBrush();
        else if (session === "night") completeNightBrush();
        else addExtraBrush();
      } catch {}
    }
  }, [secondsLeft, timerState]);

  // Spotify polling
  useEffect(() => {
    if (timerState === "running") {
      spotify.startPolling();
    } else {
      spotify.stopPolling();
    }
    return () => spotify.stopPolling();
  }, [timerState]);

  const startTimer = () => {
    startSound.current?.replayAsync().catch(() => {});
    completedRef.current = false;
    lastTickRef.current = 0;
    setSecondsLeft(durationSeconds);
    setSvgProgress(0);
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("paused");
  };

  const resumeTimer = () => {
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
  };

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    router.back();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const doneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: doneScale.value }],
    opacity: doneOpacity.value,
  }));

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleCancel} hitSlop={12}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.sessionLabel}>{SESSION_LABELS[session].toUpperCase()}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* MAIN RING AREA */}
      <View style={styles.ringArea}>
        {timerState === "done" ? (
          <Animated.View style={[styles.doneCircle, doneStyle]}>
            <View style={[styles.doneInner, { borderColor: accentColor + "40" }]}>
              <Ionicons name="checkmark-circle" size={64} color={accentColor} />
              <Text style={[styles.doneTitle, { color: accentColor }]}>Done!</Text>
              <Text style={styles.doneSub}>Session complete</Text>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.ringWrapper}>
            <ProgressRingSvg progress={svgProgress} color={accentColor} />
            <Animated.View style={[styles.ringContent, pulseStyle]}>
              <Text style={[styles.timeText, { color: accentColor }]}>{timeDisplay}</Text>
              <Text style={styles.timeLabel}>
                {timerState === "idle"
                  ? "Ready"
                  : timerState === "paused"
                  ? "Paused"
                  : "Keep going!"}
              </Text>
            </Animated.View>
          </View>
        )}
      </View>

      {/* QUADRANT TRACKER */}
      {timerState !== "done" && (
        <View style={styles.quadrantRow}>
          {QUADRANTS.map((q, i) => {
            const isActive = timerState === "running" && i === currentQuadrant;
            const isDone = elapsed > 0 && i < currentQuadrant || (secondsLeft === 0 && i <= currentQuadrant);
            return (
              <View key={i} style={styles.quadrantItem}>
                <View
                  style={[
                    styles.quadrantDot,
                    isDone
                      ? { backgroundColor: accentColor }
                      : isActive
                      ? { backgroundColor: accentColor, opacity: 0.6 }
                      : { backgroundColor: "rgba(255,255,255,0.12)" },
                  ]}
                >
                  {isDone && (
                    <Ionicons name="checkmark" size={10} color="#000" />
                  )}
                  {isActive && !isDone && (
                    <View style={[styles.activePulse, { backgroundColor: accentColor }]} />
                  )}
                </View>
                <Text style={[styles.quadrantLabel, isActive && { color: accentColor, fontWeight: "700" }]}>
                  {q.short}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* SPOTIFY NOW PLAYING */}
      {spotify.isConnected && spotify.nowPlaying && (
        <View style={styles.spotifyCard}>
          {spotify.nowPlaying.albumArt && (
            <Image source={{ uri: spotify.nowPlaying.albumArt }} style={styles.albumArt} />
          )}
          <View style={styles.spotifyInfo}>
            <Text style={styles.trackName} numberOfLines={1}>
              {spotify.nowPlaying.name}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {spotify.nowPlaying.artists}
            </Text>
          </View>
          <Ionicons name={"logo-spotify" as any} size={18} color="#1DB954" />
        </View>
      )}

      {/* BOTTOM CONTROLS */}
      <View style={styles.controls}>
        {timerState === "idle" && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accentColor }]}
            onPress={startTimer}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={22} color="#000" />
            <Text style={styles.primaryBtnText}>Start Brushing</Text>
          </TouchableOpacity>
        )}

        {timerState === "running" && (
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={pauseTimer}
            activeOpacity={0.85}
          >
            <Ionicons name="pause" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.pauseBtnText}>Pause</Text>
          </TouchableOpacity>
        )}

        {timerState === "paused" && (
          <View style={styles.pausedActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>Quit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: accentColor, flex: 1 }]}
              onPress={resumeTimer}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={20} color="#000" />
              <Text style={styles.primaryBtnText}>Resume</Text>
            </TouchableOpacity>
          </View>
        )}

        {timerState === "done" && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accentColor }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={22} color="#000" />
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D18",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  sessionLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "600",
  },
  ringArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringContent: {
    position: "absolute",
    alignItems: "center",
  },
  timeText: {
    fontSize: 56,
    fontWeight: "700",
    letterSpacing: -2,
  },
  timeLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  doneCircle: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  doneInner: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RING_SIZE / 2,
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: "center",
    gap: 4,
  },
  doneTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1,
  },
  doneSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
  },
  quadrantRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  quadrantItem: {
    alignItems: "center",
    gap: 6,
  },
  quadrantDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  activePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quadrantLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  spotifyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  spotifyInfo: {
    flex: 1,
  },
  trackName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
  artistName: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  pauseBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pauseBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "600",
  },
  pausedActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cancelBtnText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    fontWeight: "600",
  },
});
