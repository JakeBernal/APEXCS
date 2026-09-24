import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { getDashboardSummary, resetUserProgress } from "../../lib/attempts";
import {
  getStudyReminders,
  isReminderDueToday,
  getTodayQuestionsProgress,
} from "../../lib/remindersHelper";
import {
  getAvatarSource,
  getUserAvatar,
} from "../../lib/avatarHelper";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#386BF6",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  muted: "#7D8FB3",
  border: "#EEF1F5",
};

const SPACING = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
};

const RADIUS = {
  sm: 14,
  md: 22,
  lg: 28,
};

const cards = [
  { id: "1", type: "progress" },
  { id: "2", type: "schedule" },
];

const EXAM_DATE = "2026-05-18T08:00:00";

/*
 * Subjects are different between the two Civil Service
 * exam levels.
 *
 * Professional:
 * - General Information
 * - Verbal Ability
 * - Numerical Ability
 * - Analytical Ability
 *
 * Sub-Professional:
 * - General Information
 * - Verbal Ability
 * - Numerical Ability
 * - Clerical Ability
 */
const SUBJECTS_BY_LEVEL = {
  professional: [
    "General Information",
    "Verbal Ability",
    "Numerical Ability",
    "Analytical Ability",
  ],

  sub: [
    "General Information",
    "Verbal Ability",
    "Numerical Ability",
    "Clerical Ability",
  ],
};

function getCountdown(targetDate) {
  const now = new Date();
  const diff = new Date(targetDate) - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const days = Math.floor(
    diff / (1000 * 60 * 60 * 24)
  );

  const hours = Math.floor(
    (diff / (1000 * 60 * 60)) % 24
  );

  const minutes = Math.floor(
    (diff / (1000 * 60)) % 60
  );

  return {
    days,
    hours,
    minutes,
  };
}

// Maps readiness percentage to a color band.
function getReadinessColor(percent) {
  if (percent < 25) return "#EC6666";
  if (percent < 50) return "#F0AE65";
  if (percent < 75) return "#D6DD55";
  return "#67C36D";
}

