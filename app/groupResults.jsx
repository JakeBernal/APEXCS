import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getRoomLeaderboard } from "../lib/groupExamManager";
import { PASS_THRESHOLD } from "../lib/curriculum";

const COLORS = {
  primary: "#386BF6",
  primaryDark: "#1D4ED8",
  primaryBg: "#EFF6FF",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  muted: "#7D8FB3",
  border: "#EEF1F5",
  success: "#10B981",
  successBg: "#ECFDF5",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  gold: "#F59E0B",
  goldBg: "#FEF3C7",
};

export default function GroupResultScreen({
  roomCode = "APX-408",
  userScore = 84,
  userCorrect = 42,
  userTotal = 50,
  userDuration = 1520,
  onReviewAnswers,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadLeaderboard = async () => {
    try {
      const res = await getRoomLeaderboard(roomCode);
      setData(res);
    } catch (err) {
      console.warn("Failed to load group leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [roomCode]);

  const formatDuration = (seconds) => {
    const m = Math.floor((seconds || 0) / 60);
    const s = (seconds || 0) % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const isUserPassed = userScore >= PASS_THRESHOLD;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <View style={styles.badgeRow}>
            <View style={styles.trackBadge}>
              <View style={styles.trackDot} />
              <Text style={styles.trackBadgeText}>ROOM {roomCode} RESULTS</Text>
            </View>
          </View>
          <Text style={styles.title}>Batch Leaderboard</Text>
          <Text style={styles.subtitle}>
            Standardized examination results across all batch examinees
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close Leaderboard"
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Summary Card */}
        <LinearGradient
          colors={isUserPassed ? [COLORS.primary, COLORS.primaryDark] : ["#475569", "#1E293B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userCard}
        >
          <View style={styles.userCardTop}>
            <View>
              <Text style={styles.userCardLabel}>YOUR FINAL RATING</Text>
              <Text style={styles.userCardScore}>{userScore}%</Text>
            </View>
            <View style={[styles.statusBadge, isUserPassed ? styles.statusBadgePass : styles.statusBadgeFail]}>
              <Ionicons
                name={isUserPassed ? "checkmark-circle" : "alert-circle"}
                size={14}
                color={isUserPassed ? COLORS.success : COLORS.danger}
              />
              <Text style={[styles.statusBadgeText, isUserPassed ? styles.statusTextPass : styles.statusTextFail]}>
                {isUserPassed ? "CSC PASSED (80%+)" : "NEEDS IMPROVEMENT"}
              </Text>
            </View>
          </View>

          <View style={styles.userCardDivider} />

          <View style={styles.userStatsRow}>
            <View>
              <Text style={styles.userStatVal}>{userCorrect}/{userTotal}</Text>
              <Text style={styles.userStatLbl}>CORRECT</Text>
            </View>
            <View>
              <Text style={styles.userStatVal}>{formatDuration(userDuration)}</Text>
              <Text style={styles.userStatLbl}>TIME TAKEN</Text>
            </View>
            <View>
              <Text style={styles.userStatVal}>80%</Text>
              <Text style={styles.userStatLbl}>CUT-OFF</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Batch Class Analytics Summary */}
        {data && (
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{data.totalTakers}</Text>
              <Text style={styles.metricLbl}>TAKERS</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricVal, { color: COLORS.success }]}>{data.passRate}%</Text>
              <Text style={styles.metricLbl}>CLASS PASS RATE</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{data.avgScore}%</Text>
              <Text style={styles.metricLbl}>CLASS AVERAGE</Text>
            </View>
          </View>
        )}

        {/* Leaderboard Table */}
        <View style={styles.leaderboardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Reviewee Rankings</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setLoading(true);
                loadLeaderboard();
              }}
              style={styles.refreshBtn}
              hitSlop={10}
            >
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Compiling batch results...</Text>
            </View>
          ) : (
            <View style={styles.rankListCard}>
              {data?.participants?.map((participant, index) => {
                const isTop3 = index < 3;
                const podiumColors = ["#F59E0B", "#94A3B8", "#B45309"];
                const rankColor = isTop3 ? podiumColors[index] : COLORS.muted;
                const passed = (participant.score ?? 0) >= PASS_THRESHOLD;

                return (
                  <View key={participant.id || index}>
                    <View style={styles.rankRow}>
                      {/* Rank Position */}
                      <View style={[styles.rankBadge, isTop3 && { backgroundColor: `${rankColor}15` }]}>
                        <Text style={[styles.rankText, { color: rankColor }]}>
                          #{index + 1}
                        </Text>
                      </View>

                      {/* Name & Duration */}
                      <View style={styles.rankNameCol}>
                        <Text style={styles.rankName} numberOfLines={1}>
                          {participant.display_name}
                        </Text>
                        <Text style={styles.rankMeta}>
                          {formatDuration(participant.duration_seconds)}
                        </Text>
                      </View>

                      {/* Score & CSC Badge */}
                      <View style={styles.rankScoreCol}>
                        <Text style={styles.rankScoreText}>{participant.score}%</Text>
                        <Text style={[styles.rankPassIndicator, { color: passed ? COLORS.success : COLORS.danger }]}>
                          {passed ? "Pass" : "Fail"}
                        </Text>
                      </View>
                    </View>
                    {index < (data?.participants?.length || 0) - 1 && (
                      <View style={styles.rowDivider} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Review Answers Action */}
        {onReviewAnswers && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={onReviewAnswers}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.reviewBtnText}>Review My Answers & Explanations</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  trackBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  trackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  trackBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* User Score Card */
  userCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#1D4ED8",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  userCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 0.8,
  },
  userCardScore: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgePass: {
    backgroundColor: "#ECFDF5",
  },
  statusBadgeFail: {
    backgroundColor: "#FEF2F2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusTextPass: {
    color: COLORS.success,
  },
  statusTextFail: {
    color: COLORS.danger,
  },
  userCardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 14,
  },
  userStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  userStatVal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userStatLbl: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 1,
  },

  /* Metrics Grid */
  metricsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  metricLbl: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.muted,
    marginTop: 2,
    textAlign: "center",
  },

  /* Leaderboard Section */
  leaderboardSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  rankListCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "800",
  },
  rankNameCol: {
    flex: 1,
  },
  rankName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  rankMeta: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 1,
  },
  rankScoreCol: {
    alignItems: "flex-end",
  },
  rankScoreText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  rankPassIndicator: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 48,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
