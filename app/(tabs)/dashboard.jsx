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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import BottomNav from "../components/bottomNav";
import { useAuth } from "../../context/AuthContext";

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
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes };
}

export default function Dashboard() {
  const { user, session, loading, signOut } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("home");
  const [countdown, setCountdown] = useState(getCountdown(EXAM_DATE));
  const pathname = usePathname();
  const flatListRef = useRef();

  // Route guard: bounce to login if there's no active session
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session]);

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

  const handleAvatarPress = () => {
    Alert.alert("Account", undefined, [
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


  const displayName = user?.user_metadata?.full_name || user?.email || "Welcome";

  const renderCard = ({ item, index }) => {
    const isActive = index === currentIndex;

    if (item.type === "progress") {
      return (
        <LinearGradient
        colors={[ "#386BF6", "#152b65"]}
           start={{ x: 1, y: 0 }}
           end={{ x: 1, y: 1 }}
           style={[
           styles.progressCard,
          { transform: [{ scale: isActive ? 1 : 0.93 }] },
          ]}>
            
          {/* TOP ROW */}
          <View style={styles.progressTopRow}>
            <Text style={styles.cardLabel}>Exam Readiness</Text>
            <View style={styles.examBadgeBlue}>
              <Text style={styles.examBadgeBlueText}>Civil Service Exam</Text>
            </View>
          </View>

          {/* BIG SCORE */}
          <Text style={styles.bigScore}>60.5%</Text>
          <Text style={styles.avgScoreLabel}>Avg. Score</Text>

          {/* HORIZONTAL PROGRESS BAR */}
          <View style={styles.hBarBg}>
            <View style={[styles.hBarFill, { width: "60.5%" }]} />
          </View>
          <Text style={styles.hBarHint}>Keep going! You need 80% to pass.</Text>

          {/* STATS ROW */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{countdown.days}</Text>
              <Text style={styles.statUnit}>Mock Exams</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>3</Text>
              <Text style={styles.statUnit}>Last Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>72%</Text>
              <Text style={styles.statUnit}>Best Score</Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    return (
      <View
        style={[
          styles.scheduleCard,
          { transform: [{ scale: isActive ? 1 : 0.93 }] },
        ]}
      >
        {/* TOP ROW */}
        <View style={styles.scheduleTopRow}>
          <Text style={styles.examLabel}>UPCOMING EXAM</Text>
          <View style={styles.examBadge}>
            <Text style={styles.examBadgeText}>Civil Service Exam</Text>
          </View>
        </View>

        {/* DATE */}
        <Text style={styles.examDateText}>May 18, 2026</Text>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* COUNTDOWN */}
        <View style={styles.countdownRow}>
          <Text style={styles.countdownLabel}>Time remaining</Text>
          <View style={styles.countdownBlocks}>
            <View style={styles.countBlock}>
              <Text style={styles.countNum}>
                {String(countdown.days).padStart(3, "0")}
              </Text>
              <Text style={styles.countUnit}>DAYS</Text>
            </View>
            <Text style={styles.countSep}>:</Text>
            <View style={styles.countBlock}>
              <Text style={styles.countNum}>
                {String(countdown.hours).padStart(2, "0")}
              </Text>
              <Text style={styles.countUnit}>HRS</Text>
            </View>
            <Text style={styles.countSep}>:</Text>
            <View style={styles.countBlock}>
              <Text style={styles.countNum}>
                {String(countdown.minutes).padStart(2, "0")}
              </Text>
              <Text style={styles.countUnit}>MIN</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Avoid flashing dashboard content before the redirect kicks in
  if (loading || !session) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.dashboard}>{displayName}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#111" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress}>
              <Ionicons name="person" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO CAROUSEL */}
        <FlatList
          ref={flatListRef}
          data={cards}
          renderItem={renderCard}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={onScroll}
          contentContainerStyle={{ paddingHorizontal: 20 }}/>

        {/* DOTS */}
        <View style={styles.dotsContainer}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentIndex === i && styles.activeDot]}
            />
          ))}
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickCard}>
            <View style={styles.quickIcon}>
              <Ionicons name="book-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.quickTitle}>Reviewers</Text>
            <Text style={styles.quickDesc}>Study modules & lessons</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard}>
            <View style={styles.quickIcon}>
              <Ionicons
                name="help-circle-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.quickTitle}>Mock Exam</Text>
            <Text style={styles.quickDesc}>Practice exam questions</Text>
          </TouchableOpacity>
        </View>

        {/* Subject Readiness */}
        <Text style={styles.sectionTitle}>Subject Readiness</Text>

        <View style={styles.performanceCard}>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Analytical Ability</Text>
            <Text style={styles.performanceValue}>87%</Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>
        
        {/*Verbal */}
        <View style={styles.performanceCard}>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Verbal Ability</Text>
            <Text style={styles.performanceValue}>87%  </Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>
          {/* <View style={styles.performanceBottom}>
           
          </View> */}
          
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 65,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
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

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  /* PROGRESS CARD */
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

  /* SCHEDULE CARD */
  scheduleCard: {
    width: width - 50,
    height: 200,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 22,
    paddingVertical: 20,
    justifyContent: "space-between",
  },

  scheduleTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  examLabel: {
    color: "#DCE6FF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  examBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
  },

  examBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  examDateText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  countdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  countdownLabel: {
    color: "#DCE6FF",
    fontSize: 12,
    fontWeight: "500",
  },

  countdownBlocks: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },

  countBlock: {
    alignItems: "center",
  },

  countNum: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },

  countUnit: {
    color: "#DCE6FF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 2,
  },

  countSep: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 20,
    fontWeight: "300",
    marginTop: 2,
  },

  /* DOTS */
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: "#C7D2FE",
    marginHorizontal: 4,
  },

  activeDot: {
    width: 20,
    backgroundColor: COLORS.primary,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 30,
    marginBottom: 16,
    paddingHorizontal: SPACING.lg,
  },

  /* QUICK ACTIONS */
  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },

  quickCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    padding: 18,
  },

  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  quickTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  quickDesc: {
    color: COLORS.muted,
    marginTop: 6,
    fontSize: 13,
  },

  /* PERFORMANCE */
  performanceCard: {
    backgroundColor: "#fff",
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    padding: 20,
  },

  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  performanceLabel: {
    color: COLORS.text,
     fontWeight: "700",
  },

  performanceValue: {
    fontSize: 24,
    fontWeight: "800",
  },

  progressBarBg: {
    height: 12,
    backgroundColor: "#E7ECF5",
    borderRadius: 20,
    marginTop: 16,
  },

  progressBarFill: {
    width: "87%",
    height: "100%",
    backgroundColor:"#6FC369",
    borderRadius: 20,
  },

  performanceBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  performanceSmall: {
    color: COLORS.muted,
  },

  
});