import { supabase } from "./supabase.js";
import { classifyQuestionChapter, getCurriculum, EXAM_LEVELS } from "./curriculum.js";
import { getOfflineQuestions, cacheQuestionsLocally } from "./offlineManager.js";

/**
 * Builds a validated question set filtered by Level, Category, and optionally Chapter.
 * Fully offline-first: queries cloud when available, seamlessly falls back to local
 * offline cache and built-in CSC seed question bank when disconnected.
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

  let cleanQuestions = [];
  let fetchedFromCloud = false;

  // 1. ATTEMPT CLOUD FETCH (WITH 3.5s FAST TIMEOUT)
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase request timeout")), 3500)
    );

    const fetchPromise = (async () => {
      let targetSubjectId = null;
      if (subjectTitle) {
        const { data: subject } = await supabase
          .from("subjects")
          .select("id, name")
          .ilike("name", subjectTitle.trim())
          .maybeSingle();

        if (subject) targetSubjectId = subject.id;
      }

      let query = createQuery(selectWithChapter);
      if (targetSubjectId) {
        query = query.eq("subject_id", targetSubjectId);
      }

      let { data, error } = await query;

      if (
        error &&
        (error.message?.includes("chapter") ||
          error.code === "42703" ||
          error.code === "PGRST204")
      ) {
        let fallbackQuery = createQuery(selectWithoutChapter);
        if (targetSubjectId) fallbackQuery = fallbackQuery.eq("subject_id", targetSubjectId);
        const fallbackRes = await fallbackQuery;
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) throw error;
      return data || [];
    })();

    const data = await Promise.race([fetchPromise, timeoutPromise]);

    if (Array.isArray(data) && data.length > 0) {
      const mapped = data
        .filter((q) => {
          const choices = q.choices || [];
          return (
            Boolean(q.question_text?.trim()) &&
            choices.length >= 2 &&
            choices.some((c) => Boolean(c?.is_correct))
          );
        })
        .map((q) => {
          const orderedChoices = [...(q.choices || [])].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0)
          );
          const correctIndex = orderedChoices.findIndex((c) => c.is_correct);
          const resolvedCategory = q.subjects?.name ?? subjectTitle ?? "General Information";
          const resolvedChapter =
            q.chapter && q.chapter.trim() !== ""
              ? q.chapter.trim()
              : classifyQuestionChapter(
                  q.question_text,
                  resolvedCategory,
                  normLevel || "professional"
                );

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

      if (mapped.length > 0) {
        cleanQuestions = mapped.filter((q) => {
          const catLower = q.subjectTitle.toLowerCase();
          if (normLevel === "sub" && catLower.includes("analytical")) return false;
          if (normLevel === "professional" && catLower.includes("clerical")) return false;
          return true;
        });

        fetchedFromCloud = true;
        // Asynchronously update local offline cache in background
        cacheQuestionsLocally(cleanQuestions).catch(() => {});
      }
    }
  } catch (cloudErr) {
    console.log("Cloud question query unavailable or timed out, loading from offline storage:", cloudErr?.message);
  }

  // 2. OFFLINE FALLBACK: LOAD FROM LOCAL CACHE + BUILT-IN SEED BANK
  if (!fetchedFromCloud || cleanQuestions.length === 0) {
    const offlinePool = await getOfflineQuestions(normLevel);
    cleanQuestions = offlinePool;

    // Filter by subjectTitle if specified
    if (subjectTitle && subjectTitle.trim() !== "") {
      const targetSubj = subjectTitle.trim().toLowerCase();
      cleanQuestions = cleanQuestions.filter((q) => {
        const cat = (q.subjectTitle || "").trim().toLowerCase();
        return cat === targetSubj || cat.includes(targetSubj) || targetSubj.includes(cat);
      });
    }

    // Filter out cross-level pollution
    cleanQuestions = cleanQuestions.filter((q) => {
      const catLower = (q.subjectTitle || "").toLowerCase();
      if (normLevel === "sub" && catLower.includes("analytical")) return false;
      if (normLevel === "professional" && catLower.includes("clerical")) return false;
      return true;
    });
  }

  // 3. CHAPTER FILTERING
  let filteredQuestions = cleanQuestions;
  if (chapterTitle && chapterTitle.trim() !== "") {
    const targetChapter = chapterTitle.trim().toLowerCase();
    const chapterFiltered = cleanQuestions.filter(
      (q) => (q.chapter || "").toLowerCase() === targetChapter
    );

    // If chapter has specific questions, return them; otherwise return all in category as fallback
    if (chapterFiltered.length > 0) {
      filteredQuestions = chapterFiltered;
    }
  }

  // 4. UNLIMITED COUNT REQUEST (e.g. for getQuestionCounts)
  if (options.unlimited) {
    return filteredQuestions;
  }

  // 5. DETERMINE TARGET ITEM LIMIT
  let limit = options.limit;
  const isFullExam = !subjectTitle && !chapterTitle;

  if (!limit && isFullExam) {
    // 2026 Civil Service Exam official item limits:
    // Professional: 170 items | Sub-Professional: 165 items
    const examConfig = EXAM_LEVELS[normLevel] || EXAM_LEVELS.professional;
    limit = examConfig?.totalItems || (normLevel === "sub" ? 165 : 170);
  } else if (!limit && chapterTitle) {
    // Sub-category (chapter/topic) practice: Max 30 questions
    limit = 30;
  } else if (!limit && subjectTitle) {
    // Category (major subject) practice: Max 50 questions
    limit = 50;
  }

  // 6. SAMPLING & SHUFFLE
  const isDeterministic = Boolean(options.roomCode || options.seed !== undefined);
  const roomSeed = isDeterministic ? getRoomSeed(options.roomCode || options.seed) : null;
  const rng = isDeterministic ? createSeededRandom(roomSeed) : null;

  // Stably sort candidates by ID before seeded shuffling to guarantee 100% deterministic results across devices
  if (isDeterministic && Array.isArray(filteredQuestions)) {
    filteredQuestions = [...filteredQuestions].sort((a, b) =>
      String(a.id || "").localeCompare(String(b.id || ""))
    );
  }

  if (limit && filteredQuestions.length > limit) {
    if (isFullExam) {
      return sampleExamQuestions(filteredQuestions, normLevel, limit, rng);
    }
    const shuffled = rng ? seededShuffleArray(filteredQuestions, rng) : shuffleArray(filteredQuestions);
    return shuffled.slice(0, limit);
  }

  if (options.shuffle !== false) {
    return rng ? seededShuffleArray(filteredQuestions, rng) : shuffleArray(filteredQuestions);
  }

  return filteredQuestions;
}

/**
 * Hashes a room code string into a deterministic 32-bit positive integer seed.
 */
