import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { loadState, saveState } from "@/services/storageService";
import {
  calculateDayStatus,
  checkNewBadges,
  getXPForAction,
  todayString,
  updateStreaksForPreviousDay,
  yesterdayString,
} from "@/services/streakService";

export interface DayRecord {
  date: string;
  morningBrush: boolean;
  nightBrush: boolean;
  floss: boolean;
  mouthwash: boolean;
  extraBrushes: number;
  missedReasons: Array<{ session: string; reason: string }>;
  status: "complete" | "partial" | "missed";
  xpEarned: number;
}

export interface AppSettings {
  morningReminderTime: string;
  nightReminderTime: string;
  timerDuration: 2 | 3;
  wakeTime: string;
  sleepTime: string;
  onboardingComplete: boolean;
  theme: string;
}

export interface AppState {
  brushingStreak: number;
  fullCareStreak: number;
  totalFullDays: number;
  totalSessions: number;
  extraBrushesTotal: number;
  xp: number;
  level: number;
  freezeTokens: number;
  points: number;
  settings: AppSettings;
  history: DayRecord[];
  unlockedBadges: string[];
  isComeback: boolean;
  lastCheckedDate: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  morningReminderTime: "07:00",
  nightReminderTime: "21:00",
  timerDuration: 2,
  wakeTime: "07:00",
  sleepTime: "22:00",
  onboardingComplete: false,
  theme: "default",
};

const DEFAULT_STATE: AppState = {
  brushingStreak: 0,
  fullCareStreak: 0,
  totalFullDays: 0,
  totalSessions: 0,
  extraBrushesTotal: 0,
  xp: 0,
  level: 1,
  freezeTokens: 0,
  points: 0,
  settings: DEFAULT_SETTINGS,
  history: [],
  unlockedBadges: [],
  isComeback: false,
  lastCheckedDate: "",
};

