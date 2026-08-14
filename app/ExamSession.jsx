import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ExamQuestionScreen from "./ExamQuestionScreen";
import ExamResultScreen from "./ExamResultScreen";
import SubmitExamModal from "./SubmitExamModal";
import { buildQuestionSet } from "../lib/examData";
import { saveAttempt } from "../lib/attempts";
// import { ExamQuestionSkeleton } from "../components/ExamQuestionSkeleton";

// Duration in seconds per level for the "timed" mode. Tweak as needed —
// currently a placeholder, not tied to real per-subject question counts.
const TIMED_DURATION = {
  // professional: 3 * 60 * 60,
  professional: 3 * 60 * 60,
  sub: 2 * 60 * 60,
};

function TimeUpScreen({ onSeeResults }) {
  return (
    <View style={timeUpStyles.container}>
      <LinearGradient
        colors={["#4D79FF", "#2346B8"]}
        style={timeUpStyles.iconCircle}
      >
        <Ionicons name="time-outline" size={44} color="#fff" />
      </LinearGradient>

      <Text style={timeUpStyles.title}>Time's Up!</Text>
      <Text style={timeUpStyles.subtitle}>
        Your time has ended. Let's see how you did.
      </Text>

      <TouchableOpacity style={timeUpStyles.button} onPress={onSeeResults}>
        <Text style={timeUpStyles.buttonText}>View Results</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const timeUpStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#14143A",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#7D8FB3",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#386BF6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default function ExamSession({ subject, level, mode, onExit }) {
  // subject: { title, topics } | null (null = "All Categories")
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoadingQuestions(true);
    setLoadError(null);

    buildQuestionSet(subject?.title ?? null, level)
      .then((data) => {
        if (cancelled) return;
        setQuestions(data);
        setLoadingQuestions(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load questions:", err);
        setLoadError("Couldn't load questions. Please check your connection and try again.");
        setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subject, level]);

  const [screen, setScreen] = useState("question"); // "question" | "result"
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: choiceIndex }
  const [timeLeft, setTimeLeft] = useState(TIMED_DURATION[level] ?? TIMED_DURATION.professional);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  const subjectLabel = subject ? subject.title : "All Categories";
  const levelLabel = level === "professional" ? "Professional" : "Sub-Professional";

  const resetSession = () => {
    setScreen("question");
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(TIMED_DURATION[level] ?? TIMED_DURATION.professional);
    setTimeUp(false);
  };

 const finalizeExam = (answersOverride = answers) => {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const bySubject = {};

  questions.forEach((q) => {
    if (!bySubject[q.subjectTitle]) {
      bySubject[q.subjectTitle] = {
        title: q.subjectTitle,
        correct: 0,
        wrong: 0,
        total: 0,
      };
    }

    bySubject[q.subjectTitle].total += 1;

    const given = answersOverride[q.id];

    // No answer
    if (given === undefined) {
      skipped += 1;
      return;
    }

    // FLASHCARDS
    if (mode === "flashcards") {
      if (given === "correct") {
        correct += 1;
        bySubject[q.subjectTitle].correct += 1;
      } else if (given === "wrong") {
        wrong += 1;
        bySubject[q.subjectTitle].wrong += 1;
      }

      return;
    }

    // MULTIPLE CHOICE / EXAM
    if (given === q.correctIndex) {
      correct += 1;
      bySubject[q.subjectTitle].correct += 1;
    } else {
      wrong += 1;
      bySubject[q.subjectTitle].wrong += 1;
    }
  });

  setShowSubmitModal(false);
  setScreen("result");

  return {
    mode, // IMPORTANT
    correct,
    wrong,
    skipped,
    total: questions.length,
    timeLeft,
    hasTimer: mode === "timed",
    subjectBreakdown: Object.values(bySubject),
  };
};

  const [results, setResults] = useState(null);

  const handleSubmit = async () => {
    const r = finalizeExam();
    setResults(r);

    // Flashcards aren't graded, so there's nothing meaningful to save.
    if (mode === "flashcards") return;

    const durationSeconds =
      mode === "timed"
        ? (TIMED_DURATION[level] ?? TIMED_DURATION.professional) - timeLeft
        : null;

    try {
      await saveAttempt({
        subjectTitle: subject?.title ?? null,
        level,
        mode,
        results: r,
        answers,
        questions,
        durationSeconds,
      });
    } catch (err) {
      // Non-fatal — the user still sees their results on screen either way,
      // it just won't show up in History/Dashboard if this failed.
      console.error("Could not save exam attempt:", err);
    }
  };

  const handleTimeUp = () => {
    setTimeUp(true);
  };

  const handleSeeResultsAfterTimeUp = () => {
    handleSubmit();
  };

  const handleBackFromQuestion = () => {
    if (mode === "flashcards") {
      onExit();
    } else {
      setShowSubmitModal(true);
    }
  };

  // if (loadingQuestions) {
  //   return <ExamQuestionSkeleton />;
  // }

  if (loadError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ textAlign: "center", color: "#E74C3C", fontSize: 15 }}>
          {loadError}
        </Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ textAlign: "center", color: "#7D8FB3", fontSize: 15 }}>
          No published questions found for Sub-Professional yet.
        </Text>
      </View>
    );
  }

  if (screen === "result" && results) {
    return (
      <ExamResultScreen
        results={results}
        onRetake={resetSession}
        onHome={onExit}
      />
    );
  }

  if (timeUp) {
    return <TimeUpScreen onSeeResults={handleSeeResultsAfterTimeUp} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ExamQuestionScreen
        mode={mode}
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

      <SubmitExamModal
        visible={showSubmitModal}
        onCancel={() => setShowSubmitModal(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}