export function getRoomSeed(roomCode) {
  const str = String(roomCode || "APX-408").trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Fast, high-quality 32-bit PRNG (Mulberry32).
 */
export function createSeededRandom(seed) {
  let s = (seed || 1) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t >>> 0) / 4294967296);
  };
}

/**
 * Deterministic Fisher-Yates shuffle using a seeded PRNG.
 */
export function seededShuffleArray(arr, rng) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Retrieves a standardized set of questions matching an exact array of IDs.
 * Used for Group Examinations to guarantee 100% question consistency.
 * Preserves the exact ordering of the questionIds array.
 */
export async function buildQuestionSetByIds(questionIds = []) {
  let ids = questionIds;
  if (typeof ids === "string") {
    try {
      ids = JSON.parse(ids);
    } catch {
      ids = [];
    }
  }
  if (!Array.isArray(ids) || ids.length === 0) return [];

  // 1. Gather all available questions from offline cache + seed bank
  const offlinePool = await getOfflineQuestions(null);
  const questionMap = new Map();
  offlinePool.forEach((q) => questionMap.set(q.id, q));

  // 2. Try fetching missing ones from Supabase if online
  const missingIds = ids.filter((id) => !questionMap.has(id));
  if (missingIds.length > 0) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 2500)
      );
      const queryPromise = supabase
        .from("questions")
        .select(`
          id, question_text, explanation, subject_id, level, chapter,
          subjects ( id, name ),
          choices ( id, choice_text, is_correct, position )
        `)
        .in("id", missingIds);

      const { data } = await Promise.race([queryPromise, timeoutPromise]);
      if (Array.isArray(data)) {
        data.forEach((q) => {
          const orderedChoices = [...(q.choices || [])].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0)
          );
          questionMap.set(q.id, {
            id: q.id,
            question: q.question_text,
            choices: orderedChoices.map((c) => c.choice_text),
            choiceIds: orderedChoices.map((c) => c.id),
            correctIndex: orderedChoices.findIndex((c) => c.is_correct),
            explanation: q.explanation || "",
            subjectTitle: q.subjects?.name || "General Information",
            chapter: q.chapter || "General",
            level: q.level || "professional",
          });
        });
      }
    } catch {}
  }

  // 3. Return mapped questions preserving the exact input ID order
  const mapped = ids
    .map((id) => questionMap.get(id))
    .filter(Boolean);

  // If all requested questions were found, return them
  if (mapped.length === ids.length) {
    return mapped;
  }

  // If any IDs were missing, backfill deterministically from offlinePool so examinees always get the required number of questions
  if (mapped.length < ids.length) {
    const existingIds = new Set(mapped.map((q) => q.id));
    for (const q of offlinePool) {
      if (!existingIds.has(q.id)) {
        mapped.push(q);
        existingIds.add(q.id);
        if (mapped.length >= ids.length) break;
      }
    }
  }

  return mapped;
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
 */
