import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

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
        <Text style={introStyles.stepText}>Tap the card to reveal the answer</Text>
      </View>

      <View style={introStyles.stepRow}>
        <View style={[introStyles.stepBadge, { backgroundColor: "#3CC873" }]}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
        <Text style={introStyles.stepText}>
          Tap <Text style={{ fontWeight: "800" }}>Knew It</Text> if you got it right
        </Text>
      </View>

      <View style={introStyles.stepRow}>
        <View style={[introStyles.stepBadge, { backgroundColor: "#F15B5B" }]}>
          <Ionicons name="close" size={16} color="#fff" />
        </View>
        <Text style={introStyles.stepText}>
          Tap <Text style={{ fontWeight: "800" }}>Didn't Know</Text> if you didn't
        </Text>
      </View>

      <TouchableOpacity style={introStyles.startBtn} onPress={onStart}>
        <Text style={introStyles.startBtnText}>Start</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

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
  const [showFlashcardIntro, setShowFlashcardIntro] = useState(mode === "flashcards");
  const timerRef = useRef(null);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const question = questions[currentIndex];
  const total = questions.length;
  const isLast = currentIndex === total - 1;
  const progress = ((currentIndex + 1) / total) * 100;
  const selected = answers[question.id];

  // Countdown for timed mode only
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

  useEffect(() => {
    setFlipped(false);
    flipAnim.setValue(0);
  }, [currentIndex]);

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goNext = () => {
    if (isLast) {
      onRequestSubmit();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const flipCard = () => {
    Animated.timing(flipAnim, {
      toValue: flipped ? 0 : 180,
      duration: 400,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };

  // Self-assessed correctness for flashcards — stores "correct" / "wrong"
  // per question, then advances (or submits, if it's the last card).
  const handleFlashcardAnswer = (knewIt) => {
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

  const selectChoice = (choiceIndex) => {
    // In review mode, lock the answer once picked so feedback stays visible
    if (mode === "review" && selected !== undefined) return;
    setAnswers((prev) => ({ ...prev, [question.id]: choiceIndex }));
  };

  const getChoiceStyle = (choiceIndex) => {
    if (mode !== "review" || selected === undefined) {
      return selected === choiceIndex ? styles.choiceSelected : styles.choice;
    }
    // Review mode feedback after an answer is chosen
    if (choiceIndex === question.correctIndex) return styles.choiceCorrect;
    if (choiceIndex === selected) return styles.choiceWrong;
    return styles.choice;
  };

  const getChoiceTextStyle = (choiceIndex) => {
    if (mode !== "review" || selected === undefined) {
      return selected === choiceIndex
        ? styles.choiceTextSelected
        : styles.choiceText;
    }
    if (choiceIndex === question.correctIndex || choiceIndex === selected) {
      return styles.choiceTextSelected;
    }
    return styles.choiceText;
  };

  if (showFlashcardIntro) {
    return (
      <FlashcardIntro
        onBack={onBack}
        onStart={() => setShowFlashcardIntro(false)}
      />
    );
  }

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4D79FF", "#2346B8"]} style={styles.header}>
          
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headerTitle}>{subjectLabel}</Text>
            <Text style={styles.headerSubtitle}>{levelLabel}</Text>
          </View>

          <View style={{ width: 42 }} />
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>
              Question {currentIndex + 1} out of {total}
            </Text>
          </View>

          {mode === "timed" && (
            <View style={styles.pill}>
              <Ionicons name="time-outline" size={13} color="#fff" />
              <Text style={[styles.pillText, { marginLeft: 4 }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          )}

          {mode === "flashcards" && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>Flashcards</Text>
            </View>
          )}

          {mode === "review" && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>Review</Text>
            </View>
          )}
        </View>
       
      </LinearGradient>
      {mode === "flashcards" ? (
        <View style={styles.flashcardArea}>
          <TouchableOpacity activeOpacity={0.9} onPress={flipCard}>
            <View style={styles.flipContainer}>
              {/* FRONT — question */}
              <Animated.View
                style={[
                  styles.flashcard,
                  styles.flashcardFace,
                  { transform: [{ rotateY: frontRotate }] },
                ]}
              >
                <Text style={styles.brand}>
                  APEX<Text style={{ color: "#7D8FB3" }}>CS</Text>
                </Text>

                <Text style={styles.flashcardText}>{question.question}</Text>

                <Text style={styles.flipHint}>Tap to reveal answer</Text>
              </Animated.View>

              {/* BACK — answer */}
              <Animated.View
                style={[
                  styles.flashcard,
                  styles.flashcardFace,
                  styles.flashcardBack,
                  { transform: [{ rotateY: backRotate }] },
                ]}
              >
                <Text style={styles.answerLabel}>ANSWER</Text>

                <Text style={styles.flashcardAnswerText}>
                  {question.choices[question.correctIndex]}
                </Text>

                <Text style={styles.flipHint}>Tap to see question</Text>
              </Animated.View>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.questionArea}>
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.choicesWrapper}>
            {question.choices.map((choice, i) => (
              <TouchableOpacity
                key={i}
                style={getChoiceStyle(i)}
                onPress={() => selectChoice(i)}
                activeOpacity={0.8}
              >
                <View style={styles.letterCircle}>
                  <Text style={styles.letterText}>{LETTERS[i]}</Text>
                </View>
                <Text style={getChoiceTextStyle(i)}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === "review" && selected !== undefined && (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationTitle}>
                {selected === question.correctIndex
                  ? "Correct!"
                  : `Not quite — the correct answer is ${LETTERS[question.correctIndex]}. ${question.choices[question.correctIndex]}`}
              </Text>
              {!!question.explanation && (
                <Text style={styles.explanationText}>
                  {question.explanation}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>

        {mode === "flashcards" ? (
          <>
            <TouchableOpacity
              style={[styles.navBtn, styles.wrongBtn]}
              onPress={() => handleFlashcardAnswer(false)}
            >
              <Ionicons name="close" size={18} color="#fff" />
              <Text style={styles.wrongBtnText}>Didn't Know</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, styles.correctBtn]}
              onPress={() => handleFlashcardAnswer(true)}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.correctBtnText}>Knew It</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnOutline]}
              onPress={goPrev}
              disabled={currentIndex === 0}
            >
              <Ionicons name="chevron-back" size={16} color="#386BF6" />
              <Text style={styles.navBtnOutlineText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnFilled]}
              onPress={goNext}
            >
              <Text style={styles.navBtnFilledText}>
                {isLast ? "Submit" : "Next"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </>
        )}
    
      </View>
    </View>
  );
}

const introStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 90,
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
    marginBottom: 24,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

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

  /* flashcards */

  flashcardArea: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 110,
  },

  flipContainer: {
    minHeight: 320,
  },

  flashcard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 30,
    minHeight: 320,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  flashcardFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backfaceVisibility: "hidden",
  },

  flashcardBack: {
    backgroundColor: "#EEF4FF",
  },

  brand: {
    fontSize: 15,
    fontWeight: "800",
    color: "#386BF6",
    marginBottom: 20,
  },

  answerLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#386BF6",
    letterSpacing: 1,
    marginBottom: 20,
  },

  flashcardText: {
    fontSize: 17,
    paddingTop: 30,
    fontWeight: "700",
    color: "#14143A",
    lineHeight: 26,
  },

  flashcardAnswerText: {
    fontSize: 19,
    paddingTop: 20,
    fontWeight: "800",
    color: "#14143A",
    lineHeight: 27,
  },

  flipHint: {
    marginTop: 52,
    fontSize: 12,
    color: "#B7C1D6",
    textAlign: "center",
  },

  /* MULTIPLE CHOICE */

  questionArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
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

  /* FOOTER */

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
    borderRadius: 14,
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
    backgroundColor: "#3CC873",
  },

  correctBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});