import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function getStatus(percent) {
  if (percent >= 70) return { label: "Good", color: "#3CC873", bg: "#E9FBF0" };
  if (percent >= 45) return { label: "Okay", color: "#E6A93B", bg: "#FFF6E3" };
  return { label: "Weak", color: "#F15B5B", bg: "#FFEEEF" };
}

function getMotivation(percent) {
  if (percent >= 80) return "Great job! You're well prepared!";
  if (percent >= 50) return "Good effort, keep practicing!";
  return "Don't give up, try harder next time!";
}

export default function ExamResultScreen({ results, onRetake, onHome }) {
  const {
    mode,
    correct,
    wrong,
    skipped,
    total,
    timeLeft,
    subjectBreakdown, // [{ title, correct, wrong, total }]
    hasTimer,
  } = results;

  const isFlashcards = mode === "flashcards";
  const correctLabel = isFlashcards ? "Knew It" : "Correct";
  const wrongLabel = isFlashcards ? "Didn't Know" : "Wrong";

  const percent = Math.round((correct / total) * 100);

  // Entrance animation — fade + slide up, matching the flip-card's
  // motion quality rather than just popping content in instantly.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  // Count-up animation for the big percentage, 0 -> actual score.
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const duration = 700;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayPercent(Math.round(progress * percent));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4D79FF", "#2346B8"]} style={styles.header}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: "center",
            width: "100%",
          }}
        >
          <Text style={styles.completedLabel}>
            {isFlashcards ? "Flashcards Completed" : "Exam Completed"}
          </Text>

          <Text style={styles.scoreFraction}>
            {correct} out of {total}
          </Text>

          <Text style={styles.scorePercent}>{displayPercent}%</Text>

          <Text style={styles.motivation}>{getMotivation(percent)}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{correct}</Text>
              <Text style={styles.statLabel}>{correctLabel}</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{wrong}</Text>
              <Text style={styles.statLabel}>{wrongLabel}</Text>
            </View>

            {!isFlashcards && (
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{skipped}</Text>
                <Text style={styles.statLabel}>Skipped</Text>
              </View>
            )}

            {hasTimer && (
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatTime(timeLeft)}</Text>
                <Text style={styles.statLabel}>Time Left</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Scores By Subject</Text>

        {subjectBreakdown.map((s, i) => {
          const subjPercent = Math.round((s.correct / s.total) * 100);
          const status = getStatus(subjPercent);

          return (
            <View key={i} style={styles.subjectCard}>
              <View style={styles.subjectHeaderRow}>
                <Text style={styles.subjectTitle}>{s.title}</Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.subjectPercent}>{subjPercent}%</Text>
                  <View
                    style={[styles.statusPill, { backgroundColor: status.bg }]}
                  >
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.subjectTrack}>
                <View
                  style={[
                    styles.subjectFill,
                    { width: `${subjPercent}%`, backgroundColor: status.color },
                  ]}
                />
              </View>

              <View style={styles.subjectFooterRow}>
                <Text style={styles.subjectFooterText}>
                  {correctLabel}: {s.correct}
                </Text>
                <Text style={styles.subjectFooterText}>
                  {wrongLabel}: {s.wrong}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.retakeBtn} onPress={onRetake}>
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={onHome}>
          <Text style={styles.homeText}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  header: {
    paddingTop: 60,
    paddingBottom: 26,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  completedLabel: {
    color: "#DDE7FF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },

  scoreFraction: {
    color: "#fff",
    fontSize: 15,
    marginTop: 10,
    opacity: 0.9,
  },

  scorePercent: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "800",
    marginTop: 4,
  },

  motivation: {
    color: "#DDE7FF",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statNumber: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  statLabel: {
    color: "#DDE7FF",
    fontSize: 11,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14143A",
    marginBottom: 14,
  },

  subjectCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  subjectHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  subjectTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#14143A",
  },

  subjectPercent: {
    fontSize: 13,
    fontWeight: "700",
    color: "#14143A",
    marginRight: 8,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  subjectTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EEF2FF",
    overflow: "hidden",
  },

  subjectFill: {
    height: 8,
    borderRadius: 4,
  },

  subjectFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  subjectFooterText: {
    fontSize: 12,
    color: "#7D8FB3",
  },

  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEF2FF",
    backgroundColor: "#fff",
  },

  retakeBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
  },

  retakeText: {
    color: "#386BF6",
    fontWeight: "700",
    fontSize: 15,
  },

  homeBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
  },

  homeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});