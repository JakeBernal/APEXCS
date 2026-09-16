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
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { getDashboardSummary } from "../../lib/attempts";
import { getCurriculum } from "../../lib/curriculum";

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
  if (percent === null || percent === undefined) return "#94A3B8";
  if (percent < 50) return "#EC6666";
  if (percent < 70) return "#F0AE65";
  if (percent < 80) return "#EAB308";
  return "#22C55E";
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

  const flatListRef = useRef();

  const [summary, setSummary] = useState({
    examsTaken: 0,
    bestScore: 0,
    lastScore: 0,
    avgScore: 0,
    examReadiness: 0,
    subjectReadiness: [],
  });

  /*
   * Load dashboard data for the selected exam level.
   *
   * Professional and Sub-Professional are kept completely
   * separate.
   */
  const loadDashboard = React.useCallback(async () => {
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
  }, [selectedLevel]);

  /*
   * Refetch whenever:
   * - Dashboard becomes active again
   * - User switches exam level
   */
  useFocusEffect(
    React.useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
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
   * SUBJECT READINESS & CATEGORY STATS
   * ============================================================
   *
   * Pull official curriculum categories for the selected level.
   * Merges with real attempt stats from getDashboardSummary.
   * If a category hasn't been attempted yet, percent is null ("Not Started").
   */

  const curriculumCats = getCurriculum(selectedLevel);

  const dashboardCategories = curriculumCats.map((cat) => {
    const ready = summary.subjectReadiness?.find(
      (s) => s.title?.trim().toLowerCase() === cat.title.trim().toLowerCase()
    );

    return (
      ready || {
        ...cat,
        percent: null,
        totalAttempted: 0,
        totalCorrect: 0,
        totalWrong: 0,
        chapters: cat.chapters.map((ch) => ({
          ...ch,
          percent: null,
          totalAttempted: 0,
          totalCorrect: 0,
          totalWrong: 0,
        })),
      }
    );
  });

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
          <View>
            <Text style={styles.welcome}>
              Welcome Back
            </Text>

            <Text style={styles.dashboard}>
              {displayName}
            </Text>
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
            WEAK AREAS / FOCUS TOPICS
            ===================================================== */}
        {summary.weakAreas && summary.weakAreas.length > 0 && (
          <View style={styles.focusSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <View style={styles.focusTitleRow}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#EF4444"
                  />
                  <Text style={styles.sectionTitle}>Focus Areas</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Topics below 70% mastery — targeted practice recommended
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.focusScrollContent}
            >
              {summary.weakAreas.map((weak, idx) => (
                <View key={idx} style={styles.focusCard}>
                  <View style={styles.focusCardTop}>
                    <Text style={styles.focusCatLabel} numberOfLines={1}>
                      {weak.categoryTitle}
                    </Text>
                    <View style={styles.focusMasteryPill}>
                      <Text style={styles.focusMasteryText}>
                        {weak.percent}%
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.focusChapTitle} numberOfLines={2}>
                    {weak.chapterTitle}
                  </Text>

                  <Text style={styles.focusAttemptText}>
                    {weak.totalCorrect} / {weak.totalAttempted} correct
                  </Text>

                  <TouchableOpacity
                    style={styles.focusPracticeBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/chapterDetails",
                        params: {
                          category: weak.categoryTitle,
                          chapter: weak.chapterTitle,
                          level: selectedLevel,
                        },
                      })
                    }
                  >
                    <Text style={styles.focusPracticeBtnText}>Practice</Text>
                    <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* =====================================================
            SUBJECT READINESS
            ===================================================== */}

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Subject Readiness</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedLevelLabel} performance • Tap card to explore chapters
            </Text>
          </View>
        </View>

        {dashboardCategories.map((cat) => {
          const isStarted = cat.totalAttempted > 0 && cat.percent !== null;
          const color = getReadinessColor(cat.percent);

          return (
            <TouchableOpacity
              key={cat.title}
              style={styles.categoryCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/categoryDetails",
                  params: {
                    category: cat.title,
                    level: selectedLevel,
                  },
                })
              }
            >
              {/* TOP ROW */}
              <View style={styles.categoryHeader}>
                <View
                  style={[
                    styles.categoryIconBox,
                    { backgroundColor: cat.color || "#EEF2FF" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={cat.icon || "book-open-page-variant"}
                    size={22}
                    color={cat.badgeColor || COLORS.primary}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                  <View style={styles.categoryMetaRow}>
                    <View style={styles.chapterCountBadge}>
                      <Text style={styles.chapterCountText}>
                        {cat.chapters?.length || 0} Chapters
                      </Text>
                    </View>
                    {cat.estimatedWeightLabel && (
                      <Text style={styles.weightLabelText}>
                        {cat.estimatedWeightLabel}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.categoryMasteryBox}>
                  {isStarted ? (
                    <Text style={[styles.categoryMasteryNum, { color }]}>
                      {cat.percent}%
                    </Text>
                  ) : (
                    <View style={styles.notStartedBadge}>
                      <Text style={styles.notStartedText}>Not Started</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* PROGRESS BAR */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: isStarted ? `${Math.min(cat.percent, 100)}%` : "0%",
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>

              {/* FOOTER */}
              <View style={styles.categoryFooter}>
                <Text style={styles.categoryAttemptText}>
                  {isStarted
                    ? `${cat.totalAttempted} questions attempted`
                    : "0 questions attempted"}
                </Text>

                <View style={styles.viewChaptersBtn}>
                  <Text style={styles.viewChaptersText}>View Chapters</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={COLORS.primary}
                  />
                </View>
              </View>
            </TouchableOpacity>
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
              <View style={styles.menuProfileIcon}>
                <Ionicons
                  name="person"
                  size={22}
                  color="#fff"
                />
              </View>

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
                handleMenuNavigation("/history")
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
              onPress={() =>
                handleMenuNavigation("/settings")
              }
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

  welcome: {
    fontSize: 14,
    color: COLORS.muted,
  },

  dashboard: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
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

  /* ================= FOCUS AREAS / WEAK AREAS ================= */
  focusSection: {
    marginBottom: 6,
  },

  focusTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    gap: 6,
  },

  focusScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: 12,
    paddingVertical: 4,
  },

  focusCard: {
    width: 210,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    shadowColor: "#EF4444",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    justifyContent: "space-between",
  },

  focusCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  focusCatLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    flex: 1,
    marginRight: 6,
  },

  focusMasteryPill: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },

  focusMasteryText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "800",
  },

  focusChapTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 18,
    minHeight: 36,
  },

  focusAttemptText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 10,
  },

  focusPracticeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },

  focusPracticeBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  /* ================= CATEGORY PERFORMANCE ================= */

  categoryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: SPACING.lg,
    marginBottom: 14,
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  categoryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  categoryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  chapterCountBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  chapterCountText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.muted,
  },

  weightLabelText: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: "500",
  },

  categoryMasteryBox: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  categoryMasteryNum: {
    fontSize: 20,
    fontWeight: "800",
  },

  notStartedBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  notStartedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },

  categoryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },

  categoryAttemptText: {
    fontSize: 11,
    color: COLORS.muted,
  },

  viewChaptersBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  viewChaptersText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

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
});