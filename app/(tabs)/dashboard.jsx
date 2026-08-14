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
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname, useFocusEffect } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary } from "../../lib/attempts";

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

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

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

  // Hamburger menu
  const [menuVisible, setMenuVisible] = useState(false);

  const pathname = usePathname();
  const flatListRef = useRef();

  const [summary, setSummary] = useState({
    examsTaken: 0,
    bestScore: 0,
    lastScore: 0,
    avgScore: 0,
    subjectReadiness: [],
  });

  // Refetch whenever dashboard regains focus.
  useFocusEffect(
    React.useCallback(() => {
      getDashboardSummary().then(setSummary);
    }, [])
  );

  // Route guard.
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
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
                Civil Service Exam
              </Text>
            </View>
          </View>

          {/* BIG SCORE */}
          <Text style={styles.bigScore}>
            {summary.avgScore}%
          </Text>

          <Text style={styles.avgScoreLabel}>
            Avg. Score
          </Text>

          {/* HORIZONTAL PROGRESS BAR */}
          <View style={styles.hBarBg}>
            <View
              style={[
                styles.hBarFill,
                {
                  width: `${Math.min(
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
        {/* ================= HEADER ================= */}

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

        {/* ================= HERO CAROUSEL ================= */}

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

        {/* ================= SUBJECT READINESS ================= */}

        <Text style={styles.sectionTitle}>
          Subject Readiness
        </Text>

        {summary.subjectReadiness.length === 0 && (
          <Text
            style={{
              color: COLORS.muted,
              paddingHorizontal: SPACING.lg,
              marginBottom: 10,
            }}
          >
            Take a mock exam to see your readiness
            per subject.
          </Text>
        )}

        {summary.subjectReadiness.map((s) => {
          const color = getReadinessColor(s.percent);

          return (
            <View
              key={s.title}
              style={styles.performanceCard}
            >
              <View style={styles.performanceRow}>
                <Text
                  style={styles.performanceLabel}
                >
                  {s.title}
                </Text>

                <Text
                  style={[
                    styles.performanceValue,
                    {
                      color,
                    },
                  ]}
                >
                  {s.percent}%
                </Text>
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(
                        s.percent,
                        100
                      )}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
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
          <View style={styles.sideMenu}>
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
                  Welcome
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
                  color={COLORS.text}
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
                  color={COLORS.primary}
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
                  color={COLORS.muted}
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
                  color={COLORS.muted}
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
                  color={COLORS.muted}
                />
              </View>

              <Text style={styles.menuItemText}>
                Settings
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#B8C1D1"
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
                  color={COLORS.muted}
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
                  color="#E35D6A"
                />
              </View>

              <Text style={styles.logoutText}>
                Log Out
              </Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>
              APEX-CS
            </Text>
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

  welcome: {
    fontSize: 14,
    color: COLORS.muted,
  },

  dashboard: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
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

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 30,
    marginBottom: 16,
    paddingHorizontal: SPACING.lg,
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

  sideMenu: {
    width: width * 0.78,
    backgroundColor: "#FFFFFF",
    paddingTop: 55,
    paddingHorizontal: 18,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: {
      width: -5,
      height: 0,
    },

    elevation: 15,
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
    backgroundColor: COLORS.primary,
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
    color: COLORS.muted,
  },

  menuUserName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 2,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F4F6FA",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ================= MENU DIVIDER ================= */

  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  menuSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.muted,
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
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 4,
  },

  menuItemActive: {
    backgroundColor: "#EEF3FF",
  },

  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuItemIconActive: {
    backgroundColor: "#DDE7FF",
  },

  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  menuItemTextActive: {
    color: COLORS.primary,
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
    backgroundColor: "#FFF3F4",
    borderRadius: 14,
    paddingHorizontal: 10,
    minHeight: 52,
    marginBottom: 10,
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFE2E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E35D6A",
  },

  versionText: {
    textAlign: "center",
    fontSize: 10,
    color: "#B8C1D1",
    marginBottom: 18,
  },
});