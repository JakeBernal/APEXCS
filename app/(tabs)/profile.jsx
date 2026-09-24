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
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary, getStudyStreak } from "../../lib/attempts";
import { getExamDate, setExamDate } from "../../lib/Profiledata";
import {
  AVATARS,
  getAvatarSource,
  getUserAvatar,
  setUserAvatar,
} from "../../lib/avatarHelper";
import {
  DAYS_OF_WEEK,
  PRESET_TIMES,
  GOAL_OPTIONS,
  DEFAULT_REMINDER_SETTINGS,
  formatReminderSummary,
  getStudyReminders,
  saveStudyReminders,
  getTodayQuestionsProgress,
} from "../../lib/remindersHelper";

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

  const [avatarId, setAvatarId] = useState("avatar1");
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const [reminderSettings, setReminderSettings] = useState(DEFAULT_REMINDER_SETTINGS);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [dailyProgress, setDailyProgress] = useState({
    completed: 0,
    target: 20,
    percent: 0,
    isCompleted: false,
    remaining: 20,
    taskString: "0 out of 20 questions",
  });

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
      Promise.all([
        getDashboardSummary(),
        getStudyStreak(),
        getExamDate(),
        getUserAvatar(user?.id),
        getStudyReminders(user?.id),
      ])
        .then(([summaryData, streakData, examDateData, savedAvatar, savedReminders]) => {
          setSummary(
            summaryData || {
              examsTaken: 0,
              bestScore: 0,
              lastScore: 0,
              avgScore: 0,
            }
          );
          setStreak(streakData || 0);
          setExamDateState(examDateData);
          if (savedAvatar) setAvatarId(savedAvatar);
          if (savedReminders) {
            setReminderSettings(savedReminders);
            getTodayQuestionsProgress(user?.id, savedReminders.goalQuestions).then(
              (p) => p && setDailyProgress(p)
            );
          } else {
            getTodayQuestionsProgress(user?.id, 20).then(
              (p) => p && setDailyProgress(p)
            );
          }
        })
        .catch((err) => console.error("Profile load error:", err))
        .finally(() => setLoading(false));
    }, [user?.id])
  );

  const handleSelectAvatar = async (id) => {
    setAvatarId(id);
    if (user?.id) {
      await setUserAvatar(user.id, id);
    }
  };

  const handleSaveReminders = async (newSettings) => {
    setReminderSettings(newSettings);
    setReminderModalVisible(false);
    if (user?.id) {
      await saveStudyReminders(user.id, newSettings);
      const updatedProg = await getTodayQuestionsProgress(
        user.id,
        newSettings.goalQuestions
      );
      if (updatedProg) setDailyProgress(updatedProg);
    }
  };

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
        contentContainerStyle={{ paddingBottom: 120 }}
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
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => setAvatarModalVisible(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Change Profile Avatar"
            >
              <Image
                source={getAvatarSource(avatarId)}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

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

            <SettingRow
              icon="person-outline"
              title="Personal Information"
              onPress={() =>
                Alert.alert(
                  "Personal Information",
                  `Name: ${fullName}\nEmail: ${email || "Not specified"}\nRole: Civil Service Examinee`
                )
              }
            />
            <SettingRow
              icon="notifications-outline"
              title="Study Reminders"
              badge={formatReminderSummary(reminderSettings)}
              badgeActive={reminderSettings.enabled}
              onPress={() => setReminderModalVisible(true)}
            />
            <SettingRow
              icon="shield-checkmark-outline"
              title="Security & Password"
              isLast
              onPress={() =>
                Alert.alert(
                  "Security & Password",
                  "Your account is secured with Supabase Authentication. Password management links are delivered to your registered email address."
                )
              }
            />
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

      {/* Avatar Picker Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={avatarStyles.overlay}>
          <View style={avatarStyles.card}>
            <View style={avatarStyles.header}>
              <Text style={avatarStyles.title}>Choose Your Avatar</Text>
              <Text style={avatarStyles.subtitle}>
                Select an examinee avatar for your profile identity
              </Text>
            </View>

            <ScrollView
              style={avatarStyles.scrollContainer}
              contentContainerStyle={avatarStyles.grid}
              showsVerticalScrollIndicator={false}
            >
              {AVATARS.map((item) => {
                const isSelected = item.id === avatarId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      avatarStyles.avatarOption,
                      isSelected && avatarStyles.avatarOptionSelected,
                    ]}
                    onPress={() => handleSelectAvatar(item.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${item.name} avatar`}
                  >
                    <Image
                      source={item.source}
                      style={avatarStyles.previewImage}
                      contentFit="cover"
                    />
                    {isSelected && (
                      <View style={avatarStyles.checkBadge}>
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      </View>
                    )}
                    <Text
                      style={[
                        avatarStyles.avatarName,
                        isSelected && avatarStyles.avatarNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={avatarStyles.doneBtn}
              onPress={() => setAvatarModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={avatarStyles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Study Reminders Modal */}
      <StudyRemindersModal
        visible={reminderModalVisible}
        initialSettings={reminderSettings}
        dailyProgress={dailyProgress}
        onClose={() => setReminderModalVisible(false)}
        onSave={handleSaveReminders}
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

/* =========================================================================
   STUDY REMINDERS MODAL
   ========================================================================= */
function StudyRemindersModal({
  visible,
  initialSettings,
  dailyProgress,
  onClose,
  onSave,
}) {
  const [enabled, setEnabled] = useState(initialSettings?.enabled ?? true);
  const [selectedDays, setSelectedDays] = useState(
    initialSettings?.days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  );
  const [hour, setHour] = useState(initialSettings?.hour || 7);
  const [minute, setMinute] = useState(initialSettings?.minute || 0);
  const [period, setPeriod] = useState(initialSettings?.period || "PM");
  const [goal, setGoal] = useState(initialSettings?.goalQuestions || 20);

  useEffect(() => {
    if (visible && initialSettings) {
      setEnabled(initialSettings.enabled ?? true);
      setSelectedDays(
        initialSettings.days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      );
      setHour(initialSettings.hour || 7);
      setMinute(initialSettings.minute || 0);
      setPeriod(initialSettings.period || "PM");
      setGoal(initialSettings.goalQuestions || 20);
    }
  }, [visible, initialSettings]);

  const toggleDay = (dayKey) => {
    if (selectedDays.includes(dayKey)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayKey));
    } else {
      setSelectedDays([...selectedDays, dayKey]);
    }
  };

  const setPresetDays = (type) => {
    if (type === "daily") {
      setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    } else if (type === "weekdays") {
      setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    } else if (type === "weekends") {
      setSelectedDays(["Sat", "Sun"]);
    }
  };

  const applyPresetTime = (preset) => {
    setHour(preset.hour);
    setMinute(preset.minute);
    setPeriod(preset.period);
  };

  const handleSave = () => {
    const formattedMinute =
      minute === 0 ? "00" : minute < 10 ? `0${minute}` : `${minute}`;
    const timeString = `${hour}:${formattedMinute} ${period}`;
    onSave({
      enabled,
      hour,
      minute,
      period,
      timeString,
      days: selectedDays,
      goalQuestions: goal,
    });
  };

  const formattedMinute =
    minute === 0 ? "00" : minute < 10 ? `0${minute}` : `${minute}`;
  const currentTimeDisplay = `${hour}:${formattedMinute} ${period}`;

  const completedCount = dailyProgress?.completed || 0;
  const isGoalReached = completedCount >= goal;
  const progressPercent = Math.min(
    Math.round((completedCount / (goal || 20)) * 100),
    100
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={reminderStyles.overlay}>
        <View style={reminderStyles.card}>
          {/* Header */}
          <View style={reminderStyles.header}>
            <View style={reminderStyles.headerIconWrap}>
              <Ionicons name="notifications" size={20} color={PALETTE.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={reminderStyles.title}>Study Reminders</Text>
              <Text style={reminderStyles.subtitle}>
                Stay consistent for the Civil Service Exam
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={reminderStyles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close reminders modal"
            >
              <Ionicons name="close" size={20} color={PALETTE.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={reminderStyles.scrollArea}>
            {/* Today's Practice Task Summary */}
            <View style={reminderStyles.todayProgressCard}>
              <View style={reminderStyles.todayProgressHeader}>
                <Text style={reminderStyles.todayProgressTitle}>
                  Today's Practice Task
                </Text>
                <Text style={reminderStyles.todayProgressVal}>
                  {completedCount} out of {goal} questions
                </Text>
              </View>
              <View style={reminderStyles.todayTrack}>
                <View
                  style={[
                    reminderStyles.todayFill,
                    { width: `${Math.max(progressPercent, completedCount > 0 ? 5 : 0)}%` },
                    isGoalReached && reminderStyles.todayFillCompleted,
                  ]}
                />
              </View>
              <Text style={reminderStyles.todayHint}>
                {isGoalReached
                  ? "🎉 Daily study task completed for today!"
                  : `${Math.max(goal - completedCount, 0)} more question${
                      Math.max(goal - completedCount, 0) === 1 ? "" : "s"
                    } to hit your goal.`}
              </Text>
            </View>

            {/* Master Switch */}
            <View style={reminderStyles.switchCard}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={reminderStyles.switchTitle}>Daily Study Alerts</Text>
                <Text style={reminderStyles.switchSubtitle}>
                  {enabled
                    ? "Alerts active on scheduled days"
                    : "Reminders currently paused"}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: "#D1D5DB", true: PALETTE.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {enabled && (
              <>
                {/* Time Display and Presets */}
                <View style={reminderStyles.section}>
                  <Text style={reminderStyles.sectionLabel}>Reminder Time</Text>

                  {/* Digital Clock Display */}
                  <View style={reminderStyles.clockBanner}>
                    <Text style={reminderStyles.clockTime}>{currentTimeDisplay}</Text>
                    <View style={reminderStyles.ampmToggle}>
                      <TouchableOpacity
                        style={[
                          reminderStyles.ampmBtn,
                          period === "AM" && reminderStyles.ampmBtnActive,
                        ]}
                        onPress={() => setPeriod("AM")}
                        accessibilityRole="button"
                        accessibilityLabel="AM"
                      >
                        <Text
                          style={[
                            reminderStyles.ampmText,
                            period === "AM" && reminderStyles.ampmTextActive,
                          ]}
                        >
                          AM
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          reminderStyles.ampmBtn,
                          period === "PM" && reminderStyles.ampmBtnActive,
                        ]}
                        onPress={() => setPeriod("PM")}
                        accessibilityRole="button"
                        accessibilityLabel="PM"
                      >
                        <Text
                          style={[
                            reminderStyles.ampmText,
                            period === "PM" && reminderStyles.ampmTextActive,
                          ]}
                        >
                          PM
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Hour and Minute Steppers */}
                  <View style={reminderStyles.stepperContainer}>
                    <View style={reminderStyles.stepperCard}>
                      <Text style={reminderStyles.stepperTitle}>Hour</Text>
                      <View style={reminderStyles.stepperControls}>
                        <TouchableOpacity
                          style={reminderStyles.stepperBtn}
                          onPress={() => setHour((h) => (h === 1 ? 12 : h - 1))}
                          accessibilityRole="button"
                          accessibilityLabel="Decrease hour"
                        >
                          <Ionicons name="remove" size={16} color={PALETTE.navy} />
                        </TouchableOpacity>
                        <Text style={reminderStyles.stepperValue}>{hour}</Text>
                        <TouchableOpacity
                          style={reminderStyles.stepperBtn}
                          onPress={() => setHour((h) => (h === 12 ? 1 : h + 1))}
                          accessibilityRole="button"
                          accessibilityLabel="Increase hour"
                        >
                          <Ionicons name="add" size={16} color={PALETTE.navy} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={reminderStyles.stepperCard}>
                      <Text style={reminderStyles.stepperTitle}>Minute</Text>
                      <View style={reminderStyles.stepperControls}>
                        <TouchableOpacity
                          style={reminderStyles.stepperBtn}
                          onPress={() => setMinute((m) => (m === 0 ? 45 : m - 15))}
                          accessibilityRole="button"
                          accessibilityLabel="Decrease minute"
                        >
                          <Ionicons name="remove" size={16} color={PALETTE.navy} />
                        </TouchableOpacity>
                        <Text style={reminderStyles.stepperValue}>{formattedMinute}</Text>
                        <TouchableOpacity
                          style={reminderStyles.stepperBtn}
                          onPress={() => setMinute((m) => (m === 45 ? 0 : m + 15))}
                          accessibilityRole="button"
                          accessibilityLabel="Increase minute"
                        >
                          <Ionicons name="add" size={16} color={PALETTE.navy} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Preset Quick Chips */}
                  <View style={reminderStyles.timeChipsGrid}>
                    {PRESET_TIMES.map((preset) => {
                      const isCurrent =
                        hour === preset.hour &&
                        minute === preset.minute &&
                        period === preset.period;
                      return (
                        <TouchableOpacity
                          key={preset.label}
                          style={[
                            reminderStyles.timeChip,
                            isCurrent && reminderStyles.timeChipActive,
                          ]}
                          onPress={() => applyPresetTime(preset)}
                          accessibilityRole="button"
                          accessibilityLabel={`Preset ${preset.label}`}
                        >
                          <Text
                            style={[
                              reminderStyles.timeChipText,
                              isCurrent && reminderStyles.timeChipTextActive,
                            ]}
                          >
                            {preset.label} ({preset.timeString})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Study Days */}
                <View style={reminderStyles.section}>
                  <View style={reminderStyles.sectionHeaderRow}>
                    <Text style={reminderStyles.sectionLabel}>Active Study Days</Text>
                    <View style={reminderStyles.presetLinks}>
                      <TouchableOpacity onPress={() => setPresetDays("daily")}>
                        <Text style={reminderStyles.presetLink}>Daily</Text>
                      </TouchableOpacity>
                      <Text style={reminderStyles.presetDot}>•</Text>
                      <TouchableOpacity onPress={() => setPresetDays("weekdays")}>
                        <Text style={reminderStyles.presetLink}>Weekdays</Text>
                      </TouchableOpacity>
                      <Text style={reminderStyles.presetDot}>•</Text>
                      <TouchableOpacity onPress={() => setPresetDays("weekends")}>
                        <Text style={reminderStyles.presetLink}>Weekends</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={reminderStyles.daysRow}>
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = selectedDays.includes(d.key);
                      return (
                        <TouchableOpacity
                          key={d.key}
                          style={[
                            reminderStyles.dayPill,
                            isSelected && reminderStyles.dayPillActive,
                          ]}
                          onPress={() => toggleDay(d.key)}
                          accessibilityRole="button"
                          accessibilityLabel={d.fullName}
                        >
                          <Text
                            style={[
                              reminderStyles.dayPillText,
                              isSelected && reminderStyles.dayPillTextActive,
                            ]}
                          >
                            {d.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Daily Question Target */}
                <View style={reminderStyles.section}>
                  <Text style={reminderStyles.sectionLabel}>Daily Practice Target</Text>
                  <View style={reminderStyles.goalsRow}>
                    {GOAL_OPTIONS.map((num) => {
                      const isSelected = goal === num;
                      return (
                        <TouchableOpacity
                          key={num}
                          style={[
                            reminderStyles.goalPill,
                            isSelected && reminderStyles.goalPillActive,
                          ]}
                          onPress={() => setGoal(num)}
                          accessibilityRole="button"
                          accessibilityLabel={`${num} questions goal`}
                        >
                          <Text
                            style={[
                              reminderStyles.goalPillText,
                              isSelected && reminderStyles.goalPillTextActive,
                            ]}
                          >
                            {num} Qs
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Action Button */}
          <View style={reminderStyles.footer}>
            <TouchableOpacity
              style={reminderStyles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Save reminder preferences"
            >
              <Text style={reminderStyles.saveBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SettingRow({ icon, title, isLast, badge, badgeActive, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={title}
    >
      <View style={styles.settingIconWrap}>
        <Ionicons name={icon} size={18} color={PALETTE.navy} />
      </View>
      <Text style={styles.settingText}>{title}</Text>
      {badge ? (
        <View
          style={[
            styles.settingBadge,
            badgeActive ? styles.settingBadgeActive : styles.settingBadgeInactive,
          ]}
        >
          <Text
            style={[
              styles.settingBadgeText,
              badgeActive ? styles.settingBadgeTextActive : styles.settingBadgeTextInactive,
            ]}
          >
            {badge}
          </Text>
        </View>
      ) : null}
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
  avatarWrapper: {
    position: "relative",
    width: 70,
    height: 70,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#386BF6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
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
  settingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  settingBadgeActive: {
    backgroundColor: "#EEF3FF",
    borderWidth: 1,
    borderColor: "#DDE7FF",
  },
  settingBadgeInactive: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  settingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  settingBadgeTextActive: {
    color: "#386BF6",
  },
  settingBadgeTextInactive: {
    color: "#94A3B8",
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

/* =========================================================================
   AVATAR MODAL STYLES
   ========================================================================= */
const avatarStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#14143A",
  },
  subtitle: {
    fontSize: 13,
    color: "#7D8FB3",
    marginTop: 4,
    textAlign: "center",
  },
  scrollContainer: {
    maxHeight: 340,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 2,
  },
  avatarOption: {
    width: 82,
    alignItems: "center",
    padding: 8,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: "transparent",
    backgroundColor: "#F8FAFC",
  },
  avatarOptionSelected: {
    borderColor: "#386BF6",
    backgroundColor: "#EFF6FF",
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  checkBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 6,
  },
  avatarNameSelected: {
    color: "#386BF6",
    fontWeight: "700",
  },
  doneBtn: {
    backgroundColor: "#386BF6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

/* =========================================================================
   REMINDER MODAL STYLES
   ========================================================================= */
const reminderStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#14143A",
  },
  subtitle: {
    fontSize: 12,
    color: "#7D8FB3",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  scrollArea: {
    marginBottom: 16,
  },
  todayProgressCard: {
    backgroundColor: "#EEF3FF",
    borderWidth: 1.5,
    borderColor: "#DDE7FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  todayProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  todayProgressTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#152B65",
  },
  todayProgressVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#386BF6",
  },
  todayTrack: {
    height: 7,
    backgroundColor: "#DCE6FF",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  todayFill: {
    height: "100%",
    backgroundColor: "#386BF6",
    borderRadius: 4,
  },
  todayFillCompleted: {
    backgroundColor: "#10B981",
  },
  todayHint: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "500",
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEF1F5",
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14143A",
  },
  switchSubtitle: {
    fontSize: 12,
    color: "#7D8FB3",
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#14143A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetLinks: {
    flexDirection: "row",
    alignItems: "center",
  },
  presetLink: {
    fontSize: 12,
    color: "#386BF6",
    fontWeight: "600",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  presetDot: {
    color: "#CBD5E1",
    fontSize: 12,
  },
  clockBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF3FF",
    borderWidth: 1.5,
    borderColor: "#DDE7FF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  clockTime: {
    fontSize: 26,
    fontWeight: "800",
    color: "#152B65",
    letterSpacing: 0.5,
  },
  ampmToggle: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "#DCE6FF",
  },
  ampmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  ampmBtnActive: {
    backgroundColor: "#386BF6",
  },
  ampmText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7D8FB3",
  },
  ampmTextActive: {
    color: "#FFFFFF",
  },
  stepperContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  stepperCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEF1F5",
  },
  stepperTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7D8FB3",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE6FF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#14143A",
    minWidth: 32,
    textAlign: "center",
  },
  timeChipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  timeChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#386BF6",
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  timeChipTextActive: {
    color: "#386BF6",
    fontWeight: "700",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  dayPill: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  dayPillActive: {
    backgroundColor: "#386BF6",
    borderColor: "#386BF6",
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  dayPillTextActive: {
    color: "#FFFFFF",
  },
  goalsRow: {
    flexDirection: "row",
    gap: 8,
  },
  goalPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  goalPillActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#386BF6",
  },
  goalPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  goalPillTextActive: {
    color: "#386BF6",
    fontWeight: "700",
  },
  footer: {
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: "#386BF6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});