interface AppContextValue {
  state: AppState;
  loading: boolean;
  todayRecord: DayRecord;
  completeMorningBrush: () => void;
  completeNightBrush: () => void;
  completeFloss: () => void;
  completeMouthwash: () => void;
  addExtraBrush: () => void;
  logMissedReason: (session: string, reason: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  completeOnboarding: (settings: Partial<AppSettings>) => void;
  getMissedSessions: () => string[];
  newBadges: string[];
  clearNewBadges: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function createTodayRecord(): DayRecord {
  return {
    date: todayString(),
    morningBrush: false,
    nightBrush: false,
    floss: false,
    mouthwash: false,
    extraBrushes: 0,
    missedReasons: [],
    status: "missed",
    xpEarned: 0,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    (async () => {
      const saved = await loadState();
      if (saved) {
        const initialized = checkDayTransition(saved);
        setState(initialized);
      }
      setLoading(false);
    })();
  }, []);

  const checkDayTransition = useCallback((s: AppState): AppState => {
    const today = todayString();
    const yesterday = yesterdayString();

    if (s.lastCheckedDate === today) return s;

    let updated = { ...s };

    // If we haven't checked yesterday, process it
    if (s.lastCheckedDate === yesterday || s.lastCheckedDate === "") {
      const yesterdayRecord = s.history.find((r) => r.date === yesterday) ?? null;
      const { brushingStreak, fullCareStreak } = updateStreaksForPreviousDay(
        s.brushingStreak,
        s.fullCareStreak,
        yesterdayRecord
      );

      const brushingBroken = brushingStreak === 0 && s.brushingStreak > 0;
      const wasComeback = s.isComeback;

      if (yesterdayRecord) {
        const status = calculateDayStatus(yesterdayRecord);
        if (status === "complete") {
          updated.totalFullDays = s.totalFullDays + 1;
        }
        const updatedHistory = s.history.map((r) =>
          r.date === yesterday ? { ...r, status } : r
        );
        updated.history = updatedHistory;
      }

      updated.brushingStreak = brushingStreak;
      updated.fullCareStreak = fullCareStreak;
      updated.isComeback = brushingBroken || (wasComeback && brushingStreak === 0);
    }

    // Ensure today's record exists
    const todayRecord = updated.history.find((r) => r.date === today);
    if (!todayRecord) {
      updated.history = [...updated.history, createTodayRecord()];
    }

    updated.lastCheckedDate = today;
    return updated;
  }, []);

  const persist = useCallback((newState: AppState) => {
    setState(newState);
    saveState(newState);
  }, []);

  const awardXPAndCheckBadges = useCallback(
    (
      s: AppState,
      action: "morning" | "night" | "floss" | "mouthwash" | "extra" | "fullDay"
    ): Partial<AppState> => {
      const xpGain = getXPForAction(action);
      const newXP = s.xp + xpGain;

      const stats = {
        brushingStreak: s.brushingStreak,
        fullCareStreak: s.fullCareStreak,
        totalFullDays: s.totalFullDays,
        totalSessions: s.totalSessions,
        extraBrushes: s.extraBrushesTotal,
        isComeback: s.isComeback,
      };
      const newly = checkNewBadges(s.unlockedBadges, stats);
      if (newly.length > 0) {
        setNewBadges((prev) => [...prev, ...newly]);
      }

      return {
        xp: newXP,
        unlockedBadges: [...s.unlockedBadges, ...newly],
      };
    },
    []
  );

  const updateTodayRecord = useCallback(
    (updater: (record: DayRecord) => DayRecord) => {
      setState((prev) => {
        const today = todayString();
        const idx = prev.history.findIndex((r) => r.date === today);
        const existing = idx >= 0 ? prev.history[idx] : createTodayRecord();
        const updated = updater(existing);
        const newStatus = calculateDayStatus(updated);
        const finalRecord = { ...updated, status: newStatus };

        const newHistory =
          idx >= 0
            ? prev.history.map((r, i) => (i === idx ? finalRecord : r))
            : [...prev.history, finalRecord];

        const newState = { ...prev, history: newHistory };
        saveState(newState);
        return newState;
      });
    },
    []
  );

  const completeMorningBrush = useCallback(() => {
    setState((prev) => {
      const xpData = awardXPAndCheckBadges(prev, "morning");
      const newSessions = prev.totalSessions + 1;
      const today = todayString();
      const idx = prev.history.findIndex((r) => r.date === today);
      const existing = idx >= 0 ? prev.history[idx] : createTodayRecord();
      const updatedRecord = { ...existing, morningBrush: true };
      const newStatus = calculateDayStatus(updatedRecord);

      let extraXP = 0;
      if (newStatus === "complete") {
        extraXP = getXPForAction("fullDay");
      }

      const finalRecord = { ...updatedRecord, status: newStatus };
      const newHistory =
        idx >= 0
          ? prev.history.map((r, i) => (i === idx ? finalRecord : r))
          : [...prev.history, finalRecord];

      const newState: AppState = {
        ...prev,
        ...xpData,
        xp: (prev.xp + getXPForAction("morning") + extraXP),
        totalSessions: newSessions,
        totalFullDays: newStatus === "complete" ? prev.totalFullDays + 1 : prev.totalFullDays,
        isComeback: newStatus === "complete" ? false : prev.isComeback,
        history: newHistory,
      };
      saveState(newState);
      return newState;
    });
  }, [awardXPAndCheckBadges]);

  const completeNightBrush = useCallback(() => {
    setState((prev) => {
      const xpData = awardXPAndCheckBadges(prev, "night");
      const newSessions = prev.totalSessions + 1;
      const today = todayString();
      const idx = prev.history.findIndex((r) => r.date === today);
      const existing = idx >= 0 ? prev.history[idx] : createTodayRecord();
      const updatedRecord = { ...existing, nightBrush: true };
      const newStatus = calculateDayStatus(updatedRecord);

      let extraXP = 0;
      let newTotalFullDays = prev.totalFullDays;
      if (newStatus === "complete" && !existing.nightBrush) {
        const wasComplete = calculateDayStatus(existing) === "complete";
        if (!wasComplete) {
          extraXP = getXPForAction("fullDay");
          newTotalFullDays = prev.totalFullDays + 1;
        }
      }

      // Update brushing streak for today
      const todayHasMorning = existing.morningBrush;
      const newBrushingStreak = todayHasMorning ? prev.brushingStreak + 1 : prev.brushingStreak;
      const newFullCareStreak = newStatus === "complete" ? prev.fullCareStreak + 1 : prev.fullCareStreak;

      const finalRecord = { ...updatedRecord, status: newStatus };
      const newHistory =
        idx >= 0
          ? prev.history.map((r, i) => (i === idx ? finalRecord : r))
          : [...prev.history, finalRecord];

      const newState: AppState = {
        ...prev,
        ...xpData,
        xp: prev.xp + getXPForAction("night") + extraXP,
        totalSessions: newSessions,
        totalFullDays: newTotalFullDays,
        brushingStreak: newBrushingStreak,
        fullCareStreak: newFullCareStreak,
        isComeback: newStatus === "complete" ? false : prev.isComeback,
        history: newHistory,
      };
      saveState(newState);
      return newState;
    });
  }, [awardXPAndCheckBadges]);

  const completeFloss = useCallback(() => {
    setState((prev) => {
      const xpData = awardXPAndCheckBadges(prev, "floss");
      const today = todayString();
      const idx = prev.history.findIndex((r) => r.date === today);
      const existing = idx >= 0 ? prev.history[idx] : createTodayRecord();
      const updatedRecord = { ...existing, floss: true };
      const newStatus = calculateDayStatus(updatedRecord);

      let extraXP = 0;
      let newTotalFullDays = prev.totalFullDays;
      if (newStatus === "complete") {
        const wasComplete = calculateDayStatus(existing) === "complete";
        if (!wasComplete) {
          extraXP = getXPForAction("fullDay");
          newTotalFullDays = prev.totalFullDays + 1;
        }
      }

      const finalRecord = { ...updatedRecord, status: newStatus };
      const newHistory =
        idx >= 0
          ? prev.history.map((r, i) => (i === idx ? finalRecord : r))
          : [...prev.history, finalRecord];

      const newState: AppState = {
        ...prev,
        ...xpData,
        xp: prev.xp + getXPForAction("floss") + extraXP,
        totalFullDays: newTotalFullDays,
        history: newHistory,
      };
      saveState(newState);
      return newState;
    });
  }, [awardXPAndCheckBadges]);

  const completeMouthwash = useCallback(() => {
    setState((prev) => {
      const xpData = awardXPAndCheckBadges(prev, "mouthwash");
      const today = todayString();
      const idx = prev.history.findIndex((r) => r.date === today);
      const existing = idx >= 0 ? prev.history[idx] : createTodayRecord();
      const updatedRecord = { ...existing, mouthwash: true };
      const newStatus = calculateDayStatus(updatedRecord);

      let extraXP = 0;
      let newTotalFullDays = prev.totalFullDays;
      if (newStatus === "complete") {
        const wasComplete = calculateDayStatus(existing) === "complete";
        if (!wasComplete) {
          extraXP = getXPForAction("fullDay");
          newTotalFullDays = prev.totalFullDays + 1;
        }
      }

      const finalRecord = { ...updatedRecord, status: newStatus };
      const newHistory =
        idx >= 0
          ? prev.history.map((r, i) => (i === idx ? finalRecord : r))
          : [...prev.history, finalRecord];

      const newState: AppState = {
        ...prev,
        ...xpData,
        xp: prev.xp + getXPForAction("mouthwash") + extraXP,
        totalFullDays: newTotalFullDays,
        history: newHistory,
      };
      saveState(newState);
      return newState;
    });
  }, [awardXPAndCheckBadges]);

  const addExtraBrush = useCallback(() => {
    setState((prev) => {
      const xpData = awardXPAndCheckBadges(prev, "extra");
      const today = todayString();
      const idx = prev.history.findIndex((r) => r.date === today);
      const existing = idx >= 0 ? prev.history[idx] : createTodayRecord();
      const updatedRecord = { ...existing, extraBrushes: existing.extraBrushes + 1 };
      const newHistory =
        idx >= 0
          ? prev.history.map((r, i) => (i === idx ? updatedRecord : r))
          : [...prev.history, updatedRecord];

      const newState: AppState = {
        ...prev,
        ...xpData,
        xp: prev.xp + getXPForAction("extra"),
        extraBrushesTotal: prev.extraBrushesTotal + 1,
        freezeTokens: prev.freezeTokens + 1,
        history: newHistory,
      };
      saveState(newState);
      return newState;
    });
  }, [awardXPAndCheckBadges]);

  const logMissedReason = useCallback((session: string, reason: string) => {
    updateTodayRecord((record) => ({
      ...record,
      missedReasons: [...record.missedReasons, { session, reason }],
    }));
  }, [updateTodayRecord]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState((prev) => {
      const newState: AppState = {
        ...prev,
        settings: { ...prev.settings, ...updates },
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const completeOnboarding = useCallback((settings: Partial<AppSettings>) => {
    setState((prev) => {
      const today = todayString();
      const existing = prev.history.find((r) => r.date === today);
      const newState: AppState = {
        ...prev,
        settings: { ...prev.settings, ...settings, onboardingComplete: true },
        lastCheckedDate: today,
        history: existing ? prev.history : [...prev.history, createTodayRecord()],
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const getMissedSessions = useCallback((): string[] => {
    const today = todayString();
    const record = state.history.find((r) => r.date === today);
    if (!record) return [];
    const missed: string[] = [];
    if (!record.morningBrush) missed.push("morning");
    if (!record.nightBrush) missed.push("night");
    return missed;
  }, [state.history]);

  const clearNewBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  const todayRecord = (() => {
    const today = todayString();
    return state.history.find((r) => r.date === today) ?? createTodayRecord();
  })();

  return (
    <AppContext.Provider
      value={{
        state,
        loading,
        todayRecord,
        completeMorningBrush,
        completeNightBrush,
        completeFloss,
        completeMouthwash,
        addExtraBrush,
        logMissedReason,
        updateSettings,
        completeOnboarding,
        getMissedSessions,
        newBadges,
        clearNewBadges,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
