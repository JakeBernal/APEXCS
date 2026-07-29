import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { getAttemptHistory, PASS_THRESHOLD } from "../../lib/attempts";

const COLORS = {
  primary: "#386BF6",
  secondary: "#2346B8",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#8A94A6",
};

const SUBJECT_COLORS = ["#67C36D", "#D6DD55", "#F0AE65", "#EC6666", "#7C9CF0"];

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Stats() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "professional" | "sub"

  const loadHistory = useCallback(() => {
    setLoading(true);
    getAttemptHistory()
      .then((data) => setAttempts(data.filter((a) => a.mode !== "flashcards")))
      .finally(() => setLoading(false));
  }, []);

  // Refetch every time this tab comes into focus, so a just-finished
  // exam shows up immediately without needing a manual app reload.
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const filtered = attempts.filter((a) => {
    if (filter === "all") return true;
    return a.level === filter;
  });

  const examsTaken = filtered.length;
  const passed = filtered.filter((a) => (a.score ?? 0) >= PASS_THRESHOLD).length;
  const bestScore = examsTaken > 0 ? Math.max(...filtered.map((a) => a.score ?? 0)) : 0;
  const growth =
    filtered.length >= 2 ? (filtered[0].score ?? 0) - (filtered[1].score ?? 0) : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* TITLE */}
        <Text style={styles.title}>History</Text>

        {/* SUMMARY CARD */}
        <LinearGradient
          colors={["#4E7BFF", "#2B49B9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{examsTaken}</Text>
            <Text style={styles.summaryLabel}>Exam Taken</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{passed}</Text>
            <Text style={styles.summaryLabel}>Passed</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{bestScore}%</Text>
            <Text style={styles.summaryLabel}>Best Score</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {growth >= 0 ? "+" : ""}
              {growth}%
            </Text>
            <Text style={styles.summaryLabel}>Growth</Text>
          </View>
        </LinearGradient>

        {/* FILTERS */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={filter === "all" ? styles.activeFilter : styles.filter}
            onPress={() => setFilter("all")}
          >
            <Text style={filter === "all" ? styles.activeFilterText : styles.filterText}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={filter === "professional" ? styles.activeFilter : styles.filter}
            onPress={() => setFilter("professional")}
          >
            <Text
              style={filter === "professional" ? styles.activeFilterText : styles.filterText}
            >
              Professional
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={filter === "sub" ? styles.activeFilter : styles.filter}
            onPress={() => setFilter("sub")}
          >
            <Text style={filter === "sub" ? styles.activeFilterText : styles.filterText}>
              Sub-Professional
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        )}

        {!loading && filtered.length === 0 && (
          <Text style={styles.emptyText}>
            No exams taken yet. Take a mock exam to see it here.
          </Text>
        )}

        {!loading &&
          filtered.map((attempt, index) => {
            const passedThis = (attempt.score ?? 0) >= PASS_THRESHOLD;
            const prevSameFilter = filtered[index + 1];
            const vsPrev = prevSameFilter
              ? (attempt.score ?? 0) - (prevSameFilter.score ?? 0)
              : null;

            return (
              <View key={attempt.id} style={styles.card}>
                {/* TOP */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: passedThis ? "#E1F7E6" : "#FDE0E0" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scoreBadgeText,
                        { color: passedThis ? "#2FA84F" : "#D44A4A" },
                      ]}
                    >
                      {attempt.score ?? 0}%
                    </Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.examTitle}>
                      {attempt.subject_title || "All Categories"}
                    </Text>
                    <Text style={styles.examType}>
                      {attempt.level === "professional" ? "Professional" : "Sub-Professional"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.failedBadge,
                      { backgroundColor: passedThis ? "#DFF6E4" : "#FFE1E1" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.failedText,
                        { color: passedThis ? "#2FA84F" : "#D44A4A" },
                      ]}
                    >
                      {passedThis ? "Passed" : "Failed"}
                    </Text>
                  </View>
                </View>

                {/* SUBJECTS */}
                {(attempt.subject_breakdown || []).map((s, i) => {
                  const percent = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                  return (
                    <ProgressRow
                      key={s.title}
                      label={s.title}
                      percent={percent}
                      color={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                    />
                  );
                })}

                {/* BOTTOM */}
                <View style={styles.bottomStats}>
                  <View>
                    <Text style={styles.bottomNumber}>
                      {attempt.correct_count ?? 0}/{attempt.total_questions ?? 0}
                    </Text>
                    <Text style={styles.bottomLabel}>Score</Text>
                  </View>

                  <View>
                    <Text style={styles.bottomNumber}>
                      {formatDuration(attempt.duration_seconds)}
                    </Text>
                    <Text style={styles.bottomLabel}>Time</Text>
                  </View>

                  <View>
                    <Text style={styles.bottomNumber}>
                      {vsPrev === null ? "—" : `${vsPrev >= 0 ? "+" : ""}${vsPrev}%`}
                    </Text>
                    <Text style={styles.bottomLabel}>Vs Prev</Text>
                  </View>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
}

function ProgressRow({ label, percent, color }) {
  return (
    <View style={{ marginTop: 14 }}>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={[styles.progressPercent, { color }]}>
          {percent}%
        </Text>
      </View>

      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percent}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 65,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    marginHorizontal: 24,
    marginBottom: 22,
    color: COLORS.text,
  },

  summaryCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    paddingVertical: 22,
    flexDirection: "row",
    justifyContent: "space-around",
    elevation: 5,
  },

  summaryItem: {
    alignItems: "center",
  },

  summaryNumber: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },

  summaryLabel: {
    color: "#DDE6FF",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },

  filterRow: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
  },

  activeFilter: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },

  activeFilterText: {
    color: "#fff",
    fontWeight: "700",
  },

  filter: {
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "#fff",
  },

  filterText: {
    color: "#B0B0B0",
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    color: COLORS.muted,
    marginTop: 30,
    paddingHorizontal: 24,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginBottom: 18,
    borderRadius: 18,
    padding: 18,
    elevation: 5,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  scoreBadgeText: {
    fontWeight: "700",
    fontSize: 12,
  },

  examTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: COLORS.text,
  },

  examType: {
    color: COLORS.muted,
    marginTop: 2,
  },

  failedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  failedText: {
    fontWeight: "700",
    fontSize: 12,
  },

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  progressLabel: {
    color: "#555",
    fontSize: 14,
  },

  progressPercent: {
    fontWeight: "700",
  },

  progressBg: {
    height: 8,
    backgroundColor: "#E7ECF5",
    borderRadius: 10,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  bottomStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 28,
  },

  bottomNumber: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: COLORS.text,
  },

  bottomLabel: {
    color: COLORS.muted,
    marginTop: 4,
    textAlign: "center",
  },
});