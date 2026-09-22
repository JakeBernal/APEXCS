import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { buildQuestionSet } from "../lib/examData";
import { saveAttempt } from "../lib/attempts";
import ExamQuestionScreen from "./ExamQuestionScreen";
import ExamResultScreen from "./ExamResultScreen";
import QuitExamModal from "./QuitExamModal";
import SubmitExamModal from "./SubmitExamModal";
import { stopSpeaking } from "../lib/speechHelper";

// 2026 CSE Standard Exam Durations (in seconds)
// Professional: 3 hours = 10,800s
// Sub-Professional: 2 hours = 7,200s
// Category Practice (Max 50 items): 1 hour = 3,600s
// Sub-Category / Chapter Practice (Max 30 items): 40 minutes = 2,400s
const TIMED_DURATION = {
  professional: 3 * 60 * 60,
  sub: 2 * 60 * 60,
  category: 60 * 60,
  chapter: 40 * 60,
};

export default function ExamSession({ subject, chapter = null, level, mode, onExit }) {
  // subject: { title, ... } | string | null
  // chapter: { title, ... } | string | null
  const subjectTitle =
    subject && typeof subject === "object" ? subject.title : subject || null;
  const chapterTitle =
    chapter && typeof chapter === "object" ? chapter.title : chapter || null;

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    buildQuestionSet(subjectTitle, level, chapterTitle)
      .then((data) => {
        if (cancelled) return;
        setQuestions(data);
        setLoadingQuestions(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load questions:", err);
        setLoadError(
          "Couldn't load questions. Please check your connection and try again."
        );
        setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subjectTitle, chapterTitle, level]);

  const [screen, setScreen] = useState("question"); // "question" | "result"
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: choiceIndex }

  // Determine timer duration based on scope:
  // - Sub-category (chapter): 40 minutes (max 30 items)
  // - Category (major subject): 1 hour / 60 minutes (max 50 items)
  // - Full mock exam: 3 hours (Professional) or 2 hours (Sub-Professional)
  const initialDuration = chapterTitle
    ? TIMED_DURATION.chapter
    : subjectTitle
    ? TIMED_DURATION.category
    : TIMED_DURATION[level] ?? TIMED_DURATION.professional;

  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  // Composed labels for header
  const subjectLabel =
    chapterTitle && subjectTitle
      ? `${subjectTitle} › ${chapterTitle}`
      : subjectTitle || "Full Examination";

  const levelLabel =
    level === "professional" ? "Professional" : "Sub-Professional";

  const resetSession = () => {
    stopSpeaking();
    setScreen("question");
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(initialDuration);
    setTimeUp(false);
    setShowQuitModal(false);
    setShowSubmitModal(false);
  };

  const finalizeExam = (answersOverride = answers) => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const bySubject = {};

    questions.forEach((q) => {
      const sTitle = q.subjectTitle || "General Information";
      const cTitle = q.chapter || "General";

      if (!bySubject[sTitle]) {
        bySubject[sTitle] = {
          title: sTitle,
          correct: 0,
          wrong: 0,
          total: 0,
          chaptersMap: {},
        };
      }

      if (!bySubject[sTitle].chaptersMap[cTitle]) {
        bySubject[sTitle].chaptersMap[cTitle] = {
          title: cTitle,
          correct: 0,
          wrong: 0,
          total: 0,
        };
      }

      bySubject[sTitle].total += 1;
      bySubject[sTitle].chaptersMap[cTitle].total += 1;

      const given = answersOverride[q.id];

      // No answer
      if (given === undefined) {
        skipped += 1;
        return;
      }

      // FLASHCARDS
      if (mode === "flashcards" || mode === "flashcard") {
        if (given === "correct") {
          correct += 1;
          bySubject[sTitle].correct += 1;
          bySubject[sTitle].chaptersMap[cTitle].correct += 1;
        } else if (given === "wrong") {
          wrong += 1;
          bySubject[sTitle].wrong += 1;
          bySubject[sTitle].chaptersMap[cTitle].wrong += 1;
        }
        return;
      }

      // MULTIPLE CHOICE / EXAM
      if (given === q.correctIndex) {
        correct += 1;
        bySubject[sTitle].correct += 1;
        bySubject[sTitle].chaptersMap[cTitle].correct += 1;
      } else {
        wrong += 1;
        bySubject[sTitle].wrong += 1;
        bySubject[sTitle].chaptersMap[cTitle].wrong += 1;
      }
    });

    const subjectBreakdown = Object.values(bySubject).map((s) => ({
      title: s.title,
      correct: s.correct,
      wrong: s.wrong,
      total: s.total,
      chapters: Object.values(s.chaptersMap),
    }));

    setShowSubmitModal(false);
    setScreen("result");

    return {
      mode,
      correct,
      wrong,
      skipped,
      total: questions.length,
      timeLeft,
      hasTimer: mode === "timed",
      subjectBreakdown,
      examTitle: subjectLabel,
      levelLabel,
    };
  };

  const [results, setResults] = useState(null);

  const handleSubmit = async () => {
    stopSpeaking();
    const r = finalizeExam();
    setResults(r);

    // Flashcards aren't graded, so nothing to save
    if (mode === "flashcards" || mode === "flashcard") return;

    const durationSeconds =
      mode === "timed" ? initialDuration - timeLeft : null;

    try {
      await saveAttempt({
        subjectTitle,
        chapterTitle,
        level,
        mode,
        results: r,
        answers,
        questions,
        durationSeconds,
      });
    } catch (err) {
      console.error("Could not save exam attempt:", err);
    }
  };

  const handleTimeUp = () => {
    stopSpeaking();
    setTimeUp(true);
  };

  const handleSeeResultsAfterTimeUp = () => {
    handleSubmit();
  };

  const handleBackFromQuestion = () => {
    setShowQuitModal(true);
  };

  const handleQuitConfirm = () => {
    stopSpeaking();
    setShowQuitModal(false);
    onExit();
  };

  if (loadingQuestions) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#386BF6" />
        <Text style={styles.loadingText}>
          {chapterTitle
            ? `Loading ${chapterTitle} questions...`
            : subjectTitle
            ? `Loading ${subjectTitle} questions...`
            : `Loading ${levelLabel} examination...`}
        </Text>
      </View>
    );
  }

  if (loadError || questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          {loadError ? "Connection Error" : "No Questions Available"}
        </Text>
        <Text style={styles.errorSubtitle}>
          {loadError ||
            `No questions found for ${chapterTitle || subjectTitle || levelLabel}. Check back soon as more questions are added.`}
        </Text>
        <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
          <Text style={styles.exitBtnText}>Return to Reviewer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const normalizedMode =
    mode === "flashcard" || mode === "flashcards" ? "flashcards" : mode;

  return (
    <View style={{ flex: 1 }}>
      {screen === "question" && (
        <ExamQuestionScreen
          mode={normalizedMode}
          subjectLabel={subjectLabel}
          levelLabel={levelLabel}
          questions={questions}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          answers={answers}
          setAnswers={setAnswers}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          onBack={handleBackFromQuestion}
          onRequestSubmit={() => setShowSubmitModal(true)}
          onTimeUp={handleTimeUp}
        />
      )}

      {screen === "result" && results && (
        <ExamResultScreen
          results={results}
          examTitle={subjectLabel}
          levelLabel={levelLabel}
          onRetake={resetSession}
          onHome={() => {
            stopSpeaking();
            onExit();
          }}
        />
      )}

      <QuitExamModal
        visible={showQuitModal}
        onCancel={() => setShowQuitModal(false)}
        onQuit={handleQuitConfirm}
      />

      <SubmitExamModal
        visible={showSubmitModal}
        totalQuestions={questions.length}
        answeredCount={Object.keys(answers).length}
        onCancel={() => setShowSubmitModal(false)}
        onSubmit={handleSubmit}
      />

      {timeUp && (
        <View style={styles.timeUpOverlay}>
          <View style={styles.timeUpCard}>
            <Text style={styles.timeUpTitle}>Time is Up!</Text>
            <Text style={styles.timeUpSubtitle}>
              Your exam time has expired. Let&apos;s see how you did.
            </Text>
            <TouchableOpacity
              style={styles.timeUpBtn}
              onPress={handleSeeResultsAfterTimeUp}
            >
              <Text style={styles.timeUpBtnText}>See Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: "#7D8FB3",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#14143A",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#7D8FB3",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  exitBtn: {
    backgroundColor: "#386BF6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exitBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  timeUpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  timeUpCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    elevation: 8,
  },
  timeUpTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#14143A",
    marginBottom: 8,
  },
  timeUpSubtitle: {
    fontSize: 14,
    color: "#7D8FB3",
    textAlign: "center",
    marginBottom: 24,
  },
  timeUpBtn: {
    backgroundColor: "#386BF6",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
  },
  timeUpBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});