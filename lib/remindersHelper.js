import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

let cachedNotifications = null;
let notificationHandlerConfigured = false;

/**
 * Safely resolves the expo-notifications module dynamically.
 * Prevents "Cannot find native module" crashes and Uncaught Errors in Expo Go,
 * web, or unlinked native environments.
 */
function getNotifications() {
  if (cachedNotifications !== null) {
    return cachedNotifications;
  }

  try {
    const mod = require("expo-notifications");
    if (mod) {
      cachedNotifications = mod;

      // Configure foreground handler once with modern properties and error handler
      if (!notificationHandlerConfigured && typeof mod.setNotificationHandler === "function") {
        notificationHandlerConfigured = true;
        try {
          mod.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowBanner: true,
              shouldShowList: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            }),
            handleError: (notificationId, error) => {
              console.warn("Foreground notification handler notice:", notificationId, error);
            },
          });
        } catch (handlerErr) {
          console.warn("setNotificationHandler registration notice:", handlerErr);
        }
      }

      return cachedNotifications;
    }
  } catch (err) {
    console.warn("expo-notifications is not available in current environment:", err?.message || err);
  }

  cachedNotifications = false;
  return false;
}

export const DAYS_OF_WEEK = [
  { key: "Mon", label: "M", fullName: "Monday" },
  { key: "Tue", label: "T", fullName: "Tuesday" },
  { key: "Wed", label: "W", fullName: "Wednesday" },
  { key: "Thu", label: "T", fullName: "Thursday" },
  { key: "Fri", label: "F", fullName: "Friday" },
  { key: "Sat", label: "S", fullName: "Saturday" },
  { key: "Sun", label: "S", fullName: "Sunday" },
];

export const PRESET_TIMES = [
  { label: "Morning", timeString: "8:00 AM", hour: 8, minute: 0, period: "AM" },
  { label: "Afternoon", timeString: "1:00 PM", hour: 1, minute: 0, period: "PM" },
  { label: "Evening", timeString: "7:00 PM", hour: 7, minute: 0, period: "PM" },
  { label: "Night", timeString: "9:00 PM", hour: 9, minute: 0, period: "PM" },
];

export const GOAL_OPTIONS = [10, 20, 30, 50];

export const DEFAULT_REMINDER_SETTINGS = {
  enabled: true,
  timeString: "7:00 PM",
  hour: 7,
  minute: 0,
  period: "PM",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  goalQuestions: 20,
};

const STORAGE_KEY_PREFIX = "@apex_study_reminders_";

/**
 * Format a human-friendly string for the reminders summary badge.
 * Examples: "7:00 PM • Daily", "8:00 AM • Weekdays", "Off"
 */
export function formatReminderSummary(settings) {
  if (!settings || !settings.enabled) {
    return "Off";
  }

  const { timeString, days } = settings;
  const time = timeString || "7:00 PM";

  if (!days || days.length === 0) {
    return `${time} • No days`;
  }

  if (days.length === 7) {
    return `${time} • Daily`;
  }

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const weekends = ["Sat", "Sun"];

  const isWeekdays =
    days.length === 5 && weekdays.every((d) => days.includes(d));
  if (isWeekdays) {
    return `${time} • Weekdays`;
  }

  const isWeekends =
    days.length === 2 && weekends.every((d) => days.includes(d));
  if (isWeekends) {
    return `${time} • Weekends`;
  }

  if (days.length <= 3) {
    return `${time} • ${days.join(", ")}`;
  }

  return `${time} • ${days.length} days/wk`;
}

/**
 * Checks if a reminder is active and scheduled for today.
 */
export function isReminderDueToday(settings) {
  if (!settings || !settings.enabled) return false;

  const dayKeys = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayKey = dayKeys[new Date().getDay()];

  return Array.isArray(settings.days) && settings.days.includes(todayKey);
}

/**
 * Retrieve user's reminder settings from AsyncStorage or Supabase.
 */
export async function getStudyReminders(userId) {
  const fallback = { ...DEFAULT_REMINDER_SETTINGS };
  if (!userId) return fallback;

  try {
    // 1. Try local storage first (instant, offline-first)
    const local = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (local) {
      const parsed = JSON.parse(local);
      return { ...DEFAULT_REMINDER_SETTINGS, ...parsed };
    }

    // 2. Try Supabase profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("study_reminders")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data?.study_reminders) {
      const settings = typeof data.study_reminders === "string"
        ? JSON.parse(data.study_reminders)
        : data.study_reminders;
      await AsyncStorage.setItem(
        `${STORAGE_KEY_PREFIX}${userId}`,
        JSON.stringify(settings)
      );
      return { ...DEFAULT_REMINDER_SETTINGS, ...settings };
    }
  } catch (err) {
    console.warn("Failed to retrieve study reminders:", err);
  }

  return fallback;
}

/**
 * Persist user's reminder settings locally and to Supabase.
 */
export async function saveStudyReminders(userId, settings) {
  if (!userId || !settings) return;

  try {
    // 1. Save locally for instant persistence
    await AsyncStorage.setItem(
      `${STORAGE_KEY_PREFIX}${userId}`,
      JSON.stringify(settings)
    );

    // 2. Sync to Supabase profiles (gracefully handles absent column)
    const { error } = await supabase
      .from("profiles")
      .update({ study_reminders: settings })
      .eq("id", userId);

    if (error) {
      console.log("Supabase profiles.study_reminders note:", error.message);
    }

    // 3. Dispatch safe local OS notification hook if available
    await scheduleLocalOSReminder(settings);
  } catch (err) {
    console.warn("Failed to save study reminders:", err);
  }
}

