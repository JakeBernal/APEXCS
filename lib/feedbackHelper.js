import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const FEEDBACK_QUEUE_KEY = "@apex_feedback_queue_v1";

export const FEEDBACK_CATEGORIES = [
  "General",
  "Bug Report",
  "Question Error",
  "Feature Request",
];

/**
 * Submits user feedback to Supabase (`feedbacks` table) with automatic
 * local AsyncStorage queueing if offline or cloud table is unavailable.
 */
export async function submitUserFeedback({
  userId = null,
  userName = "Reviewee",
  userEmail = null,
  category = "General",
  rating = 5,
  message = "",
}) {
  const cleanMessage = (message || "").trim();
  if (!cleanMessage) {
    throw new Error("Please enter your feedback message before submitting.");
  }

  const payload = {
    user_id: userId,
    user_name: userName || "Reviewee",
    user_email: userEmail,
    category,
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    message: cleanMessage,
    created_at: new Date().toISOString(),
  };

  let cloudError = null;
  let isNetworkError = false;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );
    const insertPromise = supabase.from("feedbacks").insert(payload);

    const { error } = await Promise.race([insertPromise, timeoutPromise]);
    if (!error) {
      return { success: true, synced: true };
    }
    cloudError = error.message || "Cloud database rejected insert";
  } catch (err) {
    isNetworkError = true;
    cloudError = err?.message || "Network unavailable";
  }

  // Save locally so feedback is never lost
  try {
    const raw = await AsyncStorage.getItem(FEEDBACK_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(payload);
    await AsyncStorage.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn("Local feedback save failed:", err);
  }

  return {
    success: true,
    synced: false,
    offline: isNetworkError,
    cloudError: isNetworkError ? null : cloudError,
  };
}
