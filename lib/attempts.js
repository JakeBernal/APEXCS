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
      // Non-fatal: the attempt itself already saved, just log it
      console.error("Failed to save attempt answers:", answersError);
    }
  }

  return attempt;
}

// Full history, most recent first. Used by the History/Stats screen.
export async function getAttemptHistory() {
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("Failed to load attempt history:", error);
    return [];
  }

  return data;
}

// Aggregate summary used by the Dashboard screen.
export async function getDashboardSummary() {
  const attempts = await getAttemptHistory();

  if (attempts.length === 0) {
    return {
      examsTaken: 0,
      bestScore: 0,
      lastScore: 0,
      avgScore: 0,
      subjectReadiness: [],
    };
  }

  const examsTaken = attempts.length;
  const bestScore = Math.max(...attempts.map((a) => a.score ?? 0));
  const lastScore = attempts[0].score ?? 0;
  const avgScore = Math.round(
    attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / examsTaken
  );

  // Aggregate per-subject correct/total across every attempt's breakdown,
  // so Dashboard can show real per-subject readiness bars.
  const subjectTotals = {};
  attempts.forEach((a) => {
    (a.subject_breakdown || []).forEach((s) => {
      if (!subjectTotals[s.title]) {
        subjectTotals[s.title] = { correct: 0, total: 0 };
      }
      subjectTotals[s.title].correct += s.correct;
      subjectTotals[s.title].total += s.total;
    });
  });

  const subjectReadiness = Object.entries(subjectTotals).map(
    ([title, { correct, total }]) => ({
      title,
      percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    })
  );

  return { examsTaken, bestScore, lastScore, avgScore, subjectReadiness };
}

// Counts consecutive days (ending today or yesterday) with at least one
// attempt. Returns 0 if the most recent attempt is older than yesterday,
// since a "streak" shouldn't still claim to be active after a gap.
export async function getStudyStreak() {
  const attempts = await getAttemptHistory();
  if (attempts.length === 0) return 0;

  const studyDates = Array.from(
    new Set(attempts.map((a) => new Date(a.completed_at).toDateString()))
  )
    .map((d) => new Date(d))
    .sort((a, b) => b - a); // newest first

  const oneDay = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysSinceLast = Math.round((today - studyDates[0]) / oneDay);
  if (daysSinceLast > 1) return 0;

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