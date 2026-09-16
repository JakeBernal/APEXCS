import { supabase } from "./supabase";
import { getCurriculum, PASS_THRESHOLD, WEAK_THRESHOLD } from "./curriculum";

export { PASS_THRESHOLD, WEAK_THRESHOLD };

/**
 * Saves a completed exam attempt to Supabase.
 * Supports full mock exams, category-wide practice, and chapter-specific practice.
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

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

  const { data: attempt, error: attemptError } = await supabase
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
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (attemptError) {
    console.error("Failed to save attempt:", attemptError);
    throw attemptError;
  }

  const answerRows = questions
    .filter((q) => answers[q.id] !== undefined)
    .map((q) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      selected_choice_id: q.choiceIds?.[answers[q.id]] ?? null,
    }));

  if (answerRows.length > 0) {
    const { error: answersError } = await supabase
      .from("attempt_answers")
      .insert(answerRows);

    if (answersError) {
      console.error("Failed to save attempt answers:", answersError);
    }
  }

  return attempt;
}

/**
 * Retrieves full attempt history ordered newest to oldest.
 */
export async function getAttemptHistory() {
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .order("completed_at", {
      ascending: false,
    });

  if (error) {
    console.error("Failed to load attempt history:", error);
    return [];
  }

  return data;
}

/**
 * Computes Dashboard Summary, Subject Performance, Chapter Mastery, and Weak Areas.
 *
 * Professional and Sub-Professional levels are kept strictly separated.
 */
export async function getDashboardSummary(selectedLevel = "professional") {
  const normLevel = selectedLevel === "sub" ? "sub" : "professional";
  const allAttempts = await getAttemptHistory();

  // Filter attempts for the selected exam level
  const attempts = allAttempts.filter(
    (attempt) => attempt.level === normLevel
  );

  const curriculumCategories = getCurriculum(normLevel);

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
  const examsTaken = attempts.length;
  const bestScore =
    examsTaken > 0
      ? Math.max(...attempts.map((a) => a.score ?? 0))
      : 0;
  const lastScore = attempts[0]?.score ?? 0;
  const avgScore =
    examsTaken > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / examsTaken
        )
      : 0;

  const examReadiness = avgScore;

  return {
    examsTaken,
    bestScore,
    lastScore,
    avgScore,
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