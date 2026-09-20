import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  getCategoryConfig,
  getChapterConfig,
  PASS_THRESHOLD,
  WEAK_THRESHOLD,
} from "../lib/curriculum";
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

function getMasteryInfo(percent, attempted) {
  if (attempted === 0 || percent === null || percent === undefined) {
    return {
      label: "Not Started",
      color: "#94A3B8",
      bg: "#F1F5F9",
      icon: "help-circle-outline",
    };
  }
  if (percent >= PASS_THRESHOLD) {
    return {
      label: "Mastered",
      color: "#22C55E",
      bg: "#DCFCE7",
      icon: "checkmark-circle-outline",
    };
  }
  if (percent < WEAK_THRESHOLD) {
    return {
      label: "Needs Work",
      color: "#EF4444",
      bg: "#FEE2E2",
      icon: "alert-circle-outline",
    };
  }
  return {
    label: "In Progress",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "trending-up-outline",
  };
}

export default function ChapterDetails() {
  const {
    category: categoryParam,
    chapter: chapterParam,
    level: levelParam,
  } = useLocalSearchParams();

  const level = levelParam === "sub" ? "sub" : "professional";
  const categoryConfig = getCategoryConfig(level, categoryParam);
  const chapterConfig = getChapterConfig(level, categoryParam, chapterParam);

  const [, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [questionCounts, setQuestionCounts] = useState(null);

  // Active exam session state
  const [activeSession, setActiveSession] = useState(false);
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
      console.error("Failed to load chapter details data:", err);
    } finally {
      setLoading(false);
    }
  }, [level]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (!categoryConfig || !chapterConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Topic / Chapter Not Found</Text>
          <Text style={styles.errorSubtitle}>
            We couldn&apos;t find details for {chapterParam || "this chapter"}.
          </Text>
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

  // Extract stats for this specific chapter
  const catStats = summaryData?.categoryStats?.[categoryConfig.title] || null;
  const chapStats = catStats?.chapters?.find(
    (c) => c.title.toLowerCase() === chapterConfig.title.toLowerCase()
  );

  const chapterMastery = chapStats?.percent ?? null;
  const chapterAttempted = chapStats?.totalAttempted ?? 0;
  const chapterCorrect = chapStats?.totalCorrect ?? 0;
  const chapterWrong = chapStats?.totalWrong ?? 0;

  const totalQuestionsInChapter =
    questionCounts?.byChapter?.[chapterConfig.title] || 0;

  const statusInfo = getMasteryInfo(chapterMastery, chapterAttempted);

  const handleStartPractice = (mode = "timed") => {
    setSelectedMode(mode);
    setActiveSession(true);
  };

  // If in an active exam session, render ExamSession
  if (activeSession) {
    return (
      <ExamSession
        subject={categoryConfig}
        chapter={chapterConfig}
        level={level}
        mode={selectedMode}
        onExit={() => {
          setActiveSession(false);
          loadData();
        }}
      />
    );
  }

  // Other chapters in the same category for easy switching
  const siblingChapters = categoryConfig.chapters.filter(
    (c) => c.title.toLowerCase() !== chapterConfig.title.toLowerCase()
  );

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

        <View style={styles.navTitleContainer}>
          <Text style={styles.navCategoryName} numberOfLines={1}>
            {categoryConfig.title}
          </Text>
          <Text style={styles.navTitle} numberOfLines={1}>
            {chapterConfig.title}
          </Text>
        </View>

        <View style={styles.navPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* HERO CARD */}
        <LinearGradient
          colors={["#3B82F6", "#1D4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* TOP TAGS */}
          <View style={styles.heroHeader}>
            <View style={styles.parentCatTag}>
              <MaterialCommunityIcons
                name={categoryConfig.icon || "book-open-page-variant"}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.parentCatText} numberOfLines={1}>
                {categoryConfig.shortTitle || categoryConfig.title}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.bg },
              ]}
            >
              <Ionicons
                name={statusInfo.icon}
                size={13}
                color={statusInfo.color}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* TITLE & DESCRIPTION */}
          <Text style={styles.heroTitle}>{chapterConfig.title}</Text>
          <Text style={styles.heroSubtitle}>{chapterConfig.description}</Text>

          {/* MASTERY DISPLAY */}
          <View style={styles.masteryContainer}>
            <View style={styles.masteryCol}>
              <Text style={styles.masteryNumber}>
                {chapterAttempted > 0 && chapterMastery !== null
                  ? `${chapterMastery}%`
                  : "Not Started"}
              </Text>
              <Text style={styles.masteryLabel}>Chapter Mastery</Text>
            </View>

            <View style={styles.masteryDivider} />

            <View style={styles.masteryCol}>
              <Text style={styles.masteryNumber}>
                {chapterAttempted}
                {totalQuestionsInChapter > 0
                  ? ` / ${totalQuestionsInChapter}`
                  : ""}
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
                  width: `${Math.min(chapterMastery ?? 0, 100)}%`,
                  backgroundColor:
                    chapterAttempted === 0
                      ? "#94A3B8"
                      : chapterMastery >= PASS_THRESHOLD
                      ? "#4ADE80"
                      : chapterMastery < WEAK_THRESHOLD
                      ? "#F87171"
                      : "#FBBF24",
                },
              ]}
            />
          </View>
        </LinearGradient>

        {/* ACCURACY SUMMARY CARD */}
        <View style={styles.accuracyCard}>
          <View style={styles.accuracyItem}>
            <Text style={[styles.accuracyNum, { color: COLORS.success }]}>
              {chapterCorrect}
            </Text>
            <Text style={styles.accuracyLabel}>Correct</Text>
          </View>

          <View style={styles.accuracyDivider} />

          <View style={styles.accuracyItem}>
            <Text style={[styles.accuracyNum, { color: COLORS.danger }]}>
              {chapterWrong}
            </Text>
            <Text style={styles.accuracyLabel}>Incorrect</Text>
          </View>

          <View style={styles.accuracyDivider} />

          <View style={styles.accuracyItem}>
            <Text style={styles.accuracyNum}>
              {chapterAttempted > 0
                ? `${Math.round((chapterCorrect / chapterAttempted) * 100)}%`
                : "—"}
            </Text>
            <Text style={styles.accuracyLabel}>Accuracy</Text>
          </View>
        </View>

        {/* PRACTICE OPTIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Practice This Chapter</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a mode tailored to your study goal
          </Text>
        </View>

        <View style={styles.modesContainer}>
          {/* TIMED MODE */}
          <TouchableOpacity
            style={styles.modeCard}
            activeOpacity={0.8}
            onPress={() => handleStartPractice("timed")}
          >
            <View style={[styles.modeIconBox, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="timer-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.modeTitleRow}>
                <Text style={styles.modeTitle}>Timed Practice</Text>
                <View style={styles.modeBadge}>
                  <Text style={styles.modeBadgeText}>40 Mins</Text>
                </View>
              </View>
              <Text style={styles.modeDesc}>
                Practice under exam conditions with a 40-minute countdown timer (max 30 items).
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          {/* REVIEW MODE */}
          <TouchableOpacity
            style={styles.modeCard}
            activeOpacity={0.8}
            onPress={() => handleStartPractice("review")}
          >
            <View style={[styles.modeIconBox, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons
                name="book-open-outline"
                size={24}
                color={COLORS.success}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.modeTitleRow}>
                <Text style={styles.modeTitle}>Review Mode</Text>
                <View style={[styles.modeBadge, { backgroundColor: "#DCFCE7" }]}>
                  <Text style={[styles.modeBadgeText, { color: COLORS.success }]}>
                    Explanations
                  </Text>
                </View>
              </View>
              <Text style={styles.modeDesc}>
                No timer. See instant answers and detailed rationales.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          {/* FLASHCARDS */}
          <TouchableOpacity
            style={styles.modeCard}
            activeOpacity={0.8}
            onPress={() => handleStartPractice("flashcard")}
          >
            <View style={[styles.modeIconBox, { backgroundColor: "#FEF3C7" }]}>
              <MaterialCommunityIcons
                name="cards-outline"
                size={24}
                color={COLORS.warning}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.modeTitleRow}>
                <Text style={styles.modeTitle}>Flashcards</Text>
                <View style={[styles.modeBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.modeBadgeText, { color: COLORS.warning }]}>
                    Active Recall
                  </Text>
                </View>
              </View>
              <Text style={styles.modeDesc}>
                Quickly test your retention by flipping question cards.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* CIVIL SERVICE EXAM CONTEXT & TIPS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Civil Service Study Notes</Text>
          <Text style={styles.sectionSubtitle}>
            Key topics tested under this chapter
          </Text>
        </View>

        <View style={styles.notesCard}>
          <View style={styles.notesRow}>
            <Ionicons
              name="pie-chart-outline"
              size={18}
              color={COLORS.primary}
              style={{ marginTop: 2 }}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.notesItemTitle}>Category Exam Weight</Text>
              <Text style={styles.notesItemDesc}>
                {categoryConfig.title} represents {categoryConfig.estimatedWeightLabel}.
                Mastering this chapter helps build a reliable foundation.
              </Text>
            </View>
          </View>

          <View style={styles.notesDivider} />

          <View style={styles.notesRow}>
            <Ionicons
              name="school-outline"
              size={18}
              color={COLORS.primary}
              style={{ marginTop: 2 }}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.notesItemTitle}>Preparation Recommendation</Text>
              <Text style={styles.notesItemDesc}>
                Aim for at least {PASS_THRESHOLD}% chapter mastery before taking
                the full timed mock examination.
              </Text>
            </View>
          </View>
        </View>

        {/* SIBLING CHAPTERS */}
        {siblingChapters.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Other Chapters in {categoryConfig.shortTitle || categoryConfig.title}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Continue exploring topics in this category
              </Text>
            </View>

            {siblingChapters.map((sib, index) => {
              const sibChapStats = catStats?.chapters?.find(
                (c) => c.title.toLowerCase() === sib.title.toLowerCase()
              );
              const sibMastery = sibChapStats?.percent ?? null;
              const sibAttempted = sibChapStats?.totalAttempted ?? 0;
              const sibInfo = getMasteryInfo(sibMastery, sibAttempted);

              return (
                <TouchableOpacity
                  key={sib.id || index}
                  style={styles.siblingCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "/chapterDetails",
                      params: {
                        category: categoryConfig.title,
                        chapter: sib.title,
                        level,
                      },
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.siblingTitle}>{sib.title}</Text>
                    <Text style={styles.siblingDesc} numberOfLines={1}>
                      {sib.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.siblingBadge,
                      { backgroundColor: sibInfo.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.siblingBadgeText,
                        { color: sibInfo.color },
                      ]}
                    >
                      {sibAttempted > 0 && sibMastery !== null
                        ? `${sibMastery}%`
                        : "Not Started"}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.muted}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  navTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  navCategoryName: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  navPlaceholder: {
    width: 40,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  parentCatTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  parentCatText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#DBEAFE",
    lineHeight: 18,
    marginBottom: 18,
  },
  masteryContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  masteryCol: {
    flex: 1,
  },
  masteryNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  masteryLabel: {
    fontSize: 11,
    color: "#BFDBFE",
    marginTop: 2,
    fontWeight: "500",
  },
  masteryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 14,
  },
  heroProgressBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
  },
  heroProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  accuracyCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  accuracyItem: {
    flex: 1,
    alignItems: "center",
  },
  accuracyNum: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  accuracyLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
    fontWeight: "500",
  },
  accuracyDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  modesContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  modeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    marginRight: 8,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  modeBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  modeDesc: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
  },
  notesCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notesItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  notesItemDesc: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
  },
  notesDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  siblingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  siblingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  siblingDesc: {
    fontSize: 11,
    color: COLORS.muted,
  },
  siblingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 10,
  },
  siblingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
