import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
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
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

type TimerState = "idle" | "running" | "done";
type SessionType = "morning" | "night" | "extra";

const SESSION_LABELS: Record<SessionType, string> = {
  morning: "Morning Brush",
  night: "Night Brush",
  extra: "Extra Session",
};

const SESSION_ICONS: Record<SessionType, string> = {
  morning: "sunny",
  night: "moon",
  extra: "add-circle",
};

const XP_EARNED: Record<SessionType, number> = {
  morning: 25,
  night: 25,
  extra: 10,
};

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ session: string }>();
  const session = (params.session ?? "morning") as SessionType;

  const { state, completeMorningBrush, completeNightBrush, addExtraBrush } =
    useApp();

  const durationSeconds = (state.settings.timerDuration ?? 2) * 60;

  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  // 🎧 Spotify state
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const [playlistName, setPlaylistName] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completedRef = useRef(false);
  const lastTickRef = useRef(0);

  const tickSound = useRef<Audio.Sound | null>(null);
  const startSound = useRef<Audio.Sound | null>(null);
  const successSound = useRef<Audio.Sound | null>(null);

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);

  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 30 : insets.bottom;

  // 🚫 BACK BLOCK
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (timerState === "running") return true;
      return false;
    });
    return () => sub.remove();
  }, [timerState]);

  // 🎧 LOAD SOUNDS
  useEffect(() => {
    const load = async () => {
      const { sound: tick } = await Audio.Sound.createAsync(
        require("../assets/sounds/tick.mp3")
      );
      const { sound: start } = await Audio.Sound.createAsync(
        require("../assets/sounds/start.mp3")
      );
      const { sound: success } = await Audio.Sound.createAsync(
        require("../assets/sounds/success.mp3")
      );

      tickSound.current = tick;
      startSound.current = start;
      successSound.current = success;
    };

    load();

    return () => {
      tickSound.current?.unloadAsync();
      startSound.current?.unloadAsync();
      successSound.current?.unloadAsync();
    };
  }, []);

  // 🎵 SPOTIFY LIVE DATA
  useEffect(() => {
    if (timerState !== "running" || !spotifyToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("https://api.spotify.com/v1/me/player", {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        });

        if (!res.ok) return;

        const data = await res.json();

        const item = data?.item;
        const context = data?.context;

        setNowPlaying(item || null);

        // playlist lookup (if available)
        if (context?.type === "playlist" && context?.uri) {
          try {
            const playlistId = context.uri.split(":").pop();

            const p = await fetch(
              `https://api.spotify.com/v1/playlists/${playlistId}`,
              {
                headers: { Authorization: `Bearer ${spotifyToken}` },
              }
            );

            const playlistData = await p.json();
            setPlaylistName(playlistData?.name || null);
          } catch {
            setPlaylistName(null);
          }
        } else {
          setPlaylistName(null);
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [timerState, spotifyToken]);

  // 🌊 BREATHING ANIMATION
  useEffect(() => {
    if (timerState === "running") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.06, {
            duration: 900,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 900 })
        ),
        -1
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1);
    }
  }, [timerState]);

  // ⏱ TIMER ENGINE
  useEffect(() => {
    if (timerState !== "running") return;

    const elapsed = durationSeconds - secondsLeft;

    progress.value = withTiming(elapsed / durationSeconds, {
      duration: 400,
    });

    if (elapsed > 0 && elapsed % 15 === 0 && elapsed !== lastTickRef.current) {
      lastTickRef.current = elapsed;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      tickSound.current?.replayAsync().catch(() => {});
    }

    if (secondsLeft <= 0 && !completedRef.current) {
      completedRef.current = true;

      if (intervalRef.current) clearInterval(intervalRef.current);

      setTimerState("done");

      successSound.current?.replayAsync().catch(() => {});

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});

      try {
        if (session === "morning") completeMorningBrush();
        else if (session === "night") completeNightBrush();
        else addExtraBrush();
      } catch {}
    }
  }, [secondsLeft, timerState]);

  const startTimer = () => {
    startSound.current?.replayAsync().catch(() => {});

    completedRef.current = false;
    lastTickRef.current = 0;

    setSecondsLeft(durationSeconds);
    setTimerState("running");

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
  };

  const handleCancel = () => router.back();
  const handleDone = () => router.back();

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const progressPercent =
    ((durationSeconds - secondsLeft) / durationSeconds) * 100;

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + 0.8 * progress.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TOP */}
      <View style={styles.top}>
        <Text style={styles.title}>BRUSH FOCUS</Text>
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* CENTER */}
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]}>
          <Animated.View style={[styles.inner, pulseStyle]}>
            <Ionicons
              name={SESSION_ICONS[session] as any}
              size={24}
              color={colors.primary}
            />

            <Text style={styles.time}>{timeDisplay}</Text>

            <Text style={styles.sub}>Brush with focus</Text>
          </Animated.View>
        </Animated.View>

        {/* 🎧 SPOTIFY NOW PLAYING */}
        {spotifyToken && nowPlaying && (
          <View style={styles.spotifyCard}>
            {nowPlaying?.album?.images?.[0]?.url && (
              <Image
                source={{ uri: nowPlaying.album.images[0].url }}
                style={styles.album}
              />
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.song}>
                {nowPlaying?.name ?? "Unknown Track"}
              </Text>

              <Text style={styles.artist}>
                {nowPlaying?.artists?.map((a: any) => a.name).join(", ")}
              </Text>

              {playlistName && (
                <Text style={styles.playlist}>
                  Playlist: {playlistName}
                </Text>
              )}
            </View>

            <Ionicons name="logo-spotify" size={20} color="#1DB954" />
          </View>
        )}
      </View>

      {/* BOTTOM */}
      <View style={styles.bottom}>
        {timerState === "idle" && (
          <TouchableOpacity style={styles.startBtn} onPress={startTimer}>
            <Ionicons name="play" size={18} color="white" />
            <Text style={styles.startText}>Start</Text>
          </TouchableOpacity>
        )}

        {timerState === "done" && (
          <TouchableOpacity style={styles.startBtn} onPress={handleDone}>
            <Ionicons name="checkmark" size={18} color="white" />
            <Text style={styles.startText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  top: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: {
    color: "white",
    fontSize: 12,
    letterSpacing: 2,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  ring: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  inner: {
    alignItems: "center",
  },

  time: {
    fontSize: 52,
    color: "white",
    fontWeight: "700",
  },

  sub: {
    color: "rgba(255,255,255,0.6)",
  },

  spotifyCard: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    width: "90%",
  },

  album: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },

  song: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },

  artist: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },

  playlist: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },

  bottom: {
    padding: 20,
  },

  startBtn: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  startText: {
    color: "white",
    fontWeight: "600",
  },
});