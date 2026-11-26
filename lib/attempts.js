import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase.js";
import {
  classifyQuestionChapter,
  getCurriculum,
  PASS_THRESHOLD,
  WEAK_THRESHOLD,
} from "./curriculum.js";
import { recordQuestionsAnsweredToday } from "./remindersHelper.js";
import {
  getCachedAttempts,
  cacheAttemptsLocally,
  queuePendingAttempt,
  syncPendingAttempts,
} from "./offlineManager.js";

export { PASS_THRESHOLD, WEAK_THRESHOLD, syncPendingAttempts };

/**
 * Saves a completed exam attempt.
 * Offline-First: Always saves to local storage immediately so Stats, History,
 * and Review work without any network dependence. When online, inserts to Supabase.
 * If offline or connection fails, automatically queues for background cloud sync.
 */
export async function saveAttempt({
  subjectTitle = null,
  chapterTitle = null,
  level,
  mode,
  results,
  answers,
  questions,
  durationSeconds,
}) {
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {}

  if (!user) {
    try {
      const { data } = await supabase.auth.getSession();
      user = data?.session?.user || null;
    } catch {}
  }

  const userId = user?.id || "offline_user";
  const localAttemptId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const totalQuestions = results.total;

  const score =
    totalQuestions > 0
      ? Math.round((results.correct / totalQuestions) * 100)
      : 0;

  // If this was a chapter practice, compose the display title
  const effectiveSubjectTitle =
    subjectTitle && chapterTitle
      ? `${subjectTitle} › ${chapterTitle}`
      : subjectTitle ?? null;

  // Build full question review list with explanations, choices, and answers
  const reviewQuestions = (questions || []).map((q, idx) => {
    const choices = (q.choices || []).map((cText, cIdx) => ({
      id: q.choiceIds?.[cIdx] ?? `choice_${cIdx}`,
      choice_text: cText,
      is_correct: cIdx === q.correctIndex,
      position: cIdx,
    }));
    const correctChoice = choices.find((c) => c.is_correct);
    const selectedIdx = answers[q.id];
    const isAnswered = selectedIdx !== undefined;
    const selectedChoiceId =
      isAnswered && q.choiceIds?.[selectedIdx]
        ? q.choiceIds[selectedIdx]
        : null;
    const isCorrect = isAnswered && selectedIdx === q.correctIndex;
    const isSkipped = !isAnswered;

    return {
      questionNumber: idx + 1,
      id: q.id,
      questionText: q.question || q.question_text || "Question prompt unavailable",
      explanation: q.explanation || "",
      chapter:
        q.chapter ||
        classifyQuestionChapter(
          q.question || q.question_text || "",
          effectiveSubjectTitle || "General Information",
          level
        ),
      choices,
      selectedChoiceId,
      selectedChoiceIndex: isAnswered ? selectedIdx : null,
      correctChoiceId: correctChoice?.id || null,
      status: isCorrect ? "correct" : isSkipped ? "skipped" : "wrong",
    };
  });

  // 1. CREATE LOCAL ATTEMPT RECORD
  const attemptRecord = {
    id: localAttemptId,
    user_id: userId,
    subject_title: effectiveSubjectTitle,
    level,
    mode,
    score,
    correct_count: results.correct,
    wrong_count: results.wrong,
    skipped_count: results.skipped,
    total_questions: totalQuestions,
    subject_breakdown: results.subjectBreakdown,
    duration_seconds: durationSeconds ?? null,
    completed_at: new Date().toISOString(),
    is_offline: true,
  };

  // 2. SAVE LOCAL REVIEW CACHE IMMEDIATELY
  try {
    await AsyncStorage.setItem(
      `@apex_attempt_review_${attemptRecord.id}`,
      JSON.stringify({ attempt: attemptRecord, questions: reviewQuestions })
    );
  } catch (storageErr) {
    console.warn("AsyncStorage review save error:", storageErr);
  }

  // 3. CACHE ATTEMPT IN LOCAL HISTORY (DASHBOARD & STATS UPDATE IMMEDIATELY)
  await cacheAttemptsLocally([attemptRecord]);

  // 4. RECORD DAILY STUDY PROGRESS
  if (totalQuestions > 0) {
    try {
      await recordQuestionsAnsweredToday(userId, totalQuestions);
    } catch (recordErr) {
      console.warn("recordQuestionsAnsweredToday notice:", recordErr);
    }
  }

  // 5. ATTEMPT CLOUD UPLOAD IF USER IS AUTHENTICATED
  const answerRows = (questions || [])
    .filter((q) => answers[q.id] !== undefined && q.choiceIds?.[answers[q.id]])
    .map((q) => ({
      question_id: q.id,
      selected_choice_id: q.choiceIds[answers[q.id]],
    }));

  let cloudSaved = false;

  if (user?.id) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Cloud save timeout")), 3500)
      );

      const savePromise = (async () => {
        const { data: cloudAttempt, error: attemptError } = await supabase
          .from("attempts")
          .insert({
            user_id: user.id,
            subject_title: effectiveSubjectTitle,
            level,
            mode,
            score,
            correct_count: results.correct,
            wrong_count: results.wrong,
            skipped_count: results.skipped,
            total_questions: totalQuestions,
            subject_breakdown: results.subjectBreakdown,
            duration_seconds: durationSeconds ?? null,
            completed_at: attemptRecord.completed_at,
          })
          .select()
          .single();

        if (attemptError || !cloudAttempt) {
          throw attemptError || new Error("Failed to create cloud attempt");
        }

        // Insert answers to cloud
        if (answerRows.length > 0) {
          const mappedAnswers = answerRows.map((ans) => ({
            ...ans,
            attempt_id: cloudAttempt.id,
          }));
          await supabase.from("attempt_answers").insert(mappedAnswers);
        }

        return cloudAttempt;
      })();

      const cloudAttempt = await Promise.race([savePromise, timeoutPromise]);

      if (cloudAttempt?.id) {
        cloudSaved = true;
        // Update review with cloud ID
        try {
          await AsyncStorage.setItem(
            `@apex_attempt_review_${cloudAttempt.id}`,
            JSON.stringify({ attempt: cloudAttempt, questions: reviewQuestions })
          );
        } catch {}

        // Replace local placeholder with cloud attempt in cache
        attemptRecord.id = cloudAttempt.id;
        attemptRecord.is_offline = false;
        await cacheAttemptsLocally([cloudAttempt]);
      }
    } catch (cloudErr) {
      console.log("Cloud attempt sync unavailable, queued for offline sync:", cloudErr?.message);
    }
  }

  // 6. IF CLOUD SAVE FAILED OR OFFLINE, QUEUE FOR FUTURE BACKGROUND SYNC
  if (!cloudSaved) {
    await queuePendingAttempt({
      localId: localAttemptId,
      attemptData: {
        subject_title: effectiveSubjectTitle,
        level,
        mode,
        score,
        correct_count: results.correct,
        wrong_count: results.wrong,
        skipped_count: results.skipped,
        total_questions: totalQuestions,
        subject_breakdown: results.subjectBreakdown,
        duration_seconds: durationSeconds ?? null,
        completed_at: attemptRecord.completed_at,
      },
      answerRows,
    });
  }

  return attemptRecord;
}