/**
 * Request notification permissions from device OS and configure Android notification channel.
 */
export async function requestNotificationPermissions() {
  try {
    const Notifications = getNotifications();
    if (!Notifications || typeof Notifications.getPermissionsAsync !== "function") {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted" && typeof Notifications.requestPermissionsAsync === "function") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === "android" && typeof Notifications.setNotificationChannelAsync === "function") {
      try {
        await Notifications.setNotificationChannelAsync("study-reminders", {
          name: "Study Reminders",
          importance: Notifications.AndroidImportance?.HIGH ?? 4,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#386BF6",
          sound: "default",
        });
      } catch (channelErr) {
        console.warn("setNotificationChannelAsync notice:", channelErr?.message || channelErr);
      }
    }

    return finalStatus === "granted";
  } catch (err) {
    console.warn("Notification permissions notice:", err?.message || err);
    return false;
  }
}

/**
 * Schedule repeating daily study notification on the mobile OS.
 */
export async function scheduleLocalOSReminder(settings) {
  try {
    const Notifications = getNotifications();
    if (!Notifications || typeof Notifications.scheduleNotificationAsync !== "function") {
      return false;
    }

    if (typeof Notifications.cancelAllScheduledNotificationsAsync === "function") {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (cancelErr) {
        console.warn("Notice cancelling prior scheduled notifications:", cancelErr?.message || cancelErr);
      }
    }

    if (!settings || !settings.enabled) return true;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    // Convert hour & period to 24-hour format
    let hour24 = Number(settings.hour) || 19;
    if (settings.period === "PM" && hour24 < 12) hour24 += 12;
    if (settings.period === "AM" && hour24 === 12) hour24 = 0;
    const minute = Number(settings.minute) || 0;

    const triggerType = Notifications.SchedulableTriggerInputTypes?.DAILY || "daily";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Civil Service Exam Study Time! 🎯",
        body: `Time for your daily review (${settings.goalQuestions || 20} questions target). Keep your study streak going!`,
        sound: "default",
        data: { type: "study_reminder" },
      },
      trigger: {
        type: triggerType,
        hour: hour24,
        minute: minute,
        channelId: "study-reminders",
      },
    });

    return true;
  } catch (err) {
    console.warn("Failed to schedule study reminder:", err?.message || err);
    return false;
  }
}

/**
 * Sends an immediate test notification so the user can verify sound and alerts on their phone.
 */
export async function sendImmediateTestNotification(goalQuestions = 20) {
  try {
    const Notifications = getNotifications();
    if (!Notifications || typeof Notifications.scheduleNotificationAsync !== "function") {
      return { success: false, reason: "unsupported" };
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return { success: false, reason: "permission_denied" };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "APEX-CS Study Alert 🎯",
        body: `Time for today's review (${goalQuestions} questions goal). Keep your daily study streak going!`,
        sound: "default",
      },
      trigger: null,
    });

    return { success: true };
  } catch (err) {
    console.warn("Test notification notice:", err?.message || err);
    return { success: false, reason: err?.message || "error" };
  }
}

const DAILY_QUESTIONS_PREFIX = "@apex_daily_qs_";

/**
 * Returns today's answered questions count and progress against the goal.
 * Example result: { completed: 4, target: 20, percent: 20, isCompleted: false, taskString: "4 out of 20 questions" }
 */
export async function getTodayQuestionsProgress(userId, targetGoal = 20) {
  const goal = targetGoal || 20;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateKey = today.toISOString().split("T")[0];

  let completedToday = 0;

  try {
    // 1. Fetch attempts completed today from Supabase
    if (userId) {
      const { data, error } = await supabase
        .from("attempts")
        .select("total_questions, correct_count, wrong_count, completed_at")
        .eq("user_id", userId)
        .gte("completed_at", today.toISOString());

      if (!error && Array.isArray(data)) {
        completedToday = data.reduce((sum, att) => {
          const count =
            att.total_questions ||
            ((att.correct_count || 0) + (att.wrong_count || 0)) ||
            0;
          return sum + count;
        }, 0);
      }
    }

    // 2. Also check local storage for questions answered
    const localKey = `${DAILY_QUESTIONS_PREFIX}${userId || "guest"}_${dateKey}`;
    const localVal = await AsyncStorage.getItem(localKey);
    if (localVal) {
      const parsedLocal = parseInt(localVal, 10);
      if (!isNaN(parsedLocal)) {
        completedToday = Math.max(completedToday, parsedLocal);
      }
    }
  } catch (err) {
    console.warn("Failed to calculate today questions progress:", err);
  }

  const percent = Math.min(
    Math.round((completedToday / goal) * 100),
    100
  );
  const isCompleted = completedToday >= goal;
  const remaining = Math.max(goal - completedToday, 0);

  return {
    completed: completedToday,
    target: goal,
    percent,
    isCompleted,
    remaining,
    taskString: `${completedToday} out of ${goal} questions`,
  };
}

/**
 * Record additional questions answered today in local storage.
 */
export async function recordQuestionsAnsweredToday(userId, count = 1) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateKey = today.toISOString().split("T")[0];
    const localKey = `${DAILY_QUESTIONS_PREFIX}${userId || "guest"}_${dateKey}`;

    const current = await AsyncStorage.getItem(localKey);
    const prevCount = current ? parseInt(current, 10) || 0 : 0;
    const newCount = prevCount + count;

    await AsyncStorage.setItem(localKey, newCount.toString());
    return newCount;
  } catch (err) {
    console.warn("Failed to record questions answered today:", err);
  }
}

