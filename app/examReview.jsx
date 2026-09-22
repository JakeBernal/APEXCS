import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { getAttemptReviewDetails, PASS_THRESHOLD } from "../lib/attempts";

const COLORS = {
  primary: "#386BF6",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  muted: "#7D8FB3",
  border: "#EEF1F5",
  success: "#22C55E",
  successBg: "#F0FDF4",
  successBorder: "#86EFAC",
  successText: "#15803D",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FCA5A5",
  dangerText: "#B91C1C",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  warningBorder: "#FDE68A",
  warningText: "#B45309",
};

const CHOICE_LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function ExamReview() {
  const { attemptId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" | "wrong" | "correct" | "skipped"

  const loadData = useCallback(async () => {
    if (!attemptId) {
      setError("No attempt ID provided.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAttemptReviewDetails(attemptId);
      setAttempt(data.attempt);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("Failed to load exam review:", err);
      setError("Unable to load exam review answers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let wrong = 0;
    let correct = 0;
    let skipped = 0;

    questions.forEach((q) => {
      if (q.status === "wrong") wrong++;
      else if (q.status === "correct") correct++;
      else if (q.status === "skipped") skipped++;
    });

    return {
      all: questions.length,
      wrong,
      correct,
      skipped,
    };
  }, [questions]);

  // Filtered question set
  const filteredQuestions = useMemo(() => {
    if (filter === "wrong") return questions.filter((q) => q.status === "wrong");
    if (filter === "correct") return questions.filter((q) => q.status === "correct");
    if (filter === "skipped") return questions.filter((q) => q.status === "skipped");
    return questions;
  }, [questions, filter]);

  // Level & score details
  const score = attempt?.score ?? 0;
  const isPassed = score >= PASS_THRESHOLD;
  const levelLabel =
    attempt?.level === "professional" ? "Professional" : "Sub-Professional";
  const title = attempt?.subject_title || "Full Mock Exam";

  const renderQuestionItem = ({ item }) => {
    const isCorrect = item.status === "correct";
    const isWrong = item.status === "wrong";
    const isSkipped = item.status === "skipped";

    return (
      <View style={styles.questionCard}>
        {/* QUESTION CARD HEADER */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.questionNumText}>
              Question {item.questionNumber} of {questions.length}
            </Text>
            {item.chapter ? (
              <View style={styles.chapterBadge}>
                <Text style={styles.chapterBadgeText} numberOfLines={1}>
                  {item.chapter}
                </Text>
              </View>
            ) : null}
          </View>

          {/* STATUS PILL */}
          {isCorrect && (
            <View style={[styles.statusPill, { backgroundColor: COLORS.successBg }]}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={[styles.statusPillText, { color: COLORS.successText }]}>
                Correct
              </Text>
            </View>
          )}

          {isWrong && (
            <View style={[styles.statusPill, { backgroundColor: COLORS.dangerBg }]}>
              <Ionicons name="close-circle" size={14} color={COLORS.danger} />
              <Text style={[styles.statusPillText, { color: COLORS.dangerText }]}>
                Incorrect
              </Text>
            </View>
          )}

          {isSkipped && (
            <View style={[styles.statusPill, { backgroundColor: COLORS.warningBg }]}>
              <Ionicons name="remove-circle" size={14} color={COLORS.warning} />
              <Text style={[styles.statusPillText, { color: COLORS.warningText }]}>
                Skipped
              </Text>
            </View>
          )}
        </View>

        {/* QUESTION TEXT */}
        <Text style={styles.questionPrompt}>{item.questionText}</Text>

        {/* CHOICES LIST */}
        <View style={styles.choicesList}>
          {item.choices.map((choice, choiceIdx) => {
            const letter = CHOICE_LETTERS[choiceIdx] || `${choiceIdx + 1}`;
            const isUserPick = item.selectedChoiceId === choice.id;
            const isChoiceCorrect = choice.id === item.correctChoiceId;

            let rowStyle = styles.choiceRow;
            let letterBg = "#F1F5F9";
            let letterColor = "#475569";
            let textColor = COLORS.text;
            let badgeComponent = null;

            if (isChoiceCorrect) {
              // Correct Choice styling
              rowStyle = [styles.choiceRow, styles.choiceCorrectRow];
              letterBg = "#DCFCE7";
              letterColor = COLORS.successText;
              textColor = "#14532D";
              badgeComponent = (
                <View style={styles.choiceCorrectBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  <Text style={styles.choiceBadgeText}>Correct</Text>
                </View>
              );
            } else if (isUserPick && !isChoiceCorrect) {
              // User's wrong pick styling
              rowStyle = [styles.choiceRow, styles.choiceWrongRow];
              letterBg = "#FEE2E2";
              letterColor = COLORS.dangerText;
              textColor = "#7F1D1D";
              badgeComponent = (
                <View style={styles.choiceWrongBadge}>
                  <Ionicons name="close" size={12} color="#FFFFFF" />
                  <Text style={styles.choiceBadgeText}>Your Answer</Text>
                </View>
              );
            }

            return (
              <View key={choice.id || choiceIdx} style={rowStyle}>
                <View style={[styles.choiceLetterCircle, { backgroundColor: letterBg }]}>
                  <Text style={[styles.choiceLetterText, { color: letterColor }]}>
                    {letter}
                  </Text>
                </View>

                <Text style={[styles.choiceText, { color: textColor }]}>
                  {choice.choice_text}
                </Text>

                {badgeComponent}
              </View>
            );
          })}
        </View>

        {/* EXPLANATION CALLOUT */}
        {item.explanation && item.explanation.trim() !== "" ? (
          <View style={styles.explanationBox}>
            <View style={styles.explanationHeader}>
              <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
              <Text style={styles.explanationTitle}>Explanation</Text>
            </View>
            <Text style={styles.explanationBody}>{item.explanation}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "bottom"]}>
      {/* ================= TOP HEADER ================= */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back to History"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {levelLabel} • Exam Review
          </Text>
        </View>

        {attempt ? (
          <View
            style={[
              styles.scorePill,
              { backgroundColor: isPassed ? "#E1F7E6" : "#FDE0E0" },
            ]}
          >
            <Text
              style={[
                styles.scorePillText,
                { color: isPassed ? "#2FA84F" : "#D44A4A" },
              ]}
            >
              {score}%
            </Text>
          </View>
        ) : null}
      </View>

      {/* ================= FILTER PILLS BAR ================= */}
      {!loading && !error && questions.length > 0 ? (
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterPill, filter === "all" && styles.filterPillActive]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "all" && styles.filterPillTextActive,
              ]}
            >
              All ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === "wrong" && styles.filterPillWrongActive,
            ]}
            onPress={() => setFilter("wrong")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "wrong" && styles.filterPillWrongTextActive,
              ]}
            >
              Incorrect ({counts.wrong})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === "correct" && styles.filterPillCorrectActive,
            ]}
            onPress={() => setFilter("correct")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "correct" && styles.filterPillCorrectTextActive,
              ]}
            >
              Correct ({counts.correct})
            </Text>
          </TouchableOpacity>

          {counts.skipped > 0 ? (
            <TouchableOpacity
              style={[
                styles.filterPill,
                filter === "skipped" && styles.filterPillSkippedActive,
              ]}
              onPress={() => setFilter("skipped")}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filter === "skipped" && styles.filterPillSkippedTextActive,
                ]}
              >
                Skipped ({counts.skipped})
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* ================= CONTENT BODY ================= */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading exam questions...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="document-text-outline" size={48} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>No Answer Details Found</Text>
          <Text style={styles.emptySubtitle}>
            Detailed question logs were not recorded for this exam session.
          </Text>
        </View>
      ) : filteredQuestions.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.success} />
          <Text style={styles.emptyTitle}>
            {filter === "wrong"
              ? "No Incorrect Questions!"
              : filter === "skipped"
              ? "No Skipped Questions"
              : "No questions in this filter."}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === "wrong"
              ? "Great job! You answered every question correctly."
              : "Try switching back to 'All' to review the entire exam."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredQuestions}
          keyExtractor={(item) => String(item.id || item.questionNumber)}
          renderItem={renderQuestionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
  },

  headerMeta: {
    flex: 1,
    marginLeft: 4,
    marginRight: 8,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  headerSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },

  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  scorePillText: {
    fontSize: 13,
    fontWeight: "700",
  },

  /* FILTER BAR */
  filterBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },

  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },

  filterPillActive: {
    backgroundColor: COLORS.primary,
  },

  filterPillWrongActive: {
    backgroundColor: COLORS.danger,
  },

  filterPillCorrectActive: {
    backgroundColor: COLORS.success,
  },

  filterPillSkippedActive: {
    backgroundColor: COLORS.warning,
  },

  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  filterPillTextActive: {
    color: "#FFFFFF",
  },

  filterPillWrongTextActive: {
    color: "#FFFFFF",
  },

  filterPillCorrectTextActive: {
    color: "#FFFFFF",
  },

  filterPillSkippedTextActive: {
    color: "#FFFFFF",
  },

  /* QUESTION LIST */
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },

  questionNumText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  chapterBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF3FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },

  chapterBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  questionPrompt: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 14,
  },

  /* CHOICES */
  choicesList: {
    gap: 8,
  },

  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  choiceCorrectRow: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.successBorder,
  },

  choiceWrongRow: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },

  choiceLetterCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  choiceLetterText: {
    fontSize: 12,
    fontWeight: "700",
  },

  choiceText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  },

  choiceCorrectBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    marginLeft: 8,
  },

  choiceWrongBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.danger,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    marginLeft: 8,
  },

  choiceBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  /* EXPLANATION CALLOUT */
  explanationBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  explanationTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  explanationBody: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 19,
  },

  /* CENTER STATES */
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.muted,
  },

  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.danger,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
});
