import { supabase } from "./supabase";

export const PASS_THRESHOLD = 80;

// Call this once an exam is finished (timed/review modes — flashcards
// aren't graded, so nothing gets saved for those).
export async function saveAttempt({
  subjectTitle,
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

  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .insert({
      user_id: user.id,
      subject_title: subjectTitle,
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
    console.error(
      "Failed to save attempt:",
      attemptError
    );

    throw attemptError;
  }

  const answerRows = questions
    .filter((q) => answers[q.id] !== undefined)
    .map((q) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      selected_choice_id:
        q.choiceIds?.[answers[q.id]] ?? null,
    }));

  if (answerRows.length > 0) {
    const { error: answersError } = await supabase
      .from("attempt_answers")
      .insert(answerRows);

    if (answersError) {
      // Non-fatal: the attempt itself already saved,
      // just log the error.
      console.error(
        "Failed to save attempt answers:",
        answersError
      );
    }
  }

  return attempt;
}

// ============================================================
// FULL ATTEMPT HISTORY
// ============================================================
//
// Most recent attempts first.
//
// Used by:
// - History screen
// - Dashboard
// - Stats
//
// ============================================================

export async function getAttemptHistory() {
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .order("completed_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Failed to load attempt history:",
      error
    );

    return [];
  }

  return data;
}

// ============================================================
// DASHBOARD SUMMARY
// ============================================================
//
// IMPORTANT:
//
// The Dashboard has two exam levels:
//
// Professional
// - General Information
// - Verbal Ability
// - Analytical Ability
// - Numerical Ability
//
// Sub-Professional
// - General Information
// - Verbal Ability
// - Clerical Ability
// - Numerical Ability
//
// We MUST filter attempts by level before calculating
// statistics. Otherwise Professional and Sub-Professional
// attempts will be mixed together.
//
// ============================================================

export async function getDashboardSummary(
  selectedLevel = null
) {
  // Get all attempts first.
  const allAttempts = await getAttemptHistory();

  // ----------------------------------------------------------
  // FILTER BY EXAM LEVEL
  // ----------------------------------------------------------
  //
  // If Dashboard selectedLevel is:
  //
  // "professional"
  // -> only Professional attempts
  //
  // "sub"
  // -> only Sub-Professional attempts
  //
  // If no level is provided, use all attempts.
  //
  const attempts = selectedLevel
    ? allAttempts.filter(
        (attempt) => attempt.level === selectedLevel
      )
    : allAttempts;

  // ----------------------------------------------------------
  // NO ATTEMPTS
  // ----------------------------------------------------------

  if (attempts.length === 0) {
    return {
      examsTaken: 0,
      bestScore: 0,
      lastScore: 0,
      avgScore: 0,
      examReadiness: 0,
      subjectReadiness: [],
    };
  }

  // ----------------------------------------------------------
  // GENERAL EXAM STATISTICS
  // ----------------------------------------------------------

  const examsTaken = attempts.length;

  const bestScore = Math.max(
    ...attempts.map(
      (attempt) => attempt.score ?? 0
    )
  );

  const lastScore =
    attempts[0]?.score ?? 0;

  const avgScore = Math.round(
    attempts.reduce(
      (sum, attempt) =>
        sum + (attempt.score ?? 0),
      0
    ) / examsTaken
  );

  // ----------------------------------------------------------
  // EXAM READINESS
  // ----------------------------------------------------------
  //
  // Currently uses the average score of the selected
  // exam level.
  //
  // Professional Dashboard:
  // -> Professional attempts only
  //
  // Sub-Professional Dashboard:
  // -> Sub-Professional attempts only
  //
  const examReadiness = avgScore;

  // ----------------------------------------------------------
  // SUBJECT READINESS
  // ----------------------------------------------------------
  //
  // Aggregate subject performance ONLY from the filtered
  // attempts.
  //
  // This prevents:
  //
  // Professional:
  // Analytical Ability
  //
  // from appearing inside:
  //
  // Sub-Professional:
  // Clerical Ability
  //
  // ----------------------------------------------------------

  const subjectTotals = {};

  attempts.forEach((attempt) => {
    const breakdown =
      attempt.subject_breakdown || [];

    breakdown.forEach((subject) => {
      if (!subject?.title) return;

      if (!subjectTotals[subject.title]) {
        subjectTotals[subject.title] = {
          correct: 0,
          total: 0,
        };
      }

      subjectTotals[subject.title].correct +=
        Number(subject.correct ?? 0);

      subjectTotals[subject.title].total +=
        Number(subject.total ?? 0);
    });
  });

  const subjectReadiness = Object.entries(
    subjectTotals
  ).map(
    ([title, { correct, total }]) => ({
      title,

      percent:
        total > 0
          ? Math.round(
              (correct / total) * 100
            )
          : 0,
    })
  );

  return {
    examsTaken,
    bestScore,
    lastScore,
    avgScore,
    examReadiness,
    subjectReadiness,
  };
}

// ============================================================
// STUDY STREAK
// ============================================================
//
// Counts consecutive days ending today or yesterday
// with at least one completed attempt.
//
// Returns 0 if the latest attempt is older than yesterday.
// ============================================================

export async function getStudyStreak() {
  const attempts =
    await getAttemptHistory();

  if (attempts.length === 0) {
    return 0;
  }

  const studyDates = Array.from(
    new Set(
      attempts.map((attempt) =>
        new Date(
          attempt.completed_at
        ).toDateString()
      )
    )
  )
    .map((date) => new Date(date))
    .sort((a, b) => b - a);

  const oneDay =
    24 * 60 * 60 * 1000;

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const daysSinceLast = Math.round(
    (today - studyDates[0]) /
      oneDay
  );

  // Streak is no longer active if there
  // has been more than one full day without studying.
  if (daysSinceLast > 1) {
    return 0;
  }

  let streak = 1;

  for (
    let i = 0;
    i < studyDates.length - 1;
    i++
  ) {
    const diff = Math.round(
      (studyDates[i] -
        studyDates[i + 1]) /
        oneDay
    );

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}