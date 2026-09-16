import { supabase } from "./supabase";
import { classifyQuestionChapter } from "./curriculum";

/**
 * Builds a validated question set filtered by Level, Category, and optionally Chapter.
 *
 * @param {string|null} subjectTitle - e.g. "Analytical Ability", "Verbal Ability" (or null for full exam)
 * @param {string|null} level - "professional" | "sub"
 * @param {string|null} chapterTitle - e.g. "Word Analogy", "Data Interpretation" (or null for whole category)
 */
export async function buildQuestionSet(subjectTitle = null, level = null, chapterTitle = null) {
  const normLevel = level === "sub" ? "sub" : level === "professional" ? "professional" : null;

  // Enforce strict level isolation:
  // - Subprofessional users never receive Analytical Ability
  // - Professional users never receive Clerical Ability
  if (normLevel === "sub" && subjectTitle?.toLowerCase().includes("analytical")) {
    return [];
  }
  if (normLevel === "professional" && subjectTitle?.toLowerCase().includes("clerical")) {
    return [];
  }

  // Base query columns (with optional chapter support)
  const selectWithChapter = `
    id,
    question_text,
    explanation,
    subject_id,
    level,
    chapter,
    subjects ( id, name ),
    choices ( id, choice_text, is_correct, position )
  `;

  const selectWithoutChapter = `
    id,
    question_text,
    explanation,
    subject_id,
    level,
    subjects ( id, name ),
    choices ( id, choice_text, is_correct, position )
  `;

  const createQuery = (columns) => {
    let q = supabase
      .from("questions")
      .select(columns)
      .eq("status", "published");

    if (normLevel) {
      q = q.or(`level.is.null,level.eq.${normLevel}`);
    }

    return q;
  };

  // If subjectTitle is specified, resolve subject_id first
  let targetSubjectId = null;
  if (subjectTitle) {
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id, name")
      .ilike("name", subjectTitle.trim())
      .maybeSingle();

    if (subjectError || !subject) {
      console.warn("Subject not found in database:", subjectTitle, subjectError);
    } else {
      targetSubjectId = subject.id;
    }
  }

  let query = createQuery(selectWithChapter);
  if (targetSubjectId) {
    query = query.eq("subject_id", targetSubjectId);
  }

  let { data, error } = await query;

  // Graceful fallback: If 'chapter' column does not exist in Supabase yet, retry without it
  if (error && (error.message?.includes("chapter") || error.code === "42703" || error.code === "PGRST204")) {
    console.log("Database 'chapter' column not detected, running with runtime classifier fallback.");
    let fallbackQuery = createQuery(selectWithoutChapter);
    if (targetSubjectId) {
      fallbackQuery = fallbackQuery.eq("subject_id", targetSubjectId);
    }
    const fallbackRes = await fallbackQuery;
    data = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error) {
    console.error("Failed to load questions:", error);
    return [];
  }

  // Filter and map questions
  const mappedQuestions = (data || [])
    .filter((q) => {
      const choices = q.choices || [];
      const hasQuestionText = Boolean(q.question_text && q.question_text.trim());
      const hasChoices = choices.length >= 2;
      const hasCorrectAnswer = choices.some((c) => Boolean(c?.is_correct));

      return hasQuestionText && hasChoices && hasCorrectAnswer;
    })
    .map((q) => {
      const orderedChoices = [...(q.choices || [])].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
      const correctIndex = orderedChoices.findIndex((c) => c.is_correct);
      const resolvedCategory = q.subjects?.name ?? subjectTitle ?? "General Information";

      // Use database chapter if populated, otherwise use keyword/topic classifier fallback
      const resolvedChapter =
        q.chapter && q.chapter.trim() !== ""
          ? q.chapter.trim()
          : classifyQuestionChapter(q.question_text, resolvedCategory, normLevel || "professional");

      return {
        id: q.id,
        question: q.question_text,
        choices: orderedChoices.map((c) => c.choice_text),
        choiceIds: orderedChoices.map((c) => c.id),
        correctIndex,
        explanation: q.explanation || "",
        subjectTitle: resolvedCategory,
        chapter: resolvedChapter,
        level: q.level || normLevel,
      };
    });

  // Filter out any cross-level pollution
  const cleanQuestions = mappedQuestions.filter((q) => {
    const catLower = q.subjectTitle.toLowerCase();
    if (normLevel === "sub" && catLower.includes("analytical")) return false;
    if (normLevel === "professional" && catLower.includes("clerical")) return false;
    return true;
  });

  // If a specific chapter was requested, filter for that chapter
  if (chapterTitle && chapterTitle.trim() !== "") {
    const targetChapter = chapterTitle.trim().toLowerCase();
    const chapterFiltered = cleanQuestions.filter(
      (q) => q.chapter.toLowerCase() === targetChapter
    );

    // If chapter has specific questions, return them; otherwise return all in category as fallback
    if (chapterFiltered.length > 0) {
      return chapterFiltered;
    }
  }

  return cleanQuestions;
}

/**
 * Returns the list of available subjects from the database.
 */
export async function getAvailableSubjects() {
  const { data, error } = await supabase.from("subjects").select("name");

  if (error) {
    console.error("Failed to load subjects:", error);
    return [];
  }

  return data.map((s) => s.name);
}

/**
 * Returns available question counts broken down by category and chapter.
 */
export async function getQuestionCounts(level = "professional") {
  const questions = await buildQuestionSet(null, level, null);
  const counts = {
    total: questions.length,
    byCategory: {},
    byChapter: {},
  };

  questions.forEach((q) => {
    counts.byCategory[q.subjectTitle] = (counts.byCategory[q.subjectTitle] || 0) + 1;
    const chapterKey = `${q.subjectTitle}:::${q.chapter}`;
    counts.byChapter[chapterKey] = (counts.byChapter[chapterKey] || 0) + 1;
  });

  return counts;
}