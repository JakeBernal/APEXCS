import { supabase } from "./supabase";
import { classifyQuestionChapter, getCurriculum, EXAM_LEVELS } from "./curriculum";

/**
 * Builds a validated question set filtered by Level, Category, and optionally Chapter.
 *
 * @param {string|null} subjectTitle - e.g. "Analytical Ability", "Verbal Ability" (or null for full exam)
 * @param {string|null} level - "professional" | "sub"
 * @param {string|null} chapterTitle - e.g. "Word Analogy", "Data Interpretation" (or null for whole category)
 * @param {Object} [options={}] - { limit, unlimited, shuffle }
 */
export async function buildQuestionSet(
  subjectTitle = null,
  level = null,
  chapterTitle = null,
  options = {}
) {
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
  let filteredQuestions = cleanQuestions;
  if (chapterTitle && chapterTitle.trim() !== "") {
    const targetChapter = chapterTitle.trim().toLowerCase();
    const chapterFiltered = cleanQuestions.filter(
      (q) => q.chapter.toLowerCase() === targetChapter
    );

    // If chapter has specific questions, return them; otherwise return all in category as fallback
    if (chapterFiltered.length > 0) {
      filteredQuestions = chapterFiltered;
    }
  }

  // If caller specifically requested unlimited questions (e.g. getQuestionCounts)
  if (options.unlimited) {
    return filteredQuestions;
  }

  // Determine target limit
  let limit = options.limit;
  const isFullExam = !subjectTitle && !chapterTitle;

  if (!limit && isFullExam) {
    // 2026 Civil Service Exam official item limits:
    // Professional: 170 items | Sub-Professional: 165 items
    const examConfig = EXAM_LEVELS[normLevel] || EXAM_LEVELS.professional;
    limit = examConfig?.totalItems || (normLevel === "sub" ? 165 : 170);
  } else if (!limit && (chapterTitle || subjectTitle)) {
    // Sub-category (chapter) and Category practice exams: Max 50 questions
    limit = 50;
  }

  // If a limit is set and available questions exceed limit
  if (limit && filteredQuestions.length > limit) {
    if (isFullExam) {
      // Stratified sampling across categories based on estimated CSC curriculum weights
      return sampleExamQuestions(filteredQuestions, normLevel, limit);
    }
    // Single category or chapter practice: shuffle and slice
    return shuffleArray(filteredQuestions).slice(0, limit);
  }

  // Default shuffle so questions don't appear in rigid database insertion order
  return options.shuffle !== false ? shuffleArray(filteredQuestions) : filteredQuestions;
}

/**
 * Modern Fisher-Yates shuffle helper.
 */
export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Samples questions proportionally across curriculum categories to match target exam limits.
 *
 * For example:
 * - Professional Mock Exam: Target 170 items (~35% Analytical, ~30% Numerical, ~30% Verbal, ~5% Gen Info).
 * - Sub-Professional Mock Exam: Target 165 items (~20% Clerical, ~30% Numerical, ~30% Verbal, ~20% Gen Info).
 *
 * If a category has fewer questions in DB than its quota, it uses all available in that category
 * and backfills remaining slots from the remaining pool, ensuring the exact target count is satisfied.
 */
function sampleExamQuestions(questions, level = "professional", targetLimit = 170) {
  if (!questions || questions.length <= targetLimit) {
    return shuffleArray(questions || []);
  }

  const normLevel = level === "sub" ? "sub" : "professional";
  const curriculumCats = getCurriculum(normLevel);

  // Group questions by category
  const poolByCat = {};
  curriculumCats.forEach((c) => {
    poolByCat[c.title.toLowerCase()] = [];
  });
  const unclassifiedPool = [];

  questions.forEach((q) => {
    const key = (q.subjectTitle || "").trim().toLowerCase();
    const matchedKey = Object.keys(poolByCat).find(
      (k) => k === key || key.includes(k) || k.includes(key)
    );
    if (matchedKey) {
      poolByCat[matchedKey].push(q);
    } else {
      unclassifiedPool.push(q);
    }
  });

  const selectedQuestions = [];
  const remainingQuestions = [...unclassifiedPool];

  // For each category, sample according to its estimated weight
  curriculumCats.forEach((cat) => {
    const catKey = cat.title.toLowerCase();
    const catPool = shuffleArray(poolByCat[catKey] || []);
    const weight = cat.estimatedWeight || 1 / curriculumCats.length;
    const catQuota = Math.round(targetLimit * weight);

    const picked = catPool.slice(0, catQuota);
    const leftOver = catPool.slice(catQuota);

    selectedQuestions.push(...picked);
    remainingQuestions.push(...leftOver);
  });

  // If selected is still short of targetLimit (e.g. due to rounding or small pool in one category),
  // backfill from the shuffled remaining questions
  if (selectedQuestions.length < targetLimit && remainingQuestions.length > 0) {
    const deficit = targetLimit - selectedQuestions.length;
    const shuffledRemaining = shuffleArray(remainingQuestions);
    selectedQuestions.push(...shuffledRemaining.slice(0, deficit));
  }

  // If due to rounding we slightly exceeded targetLimit, trim to targetLimit
  const finalSet =
    selectedQuestions.length > targetLimit
      ? selectedQuestions.slice(0, targetLimit)
      : selectedQuestions;

  // Final shuffle so questions from different categories are mixed together naturally
  return shuffleArray(finalSet);
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
  const questions = await buildQuestionSet(null, level, null, {
    unlimited: true,
    shuffle: false,
  });
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