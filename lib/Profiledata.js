import { supabase } from "./supabase";

export async function getExamDate() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("exam_date")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Failed to load exam date:", error);
    return null;
  }

  return data?.exam_date ?? null;
}

export async function setExamDate(isoDateString) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const { error } = await supabase
    .from("profiles")
    .update({ exam_date: isoDateString })
    .eq("id", user.id);

  if (error) throw error;
}