function sampleExamQuestions(questions, level = "professional", targetLimit = 170, rng = null) {
  const doShuffle = (arr) => (rng ? seededShuffleArray(arr, rng) : shuffleArray(arr));

  if (!questions || questions.length <= targetLimit) {
    return doShuffle(questions || []);
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
    const rawCatPool = poolByCat[catKey] || [];
    // If deterministic, stably sort pool by ID first
    const stableCatPool = rng
      ? [...rawCatPool].sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")))
      : rawCatPool;
    const catPool = doShuffle(stableCatPool);
    const weight = cat.estimatedWeight || 1 / curriculumCats.length;
    const catQuota = Math.round(targetLimit * weight);

    const picked = catPool.slice(0, catQuota);
    const leftOver = catPool.slice(catQuota);

    selectedQuestions.push(...picked);
    remainingQuestions.push(...leftOver);
  });

  // If selected is still short of targetLimit, backfill from remaining
  if (selectedQuestions.length < targetLimit && remainingQuestions.length > 0) {
    const deficit = targetLimit - selectedQuestions.length;
    const stableRemaining = rng
      ? [...remainingQuestions].sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")))
      : remainingQuestions;
    const shuffledRemaining = doShuffle(stableRemaining);
    selectedQuestions.push(...shuffledRemaining.slice(0, deficit));
  }

  const finalSet =
    selectedQuestions.length > targetLimit
      ? selectedQuestions.slice(0, targetLimit)
      : selectedQuestions;

  return doShuffle(finalSet);
}

/**
 * Returns the list of available subjects from the database or offline curriculum.
 */
export async function getAvailableSubjects() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 2000)
    );
    const fetchPromise = supabase.from("subjects").select("name");
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((s) => s.name);
    }
  } catch {
    // Offline fallback
  }

  const prof = getCurriculum("professional").map((c) => c.title);
  const sub = getCurriculum("sub").map((c) => c.title);
  return Array.from(new Set([...prof, ...sub]));
}

/**
 * Returns available question counts broken down by category and chapter.
 * Fully offline-first.
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
