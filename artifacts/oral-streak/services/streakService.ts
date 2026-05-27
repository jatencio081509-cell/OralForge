import { DayRecord } from "@/context/AppContext";
import { ALL_BADGES } from "@/constants/badges";

export function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function calculateDayStatus(
  record: DayRecord
): "complete" | "partial" | "missed" {
  const { morningBrush, nightBrush, floss, mouthwash } = record;
  const allDone = morningBrush && nightBrush && floss && mouthwash;
  const noneDone = !morningBrush && !nightBrush && !floss && !mouthwash;
  if (allDone) return "complete";
  if (noneDone) return "missed";
  return "partial";
}

export function getXPForAction(action: "morning" | "night" | "floss" | "mouthwash" | "extra" | "fullDay"): number {
  const xpMap: Record<string, number> = {
    morning: 25,
    night: 25,
    floss: 15,
    mouthwash: 15,
    extra: 10,
    fullDay: 25,
  };
  return xpMap[action] ?? 0;
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 6000, 10000];

export function getLevelForXP(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function getXPForLevel(level: number): number {
  return LEVEL_THRESHOLDS[level - 1] ?? 0;
}

export function getXPForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}

export function getXPProgress(xp: number): { level: number; progress: number; current: number; next: number } {
  const level = getLevelForXP(xp);
  const current = getXPForLevel(level);
  const next = getXPForNextLevel(level);
  const progress = next > current ? (xp - current) / (next - current) : 1;
  return { level, progress: Math.min(progress, 1), current, next };
}

export function checkNewBadges(
  unlockedBadges: string[],
  stats: {
    brushingStreak: number;
    fullCareStreak: number;
    totalFullDays: number;
    totalSessions: number;
    extraBrushes: number;
    isComeback: boolean;
  }
): string[] {
  const newBadges: string[] = [];
  for (const badge of ALL_BADGES) {
    if (!unlockedBadges.includes(badge.id) && badge.requirement(stats)) {
      newBadges.push(badge.id);
    }
  }
  return newBadges;
}

export function updateStreaksForPreviousDay(
  brushingStreak: number,
  fullCareStreak: number,
  prevRecord: DayRecord | null
): { brushingStreak: number; fullCareStreak: number } {
  if (!prevRecord) {
    return { brushingStreak: 0, fullCareStreak: 0 };
  }
  const { morningBrush, nightBrush, floss, mouthwash } = prevRecord;
  const brushingDone = morningBrush && nightBrush;
  const fullCareDone = morningBrush && nightBrush && floss && mouthwash;

  return {
    brushingStreak: brushingDone ? brushingStreak + 1 : 0,
    fullCareStreak: fullCareDone ? fullCareStreak + 1 : 0,
  };
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
