import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AudioReaderButton from "../components/AudioReaderButton";
import {
  speakText,
  stopSpeaking,
  formatQuestionSpeech,
} from "../lib/speechHelper";

const LETTERS = ["A", "B", "C", "D"];

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function FlashcardIntro({ onStart, onBack }) {
  return (
    <View style={introStyles.container}>
      <TouchableOpacity style={introStyles.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={22} color="#386BF6" />
      </TouchableOpacity>

      <LinearGradient
        colors={["#4D79FF", "#2346B8"]}
        style={introStyles.iconCircle}
      >
        <Ionicons name="albums-outline" size={40} color="#fff" />
      </LinearGradient>

      <Text style={introStyles.title}>How Flashcards Work</Text>

      <View style={introStyles.stepRow}>
        <View style={introStyles.stepBadge}>
          <Text style={introStyles.stepBadgeText}>1</Text>
        </View>

        <Text style={introStyles.stepText}>
          Tap the card to reveal the answer
        </Text>
      </View>

      <View style={introStyles.stepRow}>
        <View
          style={[
            introStyles.stepBadge,
            { backgroundColor: "#3CC873" },
          ]}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>

        <Text style={introStyles.stepText}>
          Tap <Text style={{ fontWeight: "800" }}>Knew It</Text> if you got it
          right
        </Text>
      </View>

      <View style={introStyles.stepRow}>
        <View
          style={[
            introStyles.stepBadge,
            { backgroundColor: "#F15B5B" },
          ]}
        >
          <Ionicons name="close" size={16} color="#fff" />
        </View>

        <Text style={introStyles.stepText}>
          Tap <Text style={{ fontWeight: "800" }}>Didn't Know</Text> if you
          didn't
        </Text>
      </View>

      <TouchableOpacity style={introStyles.startBtn} onPress={onStart}>
        <Text style={introStyles.startBtnText}>Start</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* =========================================================
   QUESTION NAVIGATOR
========================================================= */

function QuestionNavigator({
  questions,
  currentIndex,
  answers,
  skippedQuestions,
  onSelectQuestion,
  onClose,
}) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.navigatorOverlay}>
        <View style={styles.navigatorContainer}>
          {/* HEADER */}
          <View style={styles.navigatorHeader}>
            <View>
              <Text style={styles.navigatorTitle}>Questions</Text>
              <Text style={styles.navigatorSubtitle}>
                Jump to any question
              </Text>
            </View>

            <TouchableOpacity
              style={styles.navigatorCloseBtn}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color="#4A5578" />
            </TouchableOpacity>
          </View>

          {/* QUESTION GRID */}
          <View style={styles.questionGrid}>
            {questions.map((item, index) => {
              const isCurrent = index === currentIndex;
              const isWrong = answers[item.id] === "wrong";
              const isAnswered = answers[item.id] !== undefined;
              const isSkipped = skippedQuestions[item.id] === true;

              let buttonStyle = styles.questionNumber;
              let textStyle = styles.questionNumberText;
              let icon = null;

              if (isCurrent) {
                buttonStyle = styles.questionNumberCurrent;
                textStyle = styles.questionNumberTextCurrent;
              } else if (isWrong) {
                buttonStyle = styles.questionNumberSkipped;
                textStyle = styles.questionNumberTextSkipped;
                icon = "close";
              } else if (isAnswered) {
                buttonStyle = styles.questionNumberAnswered;
                textStyle = styles.questionNumberTextAnswered;
                icon = "checkmark";
              } else if (isSkipped) {
                buttonStyle = styles.questionNumberSkipped;
                textStyle = styles.questionNumberTextSkipped;
                icon = "alert";
              }

              return (
                <TouchableOpacity
                  key={item.id ?? index}
                  style={buttonStyle}
                  onPress={() => onSelectQuestion(index)}
                  activeOpacity={0.75}
                >
                  {icon ? (
                    <Ionicons
                      name={icon}
                      size={13}
                      color={
                        isWrong || isSkipped
                          ? "#D44A4A"
                          : "#2FA84F"
                      }
                      style={styles.questionStatusIcon}
                    />
                  ) : null}

                  <Text style={textStyle}>{index + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* LEGEND */}
          <View style={styles.navigatorLegend}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  styles.legendCurrent,
                ]}
              />
              <Text style={styles.legendText}>Current</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  styles.legendAnswered,
                ]}
              >
                <Ionicons
                  name="checkmark"
                  size={10}
                  color="#2FA84F"
                />
              </View>
              <Text style={styles.legendText}>Answered</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  styles.legendSkipped,
                ]}
              >
                <Ionicons
                  name="alert"
                  size={10}
                  color="#D44A4A"
                />
              </View>
              <Text style={styles.legendText}>Skipped</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  styles.legendUnanswered,
                ]}
              />
              <Text style={styles.legendText}>Unanswered</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.navigatorDoneBtn}
            onPress={onClose}
          >
            <Text style={styles.navigatorDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function ExamQuestionScreen({
  mode, // "flashcards" | "timed" | "review"
  subjectLabel, // e.g. "Numerical Ability" or "All Categories"
  levelLabel, // "Professional" | "Sub-Professional"
  questions,
  currentIndex,
  setCurrentIndex,
  answers,
  setAnswers,
  timeLeft,
  setTimeLeft,
  onBack,
  onRequestSubmit,
  onTimeUp,
}) {
  const [flipped, setFlipped] = useState(false);

  const [showFlashcardIntro, setShowFlashcardIntro] = useState(
    mode === "flashcards"
  );

  /*
   * Tracks questions that the user deliberately skipped.
   *
   * Example:
   * {
   *   "question-id-1": true,
   *   "question-id-7": true
   * }
   */
  const [skippedQuestions, setSkippedQuestions] = useState({});

  /*
   * Controls the question navigator modal.
   */
  const [showQuestionNavigator, setShowQuestionNavigator] =
    useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const timerRef = useRef(null);

  const flipAnim = useRef(new Animated.Value(0)).current;

  const question = questions[currentIndex];
  const total = questions.length;
  const isLast = currentIndex === total - 1;
  const progress = ((currentIndex + 1) / total) * 100;
  const selected = answers[question.id];

  /* =========================================================
     TIMER
  ========================================================= */

  useEffect(() => {
    if (mode !== "timed") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);

          if (onTimeUp) {
            onTimeUp();
          } else {
            onRequestSubmit();
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* =========================================================
     TEXT-TO-SPEECH (TTS) CONTROLS
  ========================================================= */

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const speechText = formatQuestionSpeech({
      questionNumber: currentIndex + 1,
      total,
      questionText: question.question,
      choices: question.choices,
      mode,
      isFlipped: flipped,
      explanation: question.explanation,
      selectedChoiceIndex: selected,
      correctChoiceIndex: question.correctIndex,
    });

    speakText(speechText, {
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  /* Stop speech when screen unmounts */
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  /* =========================================================
     RESET FLASHCARD & SPEECH WHEN QUESTION CHANGES
  ========================================================= */

  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
    setFlipped(false);
    flipAnim.setValue(0);
  }, [currentIndex]);

  /* =========================================================
     PREVIOUS
  ========================================================= */

  const goPrev = () => {
    stopSpeaking();
    setIsSpeaking(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  /* =========================================================
     NEXT
  ========================================================= */

  const goNext = () => {
    stopSpeaking();
    setIsSpeaking(false);
    /*
     * If this is the last question,
     * submit the exam.
     */
    if (isLast) {
      onRequestSubmit();
      return;
    }

    /*
     * If the current question has not been answered,
     * mark it as skipped.
     *
     * This allows the question navigator to show
     * that the user intentionally left it unanswered.
     */
    if (answers[question.id] === undefined) {
      setSkippedQuestions((prev) => ({
        ...prev,
        [question.id]: true,
      }));
    }

    setCurrentIndex(currentIndex + 1);
  };

  /* =========================================================
     QUESTION NAVIGATOR
  ========================================================= */

  const jumpToQuestion = (index) => {
    stopSpeaking();
    setIsSpeaking(false);
    setCurrentIndex(index);
    setShowQuestionNavigator(false);
  };

  /* =========================================================
     FLASHCARD FLIP
  ========================================================= */

  const flipCard = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }

    Animated.timing(flipAnim, {
      toValue: flipped ? 0 : 180,
      duration: 400,
      useNativeDriver: true,
    }).start();

    setFlipped(!flipped);
  };

  /* =========================================================
     FLASHCARD ANSWER
  ========================================================= */

  const handleFlashcardAnswer = (knewIt) => {
    stopSpeaking();
    setIsSpeaking(false);
    setAnswers((prev) => ({
      ...prev,
      [question.id]: knewIt ? "correct" : "wrong",
    }));

    if (isLast) {
      onRequestSubmit();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  /* =========================================================
     MULTIPLE CHOICE
  ========================================================= */

  const selectChoice = (choiceIndex) => {
    /*
     * In review mode, lock the answer once picked
     * so feedback stays visible.
     */
    if (mode === "review" && selected !== undefined) {
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [question.id]: choiceIndex,
    }));

    /*
     * If the user previously skipped this question,
     * remove it from skippedQuestions once they answer it.
     */
    if (skippedQuestions[question.id]) {
      setSkippedQuestions((prev) => {
        const updated = { ...prev };
        delete updated[question.id];
        return updated;
      });
    }
  };

  /* =========================================================
     CHOICE STYLING
  ========================================================= */

  const getChoiceStyle = (choiceIndex) => {
    if (
      mode !== "review" ||
      selected === undefined
    ) {
      return selected === choiceIndex
        ? styles.choiceSelected
        : styles.choice;
    }

    /*
     * Review mode feedback after an answer is chosen.
     */

    if (choiceIndex === question.correctIndex) {
      return styles.choiceCorrect;
    }

    if (choiceIndex === selected) {
      return styles.choiceWrong;
    }

    return styles.choice;
  };

  const getChoiceTextStyle = (choiceIndex) => {
    if (
      mode !== "review" ||
      selected === undefined
    ) {
      return selected === choiceIndex
        ? styles.choiceTextSelected
        : styles.choiceText;
    }

    if (
      choiceIndex === question.correctIndex ||
      choiceIndex === selected
    ) {
      return styles.choiceTextSelected;
    }

    return styles.choiceText;
  };

  /* =========================================================
     FLASHCARD INTRO
  ========================================================= */

  if (showFlashcardIntro) {
    return (
      <FlashcardIntro
        onBack={onBack}
        onStart={() => setShowFlashcardIntro(false)}
      />
    );
  }

  /* =========================================================
     FLIP ANIMATION
  ========================================================= */

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  /* =========================================================
     MAIN UI
  ========================================================= */

  const isFlashcardMode = mode === "flashcards";
  const ContainerComp = isFlashcardMode ? LinearGradient : View;
  const containerProps = isFlashcardMode
    ? {
        colors: ["#1C3FA8", "#132D82"],
        style: styles.container,
      }
    : {
        style: styles.container,
      };

  return (
    <ContainerComp {...containerProps}>
      <StatusBar style="light" />

      {/* =====================================================
          HEADER
      ===================================================== */}

      {isFlashcardMode ? (
        <View style={styles.headerFlashcards}>
          <View style={styles.topRow}>
            {/* BACK BUTTON */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                stopSpeaking();
                setIsSpeaking(false);
                onBack();
              }}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            {/* TITLE */}
            <View
              style={{
                flex: 1,
                alignItems: "center",
              }}
            >
              <Text style={styles.headerTitle}>
                {subjectLabel}
              </Text>

              <Text style={styles.headerSubtitle}>
                {levelLabel}
              </Text>
            </View>

            {/* QUESTION NAVIGATOR BUTTON (PAGINATION) */}
            <TouchableOpacity
              style={styles.questionNavigatorBtn}
              onPress={() => {
                stopSpeaking();
                setIsSpeaking(false);
                setShowQuestionNavigator(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* PROGRESS */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>

          {/* META / PAGINATION ROW */}
          <View style={styles.metaRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                stopSpeaking();
                setIsSpeaking(false);
                setShowQuestionNavigator(true);
              }}
              style={styles.metaClickable}
            >
              <Text style={styles.flashcardMetaText}>
                Question {currentIndex + 1} out of {total}
              </Text>
              <Ionicons
                name="grid-outline"
                size={13}
                color="rgba(255,255,255,0.75)"
              />
            </TouchableOpacity>

            <View style={styles.flashcardBadgePill}>
              <Text style={styles.flashcardBadgeText}>
                Flashcards
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={["#4D79FF", "#2346B8"]}
          style={styles.header}
        >
          <View style={styles.topRow}>
            {/* BACK BUTTON */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                stopSpeaking();
                setIsSpeaking(false);
                onBack();
              }}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            {/* TITLE */}
            <View
              style={{
                flex: 1,
                alignItems: "center",
              }}
            >
              <Text style={styles.headerTitle}>
                {subjectLabel}
              </Text>

              <Text style={styles.headerSubtitle}>
                {levelLabel}
              </Text>
            </View>

            {/* QUESTION NAVIGATOR BUTTON */}
            <TouchableOpacity
              style={styles.questionNavigatorBtn}
              onPress={() => {
                stopSpeaking();
                setIsSpeaking(false);
                setShowQuestionNavigator(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* PROGRESS */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>

          {/* META */}
          <View style={styles.metaRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                Question {currentIndex + 1} out of {total}
              </Text>
            </View>

            {mode === "timed" && (
              <View style={styles.pill}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color="#fff"
                />

                <Text
                  style={[
                    styles.pillText,
                    { marginLeft: 4 },
                  ]}
                >
                  {formatTime(timeLeft)}
                </Text>
              </View>
            )}

            {mode === "review" && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  Review
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      )}

      {/* =====================================================
          QUESTION NAVIGATOR MODAL
      ===================================================== */}

      {showQuestionNavigator && (
        <QuestionNavigator
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          skippedQuestions={skippedQuestions}
          onSelectQuestion={jumpToQuestion}
          onClose={() =>
            setShowQuestionNavigator(false)
          }
        />
      )}

      {/* =====================================================
          FLASHCARD
      ===================================================== */}

      {isFlashcardMode ? (
        <View style={styles.flashcardArea}>
          <View style={styles.flashcardAudioRow}>
            <AudioReaderButton
              isSpeaking={isSpeaking}
              onPress={handleToggleSpeech}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.95}
            onPress={flipCard}
            style={styles.cardTouchable}
          >
            <View style={styles.flipContainer}>
              {/* FRONT — QUESTION */}
              <Animated.View
                style={[
                  styles.flashcard,
                  styles.flashcardFace,
                  {
                    transform: [
                      {
                        rotateY: frontRotate,
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.flashcardTopRow}>
                  <View style={styles.brandRow}>
                    <Text style={styles.brandApex}>APEX</Text>
                    <Text style={styles.brandCs}>cs</Text>
                  </View>
                </View>

                <View style={styles.flashcardBody}>
                  <Text style={styles.flashcardText}>
                    {question.question}
                  </Text>
                </View>

                <View style={styles.flipHintRow}>
                  <Ionicons name="swap-horizontal" size={13} color="#8FA0BD" />
                  <Text style={styles.flipHintText}>
                    Tap to reveal answer
                  </Text>
                </View>
              </Animated.View>

              {/* BACK — ANSWER */}
              <Animated.View
                style={[
                  styles.flashcard,
                  styles.flashcardFace,
                  styles.flashcardBack,
                  {
                    transform: [
                      {
                        rotateY: backRotate,
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.flashcardTopRow}>
                  <View style={styles.brandRow}>
                    <Text style={styles.brandApex}>APEX</Text>
                    <Text style={styles.brandCs}>cs</Text>
                  </View>

                  <View style={styles.answerBadge}>
                    <Text style={styles.answerBadgeText}>ANSWER</Text>
                  </View>
                </View>

                <View style={styles.flashcardBody}>
                  <Text style={styles.flashcardAnswerText}>
                    {
                      question.choices[
                        question.correctIndex
                      ]
                    }
                  </Text>
                </View>

                <View style={styles.flipHintRow}>
                  <Ionicons name="swap-horizontal" size={13} color="#8FA0BD" />
                  <Text style={styles.flipHintText}>
                    Tap to see question
                  </Text>
                </View>
              </Animated.View>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        /* =====================================================
           MULTIPLE CHOICE
        ===================================================== */

        <View style={styles.questionArea}>
          <View style={styles.questionHeaderBar}>
            <View style={styles.questionIndexPill}>
              <Text style={styles.questionIndexText}>
                QUESTION {currentIndex + 1}
              </Text>
            </View>

            <AudioReaderButton
              isSpeaking={isSpeaking}
              onPress={handleToggleSpeech}
            />
          </View>

          <Text
            style={styles.questionText}
            accessible={true}
            accessibilityRole="header"
          >
            {question.question}
          </Text>

          <View style={styles.choicesWrapper}>
            {question.choices.map((choice, i) => (
              <TouchableOpacity
                key={i}
                style={getChoiceStyle(i)}
                onPress={() =>
                  selectChoice(i)
                }
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ selected: selected === i }}
                accessibilityLabel={`Option ${LETTERS[i]}: ${choice}`}
              >
                <View style={styles.letterCircle}>
                  <Text
                    style={styles.letterText}
                  >
                    {LETTERS[i]}
                  </Text>
                </View>

                <Text
                  style={getChoiceTextStyle(i)}
                >
                  {choice}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* REVIEW EXPLANATION */}
          {mode === "review" &&
            selected !== undefined && (
              <View style={styles.explanationBox}>
                <Text
                  style={styles.explanationTitle}
                >
                  {selected ===
                  question.correctIndex
                    ? "Correct!"
                    : `Not quite — the correct answer is ${
                        LETTERS[
                          question.correctIndex
                        ]
                      }. ${
                        question.choices[
                          question.correctIndex
                        ]
                      }`}
                </Text>

                {!!question.explanation && (
                  <Text
                    style={styles.explanationText}
                  >
                    {question.explanation}
                  </Text>
                )}
              </View>
            )}
        </View>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <View style={isFlashcardMode ? styles.footerFlashcards : styles.footer}>
        {isFlashcardMode ? (
          <View style={styles.flashcardFooterContent}>
            {/* ROW 1: CHECK & WRONG ACTIONS */}
            <View style={styles.gradingRow}>
              {/* DIDN'T KNOW */}
              <TouchableOpacity
                style={[
                  styles.gradeBtn,
                  styles.gradeBtnWrong,
                  answers[question.id] === "wrong" && styles.gradeBtnWrongActive,
                ]}
                onPress={() => handleFlashcardAnswer(false)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color={answers[question.id] === "wrong" ? "#FFFFFF" : "#F87171"}
                />
                <Text
                  style={[
                    styles.gradeBtnText,
                    styles.gradeBtnWrongText,
                    answers[question.id] === "wrong" && styles.gradeBtnTextActive,
                  ]}
                >
                  Didn't Know
                </Text>
              </TouchableOpacity>

              {/* KNEW IT */}
              <TouchableOpacity
                style={[
                  styles.gradeBtn,
                  styles.gradeBtnCorrect,
                  answers[question.id] === "correct" && styles.gradeBtnCorrectActive,
                ]}
                onPress={() => handleFlashcardAnswer(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={19}
                  color={answers[question.id] === "correct" ? "#FFFFFF" : "#4ADE80"}
                />
                <Text
                  style={[
                    styles.gradeBtnText,
                    styles.gradeBtnCorrectText,
                    answers[question.id] === "correct" && styles.gradeBtnTextActive,
                  ]}
                >
                  Knew It
                </Text>
              </TouchableOpacity>
            </View>

            {/* ROW 2: PREVIOUS & NEXT (MATCHING FIGMA) */}
            <View style={styles.navRowFlashcards}>
              <TouchableOpacity
                style={[
                  styles.figmaNavBtn,
                  currentIndex === 0 && styles.figmaNavBtnDisabled,
                ]}
                onPress={goPrev}
                disabled={currentIndex === 0}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.figmaNavBtnText}>
                  Previous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.figmaNavBtn}
                onPress={goNext}
                activeOpacity={0.8}
              >
                <Text style={styles.figmaNavBtnText}>
                  {isLast ? "Finish" : "Next"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* PREVIOUS */}
            <TouchableOpacity
              style={[
                styles.navBtn,
                styles.navBtnOutline,
              ]}
              onPress={goPrev}
              disabled={currentIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color="#386BF6"
              />

              <Text
                style={
                  styles.navBtnOutlineText
                }
              >
                Previous
              </Text>
            </TouchableOpacity>

            {/* NEXT / SUBMIT */}
            <TouchableOpacity
              style={[
                styles.navBtn,
                styles.navBtnFilled,
              ]}
              onPress={goNext}
            >
              <Text
                style={
                  styles.navBtnFilledText
                }
              >
                {isLast ? "Submit" : "Next"}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={16}
                color="#fff"
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </ContainerComp>
  );
}

/* =========================================================
   FLASHCARD INTRO STYLES
========================================================= */

const introStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 160,
  },

  backBtn: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5FF",
    justifyContent: "center",
    alignItems: "center",
  },

  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#14143A",
    marginBottom: 30,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 18,
  },

  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  stepBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  stepText: {
    flex: 1,
    fontSize: 15,
    color: "#4A5578",
    lineHeight: 21,
  },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#386BF6",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    gap: 8,
    marginTop: 30,
    width: "100%",
  },

  startBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

/* =========================================================
   MAIN STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    paddingTop: 60,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  questionNavigatorBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerRightPlaceholder: {
    width: 42,
    height: 42,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: "#DDE7FF",
    fontSize: 12,
    marginTop: 2,
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },

  progressFill: {
    height: 6,
    backgroundColor: "#5CE087",
    borderRadius: 3,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
  },

  pillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  /* =======================================================
     QUESTION NAVIGATOR MODAL
  ======================================================= */

  navigatorOverlay: {
    flex: 1,
    backgroundColor: "rgba(20,20,58,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  navigatorContainer: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    maxHeight: "80%",
  },

  navigatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  navigatorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#14143A",
  },

  navigatorSubtitle: {
    fontSize: 13,
    color: "#8A94A6",
    marginTop: 3,
  },

  navigatorCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5FF",
    justifyContent: "center",
    alignItems: "center",
  },

  questionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },

  questionNumber: {
    width: "18%",
    aspectRatio: 1,
    marginRight: "2%",
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#F1F3F7",
    borderWidth: 1,
    borderColor: "#E2E6ED",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  questionNumberCurrent: {
    width: "18%",
    aspectRatio: 1,
    marginRight: "2%",
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#386BF6",
    borderWidth: 1,
    borderColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
  },

  questionNumberAnswered: {
    width: "18%",
    aspectRatio: 1,
    marginRight: "2%",
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#E9F8EE",
    borderWidth: 1,
    borderColor: "#B9E8C7",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  questionNumberSkipped: {
    width: "18%",
    aspectRatio: 1,
    marginRight: "2%",
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#F4BDBD",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  questionNumberText: {
    color: "#4A5578",
    fontSize: 14,
    fontWeight: "700",
  },

  questionNumberTextCurrent: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  questionNumberTextAnswered: {
    color: "#2FA84F",
    fontSize: 14,
    fontWeight: "800",
  },

  questionNumberTextSkipped: {
    color: "#D44A4A",
    fontSize: 14,
    fontWeight: "800",
  },

  questionStatusIcon: {
    position: "absolute",
    top: 5,
    right: 5,
  },

  navigatorLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF2FF",
    paddingTop: 16,
    marginTop: 8,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendDot: {
    width: 18,
    height: 18,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },

  legendCurrent: {
    backgroundColor: "#386BF6",
  },

  legendAnswered: {
    backgroundColor: "#E9F8EE",
  },

  legendSkipped: {
    backgroundColor: "#FFF0F0",
  },

  legendUnanswered: {
    backgroundColor: "#F1F3F7",
    borderWidth: 1,
    borderColor: "#E2E6ED",
  },

  legendText: {
    fontSize: 11,
    color: "#68738C",
    fontWeight: "600",
  },

  navigatorDoneBtn: {
    height: 48,
    borderRadius: 13,
    backgroundColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  navigatorDoneText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  /* =======================================================
     FLASHCARDS
  ======================================================= */

  headerFlashcards: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },

  flashcardMetaText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontWeight: "600",
  },

  metaClickable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  flashcardBadgePill: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },

  flashcardBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  flashcardAudioRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },

  flashcardArea: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 10,
    justifyContent: "center",
  },

  cardTouchable: {
    width: "100%",
  },

  flipContainer: {
    width: "100%",
    height: 350,
  },

  flashcard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    height: 350,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },

  flashcardFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: "hidden",
  },

  flashcardBack: {
    backgroundColor: "#FFFFFF",
  },

  flashcardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  brandApex: {
    fontSize: 16,
    fontWeight: "900",
    color: "#14143A",
    letterSpacing: -0.2,
  },

  brandCs: {
    fontSize: 14,
    fontWeight: "800",
    color: "#5B74BC",
  },

  answerBadge: {
    backgroundColor: "#E9F8EE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  answerBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2FA84F",
    letterSpacing: 0.5,
  },

  flashcardBody: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },

  flashcardText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#14143A",
    lineHeight: 27,
    textAlign: "left",
  },

  flashcardAnswerText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#14143A",
    lineHeight: 28,
    textAlign: "left",
  },

  flipHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F4F6FB",
  },

  flipHintText: {
    fontSize: 12,
    color: "#8FA0BD",
    fontWeight: "600",
  },

  /* =======================================================
     MULTIPLE CHOICE
  ======================================================= */

  questionArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  questionHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  questionIndexPill: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  questionIndexText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#386BF6",
    letterSpacing: 0.5,
  },

  questionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14143A",
    lineHeight: 24,
    marginBottom: 22,
  },

  choicesWrapper: {
    gap: 12,
  },

  choice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E4E9F5",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  choiceSelected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    borderWidth: 1.5,
    borderColor: "#386BF6",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  choiceCorrect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9FBF0",
    borderWidth: 1.5,
    borderColor: "#3CC873",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  choiceWrong: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEEEF",
    borderWidth: 1.5,
    borderColor: "#F15B5B",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  letterCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  letterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#386BF6",
  },

  choiceText: {
    fontSize: 14,
    color: "#4A5578",
    fontWeight: "600",
    flex: 1,
  },

  choiceTextSelected: {
    fontSize: 14,
    color: "#14143A",
    fontWeight: "700",
    flex: 1,
  },

  explanationBox: {
    marginTop: 20,
    backgroundColor: "#F1F5FF",
    borderRadius: 14,
    padding: 16,
  },

  explanationTitle: {
    fontWeight: "700",
    color: "#14143A",
    marginBottom: 6,
  },

  explanationText: {
    color: "#4A5578",
    fontSize: 13,
    lineHeight: 19,
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEF2FF",
    backgroundColor: "#fff",
  },

  navBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 52,
    borderRadius: 12,
    gap: 4,
  },

  navBtnOutline: {
    borderWidth: 1.5,
    borderColor: "#386BF6",
    backgroundColor: "#fff",
  },

  navBtnOutlineText: {
    color: "#386BF6",
    fontWeight: "700",
    fontSize: 14,
  },

  navBtnFilled: {
    backgroundColor: "#386BF6",
  },

  navBtnFilledText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  wrongBtn: {
    backgroundColor: "#F15B5B",
  },

  wrongBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  correctBtn: {
    borderColor: "#3CC873",
  },

  correctBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  /* =======================================================
     FLASHCARDS FOOTER & BUTTONS (FIGMA DESIGN)
  ======================================================= */

  footerFlashcards: {
    paddingHorizontal: 22,
    paddingBottom: 32,
    paddingTop: 8,
    backgroundColor: "transparent",
  },

  flashcardFooterContent: {
    gap: 12,
  },

  gradingRow: {
    flexDirection: "row",
    gap: 12,
  },

  gradeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },

  gradeBtnWrong: {
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    borderColor: "rgba(248, 113, 113, 0.4)",
  },

  gradeBtnWrongActive: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },

  gradeBtnCorrect: {
    backgroundColor: "rgba(74, 222, 128, 0.16)",
    borderColor: "rgba(74, 222, 128, 0.4)",
  },

  gradeBtnCorrectActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },

  gradeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  gradeBtnWrongText: {
    color: "#FCA5A5",
  },

  gradeBtnCorrectText: {
    color: "#86EFAC",
  },

  gradeBtnTextActive: {
    color: "#FFFFFF",
  },

  navRowFlashcards: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },

  figmaNavBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  figmaNavBtnDisabled: {
    opacity: 0.35,
  },

  figmaNavBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
}); 