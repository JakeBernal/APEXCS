import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

export const AVATARS = [
  { id: "avatar1", source: require("../assets/avatars/avatar1.png"), name: "Nina" },
  { id: "avatar2", source: require("../assets/avatars/avatar2.png"), name: "Alex" },
  { id: "avatar3", source: require("../assets/avatars/avatar3.png"), name: "Miguel" },
  { id: "avatar4", source: require("../assets/avatars/avatar4.png"), name: "Jasmine" },
  { id: "avatar5", source: require("../assets/avatars/avatar5.png"), name: "Ethan" },
  { id: "avatar6", source: require("../assets/avatars/avatar6.png"), name: "Andre" },
  { id: "avatar7", source: require("../assets/avatars/avatar7.png"), name: "Mia" },
  { id: "avatar8", source: require("../assets/avatars/avatar8.png"), name: "Noah" },
  { id: "avatar9", source: require("../assets/avatars/avatar9.png"), name: "Airah" },
  { id: "avatar10", source: require("../assets/avatars/avatar10.png"), name: "Lucas" },
  { id: "avatar11", source: require("../assets/avatars/avatar11.png"), name: "Kai" },
  { id: "avatar12", source: require("../assets/avatars/avatar12.png"), name: "Marcus" },
];

export function getAvatarSource(avatarId) {
  const found = AVATARS.find((a) => a.id === avatarId);
  return found ? found.source : AVATARS[0].source;
}

const STORAGE_KEY_PREFIX = "@apex_user_avatar_";

export async function getUserAvatar(userId) {
  if (!userId) return "avatar1";

  try {
    // 1. Check local storage first (instant, works offline)
    const local = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (local && AVATARS.some((a) => a.id === local)) {
      return local;
    }

    // 2. Check Supabase profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_id")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data?.avatar_id && AVATARS.some((a) => a.id === data.avatar_id)) {
      await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, data.avatar_id);
      return data.avatar_id;
    }
  } catch (err) {
    console.warn("Failed to load user avatar:", err);
  }

  return "avatar1";
}

export async function setUserAvatar(userId, avatarId) {
  if (!userId || !avatarId) return;

  try {
    // 1. Save to local storage for instant persistence
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, avatarId);

    // 2. Try persisting to Supabase profiles (gracefully ignored if column absent)
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_id: avatarId })
      .eq("id", userId);

    if (error) {
      console.log("Supabase profiles.avatar_id update note:", error.message);
    }
  } catch (err) {
    console.warn("Failed to sync avatar with Supabase:", err);
  }
}
