import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const SOUND_ASSET = require("../assets/sounds/correct.wav");

let audioPlayerInstance = null;
let isPreloading = false;

/**
 * Preloads the celebration SFX ahead of time so it plays instantly with zero delay.
 */
export async function preloadCorrectSound() {
  if (audioPlayerInstance || isPreloading) return;
  isPreloading = true;

  try {
    const expoAudio = require("expo-audio");
    if (expoAudio) {
      if (typeof expoAudio.preload === "function") {
        try {
          expoAudio.preload(SOUND_ASSET);
        } catch {}
      }

      if (typeof expoAudio.createAudioPlayer === "function") {
        audioPlayerInstance = expoAudio.createAudioPlayer(SOUND_ASSET);
      }
    }
  } catch {
    // Graceful no-op if native module is not linked
  } finally {
    isPreloading = false;
  }
}

// Preload immediately in background
preloadCorrectSound().catch(() => {});

/**
 * Plays the correct answer celebration SFX with zero perceptible latency.
 * Synchronously triggers the preloaded audio buffer and non-blocking haptic feedback.
 */
export function playCorrectSound() {
  // 1. Instant tactile feedback (non-blocking, zero await)
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {}

  // 2. Web browser HTML5 Audio (instant)
  if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.Audio === "function") {
    try {
      const audio = new window.Audio(SOUND_ASSET);
      audio.volume = 1.0;
      audio.play().catch(() => {});
      return;
    } catch {}
  }

  // 3. Preloaded native player playback (instant trigger)
  if (audioPlayerInstance && typeof audioPlayerInstance.play === "function") {
    try {
      if (typeof audioPlayerInstance.seekTo === "function") {
        audioPlayerInstance.seekTo(0);
      }
      audioPlayerInstance.play();
      return;
    } catch {}
  }

  // 4. Fallback if not yet initialized
  preloadCorrectSound()
    .then(() => {
      if (audioPlayerInstance && typeof audioPlayerInstance.play === "function") {
        try {
          if (typeof audioPlayerInstance.seekTo === "function") {
            audioPlayerInstance.seekTo(0);
          }
          audioPlayerInstance.play();
        } catch {}
      }
    })
    .catch(() => {});
}

/**
 * Clean up sound resources when screen unmounts.
 */
export function unloadCorrectSound() {
  try {
    if (audioPlayerInstance && typeof audioPlayerInstance.pause === "function") {
      audioPlayerInstance.pause();
    }
  } catch {}
}
