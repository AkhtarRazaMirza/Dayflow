import { Task } from "@/constants/tasks";
import { parseTimeStringToDate } from "@/utils/deadline";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications should be handled when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

/**
 * Configure Android notification channels for Android 8.0+
 */
export async function setupNotificationChannelsAsync(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync("task-deadlines", {
      name: "Task Deadlines & Reminders",
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F59E0B",
      sound: "default",
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("focus-timer", {
      name: "Pomodoro Focus Timer",
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#10B981",
      sound: "default",
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("daily-briefing", {
      name: "Daily Morning Briefing",
      importance: AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: "#F59E0B",
      sound: "default",
      showBadge: false,
    });
  } catch (error) {
    console.warn("Failed to set up Android notification channels:", error);
  }
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (existing.status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = requested.status;
    }

    if (finalStatus !== "granted") {
      return false;
    }

    await setupNotificationChannelsAsync();
    return true;
  } catch (error) {
    console.warn("Error requesting notification permissions:", error);
    return false;
  }
}

/**
 * Helper to compute task deadline Date object
 */
export function getTaskDeadlineDate(task: Task): Date | null {
  const timeStr = task.deadline || task.time;
  if (!timeStr) return null;

  let baseDate = new Date();
  if (task.date) {
    // task.date is in YYYY-MM-DD
    const parts = task.date.split("-").map((p) => parseInt(p, 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }

  return parseTimeStringToDate(timeStr, baseDate);
}

/**
 * Schedules deadline reminders for a task:
 * 1. 15 minutes before deadline
 * 2. Exact time of deadline
 */
export async function scheduleTaskNotificationsAsync(task: Task): Promise<void> {
  try {
    // If task is completed, cancel notifications instead
    if (task.status === "Done") {
      await cancelTaskNotificationsAsync(task.id);
      return;
    }

    // Cancel existing scheduled notifications for this task to avoid duplicates
    await cancelTaskNotificationsAsync(task.id);

    const deadlineDate = getTaskDeadlineDate(task);
    if (!deadlineDate) return;

    const nowMs = Date.now();
    const deadlineMs = deadlineDate.getTime();

    // 1. Advance reminder: 15 minutes before deadline
    const advanceMs = deadlineMs - 15 * 60 * 1000;
    if (advanceMs > nowMs) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏳ 15m Reminder: ${task.title}`,
          body: `${task.category} • Scheduled deadline is ${task.deadline || task.time}.`,
          sound: true,
          data: {
            taskId: task.id,
            type: "task-advance-reminder",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(advanceMs),
          channelId: "task-deadlines",
        },
      });
    }

    // 2. Deadline alert: exactly at deadline
    if (deadlineMs > nowMs) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 Task Due Now: ${task.title}`,
          body: `Deadline reached for ${task.title}. Tap to review subtasks or mark complete!`,
          sound: true,
          data: {
            taskId: task.id,
            type: "task-due-alert",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(deadlineMs),
          channelId: "task-deadlines",
        },
      });
    }
  } catch (error) {
    console.warn(`Failed to schedule notifications for task ${task.id}:`, error);
  }
}

/**
 * Cancels all scheduled notifications associated with a given taskId
 */
export async function cancelTaskNotificationsAsync(taskId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      const data = notif.content.data;
      if (data && data.taskId === taskId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.warn(`Failed to cancel notifications for task ${taskId}:`, error);
  }
}

/**
 * Cancels all scheduled notifications
 */
export async function cancelAllTaskNotificationsAsync(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("Failed to cancel all notifications:", error);
  }
}

/**
 * Sends an immediate notification when a Pomodoro focus session finishes
 */
export async function sendFocusCompleteNotificationAsync(
  taskTitle?: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎉 Focus Session Complete!",
        body: taskTitle
          ? `Sprint completed on "${taskTitle}". Great execution! Take a breather or mark the task complete.`
          : "You completed your focus sprint! Take a 5-minute break and reset.",
        sound: true,
        data: {
          type: "focus-session-completed",
        },
      },
      trigger: null, // immediate
    });
  } catch (error) {
    console.warn("Failed to send focus completion notification:", error);
  }
}

/**
 * Sends an immediate test notification for user verification in Settings
 */
export async function sendTestNotificationAsync(): Promise<boolean> {
  try {
    const hasPermission = await requestNotificationPermissionsAsync();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Dayflow Notifications Active",
        body: "All systems go! You'll receive timely deadline alerts and focus session notifications.",
        sound: true,
        data: {
          type: "test-notification",
        },
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    console.warn("Failed to send test notification:", error);
    return false;
  }
}

/**
 * Schedules daily morning briefing at 09:00 AM
 */
export async function scheduleDailyMorningBriefingAsync(): Promise<void> {
  try {
    // Cancel any existing daily briefing
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "daily-morning-briefing") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "☀️ Good Morning! Today's Schedule",
        body: "Your daily priorities are ready. Tap to plan your focus blocks and review tasks.",
        sound: true,
        data: {
          type: "daily-morning-briefing",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 9,
        minute: 0,
        repeats: true,
        channelId: "daily-briefing",
      },
    });
  } catch (error) {
    console.warn("Failed to schedule daily briefing notification:", error);
  }
}
