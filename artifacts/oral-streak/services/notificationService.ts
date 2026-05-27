import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
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
 */
export async function scheduleAllReminders(
  morningTime: string, // "HH:MM"
  nightTime: string,   // "HH:MM"
  pending: PendingTasks
): Promise<void> {
  if (Platform.OS === "web") return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const [mH, mM] = morningTime.split(":").map(Number);
  const [nH, nM] = nightTime.split(":").map(Number);

  // Morning reminder — only if morning brush not yet done
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

  // Night reminder — include any unfinished tasks in the body
  const unfinished: string[] = [];
  if (!pending.nightBrush) unfinished.push("Night Brush");
  if (!pending.floss) unfinished.push("Floss");
  if (!pending.mouthwash) unfinished.push("Mouthwash");

  if (unfinished.length > 0) {
    const taskList = unfinished.join(", ");
    const body =
      unfinished.length === 1
        ? `Don't forget your ${taskList} before bed. Keep the streak alive.`
        : `Still pending tonight: ${taskList}. Finish all three to protect your streak.`;

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
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
