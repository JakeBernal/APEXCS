// Real question bank, sourced from Supabase.
// Shape per question: { id, question, choices: [4 strings], choiceIds: [4 uuids],
//                        correctIndex, explanation, subjectTitle }
//
// IMPORTANT: buildQuestionSet is ASYNC (it makes a network call). Any screen
// calling it needs to `await` it and handle a loading state.

import { supabase } from "../lib/supabase";

// subjectTitle = null means "All Categories" (combined, tagged per question).
// level = "professional" | "sub". Questions tagged for a specific level only
// show up for that level; questions with no level set (null) show up for
// BOTH, so existing content keeps working without needing to be re-tagged.
export async function buildQuestionSet(subjectTitle, level) {
  let query = supabase
    .from("questions")
    .select(
      `
      id,
      question_text,
      explanation,
      subject_id,
      level,
      subjects ( name ),
      choices ( id, choice_text, is_correct, position )
    `
    )
    .eq("status", "published");

  if (level) {
    query = query.or(`level.is.null,level.eq.${level}`);
  }

  if (subjectTitle) {
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("name", subjectTitle)
      .single();

    if (subjectError || !subject) {
      console.error("Subject not found:", subjectTitle, subjectError);
      return [];
    }

    query = query.eq("subject_id", subject.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load questions:", error);
    return [];
  }

  return data.map((q) => {
    const orderedChoices = [...q.choices].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    const correctIndex = orderedChoices.findIndex((c) => c.is_correct);

    return {
      id: q.id,
      question: q.question_text,
      choices: orderedChoices.map((c) => c.choice_text),
      choiceIds: orderedChoices.map((c) => c.id),
      correctIndex,
      explanation: q.explanation || "",
      subjectTitle: q.subjects?.name ?? subjectTitle,
    };
  });
}

// Returns the list of subject names currently available, so screens that
// let the user pick a category can build that list dynamically.
export async function getAvailableSubjects() {
  const { data, error } = await supabase.from("subjects").select("name");

  if (error) {
    console.error("Failed to load subjects:", error);
    return [];
  }

  return data.map((s) => s.name);
}