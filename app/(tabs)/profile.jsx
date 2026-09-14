import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary, getStudyStreak } from "../../lib/attempts";
import { getExamDate, setExamDate } from "../../lib/Profiledata";

/* =========================================================================
   DESIGN TOKENS & PALETTE
   ========================================================================= */
const PALETTE = {
  primary: "#386BF6",
  navy: "#152B65",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  muted: "#7D8FB3",
  border: "#EEF1F5",
  lightBlue: "#DCE6FF",
  panelBlue: "#EEF3FF",
  panelBlueBorder: "#DDE7FF",
  success: "#67C36D",
  successAlt: "#4ADE80",
  warning: "#F0AE65",
  danger: "#EC6666",
  dangerBg: "#FDF2F2",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

function getReadinessLevel(percent) {
  if (!percent || percent === 0) return { label: "Not Started", color: PALETTE.muted, bg: "#F1F5F9" };
  if (percent < 50) return { label: "Foundational", color: PALETTE.warning, bg: "#FEF7EE" };
  if (percent < 75) return { label: "Intermediate", color: PALETTE.primary, bg: PALETTE.panelBlue };
  if (percent < 80) return { label: "Near Passing", color: PALETTE.primary, bg: PALETTE.lightBlue };
  if (percent < 90) return { label: "Proficient", color: PALETTE.success, bg: "#EAF9ED" };
  return { label: "Mastery", color: PALETTE.successAlt, bg: "#EAF9ED" };
}

function getDaysRemaining(targetDate) {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Exam Passed";
  if (diffDays === 0) return "Exam Today!";
  return `${diffDays} Day${diffDays > 1 ? "s" : ""} Left`;
}

/* =========================================================================
   CALENDAR MODAL
   ========================================================================= */
function CalendarPicker({ visible, initialDate, onClose, onSelect }) {
  const base = initialDate ? new Date(initialDate) : new Date();
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());

  useEffect(() => {
    if (visible) {
      const d = initialDate ? new Date(initialDate) : new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible, initialDate]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectedDate = initialDate ? new Date(initialDate) : null;
  const isSelected = (day) =>
    selectedDate &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getDate() === day;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={calStyles.overlay}>
        <View style={calStyles.card}>
          <View style={calStyles.header}>
            <TouchableOpacity onPress={goPrevMonth} style={calStyles.navBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={18} color={PALETTE.navy} />
            </TouchableOpacity>
            <Text style={calStyles.headerText}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={goNextMonth} style={calStyles.navBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={18} color={PALETTE.navy} />
            </TouchableOpacity>
          </View>

          <View style={calStyles.dayNamesRow}>
            {DAY_NAMES.map((d, i) => (
              <Text key={i} style={calStyles.dayNameText}>{d}</Text>
            ))}
          </View>

          <View style={calStyles.grid}>
            {cells.map((day, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  calStyles.cell,
                  day && isSelected(day) && calStyles.cellSelected,
                ]}
                disabled={!day}
                onPress={() => day && onSelect(new Date(viewYear, viewMonth, day, 8, 0, 0))}
                activeOpacity={0.7}
              >
                {day && (
                  <Text
                    style={[
                      calStyles.cellText,
                      isSelected(day) && calStyles.cellTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={calStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={calStyles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function Profile() {
  const { user, signOut } = useAuth();

  const fullName = user?.user_metadata?.full_name || "Civil Service Examinee";
  const email = user?.email || "";
  const initial = fullName.charAt(0).toUpperCase();

  const [summary, setSummary] = useState({
    examsTaken: 0,
    bestScore: 0,
    lastScore: 0,
    avgScore: 0,
  });
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const [examDate, setExamDateState] = useState(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [savingDate, setSavingDate] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([getDashboardSummary(), getStudyStreak(), getExamDate()])
        .then(([summaryData, streakData, examDateData]) => {
          setSummary(summaryData || { examsTaken: 0, bestScore: 0, lastScore: 0, avgScore: 0 });
          setStreak(streakData || 0);
          setExamDateState(examDateData);
        })
        .catch((err) => console.error("Profile load error:", err))
        .finally(() => setLoading(false));
    }, [])
  );

  const handleSelectExamDate = async (date) => {
    setCalendarVisible(false);
    setSavingDate(true);
    try {
      const iso = date.toISOString();
      await setExamDate(iso);
      setExamDateState(iso);
    } catch (err) {
      Alert.alert("Unable to save", "Please try again.");
    } finally {
      setSavingDate(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to exit your session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const daysRemaining = getDaysRemaining(examDate);
  const readiness = getReadinessLevel(summary.avgScore);

  const achievements = [];
  if (summary.examsTaken >= 1) {
    achievements.push({
      icon: "trophy",
      color: PALETTE.warning,
      bg: "#FEF7EE",
      title: "First Mock Exam Completed",
      sub: "Took the first step toward the license",
    });
  }
  if (streak >= 2) {
    achievements.push({
      icon: "flame",
      color: "#EA580C",
      bg: "#FFF3EB",
      title: `${streak}-Day Study Streak`,
      sub: "Consistent preparation underway",
    });
  }
  if (summary.bestScore >= 80) {
    achievements.push({
      icon: "checkmark-circle",
      color: PALETTE.success,
      bg: "#EAF9ED",
      title: "Passed Benchmark (80%+)",
      sub: `Current high score is ${summary.bestScore}%`,
    });
  } else if (summary.bestScore > 0) {
    achievements.push({
      icon: "star",
      color: PALETTE.primary,
      bg: PALETTE.panelBlue,
      title: `Personal Record: ${summary.bestScore}%`,
      sub: "Keep reviewing to reach 80%",
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ================= HEADER ================= */}
        <LinearGradient
          colors={[PALETTE.navy, PALETTE.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <Text style={styles.screenHeading}>My Profile</Text>
          </View>

          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName} numberOfLines={1}>{fullName}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>CSE Candidate</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ================= TARGET EXAM BANNER ================= */}
          <TouchableOpacity
            style={styles.targetExamCard}
            onPress={() => setCalendarVisible(true)}
            activeOpacity={0.85}
            disabled={savingDate}
          >
            <View style={styles.calendarIconCircle}>
              <Ionicons name="calendar-outline" size={22} color={PALETTE.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.examCardSub}>Target Examination Date</Text>
              <Text style={styles.examCardDate}>
                {savingDate
                  ? "Updating..."
                  : examDate
                  ? new Date(examDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Tap to set target date"}
              </Text>
            </View>
            {daysRemaining ? (
              <View style={styles.daysRemainingBadge}>
                <Ionicons name="hourglass-outline" size={13} color={PALETTE.navy} />
                <Text style={styles.daysRemainingText}>{daysRemaining}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={PALETTE.muted} />
            )}
          </TouchableOpacity>

          {/* ================= 2x2 METRICS GRID ================= */}
          <Text style={styles.sectionHeaderTitle}>Performance Metrics</Text>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={PALETTE.primary} />
            </View>
          ) : (
            <View style={styles.metricsGrid}>
              <MetricBox
                icon="document-text-outline"
                iconColor={PALETTE.primary}
                iconBg={PALETTE.panelBlue}
                label="Mock Exams"
                value={summary.examsTaken}
              />
              <MetricBox
                icon="trophy-outline"
                iconColor={PALETTE.success}
                iconBg="#EAF9ED"
                label="High Score"
                value={`${summary.bestScore}%`}
              />
              <MetricBox
                icon="flame-outline"
                iconColor={PALETTE.warning}
                iconBg="#FEF7EE"
                label="Study Streak"
                value={`${streak} Days`}
              />
              <MetricBox
                icon="pie-chart-outline"
                iconColor={PALETTE.navy}
                iconBg={PALETTE.panelBlue}
                label="Average"
                value={`${summary.avgScore}%`}
              />
            </View>
          )}

          {/* ================= READINESS PROGRESS ================= */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Exam Readiness</Text>
              <View style={[styles.statusTag, { backgroundColor: readiness.bg }]}>
                <Text style={[styles.statusTagText, { color: readiness.color }]}>
                  {readiness.label}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(summary.avgScore, 100)}%`,
                      backgroundColor: summary.avgScore >= 80 ? PALETTE.success : PALETTE.primary,
                    },
                  ]}
                />
              </View>
              {/* Benchmark Indicator */}
              <View style={styles.benchmarkMarker}>
                <View style={styles.markerLine} />
                <Text style={styles.markerLabel}>80% Pass</Text>
              </View>
            </View>

            <View style={styles.readinessStatsRow}>
              <View style={styles.subStat}>
                <Text style={styles.subStatLabel}>Average Score</Text>
                <Text style={styles.subStatValue}>{summary.avgScore}%</Text>
              </View>
              <View style={styles.verticalSep} />
              <View style={styles.subStat}>
                <Text style={styles.subStatLabel}>Last Attempt</Text>
                <Text style={styles.subStatValue}>{summary.lastScore}%</Text>
              </View>
              <View style={styles.verticalSep} />
              <View style={styles.subStat}>
                <Text style={styles.subStatLabel}>Target Benchmark</Text>
                <Text style={[styles.subStatValue, { color: PALETTE.navy }]}>80%</Text>
              </View>
            </View>
          </View>

          {/* ================= MILESTONES ================= */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Milestones & Badges</Text>

            {achievements.length === 0 ? (
              <View style={styles.emptyMilestones}>
                <Ionicons name="ribbon-outline" size={30} color={PALETTE.muted} />
                <Text style={styles.emptyMilestoneText}>
                  Take your first practice exam to unlock achievements.
                </Text>
              </View>
            ) : (
              achievements.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.milestoneItem,
                    index === achievements.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.milestoneIconWrap, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.milestoneTitle}>{item.title}</Text>
                    <Text style={styles.milestoneSub}>{item.sub}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* ================= ACCOUNT PREFERENCES ================= */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Preferences</Text>

            <SettingRow icon="person-outline" title="Personal Information" />
            <SettingRow icon="notifications-outline" title="Study Reminders" />
            <SettingRow icon="shield-checkmark-outline" title="Security & Password" isLast />
          </View>

          {/* ================= STANDALONE LOGOUT BUTTON ================= */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={PALETTE.danger} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Calendar Picker Modal */}
      <CalendarPicker
        visible={calendarVisible}
        initialDate={examDate}
        onClose={() => setCalendarVisible(false)}
        onSelect={handleSelectExamDate}
      />
    </View>
  );
}

/* =========================================================================
   REUSABLE SUB-COMPONENTS
   ========================================================================= */
function MetricBox({ icon, iconColor, iconBg, label, value }) {
  return (
    <View style={styles.metricBox}>
      <View style={[styles.metricIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricLbl}>{label}</Text>
    </View>
  );
}

function SettingRow({ icon, title, isLast }) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={0.7}
    >
      <View style={styles.settingIconWrap}>
        <Ionicons name={icon} size={18} color={PALETTE.navy} />
      </View>
      <Text style={styles.settingText}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color={PALETTE.muted} />
    </TouchableOpacity>
  );
}

/* =========================================================================
   STYLESHEET
   ========================================================================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },

  /* Header */
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerTop: {
    marginBottom: 16,
  },
  screenHeading: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    opacity: 0.95,
    letterSpacing: 0.5,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  profileMeta: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    color: PALETTE.lightBlue,
    marginTop: 2,
    fontWeight: "500",
  },
  badgePill: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  badgePillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  /* Body Container */
  body: {
    paddingHorizontal: 18,
    marginTop: -14,
  },

  /* Target Exam Hero Banner */
  targetExamCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },
  calendarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF3FF",
    justifyContent: "center",
    alignItems: "center",
  },
  examCardSub: {
    fontSize: 11,
    fontWeight: "700",
    color: PALETTE.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  examCardDate: {
    fontSize: 16,
    fontWeight: "800",
    color: PALETTE.text,
    marginTop: 2,
  },
  daysRemainingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF3FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  daysRemainingText: {
    fontSize: 12,
    fontWeight: "800",
    color: PALETTE.primary,
  },

  /* Section Title */
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: PALETTE.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  /* 2x2 Metrics Grid */
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  metricBox: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    borderRadius: 20,
    paddingHorizontal: 16,
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
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: "800",
    color: PALETTE.text,
  },
  metricLbl: {
    fontSize: 12,
    color: PALETTE.muted,
    marginTop: 3,
    fontWeight: "600",
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },

  /* Cards */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: PALETTE.text,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "800",
  },

  /* Progress Bar & Markers */
  progressContainer: {
    marginTop: 6,
    marginBottom: 16,
    position: "relative",
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: PALETTE.panelBlue,
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 8,
  },
  benchmarkMarker: {
    position: "absolute",
    left: "80%",
    top: -2,
    alignItems: "center",
  },
  markerLine: {
    width: 2,
    height: 14,
    backgroundColor: PALETTE.navy,
    borderRadius: 1,
  },
  markerLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: PALETTE.muted,
    marginTop: 2,
  },

  /* Readiness Bottom Stats */
  readinessStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  subStat: {
    alignItems: "center",
    flex: 1,
  },
  subStatLabel: {
    fontSize: 11,
    color: PALETTE.muted,
    fontWeight: "600",
  },
  subStatValue: {
    fontSize: 16,
    fontWeight: "800",
    color: PALETTE.text,
    marginTop: 3,
  },
  verticalSep: {
    width: 1,
    height: 24,
    backgroundColor: PALETTE.border,
  },

  /* Milestones */
  emptyMilestones: {
    alignItems: "center",
    paddingVertical: 14,
  },
  emptyMilestoneText: {
    fontSize: 12,
    color: PALETTE.muted,
    textAlign: "center",
    marginTop: 6,
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  milestoneIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: PALETTE.text,
  },
  milestoneSub: {
    fontSize: 12,
    color: PALETTE.muted,
    marginTop: 2,
    fontWeight: "500",
  },

  /* Setting Rows */
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: PALETTE.panelBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.text,
    fontWeight: "600",
  },

  /* Standalone Logout Button */
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.dangerBg,
    borderColor: "#FBCFE8",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
    gap: 8,
  },
  logoutBtnText: {
    color: PALETTE.danger,
    fontSize: 15,
    fontWeight: "700",
  },
});

/* Calendar Modal Styles */
const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 58, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: 320,
    backgroundColor: PALETTE.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: PALETTE.panelBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: 15,
    fontWeight: "700",
    color: PALETTE.navy,
  },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  dayNameText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: PALETTE.muted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  cellSelected: {
    backgroundColor: PALETTE.primary,
  },
  cellText: {
    fontSize: 13,
    color: PALETTE.text,
    fontWeight: "600",
  },
  cellTextSelected: {
    color: "#FFFFFF",
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeBtnText: {
    color: PALETTE.muted,
    fontWeight: "600",
    fontSize: 13,
  },
});