import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary, getStudyStreak } from "../../lib/attempts";
import { getExamDate, setExamDate } from "../../lib/Profiledata";

const COLORS = {
  primary: "#386BF6",
  secondary: "#1F46C7",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  muted: "#8A94A6",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

function getReadinessLevel(percent) {
  if (percent === 0) return "Not Started";
  if (percent < 50) return "Beginner";
  if (percent < 75) return "Intermediate";
  if (percent < 90) return "Proficient";
  return "Excellent";
}


function CalendarPicker({ visible, initialDate, onClose, onSelect }) {
  const base = initialDate ? new Date(initialDate) : new Date();
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());

  React.useEffect(() => {
    if (visible) {
      const d = initialDate ? new Date(initialDate) : new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible]);

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

  const handleSelectDay = (day) => {
    // Default to 8:00 AM, a typical exam start time
    const picked = new Date(viewYear, viewMonth, day, 8, 0, 0);
    onSelect(picked);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={calStyles.overlay}>
        <View style={calStyles.card}>
          <View style={calStyles.header}>
            <TouchableOpacity onPress={goPrevMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={calStyles.headerText}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={goNextMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
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
                onPress={() => day && handleSelectDay(day)}
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

          <TouchableOpacity style={calStyles.closeBtn} onPress={onClose}>
            <Text style={calStyles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();

  const fullName = user?.user_metadata?.full_name || "Your Name";
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
    React.useCallback(() => {
      setLoading(true);
      Promise.all([getDashboardSummary(), getStudyStreak(), getExamDate()])
        .then(([summaryData, streakData, examDateData]) => {
          setSummary(summaryData);
          setStreak(streakData);
          setExamDateState(examDateData);
        })
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
      console.error("Failed to save exam date:", err);
      Alert.alert("Couldn't save", "Please try setting your exam date again.");
    } finally {
      setSavingDate(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const achievements = [];
  if (summary.examsTaken >= 1) {
    achievements.push({
      icon: "trophy",
      color: "#F7B500",
      text: "First Mock Exam Completed",
    });
  }
  if (streak >= 2) {
    achievements.push({
      icon: "flame",
      color: "#FF7A00",
      text: `${streak}-Day Study Streak`,
    });
  }
  if (summary.bestScore > 0) {
    achievements.push({
      icon: "star",
      color: "#FFD700",
      text: `Personal Best: ${summary.bestScore}%`,
    });
  }

  const examDateLabel = examDate
    ? new Date(examDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Tap to set your exam date";

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <LinearGradient
          colors={["#4D79FF", "#2449C9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{email}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#FF6B6B" />
              <Text style={styles.location}>CSC - Region I • Ilocos</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 28 }} />
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{summary.examsTaken}</Text>
                <Text style={styles.statLabel}>Exams</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{summary.bestScore}%</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{streak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{summary.avgScore}%</Text>
                <Text style={styles.statLabel}>Avg</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Exam Date */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Exam Date</Text>

          <TouchableOpacity
            style={dateStyles.row}
            onPress={() => setCalendarVisible(true)}
            disabled={savingDate}
          >
            <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
            <Text style={dateStyles.text}>
              {savingDate ? "Saving..." : examDateLabel}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#B8B8B8" />
          </TouchableOpacity>
        </View>

        {/* Study Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Study Progress</Text>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Readiness</Text>
                <Text style={styles.progressValue}>{summary.avgScore}%</Text>
              </View>

              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${summary.avgScore}%` },
                  ]}
                />
              </View>

              <View style={styles.progressBottom}>
                <View>
                  <Text style={styles.smallTitle}>Target</Text>
                  <Text style={styles.smallValue}>80%</Text>
                </View>
                <View>
                  <Text style={styles.smallTitle}>Current</Text>
                  <Text style={styles.smallValue}>
                    {getReadinessLevel(summary.avgScore)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.smallTitle}>Last Exam</Text>
                  <Text style={styles.smallValue}>{summary.lastScore}%</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Achievements</Text>

          {!loading && achievements.length === 0 && (
            <Text style={{ color: COLORS.muted }}>
              Complete a mock exam to start earning achievements.
            </Text>
          )}

          {achievements.map((a) => (
            <View key={a.text} style={styles.achievement}>
              <Ionicons name={a.icon} size={22} color={a.color} />
              <Text style={styles.achievementText}>{a.text}</Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>

          <SettingItem icon="person-outline" title="Edit Profile" />
          <SettingItem icon="notifications-outline" title="Notifications" />
          <SettingItem icon="lock-closed-outline" title="Change Password" />
          <SettingItem
            icon="log-out-outline"
            title="Logout"
            danger
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      <CalendarPicker
        visible={calendarVisible}
        initialDate={examDate}
        onClose={() => setCalendarVisible(false)}
        onSelect={handleSelectExamDate}
      />
    </View>
  );
}

function SettingItem({ icon, title, danger, onPress }) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color={danger ? "#E74C3C" : "#386BF6"} />
      <Text style={[styles.settingText, danger && { color: "#E74C3C" }]}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#B8B8B8" />
    </TouchableOpacity>
  );
}

const dateStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: "#14143A",
    fontWeight: "600",
  },
});

const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14143A",
  },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  dayNameText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#8A94A6",
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
    borderRadius: 10,
  },
  cellSelected: {
    backgroundColor: "#386BF6",
  },
  cellText: {
    fontSize: 14,
    color: "#14143A",
    fontWeight: "600",
  },
  cellTextSelected: {
    color: "#fff",
  },
  closeBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#8A94A6",
    fontWeight: "600",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
  },

  userInfo: {
    marginTop: 18,
  },

  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },

  email: {
    color: "#DCE6FF",
    marginTop: 4,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  location: {
    color: "#DCE6FF",
    marginLeft: 6,
    fontSize: 13,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },

  stat: {
    alignItems: "center",
  },

  statNumber: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 24,
  },

  statLabel: {
    color: "#DCE6FF",
    fontSize: 12,
    marginTop: 4,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 22,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressLabel: {
    color: COLORS.text,
    fontWeight: "600",
  },

  progressValue: {
    fontWeight: "800",
    color: COLORS.primary,
  },

  progressBg: {
    marginTop: 12,
    height: 12,
    borderRadius: 20,
    backgroundColor: "#E8EDF5",
  },

  progressFill: {
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#67C36D",
  },

  progressBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  smallTitle: {
    color: COLORS.muted,
    fontSize: 12,
  },

  smallValue: {
    marginTop: 5,
    fontWeight: "700",
    color: COLORS.text,
  },

  achievement: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  achievementText: {
    marginLeft: 15,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },

  settingText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },
});