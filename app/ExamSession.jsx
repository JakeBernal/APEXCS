import React, { useState, useMemo } from "react";
import { View } from "react-native";
import ExamQuestionScreen from "./ExamQuestionScreen";
import ExamResultScreen from "./ExamResultScreen";
import SubmitExamModal from "./SubmitExamModal";
import { buildQuestionSet } from "./examData";

// Duration in seconds per level for the "timed" mode. Tweak as needed —
// currently a placeholder, not tied to real per-subject question counts.
const TIMED_DURATION = {
  professional: 3 * 60 * 60,
  sub: 2 * 60 * 60,
};

export default function ExamSession({ subject, level, mode, onExit }) {
  // subject: { title, topics } | null (null = "All Categories")
  const questions = useMemo(() => buildQuestionSet(subject?.title ?? null), [
    subject,
  ]);

  const [screen, setScreen] = useState("question"); // "question" | "result"
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: choiceIndex }
  const [timeLeft, setTimeLeft] = useState(TIMED_DURATION[level] ?? TIMED_DURATION.professional);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const subjectLabel = subject ? subject.title : "All Categories";
  const levelLabel = level === "professional" ? "Professional" : "Sub-Professional";

  const resetSession = () => {
    setScreen("question");
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(TIMED_DURATION[level] ?? TIMED_DURATION.professional);
  };

  const finalizeExam = () => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const bySubject = {};

    questions.forEach((q) => {
      if (!bySubject[q.subjectTitle]) {
        bySubject[q.subjectTitle] = { title: q.subjectTitle, correct: 0, wrong: 0, total: 0 };
      }
      bySubject[q.subjectTitle].total += 1;

      const given = answers[q.id];
      if (given === undefined) {
        skipped += 1;
      } else if (given === q.correctIndex) {
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

  const handleSubmit = () => {
    const r = finalizeExam();
    setResults(r);
  };

  const handleBackFromQuestion = () => {
    if (mode === "flashcards") {
      onExit();
    } else {
      setShowSubmitModal(true);
    }
  };

  if (screen === "result" && results) {
    return (
      <ExamResultScreen
        results={results}
        onRetake={resetSession}
        onHome={onExit}
      />
    );
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
      />

      <SubmitExamModal
        visible={showSubmitModal}
        onCancel={() => setShowSubmitModal(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
