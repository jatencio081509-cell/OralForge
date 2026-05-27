import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Call this once from the root layout — NOT at module level
export function configureNotificationHandler() {
  if (Platform.OS === "web") return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Silently ignore — never crash the app over notification config
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export interface PendingTasks {
  morningBrush: boolean;
  nightBrush: boolean;
  floss: boolean;
  mouthwash: boolean;
}

/**
 * Cancels all scheduled notifications and reschedules morning + night reminders.
 * The night reminder body dynamically lists any care tasks not yet completed today.
 * All calls are wrapped in try/catch — notification errors must never crash the app.
 */
export async function scheduleAllReminders(
  morningTime: string,
  nightTime: string,
  pending: PendingTasks
): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const [mH, mM] = morningTime.split(":").map(Number);
    const [nH, nM] = nightTime.split(":").map(Number);

    // Morning reminder — skip if already done today
    if (!pending.morningBrush) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Morning Brush Time 🦷",
          body: "Your morning window closes at noon. Start now to protect your streak.",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: mH,
          minute: mM,
        },
      });
    }

    // Night reminder — include any unfinished tasks
    const unfinished: string[] = [];
    if (!pending.nightBrush) unfinished.push("Night Brush");
    if (!pending.floss) unfinished.push("Floss");
    if (!pending.mouthwash) unfinished.push("Mouthwash");

    if (unfinished.length > 0) {
      const body =
        unfinished.length === 1
          ? `Don't forget your ${unfinished[0]} before bed. Keep the streak alive.`
          : `Still pending tonight: ${unfinished.join(", ")}. Finish all to protect your streak.`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Evening Routine 🌙",
          body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: nH,
          minute: nM,
        },
      });
    }
  } catch {
    // Silently ignore — notification errors must never crash the app
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