/**
 * Retrieves full attempt history ordered newest to oldest.
 * Offline-First: Pulls from cloud when online and updates local storage;
 * seamlessly returns local cached attempts whenever offline.
 */
export async function getAttemptHistory() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Cloud fetch timeout")), 3000)
    );
    const fetchPromise = supabase
      .from("attempts")
      .select("*")
      .order("completed_at", {
        ascending: false,
      });

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (!error && Array.isArray(data)) {
      await cacheAttemptsLocally(data);
    }
  } catch (err) {
    console.log("Using cached offline attempt history:", err?.message);
  }

  // Always return local cached attempts (which merges offline attempts)
  return await getCachedAttempts();
}

/**
 * Formats total seconds into a clean human-readable practice time string.
 * e.g., 5400s -> "1.5 hrs", 7200s -> "2 hrs", 2700s -> "45 mins", 45s -> "< 1 min"
 */
export function formatPracticeTime(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return "0 min";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    if (minutes === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
    const decimalHours = (totalSeconds / 3600).toFixed(1);
    return `${decimalHours} hrs`;
  }
  if (minutes > 0) {
    return `${minutes} min${minutes === 1 ? "" : "s"}`;
  }
  return "< 1 min";
}

/**
 * Computes Dashboard Summary, Subject Performance, Chapter Mastery, and Weak Areas.
 *
 * Professional and Sub-Professional levels are kept strictly separated.
 */
