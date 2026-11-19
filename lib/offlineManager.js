import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase.js";
import { OFFLINE_SEED_QUESTIONS } from "./offlineSeedQuestions.js";

const STORAGE_KEYS = {
  QUESTIONS_CACHE: "@apex_offline_questions_cache_v1",
  ATTEMPTS_CACHE: "@apex_offline_attempts_cache_v1",
  PENDING_SYNC: "@apex_offline_pending_sync_queue_v1",
  LAST_SYNC: "@apex_offline_last_sync_timestamp",
};

/**
 * Normalizes exam level.
 */
function normLevel(level) {
  return level === "sub" ? "sub" : level === "professional" ? "professional" : null;
}

/**
 * Checks whether the app can currently reach Supabase.
 * Uses a fast 2.5-second timeout to avoid stalling UI interactions.
 */
export async function checkOnlineStatus() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Network timeout")), 2500)
    );
    const probePromise = supabase
      .from("subjects")
      .select("id")
      .limit(1);

    const { error } = await Promise.race([probePromise, timeoutPromise]);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Retrieves all offline questions from AsyncStorage.
 * If storage is empty, initializes it with the built-in OFFLINE_SEED_QUESTIONS.
 *
 * @param {string|null} level - "professional" | "sub" | null
 * @returns {Promise<Array>}
 */
export async function getOfflineQuestions(level = null) {
  const targetLevel = normLevel(level);

  let storedQuestions = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.QUESTIONS_CACHE);
    if (raw) {
      storedQuestions = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Error reading offline questions cache:", err);
  }

  // Merge seed questions with stored questions (deduplicating by ID)
  const questionMap = new Map();

  // First insert seed questions
  OFFLINE_SEED_QUESTIONS.forEach((q) => {
    questionMap.set(q.id, q);
  });

  // Then overlay any stored / synced questions
  if (Array.isArray(storedQuestions)) {
    storedQuestions.forEach((q) => {
      if (q?.id && q?.question) {
        questionMap.set(q.id, q);
      }
    });
  }

  const allQuestions = Array.from(questionMap.values());

  // If level is specified, filter strictly
  if (targetLevel) {
    return allQuestions.filter((q) => {
      if (!q.level) return true; // Questions applicable to both levels
      return q.level === targetLevel;
    });
  }

  return allQuestions;
}

/**
 * Merges freshly fetched questions from Supabase into the local offline cache.
 *
 * @param {Array} newQuestions
 */
export async function cacheQuestionsLocally(newQuestions) {
  if (!Array.isArray(newQuestions) || newQuestions.length === 0) return;

  try {
    const existing = await getOfflineQuestions(null);
    const questionMap = new Map();

    existing.forEach((q) => questionMap.set(q.id, q));
    newQuestions.forEach((q) => {
      if (q?.id && q?.question) {
        questionMap.set(q.id, q);
      }
    });

    const merged = Array.from(questionMap.values());
    await AsyncStorage.setItem(
      STORAGE_KEYS.QUESTIONS_CACHE,
      JSON.stringify(merged)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_SYNC,
      new Date().toISOString()
    );
  } catch (err) {
    console.warn("Failed to cache questions locally:", err);
  }
}

/**
 * Retrieves all locally cached exam attempts.
 *
 * @returns {Promise<Array>}
 */
export async function getCachedAttempts() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTEMPTS_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Failed to read cached attempts:", err);
  }
  return [];
}

/**
 * Saves or updates attempts in the local cache.
 *
 * @param {Array|Object} attempts
 */
export async function cacheAttemptsLocally(attempts) {
  try {
    const list = Array.isArray(attempts) ? attempts : [attempts];
    const existing = await getCachedAttempts();
    const map = new Map();

    existing.forEach((a) => {
      if (a?.id) map.set(a.id, a);
    });

    list.forEach((a) => {
      if (a?.id) map.set(a.id, a);
    });

    // Sort newest to oldest
    const sorted = Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.completed_at || 0).getTime();
      const timeB = new Date(b.completed_at || 0).getTime();
      return timeB - timeA;
    });

    await AsyncStorage.setItem(
      STORAGE_KEYS.ATTEMPTS_CACHE,
      JSON.stringify(sorted)
    );
    return sorted;
  } catch (err) {
    console.warn("Failed to cache attempts locally:", err);
    return [];
  }
}

/**
 * Queues an attempt for future cloud synchronization when offline.
 *
 * @param {Object} attemptPayload
 */
export async function queuePendingAttempt(attemptPayload) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({
      ...attemptPayload,
      queuedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(queue));
  } catch (err) {
    console.warn("Failed to queue pending attempt:", err);
  }
}

/**
 * Attempts to upload all queued offline attempts to Supabase.
 * Called automatically on app launch, reconnect, or dashboard focus.
 */
export async function syncPendingAttempts() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    if (!raw) return { syncedCount: 0 };

    const queue = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return { syncedCount: 0 };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { syncedCount: 0, reason: "No authenticated user" };
    }

    const remainingQueue = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const { attemptData, answerRows } = item;

        // Insert attempt record to Supabase
        const { data: cloudAttempt, error: attemptError } = await supabase
          .from("attempts")
          .insert({
            ...attemptData,
            user_id: user.id,
          })
          .select()
          .single();

        if (attemptError || !cloudAttempt) {
          remainingQueue.push(item);
          continue;
        }

        // Insert associated answers if any exist
        if (Array.isArray(answerRows) && answerRows.length > 0) {
          const mappedAnswers = answerRows.map((ans) => ({
            ...ans,
            attempt_id: cloudAttempt.id,
          }));
          await supabase.from("attempt_answers").insert(mappedAnswers);
        }

        // Update local review cache key to match cloud ID if needed
        if (item.localId && cloudAttempt.id !== item.localId) {
          try {
            const localReview = await AsyncStorage.getItem(
              `@apex_attempt_review_${item.localId}`
            );
            if (localReview) {
              await AsyncStorage.setItem(
                `@apex_attempt_review_${cloudAttempt.id}`,
                localReview
              );
            }
          } catch {}
        }

        syncedCount++;
      } catch {
        remainingQueue.push(item);
      }
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.PENDING_SYNC,
      JSON.stringify(remainingQueue)
    );

    return { syncedCount, remaining: remainingQueue.length };
  } catch (err) {
    console.warn("Sync pending attempts notice:", err);
    return { syncedCount: 0, error: err };
  }
}