export default function Dashboard() {
  const { user, session, loading, signOut } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);

  const [countdown, setCountdown] = useState(
    getCountdown(EXAM_DATE)
  );

  // Professional / Sub-Professional selector
  const [selectedLevel, setSelectedLevel] = useState(
    "professional"
  );

  const [menuVisible, setMenuVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [avatarId, setAvatarId] = useState("avatar1");
  const [reminderSettings, setReminderSettings] = useState(null);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [dailyProgress, setDailyProgress] = useState({
    completed: 0,
    target: 20,
    percent: 0,
    isCompleted: false,
    remaining: 20,
    taskString: "0 out of 20 questions",
  });

  const flatListRef = useRef();

  const [summary, setSummary] = useState({
    examsTaken: 0,
    bestScore: 0,
    lastScore: 0,
    avgScore: 0,
    examReadiness: 0,
    subjectReadiness: [],
  });

  const [expandedSubjects, setExpandedSubjects] = useState({});

  const toggleSubjectExpand = (title) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  /*
   * Load dashboard data for the selected exam level.
   *
   * Professional and Sub-Professional are kept completely
   * separate.
   */
  const loadDashboard = async () => {
    try {
      const data = await getDashboardSummary(
        selectedLevel
      );

      setSummary(data);
    } catch (error) {
      console.error(
        "Failed to load dashboard summary:",
        error
      );
    }
  };

  /*
   * Refetch whenever:
   * - Dashboard becomes active again
   * - User switches exam level
   */
  useFocusEffect(
    React.useCallback(() => {
      loadDashboard();
      if (user?.id) {
        getUserAvatar(user.id).then((savedAvatar) => {
          if (savedAvatar) setAvatarId(savedAvatar);
        });
        getStudyReminders(user.id).then((data) => {
          if (data) {
            setReminderSettings(data);
            getTodayQuestionsProgress(user.id, data.goalQuestions).then(
              (prog) => {
                if (prog) setDailyProgress(prog);
              }
            );
          } else {
            getTodayQuestionsProgress(user.id, 20).then((prog) => {
              if (prog) setDailyProgress(prog);
            });
          }
        });
      }
    }, [selectedLevel, user?.id])
  );

  // Route guard: double check Supabase storage to prevent false bounce during OAuth redirects
  useEffect(() => {
    if (!loading && !session) {
      const verifySession = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (!data?.session) {
            router.replace("/login");
          }
        } catch {
          router.replace("/login");
        }
      };
      verifySession();
    }
  }, [loading, session]);

  // Countdown timer.
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown(EXAM_DATE));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const onScroll = (e) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / (width - 50)
    );

    setCurrentIndex(index);
  };

  // Logout
  const handleLogout = () => {
    setMenuVisible(false);

    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/login");
          },
        },
      ]
    );
  };

  // Reset exam progress
  const handleResetProgress = () => {
    Alert.alert(
      "Reset Exam Progress?",
      "This will permanently delete all your exam attempts, test scores, and chapter mastery. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            try {
              setResettingProgress(true);
              await resetUserProgress();
              setMenuVisible(false);
              setSettingsModalVisible(false);
              await loadDashboard();
              Alert.alert(
                "Progress Reset",
                "All your exam attempts and topic mastery have been reset to a clean slate."
              );
            } catch (err) {
              console.error("Failed to reset progress:", err);
              const isPermissionError =
                err?.code === "42501" ||
                err?.message?.toLowerCase().includes("permission denied");

              Alert.alert(
                "Reset Failed",
                isPermissionError
                  ? "Supabase permission denied: Please run the DELETE grant policy in your Supabase SQL Editor."
                  : "Could not reset progress. Please check your connection and try again."
              );
            } finally {
              setResettingProgress(false);
            }
          },
        },
      ]
    );
  };

  // Menu navigation
  const handleMenuNavigation = (route) => {
    setMenuVisible(false);
    router.push(route);
  };

  // Display name
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email ||
    "Welcome";

  // Friendly label for the selected level
  const selectedLevelLabel =
    selectedLevel === "professional"
      ? "Professional"
      : "Sub-Professional";

  /*
   * ============================================================
   * SUBJECT READINESS
   * ============================================================
   *
   * We don't simply render whatever subjects happen to exist
   * in the database.
   *
   * Instead, the Dashboard knows the official subjects for
   * the currently selected exam level.
   *
   * This prevents:
   *
   * Professional:
   * Analytical Ability
   *
   * from accidentally appearing for:
   *
   * Sub-Professional:
   * Clerical Ability
   *
   * It also means subjects with no attempts yet still appear
   * with 0%.
   */

  const selectedSubjects =
    SUBJECTS_BY_LEVEL[selectedLevel] || [];

  const dashboardSubjects = selectedSubjects.map(
    (subjectName) => {
      const existingSubject =
        summary.subjectReadiness?.find(
          (subject) =>
            subject.title?.trim().toLowerCase() ===
            subjectName.trim().toLowerCase()
        );

      return {
        title: subjectName,
        percent: existingSubject?.percent ?? 0,
        totalAttempted: existingSubject?.totalAttempted ?? 0,
        totalCorrect: existingSubject?.totalCorrect ?? 0,
        chapters: existingSubject?.chapters || [],
      };
    }
  );

  const renderCard = ({ item, index }) => {
    const isActive = index === currentIndex;

    if (item.type === "progress") {
      return (
        <LinearGradient
          colors={["#386BF6", "#152B65"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.progressCard,
            {
              transform: [
                {
                  scale: isActive ? 1 : 0.93,
                },
              ],
            },
          ]}
        >
          {/* TOP ROW */}

          <View style={styles.progressTopRow}>
            <Text style={styles.cardLabel}>
              Exam Readiness
            </Text>

            <View style={styles.examBadgeBlue}>
              <Text style={styles.examBadgeBlueText}>
                {selectedLevelLabel}
              </Text>
            </View>
          </View>

          {/* BIG SCORE */}

          <Text style={styles.bigScore}>
            {summary.examReadiness ??
              summary.avgScore}
            %
          </Text>

          <Text style={styles.avgScoreLabel}>
            {selectedLevelLabel} Readiness
          </Text>

          {/* HORIZONTAL PROGRESS BAR */}

          <View style={styles.hBarBg}>
            <View
              style={[
                styles.hBarFill,
                {
                  width: `${Math.min(
                    summary.examReadiness ??
                      summary.avgScore,
                    100
                  )}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.hBarHint}>
            Keep going! You need 80% to pass.
          </Text>

          {/* STATS ROW */}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {countdown.days}
              </Text>

              <Text style={styles.statUnit}>
                Days Left
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {summary.examsTaken}
              </Text>

              <Text style={styles.statUnit}>
                Mock Exams
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {summary.lastScore}%
              </Text>

              <Text style={styles.statUnit}>
                Last Score
              </Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    // Schedule card is currently disabled.
    return null;
  };

  // Avoid flashing dashboard before redirect.
  if (loading || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          style="dark"
          backgroundColor={COLORS.bg}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      {/* STATUS BAR */}

      <StatusBar
        style="dark"
        backgroundColor={COLORS.bg}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
      >
        {/* =====================================================
            HEADER
            ===================================================== */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View profile"
              style={styles.headerAvatarWrap}
            >
              <Image
                source={getAvatarSource(avatarId)}
                style={styles.headerAvatar}
                contentFit="cover"
              />
            </TouchableOpacity>

            <View style={{ marginLeft: 12 }}>
              <Text style={styles.welcome}>
                Welcome Back
              </Text>

              <Text style={styles.dashboard}>
                {displayName}
              </Text>
            </View>
          </View>

          {/* HAMBURGER BUTTON */}

          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons
              name="menu-outline"
              size={28}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* =====================================================
            EXAM LEVEL TOGGLE
            ===================================================== */}

        <View style={styles.levelSection}>
          <View style={styles.levelToggle}>
            {/* PROFESSIONAL */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.levelButton,
                selectedLevel === "professional" &&
                  styles.levelButtonActive,
              ]}
              onPress={() =>
                setSelectedLevel("professional")
              }
            >
              <Text
                style={[
                  styles.levelButtonText,
                  selectedLevel === "professional" &&
                    styles.levelButtonTextActive,
                ]}
              >
                Professional
              </Text>
            </TouchableOpacity>

            {/* SUB-PROFESSIONAL */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.levelButton,
                selectedLevel === "sub" &&
                  styles.levelButtonActive,
              ]}
              onPress={() =>
                setSelectedLevel("sub")
              }
            >
              <Text
                style={[
                  styles.levelButtonText,
                  selectedLevel === "sub" &&
                    styles.levelButtonTextActive,
                ]}
              >
                Sub-Professional
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =====================================================
            HERO CAROUSEL
            ===================================================== */}

        <FlatList
          ref={flatListRef}
          data={cards}
          renderItem={renderCard}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={onScroll}
          contentContainerStyle={{
            paddingHorizontal: 20,
          }}
        />

        {/* =====================================================
            DAILY STUDY TASK & REMINDER CARD
            ===================================================== */}
        {!reminderDismissed &&
          reminderSettings?.enabled &&
          isReminderDueToday(reminderSettings) && (
            <View style={styles.taskCard}>
              {/* Header row */}
              <View style={styles.taskHeaderRow}>
                <View style={styles.taskHeaderLeft}>
                  <View
                    style={[
                      styles.taskIconWrap,
                      dailyProgress.isCompleted && styles.taskIconWrapCompleted,
                    ]}
                  >
                    <Ionicons
                      name={
                        dailyProgress.isCompleted
                          ? "checkmark-circle"
                          : "notifications"
                      }
                      size={20}
                      color={
                        dailyProgress.isCompleted ? "#10B981" : COLORS.primary
                      }
                    />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.taskTitle}>Today's Study Goal</Text>
                    <Text style={styles.taskSubtitle}>
                      {reminderSettings.timeString} • Daily Practice
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.taskDismissBtn}
                  onPress={() => setReminderDismissed(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss task card"
                >
                  <Ionicons name="close" size={16} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              {/* Task progress info */}
              <View style={styles.taskProgressSection}>
                <View style={styles.taskMetaRow}>
                  <Text style={styles.taskProgressText}>
                    {dailyProgress.completed} out of {dailyProgress.target} questions
                  </Text>
                  <Text
                    style={[
                      styles.taskPercentText,
                      dailyProgress.isCompleted && styles.taskPercentTextCompleted,
                    ]}
                  >
                    {dailyProgress.percent}%
                  </Text>
                </View>

                {/* Progress Bar Track */}
                <View style={styles.taskTrack}>
                  <View
                    style={[
                      styles.taskFill,
                      {
                        width: `${Math.max(
                          dailyProgress.percent,
                          dailyProgress.completed > 0 ? 5 : 0
                        )}%`,
                      },
                      dailyProgress.isCompleted && styles.taskFillCompleted,
                    ]}
                  />
                </View>

                <View style={styles.taskFooterRow}>
                  <Text style={styles.taskHint}>
                    {dailyProgress.isCompleted
                      ? "🎉 Daily goal completed! Excellent work."
                      : `${dailyProgress.remaining} question${
                          dailyProgress.remaining === 1 ? "" : "s"
                        } left to reach today's target.`}
                  </Text>
                </View>
              </View>
            </View>
          )}

        {/* =====================================================
            SUBJECT READINESS
            ===================================================== */}

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>
              Subject Readiness
            </Text>

            <Text style={styles.sectionSubtitle}>
              {selectedLevelLabel} performance
            </Text>
          </View>
        </View>

        {dashboardSubjects.length === 0 && (
          <Text style={styles.emptyText}>
            Take a mock exam to see your readiness
            per subject.
          </Text>
        )}

        {dashboardSubjects.map((subject) => {
          const color = getReadinessColor(subject.percent);
          const isExpanded = !!expandedSubjects[subject.title];
          const hasChapters =
            Array.isArray(subject.chapters) && subject.chapters.length > 0;

          return (
            <View
              key={subject.title}
              style={styles.performanceCard}
            >
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => hasChapters && toggleSubjectExpand(subject.title)}
                accessibilityRole="button"
                accessibilityLabel={`${subject.title} readiness: ${subject.percent}%. ${
                  hasChapters
                    ? isExpanded
                      ? "Collapse topics"
                      : "Expand topics"
                    : ""
                }`}
                style={styles.performanceHeaderBtn}
              >
                <View style={styles.performanceRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.performanceLabel}>
                      {subject.title}
                    </Text>
                    {hasChapters && (
                      <Text style={styles.performanceSubCount}>
                        {subject.chapters.length} Topics • {isExpanded ? "Hide" : "View breakdown"}
                      </Text>
                    )}
                  </View>

                  <View style={styles.performanceRight}>
                    <Text
                      style={[
                        styles.performanceValue,
                        {
                          color,
                        },
                      ]}
                    >
                      {subject.percent}%
                    </Text>
                    {hasChapters && (
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={COLORS.muted}
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          subject.percent,
                          100
                        )}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {/* EXPANDABLE SUB-CATEGORIES ACCORDION */}
              {isExpanded && hasChapters && (
                <View style={styles.subCategoryContainer}>
                  <View style={styles.subCategoryDivider} />
                  <View style={styles.subCategoryHeaderRow}>
                    <Text style={styles.subCategoryHeaderTitle}>
                      Topic Breakdown
                    </Text>
                    <Text style={styles.subCategoryHeaderHint}>
                      Tap topic to practice ›
                    </Text>
                  </View>

                  {subject.chapters.map((ch, chIdx) => {
                    const isAttempted = (ch.totalAttempted ?? 0) > 0;
                    const chPercent = ch.percent;
                    const chColor =
                      isAttempted && chPercent !== null
                        ? getReadinessColor(chPercent)
                        : COLORS.muted;

                    return (
                      <TouchableOpacity
                        key={ch.id || `${ch.title}-${chIdx}`}
                        style={styles.subCategoryItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          router.push({
                            pathname: "/chapterDetails",
                            params: {
                              category: subject.title,
                              chapter: ch.title,
                              level: selectedLevel,
                            },
                          });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${ch.title}: ${
                          isAttempted && chPercent !== null
                            ? `${chPercent}%`
                            : "Not Started"
                        }. Tap to practice.`}
                      >
                        <View style={styles.subCategoryTopRow}>
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text
                              style={styles.subCategoryTitle}
                              numberOfLines={1}
                            >
                              {ch.title}
                            </Text>
                            <Text style={styles.subCategoryMeta}>
                              {isAttempted
                                ? `${ch.totalCorrect ?? 0}/${
                                    ch.totalAttempted ?? 0
                                  } correct`
                                : "Not started yet"}
                            </Text>
                          </View>

                          <View style={styles.subCategoryScoreWrap}>
                            <Text
                              style={[
                                styles.subCategoryPercentText,
                                {
                                  color: isAttempted
                                    ? chColor
                                    : COLORS.muted,
                                },
                              ]}
                            >
                              {isAttempted && chPercent !== null
                                ? `${chPercent}%`
                                : "Not Started"}
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={14}
                              color="#A0AEC0"
                              style={{ marginLeft: 4 }}
                            />
                          </View>
                        </View>

                        {/* MINI PROGRESS TRACK */}
                        <View style={styles.subProgressBarBg}>
                          <View
                            style={[
                              styles.subProgressBarFill,
                              {
                                width: `${
                                  isAttempted && chPercent !== null
                                    ? Math.min(chPercent, 100)
                                    : 0
                                }%`,
                                backgroundColor: isAttempted
                                  ? chColor
                                  : "#CBD5E1",
                              },
                            ]}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* =====================================================
          HAMBURGER MENU
          ===================================================== */}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setMenuVisible(false)
        }
      >
        <View style={styles.menuOverlay}>
          {/* BACKDROP */}

          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          />

          {/* SIDE MENU */}

          <LinearGradient
            colors={["#0E1E4A", "#152E6E", "#1E449A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.sideMenu}
          >
            {/* MENU HEADER */}

            <View style={styles.menuHeader}>
              <TouchableOpacity
                style={styles.menuAvatarWrapper}
                onPress={() => {
                  setMenuVisible(false);
                  router.push("/(tabs)/profile");
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="View profile"
              >
                <Image
                  source={getAvatarSource(avatarId)}
                  style={styles.menuAvatarImage}
                  contentFit="cover"
                />
              </TouchableOpacity>

              <View style={styles.menuUserInfo}>
                <Text style={styles.menuWelcome}>
                  Hello
                </Text>

                <Text
                  style={styles.menuUserName}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setMenuVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.menuDivider} />

            {/* MENU TITLE */}

            <Text style={styles.menuSectionTitle}>
              MENU
            </Text>

            {/* DASHBOARD */}

            <TouchableOpacity
              style={[
                styles.menuItem,
                styles.menuItemActive,
              ]}
              onPress={() =>
                setMenuVisible(false)
              }
            >
              <View
                style={[
                  styles.menuItemIcon,
                  styles.menuItemIconActive,
                ]}
              >
                <Ionicons
                  name="home"
                  size={21}
                  color="#FFFFFF"
                />
              </View>

              <Text
                style={[
                  styles.menuItemText,
                  styles.menuItemTextActive,
                ]}
              >
                Dashboard
              </Text>
            </TouchableOpacity>

            {/* EXAM HISTORY */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                handleMenuNavigation("/stats")
              }
            >
              <View style={styles.menuItemIcon}>
                <Ionicons
                  name="time-outline"
                  size={21}
                  color="#B8CEFF"
                />
              </View>

              <Text style={styles.menuItemText}>
                Exam History
              </Text>
            </TouchableOpacity>

            {/* PROFILE */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                handleMenuNavigation("/profile")
              }
            >
              <View style={styles.menuItemIcon}>
                <Ionicons
                  name="person-outline"
                  size={21}
                  color="#B8CEFF"
                />
              </View>

              <Text style={styles.menuItemText}>
                Profile
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* SETTINGS */}

            <Text style={styles.menuSectionTitle}>
              PREFERENCES
            </Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setSettingsModalVisible(true);
              }}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons
                  name="settings-outline"
                  size={21}
                  color="#B8CEFF"
                />
              </View>

              <Text style={styles.menuItemText}>
                Settings
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="rgba(255, 255, 255, 0.55)"
              />
            </TouchableOpacity>

            {/* RESET PROGRESS */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleResetProgress}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons
                  name="refresh-circle-outline"
                  size={21}
                  color="#FCA5A5"
                />
              </View>

              <Text style={[styles.menuItemText, { color: "#FCA5A5" }]}>
                Reset Progress
              </Text>
            </TouchableOpacity>

            {/* ABOUT */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);

                Alert.alert(
                  "APEX-CS",
                  "Assessment & Practice Exam for Civil Service"
                );
              }}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={21}
                  color="#B8CEFF"
                />
              </View>

              <Text style={styles.menuItemText}>
                About APEX-CS
              </Text>
            </TouchableOpacity>

            <View style={styles.menuBottomSpace} />

            {/* LOG OUT */}

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <View style={styles.logoutIcon}>
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color="#FFA0A0"
                />
              </View>

              <Text style={styles.logoutText}>
                Log Out
              </Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>
              APEX-CS
            </Text>
          </LinearGradient>
        </View>
      </Modal>

      {/* =====================================================
          SETTINGS MODAL
          ===================================================== */}

      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.settingsOverlay}>
          <Pressable
            style={styles.settingsBackdrop}
            onPress={() => setSettingsModalVisible(false)}
          />

          <View style={styles.settingsCard}>
            {/* MODAL HEADER */}
            <View style={styles.settingsHeader}>
              <View style={styles.settingsHeaderTitleRow}>
                <View style={styles.settingsIconPill}>
                  <Ionicons name="settings-sharp" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.settingsTitle}>Settings</Text>
              </View>

              <TouchableOpacity
                style={styles.settingsCloseBtn}
                onPress={() => setSettingsModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            {/* EXAMINEE PROFILE IDENTITY CARD */}
            <TouchableOpacity
              style={styles.settingsProfileCard}
              onPress={() => {
                setSettingsModalVisible(false);
                router.push("/(tabs)/profile");
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="View profile or change avatar"
            >
              <Image
                source={getAvatarSource(avatarId)}
                style={styles.settingsAvatarImage}
                contentFit="cover"
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.settingsProfileName}>{displayName}</Text>
                <Text style={styles.settingsProfileSub}>Civil Service Examinee • Change Avatar ›</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </TouchableOpacity>

            {/* TESTING & PROGRESS SECTION */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>
                TESTING & MONITORING
              </Text>

              <View style={styles.settingsActionCard}>
                <View style={styles.settingsActionTop}>
                  <View style={styles.settingsResetIconBox}>
                    <Ionicons name="refresh-outline" size={22} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.settingsActionTitle}>
                      Reset Exam Progress
                    </Text>
                    <Text style={styles.settingsActionDesc}>
                      Wipes all attempt history, scores, and topic mastery. Ideal for testing calculations and formula verification.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.settingsResetBtn}
                  activeOpacity={0.8}
                  onPress={handleResetProgress}
                  disabled={resettingProgress}
                >
                  {resettingProgress ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.settingsResetBtnText}>
                        Reset All Progress
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* APPLICATION INFO */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>
                APPLICATION
              </Text>

              <View style={styles.settingsInfoCard}>
                <View style={styles.settingsInfoRow}>
                  <Text style={styles.settingsInfoLabel}>Exam Standard</Text>
                  <Text style={styles.settingsInfoValue}>2026 Civil Service</Text>
                </View>

                <View style={styles.settingsInfoDivider} />

                <View style={styles.settingsInfoRow}>
                  <Text style={styles.settingsInfoLabel}>Active Level</Text>
                  <Text style={styles.settingsInfoValue}>{selectedLevelLabel}</Text>
                </View>
              </View>
            </View>

            {/* CLOSE / DONE BUTTON */}
            <TouchableOpacity
              style={styles.settingsDoneBtn}
              activeOpacity={0.8}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Text style={styles.settingsDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* ================= CONTAINER ================= */

  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* ================= HEADER ================= */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  headerAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: "hidden",
    backgroundColor: "#EFF6FF",
  },

  headerAvatar: {
    width: "100%",
    height: "100%",
  },

  welcome: {
    fontSize: 13,
    color: COLORS.muted,
  },

  dashboard: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  /* ================= EXAM LEVEL ================= */

  levelSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 18,
  },

  levelSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },

  levelToggle: {
    flexDirection: "row",
    backgroundColor: "#E9EEF8",
    borderRadius: 14,
    padding: 4,
  },

  levelButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 11,
    paddingHorizontal: 8,
  },

  levelButtonActive: {
    backgroundColor: "#FFFFFF",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  levelButtonText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },

  levelButtonTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },

  /* ================= HAMBURGER ================= */

  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  /* ================= PROGRESS CARD ================= */

  progressCard: {
    width: width - 50,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginRight: 15,
    justifyContent: "space-between",
  },

  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  cardLabel: {
    color: "#DCE6FF",
    fontSize: 14,
    fontWeight: "600",
  },

  examBadgeBlue: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
  },

  examBadgeBlueText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  bigScore: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    marginTop: 2,
  },

  avgScoreLabel: {
    color: "#DCE6FF",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },

  hBarBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    overflow: "hidden",
  },

  hBarFill: {
    height: "100%",
    backgroundColor: "#4ADE80",
    borderRadius: 10,
  },

  hBarHint: {
    color: "#DCE6FF",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 14,
  },

  /* ================= STATS ================= */

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statNum: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  statUnit: {
    color: "#DCE6FF",
    fontSize: 11,
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  /* ================= SECTION ================= */

  sectionHeaderRow: {
    marginTop: 30,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    paddingHorizontal: SPACING.lg,
    marginTop: 3,
  },

  emptyText: {
    color: COLORS.muted,
    paddingHorizontal: SPACING.lg,
    marginBottom: 10,
    lineHeight: 19,
  },

  /* ================= PERFORMANCE ================= */

  performanceCard: {
    backgroundColor: "#fff",
    marginHorizontal: SPACING.lg,
    marginBottom: 12,
    borderRadius: RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical: 16,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },

  performanceLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },

  performanceValue: {
    fontSize: 24,
    fontWeight: "800",
  },

  progressBarBg: {
    height: 10,
    backgroundColor: "#E7ECF5",
    borderRadius: 20,
    marginTop: 12,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    borderRadius: 20,
  },

  performanceHeaderBtn: {
    paddingVertical: 2,
  },

  performanceRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  performanceSubCount: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    fontWeight: "500",
  },

  /* ================= SUB-CATEGORIES ACCORDION ================= */

  subCategoryContainer: {
    marginTop: 14,
  },

  subCategoryDivider: {
    height: 1,
    backgroundColor: "#EEF2F6",
    marginBottom: 12,
  },

  subCategoryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  subCategoryHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  subCategoryHeaderHint: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },

  subCategoryItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  subCategoryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  subCategoryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  subCategoryMeta: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    fontWeight: "500",
  },

  subCategoryScoreWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  subCategoryPercentText: {
    fontSize: 13,
    fontWeight: "800",
  },

  subProgressBarBg: {
    height: 6,
    backgroundColor: "#EEF2F6",
    borderRadius: 4,
    overflow: "hidden",
  },

  subProgressBarFill: {
    height: "100%",
    borderRadius: 4,
  },

  /* ================= MENU OVERLAY ================= */

  menuOverlay: {
    flex: 1,
    flexDirection: "row",
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.30)",
  },

  /* ================= SIDE MENU ================= */

  /* ================= SIDE MENU ================= */

  sideMenu: {
    width: width * 0.78,
    paddingTop: 55,
    paddingHorizontal: 18,

    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 25,
    shadowOffset: {
      width: -5,
      height: 0,
    },

    elevation: 20,
  },

  /* ================= MENU HEADER ================= */

  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  menuProfileIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
    justifyContent: "center",
    alignItems: "center",
  },

  menuAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    overflow: "hidden",
  },

  menuAvatarImage: {
    width: "100%",
    height: "100%",
  },

  menuUserInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  menuWelcome: {
    fontSize: 12,
    color: "#B8CFFF",
  },

  menuUserName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ================= MENU DIVIDER ================= */

  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    marginVertical: 14,
  },

  menuSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94B6FF",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 6,
  },

  /* ================= MENU ITEM ================= */

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 4,
  },

  menuItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
  },

  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuItemIconActive: {
    backgroundColor: "#386BF6",
  },

  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E8F0",
  },

  menuItemTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  /* ================= LOGOUT ================= */

  menuBottomSpace: {
    flex: 1,
    minHeight: 20,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.32)",
    borderRadius: 14,
    paddingHorizontal: 10,
    minHeight: 52,
    marginBottom: 10,
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.24)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFA0A0",
  },

  versionText: {
    textAlign: "center",
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.45)",
    marginBottom: 18,
  },

  /* ================= DAILY STUDY TASK CARD ================= */
  taskCard: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  taskHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  taskHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  taskIconWrapCompleted: {
    backgroundColor: "#ECFDF5",
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  taskSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 1,
    fontWeight: "500",
  },
  taskDismissBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  taskProgressSection: {
    marginTop: 2,
  },
  taskMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskProgressText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  taskPercentText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  taskPercentTextCompleted: {
    color: "#10B981",
  },
  taskTrack: {
    height: 8,
    backgroundColor: "#EEF2F6",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  taskFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  taskFillCompleted: {
    backgroundColor: "#10B981",
  },
  taskFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskHint: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "500",
    flex: 1,
  },

  /* ================= SETTINGS MODAL ================= */

  settingsOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 20, 45, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },

  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  settingsCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.md,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  settingsProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  settingsAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  settingsProfileName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  settingsProfileSub: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },

  settingsHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  settingsIconPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  settingsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  settingsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  settingsSection: {
    marginBottom: 18,
  },

  settingsSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.muted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  settingsActionCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: RADIUS.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  settingsActionTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  settingsResetIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },

  settingsActionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 2,
  },

  settingsActionDesc: {
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 16,
  },

  settingsResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    minHeight: 44,
    borderRadius: 10,
    gap: 8,
  },

  settingsResetBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  settingsInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  settingsInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  settingsInfoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  settingsInfoLabel: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "500",
  },

  settingsInfoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  settingsDoneBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 46,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  settingsDoneBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});