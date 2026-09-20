import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { getCategoryConfig } from "../lib/curriculum";
import { getDashboardSummary } from "../lib/attempts";
import { getQuestionCounts } from "../lib/examData";
import ExamSession from "./ExamSession";

const COLORS = {
  primary: "#386BF6",
  secondary: "#1F46C7",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  muted: "#7D8FB3",
  border: "#EEF1F5",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
};

function getMasteryColor(percent) {
  if (percent === null || percent === undefined) return "#94A3B8";
  if (percent >= 80) return "#22C55E";
  if (percent >= 70) return "#84CC16";
  if (percent >= 50) return "#EAB308";
  return "#EF4444";
}

export default function CategoryDetails() {
  const { category: categoryParam, level: levelParam } = useLocalSearchParams();
  const level = levelParam === "sub" ? "sub" : "professional";
  const categoryConfig = getCategoryConfig(level, categoryParam);

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [questionCounts, setQuestionCounts] = useState(null);

  // Active exam session state
  const [activeSession, setActiveSession] = useState(false);
  const [selectedPracticeChapter, setSelectedPracticeChapter] = useState(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState("timed");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, countsRes] = await Promise.all([
        getDashboardSummary(level),
        getQuestionCounts(level),
      ]);
      setSummaryData(summaryRes);
      setQuestionCounts(countsRes);
    } catch (err) {
      console.error("Failed to load category details data:", err);
    } finally {
      setLoading(false);
    }
  }, [level]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (!categoryConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Category Not Found</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Extract category and chapter stats
  const catStats = summaryData?.categoryStats?.[categoryConfig.title] || null;
  const categoryMastery = catStats?.percent ?? null;
  const categoryAttempted = catStats?.totalAttempted ?? 0;
  const categoryCorrect = catStats?.totalCorrect ?? 0;
  const categoryWrong = catStats?.totalWrong ?? 0;

  const totalQuestionsInCategory =
    questionCounts?.byCategory?.[categoryConfig.title] || 0;

  const handleStartPractice = (chapter = null) => {
    setSelectedPracticeChapter(chapter);
    setShowModeModal(true);
  };

  const handleConfirmMode = () => {
    setShowModeModal(false);
    setActiveSession(true);
  };

  // If in an active exam session, render ExamSession
  if (activeSession) {
    return (
      <ExamSession
        subject={categoryConfig}
        chapter={selectedPracticeChapter}
        level={level}
        mode={selectedMode}
        onExit={() => {
          setActiveSession(false);
          setSelectedPracticeChapter(null);
          loadData();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" backgroundColor={COLORS.bg} />

      {/* TOP NAVBAR */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.navTitle} numberOfLines={1}>
          {categoryConfig.title}
        </Text>

        <View style={styles.navPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* HERO CARD */}
        <LinearGradient
          colors={["#4D7CFF", "#2447B8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons
                name={categoryConfig.icon || "book-open-page-variant"}
                size={26}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {level === "professional" ? "Professional" : "Sub-Professional"}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{categoryConfig.title}</Text>
          <Text style={styles.heroSubtitle}>{categoryConfig.description}</Text>

          {/* ESTIMATED WEIGHT BADGE */}
          <View style={styles.weightPill}>
            <Ionicons name="information-circle-outline" size={14} color="#DDE6FF" />
            <Text style={styles.weightPillText}>
              {categoryConfig.estimatedWeightLabel}
            </Text>
          </View>

          {/* MASTERY METRIC */}
          <View style={styles.masteryRow}>
            <View>
              <Text style={styles.masteryNumber}>
                {categoryMastery !== null ? `${categoryMastery}%` : "Not Started"}
              </Text>
              <Text style={styles.masteryLabel}>Overall Mastery</Text>
            </View>

            <View style={styles.heroStatsDivider} />

            <View>
              <Text style={styles.masteryNumber}>
                {categoryAttempted}
                {totalQuestionsInCategory > 0 ? ` / ${totalQuestionsInCategory}` : ""}
              </Text>
              <Text style={styles.masteryLabel}>Questions Attempted</Text>
            </View>
          </View>

          {/* PROGRESS BAR */}
          <View style={styles.heroProgressBg}>
            <View
              style={[
                styles.heroProgressFill,
                {
                  width: `${Math.min(categoryMastery ?? 0, 100)}%`,
                  backgroundColor:
                    categoryMastery !== null ? "#A7F3B5" : "#94A3B8",
                },
              ]}
            />
          </View>

          {/* PRACTICE CATEGORY BUTTON */}
          <TouchableOpacity
            style={styles.heroPracticeBtn}
            onPress={() => handleStartPractice(null)}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={18} color={COLORS.primary} />
            <Text style={styles.heroPracticeBtnText}>
              Practice Entire Category
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ACCURACY COUNTS ROW */}
        <View style={styles.accuracyCard}>
          <View style={styles.accuracyItem}>
            <Text style={[styles.accuracyNum, { color: COLORS.success }]}>
              {categoryCorrect}
            </Text>
            <Text style={styles.accuracyLabel}>Correct</Text>
          </View>

          <View style={styles.accuracyDivider} />

          <View style={styles.accuracyItem}>
            <Text style={[styles.accuracyNum, { color: COLORS.danger }]}>
              {categoryWrong}
            </Text>
            <Text style={styles.accuracyLabel}>Incorrect</Text>
          </View>

          <View style={styles.accuracyDivider} />

          <View style={styles.accuracyItem}>
            <Text style={styles.accuracyNum}>
              {categoryConfig.chapters.length}
            </Text>
            <Text style={styles.accuracyLabel}>Chapters</Text>
          </View>
        </View>

        {/* CHAPTERS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Chapters ({categoryConfig.chapters.length})
          </Text>
          <Text style={styles.sectionSubtitle}>
            Practice individual topics to build targeted strength
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 24 }}
          />
        ) : (
          categoryConfig.chapters.map((chapter, index) => {
            const chapStats = catStats?.chapters?.find(
              (c) => c.title.toLowerCase() === chapter.title.toLowerCase()
            );

            const mastery = chapStats?.percent ?? null;
            const attempted = chapStats?.totalAttempted ?? 0;
            const correct = chapStats?.totalCorrect ?? 0;
            const mColor = getMasteryColor(mastery);

            return (
              <View key={chapter.id || index} style={styles.chapterCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "/chapterDetails",
                      params: {
                        category: categoryConfig.title,
                        chapter: chapter.title,
                        level,
                      },
                    })
                  }
                >
                  <View style={styles.chapterTopRow}>
                    <View style={styles.chapterNumberBadge}>
                      <Text style={styles.chapterNumberText}>{index + 1}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.chapterTitle}>{chapter.title}</Text>
                      <Text style={styles.chapterDesc} numberOfLines={2}>
                        {chapter.description}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.chapterMasteryBadge,
                        { backgroundColor: `${mColor}18` },
                      ]}
                    >
                      <Text style={[styles.chapterMasteryText, { color: mColor }]}>
                        {mastery !== null ? `${mastery}%` : "Not Started"}
                      </Text>
                    </View>
                  </View>

                  {/* PROGRESS BAR */}
                  <View style={styles.chapterProgressBg}>
                    <View
                      style={[
                        styles.chapterProgressFill,
                        {
                          width: `${Math.min(mastery ?? 0, 100)}%`,
                          backgroundColor: mColor,
                        },
                      ]}
                    />
                  </View>

                  {/* FOOTER & BUTTONS */}
                  <View style={styles.chapterFooter}>
                    <Text style={styles.chapterAttemptText}>
                      {attempted > 0
                        ? `${correct} / ${attempted} correct`
                        : "0 questions attempted"}
                    </Text>

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={styles.chapterDetailsBtn}
                        onPress={() =>
                          router.push({
                            pathname: "/chapterDetails",
                            params: {
                              category: categoryConfig.title,
                              chapter: chapter.title,
                              level,
                            },
                          })
                        }
                      >
                        <Text style={styles.chapterDetailsBtnText}>Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.chapterPracticeBtn}
                        onPress={() => handleStartPractice(chapter)}
                      >
                        <Text style={styles.chapterPracticeBtnText}>Practice</Text>
                        <Ionicons name="arrow-forward" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODE SELECTION MODAL */}
      <Modal
        visible={showModeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Practice Mode</Text>
              <TouchableOpacity onPress={() => setShowModeModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedPracticeChapter
                ? `Practicing: ${selectedPracticeChapter.title} (Max 30 items · 40 mins)`
                : `Practicing: All ${categoryConfig.title} (Max 50 items · 1 hr)`}
            </Text>

            {/* MODE OPTIONS */}
            <View style={styles.modeTabs}>
              {["timed", "review", "flashcards"].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeTab,
                    selectedMode === mode && styles.modeTabActive,
                  ]}
                  onPress={() => setSelectedMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      selectedMode === mode && styles.modeTabTextActive,
                    ]}
                  >
                    {mode === "timed"
                      ? "Timed"
                      : mode === "review"
                      ? "Review"
                      : "Flashcards"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modeDesc}>
              {selectedMode === "timed"
                ? selectedPracticeChapter
                  ? "Timed 40-minute practice session (max 30 items) simulating exam conditions."
                  : "Timed 1-hour practice session (max 50 items) simulating exam conditions."
                : selectedMode === "review"
                ? "Self-paced study mode with instant answers and explanations."
                : "Quick-flip flashcard review to memorize key concepts rapidly."}
            </Text>

            <TouchableOpacity
              style={styles.modalStartBtn}
              onPress={handleConfirmMode}
            >
              <Text style={styles.modalStartBtnText}>Start Practice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    maxWidth: "70%",
    textAlign: "center",
  },
  navPlaceholder: {
    width: 40,
  },
  heroCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 22,
    padding: 22,
    elevation: 6,
    shadowColor: "#2B49B9",
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  heroIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#DDE6FF",
    lineHeight: 18,
    marginBottom: 12,
  },
  weightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 16,
  },
  weightPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DDE6FF",
  },
  masteryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  heroStatsDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  masteryNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  masteryLabel: {
    fontSize: 11,
    color: "#DDE6FF",
    marginTop: 2,
    textAlign: "center",
  },
  heroProgressBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    overflow: "hidden",
    marginVertical: 14,
  },
  heroProgressFill: {
    height: "100%",
    borderRadius: 6,
  },
  heroPracticeBtn: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
  },
  heroPracticeBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  accuracyCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  accuracyItem: {
    alignItems: "center",
    flex: 1,
  },
  accuracyNum: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  accuracyLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    fontWeight: "600",
  },
  accuracyDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  chapterCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  chapterTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  chapterNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
  },
  chapterDesc: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
  },
  chapterMasteryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  chapterMasteryText: {
    fontSize: 12,
    fontWeight: "800",
  },
  chapterProgressBg: {
    height: 6,
    backgroundColor: "#EEF2FF",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 14,
    marginBottom: 10,
  },
  chapterProgressFill: {
    height: "100%",
    borderRadius: 6,
  },
  chapterFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  chapterAttemptText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
  },
  chapterDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chapterDetailsBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  chapterPracticeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  chapterPracticeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 22,
    width: "100%",
    maxWidth: 360,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 16,
  },
  modeTabs: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  modeTabTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  modeDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 20,
    minHeight: 36,
  },
  modalStartBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalStartBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