export async function getDashboardSummary(selectedLevel = "professional") {
  const normLevel =
    selectedLevel === "all"
      ? "all"
      : selectedLevel === "sub"
      ? "sub"
      : "professional";
  const allAttempts = await getAttemptHistory();

  // Filter attempts for the selected exam level
  const attempts = allAttempts.filter((attempt) => {
    if (normLevel !== "all" && attempt.level && attempt.level !== normLevel) {
      return false;
    }
    return true;
  });

  const curriculumCategories = getCurriculum(normLevel === "all" ? "professional" : normLevel);

  // Initialize data structures based on curriculum
  const categoryMap = {};
  const chapterMap = {};

  curriculumCategories.forEach((cat) => {
    categoryMap[cat.title] = {
      title: cat.title,
      id: cat.id,
      icon: cat.icon,
      iconType: cat.iconType,
      color: cat.color,
      badgeColor: cat.badgeColor,
      description: cat.description,
      estimatedWeight: cat.estimatedWeight,
      estimatedWeightLabel: cat.estimatedWeightLabel,
      correct: 0,
      wrong: 0,
      total: 0,
      chapters: {},
    };

    cat.chapters.forEach((ch) => {
      categoryMap[cat.title].chapters[ch.title] = {
        title: ch.title,
        id: ch.id,
        description: ch.description,
        correct: 0,
        wrong: 0,
        total: 0,
      };

      const compositeKey = `${cat.title}:::${ch.title}`;
      chapterMap[compositeKey] = {
        categoryTitle: cat.title,
        chapterTitle: ch.title,
        correct: 0,
        wrong: 0,
        total: 0,
      };
    });
  });

  // Aggregate questions across all attempts for this level
  attempts.forEach((attempt) => {
    const breakdown = attempt.subject_breakdown || [];

    breakdown.forEach((subj) => {
      if (!subj?.title) return;

      // Find matching curriculum category
      const matchedCatTitle = Object.keys(categoryMap).find(
        (t) => t.toLowerCase() === subj.title.trim().toLowerCase()
      );

      if (!matchedCatTitle) return;

      const catObj = categoryMap[matchedCatTitle];
      catObj.correct += Number(subj.correct ?? 0);
      catObj.wrong += Number(subj.wrong ?? 0);
      catObj.total += Number(subj.total ?? 0);

      // Process chapters breakdown if present
      if (Array.isArray(subj.chapters)) {
        subj.chapters.forEach((ch) => {
          if (!ch?.title) return;

          const matchedChapTitle = Object.keys(catObj.chapters).find(
            (t) => t.toLowerCase() === ch.title.trim().toLowerCase()
          );

          if (matchedChapTitle) {
            const chObj = catObj.chapters[matchedChapTitle];
            chObj.correct += Number(ch.correct ?? 0);
            chObj.wrong += Number(ch.wrong ?? 0);
            chObj.total += Number(ch.total ?? 0);

            const compositeKey = `${matchedCatTitle}:::${matchedChapTitle}`;
            if (chapterMap[compositeKey]) {
              chapterMap[compositeKey].correct += Number(ch.correct ?? 0);
              chapterMap[compositeKey].wrong += Number(ch.wrong ?? 0);
              chapterMap[compositeKey].total += Number(ch.total ?? 0);
            }
          }
        });
      }
    });
  });

  // Calculate mastery percentages and build clean result arrays
  const subjectReadiness = curriculumCategories.map((cat) => {
    const catData = categoryMap[cat.title];
    const catPercent =
      catData.total > 0
        ? Math.round((catData.correct / catData.total) * 100)
        : null; // null represents "Not Started"

    const chapters = cat.chapters.map((ch) => {
      const chData = catData.chapters[ch.title];
      const chPercent =
        chData.total > 0
          ? Math.round((chData.correct / chData.total) * 100)
          : null; // null represents "Not Started"

      return {
        title: ch.title,
        id: ch.id,
        description: ch.description,
        percent: chPercent,
        totalAttempted: chData.total,
        totalCorrect: chData.correct,
        totalWrong: chData.wrong,
      };
    });

    return {
      title: cat.title,
      id: cat.id,
      icon: cat.icon,
      iconType: cat.iconType,
      color: cat.color,
      badgeColor: cat.badgeColor,
      description: cat.description,
      estimatedWeight: cat.estimatedWeight,
      estimatedWeightLabel: cat.estimatedWeightLabel,
      percent: catPercent,
      totalAttempted: catData.total,
      totalCorrect: catData.correct,
      totalWrong: catData.wrong,
      chapters,
    };
  });

  // Build category stats lookup dictionary
  const categoryStats = {};
  subjectReadiness.forEach((c) => {
    categoryStats[c.title] = c;
  });

  // Identify Weak Areas (chapters attempted with mastery < WEAK_THRESHOLD)
  const weakAreas = [];
  Object.values(chapterMap).forEach((ch) => {
    if (ch.total > 0) {
      const percent = Math.round((ch.correct / ch.total) * 100);
      if (percent < WEAK_THRESHOLD) {
        weakAreas.push({
          categoryTitle: ch.categoryTitle,
          chapterTitle: ch.chapterTitle,
          percent,
          totalAttempted: ch.total,
          totalCorrect: ch.correct,
          totalWrong: ch.wrong,
        });
      }
    }
  });

  // Sort weak areas lowest mastery first
  weakAreas.sort((a, b) => a.percent - b.percent);

  // General exam statistics
  // Consistent with History (stats.jsx): only timed exams count as "exams taken"
  const examAttempts = attempts.filter(
    (a) => a.mode === "timed" || (!a.mode && (Number(a.total_questions) || 0) >= 10)
  );
  const examsTaken = examAttempts.length;
  const bestScore =
    examsTaken > 0
      ? Math.max(...examAttempts.map((a) => a.score ?? 0))
      : 0;
  const lastScore = examAttempts[0]?.score ?? 0;
  const avgScore =
    examsTaken > 0
      ? Math.round(
          examAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / examsTaken
        )
      : 0;

  // Cumulative Practice Time (in seconds) across all attempts
  const totalPracticeSeconds = attempts.reduce((sum, a) => {
    const sec = Number(a.duration_seconds);
    if (sec && sec > 0) return sum + sec;
    // Realistic fallback for untimed or older sessions: ~45s per attempted question
    return sum + (Number(a.total_questions) || 10) * 45;
  }, 0);

  const practiceTime = formatPracticeTime(totalPracticeSeconds);

  // Calculate True Weighted Curriculum Readiness:
  // Each category contributes according to its official exam weight (e.g. Analytical 35%, Numerical 30%, etc.).
  // Categories not yet practiced (percent === null) contribute 0% until attempted.
  let weightedReadiness = 0;
  subjectReadiness.forEach((cat) => {
    const weight = Number(cat.estimatedWeight || 0);
    const scorePercent = cat.percent !== null ? Number(cat.percent || 0) : 0;
    weightedReadiness += scorePercent * weight;
  });

  const examReadiness = Math.min(100, Math.round(weightedReadiness));

  // Full Mock Exam Statistics (Strictly Full Mock Exams, e.g. 50/170 for professional, 50/165 for sub)
  const targetTotal = normLevel === "sub" ? 165 : 170;

  // Filter ONLY full mock exams:
  // - No subject_title, empty string, or explicitly "Full Mock Exam"
  // - Or subject_title containing "mock"
  // - Or total_questions >= 100
  const isFullMock = (a) => {
    if (!a) return false;
    const title = (a.subject_title || "").trim().toLowerCase();
    if (!title || title === "full mock exam" || title.includes("mock")) {
      return true;
    }
    if (a.total_questions && a.total_questions >= 100) {
      return true;
    }
    return false;
  };

  const fullMockAttempts = examAttempts.filter(isFullMock);
  const mockExamsTaken = fullMockAttempts.length;

  // Chronologically sort full mock exams newest -> oldest
  const sortedFullMocks = [...fullMockAttempts].sort((a, b) => {
    const timeA = new Date(a.completed_at || a.created_at || 0).getTime();
    const timeB = new Date(b.completed_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  let bestMockScore = `0/${targetTotal}`;
  let bestMockCorrect = 0;
  let bestMockTotal = targetTotal;
  let lastMockScore = 0;
  let mockGrowth = null;
  let mockGrowthRecent = null;

  if (sortedFullMocks.length > 0) {
    const topMock = [...sortedFullMocks].sort(
      (a, b) =>
        (b.correct_count ?? 0) - (a.correct_count ?? 0) ||
        (b.score ?? 0) - (a.score ?? 0)
    )[0];
    bestMockCorrect = topMock.correct_count ?? 0;
    bestMockTotal = topMock.total_questions ?? targetTotal;
    bestMockScore = `${bestMockCorrect}/${bestMockTotal}`;
    lastMockScore = sortedFullMocks[0]?.score ?? 0;

    // Full Mock Exam Growth (Strictly Full Mock Exams Only)
    // Measures cumulative score improvement from initial baseline full mock to latest full mock
    if (sortedFullMocks.length > 1) {
      const latestMock = sortedFullMocks[0];
      const initialMock = sortedFullMocks[sortedFullMocks.length - 1];
      const previousMock = sortedFullMocks[1];

      const getMockPercent = (m) => {
        if (typeof m.score === "number") return m.score;
        const correct = Number(m.correct_count) || 0;
        const total = Number(m.total_questions) || targetTotal;
        return total > 0 ? Math.round((correct / total) * 100) : 0;
      };

      mockGrowth = getMockPercent(latestMock) - getMockPercent(initialMock);
      mockGrowthRecent = getMockPercent(latestMock) - getMockPercent(previousMock);
    }
  }

  return {
    examsTaken,
    mockExamsTaken,
    bestScore,
    bestMockScore,
    bestMockCorrect,
    bestMockTotal,
    lastScore,
    lastMockScore,
    mockGrowth,
    mockGrowthRecent,
    avgScore,
    totalPracticeSeconds,
    practiceTime,
    examReadiness,
    subjectReadiness,
    categoryStats,
    weakAreas,
  };
}

/**
 * Counts consecutive days with at least one completed attempt.
 */
export async function getStudyStreak() {
  const attempts = await getAttemptHistory();

  if (attempts.length === 0) {
    return 0;
  }

  const studyDates = Array.from(
    new Set(
      attempts.map((attempt) =>
        new Date(attempt.completed_at).toDateString()
      )
    )
  )
    .map((date) => new Date(date))
    .sort((a, b) => b - a);

  const oneDay = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysSinceLast = Math.round((today - studyDates[0]) / oneDay);

  if (daysSinceLast > 1) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < studyDates.length - 1; i++) {
    const diff = Math.round((studyDates[i] - studyDates[i + 1]) / oneDay);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Resets all exam progress and history for the current authenticated user.
 * Safely deletes linked rows in attempt_answers and attempts.
 * Returns true upon successful reset.
 */
export async function resetUserProgress() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  // 1. Try deleting attempts directly. If PostgreSQL has ON DELETE CASCADE on attempt_answers,
  // this cleans up both tables in a single operation without requiring client DELETE on attempt_answers.
  let { error: attemptsError } = await supabase
    .from("attempts")
    .delete()
    .eq("user_id", user.id);

  // 2. If blocked by a foreign key constraint (code 23503), manually delete attempt_answers first
  if (attemptsError && attemptsError.code === "23503") {
    const { data: userAttempts } = await supabase
      .from("attempts")
      .select("id")
      .eq("user_id", user.id);

    const attemptIds = (userAttempts || []).map((a) => a.id);
    if (attemptIds.length > 0) {
      const { error: answersError } = await supabase
        .from("attempt_answers")
        .delete()
        .in("attempt_id", attemptIds);

      if (answersError) {
        console.error("Failed to delete attempt answers:", answersError);
        throw answersError;
      }

      const retryRes = await supabase
        .from("attempts")
        .delete()
        .eq("user_id", user.id);
      attemptsError = retryRes.error;
    }
  }

  if (attemptsError) {
    console.error("Failed to delete attempts:", attemptsError);
    throw attemptsError;
  }

  // Clear local offline attempt cache as well
  try {
    await AsyncStorage.removeItem("@apex_offline_attempts_cache_v1");
    await AsyncStorage.removeItem("@apex_offline_pending_sync_queue_v1");
  } catch (clearErr) {
    console.warn("AsyncStorage cache clear notice:", clearErr);
  }

  return true;
}

/**
 * Retrieves detailed question-by-question review data for a specific attempt.
 * Checks local device cache first, then falls back to Supabase attempt_answers.
 */
export async function getAttemptReviewDetails(attemptId) {
  if (!attemptId) {
    throw new Error("Attempt ID is required");
  }

  // 1. Check local device cache first (instant & 100% reliable)
  try {
    const cached = await AsyncStorage.getItem(`@apex_attempt_review_${attemptId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (
        parsed?.attempt &&
        Array.isArray(parsed?.questions) &&
        parsed.questions.length > 0
      ) {
        return parsed;
      }
    }
  } catch (cacheErr) {
    console.warn("AsyncStorage review read notice:", cacheErr);
  }

  // 2. Fetch attempt record from Supabase
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) {
    console.error("Failed to load attempt details:", attemptError);
    throw attemptError || new Error("Attempt not found");
  }

  // 3. Fetch answer rows (NOTE: questions table does NOT have a 'chapter' column)
  let questions = [];
  const { data: answerRows, error: answersError } = await supabase
    .from("attempt_answers")
    .select(`
      question_id,
      selected_choice_id,
      questions (
        id,
        question_text,
        explanation,
        choices ( id, choice_text, is_correct, position )
      )
    `)
    .eq("attempt_id", attemptId);

  if (
    !answersError &&
    Array.isArray(answerRows) &&
    answerRows.length > 0 &&
    answerRows[0].questions
  ) {
    questions = answerRows.map((row, idx) => {
      const q = row.questions || {};
      const choices = [...(q.choices || [])].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
      const correctChoice = choices.find((c) => Boolean(c.is_correct));
      const isCorrect =
        row.selected_choice_id &&
        correctChoice &&
        row.selected_choice_id === correctChoice.id;
      const isSkipped = !row.selected_choice_id;

      return {
        questionNumber: idx + 1,
        id: q.id || row.question_id,
        questionText: q.question_text || "Question prompt unavailable",
        explanation: q.explanation || "",
        chapter: classifyQuestionChapter(
          q.question_text || "",
          attempt.subject_title || "General Information",
          attempt.level || "professional"
        ),
        choices,
        selectedChoiceId: row.selected_choice_id,
        correctChoiceId: correctChoice?.id || null,
        status: isCorrect ? "correct" : isSkipped ? "skipped" : "wrong",
      };
    });
  } else {
    // Fallback: fetch attempt_answers then query questions separately (WITHOUT 'chapter' column)
    const { data: rawAnswers, error: rawAnswersError } = await supabase
      .from("attempt_answers")
      .select("question_id, selected_choice_id")
      .eq("attempt_id", attemptId);

    if (rawAnswersError) {
      console.warn("Could not load attempt_answers from database:", rawAnswersError);
    }

    if (rawAnswers && rawAnswers.length > 0) {
      const qIds = rawAnswers.map((r) => r.question_id);
      const { data: qData, error: qError } = await supabase
        .from("questions")
        .select(`
          id,
          question_text,
          explanation,
          choices ( id, choice_text, is_correct, position )
        `)
        .in("id", qIds);

      if (qError) {
        console.warn("Could not load questions for review:", qError);
      }

      const qMap = {};
      (qData || []).forEach((q) => {
        qMap[q.id] = q;
      });

      questions = rawAnswers.map((row, idx) => {
        const q = qMap[row.question_id] || {};
        const choices = [...(q.choices || [])].sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0)
        );
        const correctChoice = choices.find((c) => Boolean(c.is_correct));
        const isCorrect =
          row.selected_choice_id &&
          correctChoice &&
          row.selected_choice_id === correctChoice.id;
        const isSkipped = !row.selected_choice_id;

        return {
          questionNumber: idx + 1,
          id: q.id || row.question_id,
          questionText: q.question_text || "Question prompt unavailable",
          explanation: q.explanation || "",
          chapter: classifyQuestionChapter(
            q.question_text || "",
            attempt.subject_title || "General Information",
            attempt.level || "professional"
          ),
          choices,
          selectedChoiceId: row.selected_choice_id,
          correctChoiceId: correctChoice?.id || null,
          status: isCorrect ? "correct" : isSkipped ? "skipped" : "wrong",
        };
      });
    }
  }

  // Cache to AsyncStorage if questions were retrieved from Supabase
  if (questions.length > 0) {
    try {
      await AsyncStorage.setItem(
        `@apex_attempt_review_${attemptId}`,
        JSON.stringify({ attempt, questions })
      );
    } catch {}
  }

  return {
    attempt,
    questions,
  };
}