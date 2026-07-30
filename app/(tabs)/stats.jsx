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
import { Ionicons } from "@expo/vector-icons";
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
  const [categoryFilter, setCategoryFilter] = useState("all"); // "all" | "__all_categories__" | subject name
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

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

  // Built from real attempt data rather than hardcoded, so it naturally
  // adapts as more subjects get added to the question bank later.
  const categoryOptions = React.useMemo(() => {
    const subjectNames = Array.from(
      new Set(attempts.map((a) => a.subject_title).filter(Boolean))
    ).sort();
    const hasAllCategoriesAttempts = attempts.some((a) => a.subject_title === null);

    return [
      { key: "all", label: "All Subjects" },
      ...(hasAllCategoriesAttempts
        ? [{ key: "__all_categories__", label: "All Categories" }]
        : []),
      ...subjectNames.map((name) => ({ key: name, label: name })),
    ];
  }, [attempts]);

  const filtered = attempts.filter((a) => {
    if (filter !== "all" && a.level !== filter) return false;
    if (categoryFilter === "all") return true;
    if (categoryFilter === "__all_categories__") return a.subject_title === null;
    return a.subject_title === categoryFilter;
  });

  // Growth/comparisons should only ever be made within the same subject
  // scope + level — a Verbal Ability score isn't a fair comparison against
  // a Numerical Ability score. subject_title is either a specific subject
  // name, or null for "All Categories" attempts — null groups with null
  // just like any other value, so "All Categories" naturally becomes its
  // own comparison group with no special-casing needed.
  const sameGroup = (a, b) =>
    a.subject_title === b.subject_title && a.level === b.level;

  const findPreviousInGroup = (list, index) => {
    const current = list[index];
    for (let i = index + 1; i < list.length; i++) {
      if (sameGroup(list[i], current)) return list[i];
    }
    return null;
  };

  const examsTaken = filtered.length;
  const passed = filtered.filter((a) => (a.score ?? 0) >= PASS_THRESHOLD).length;
  const bestScore = examsTaken > 0 ? Math.max(...filtered.map((a) => a.score ?? 0)) : 0;

  const mostRecentPrevInGroup = examsTaken > 0 ? findPreviousInGroup(filtered, 0) : null;
  const growth = mostRecentPrevInGroup
    ? (filtered[0].score ?? 0) - (mostRecentPrevInGroup.score ?? 0)
    : null;

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
              {growth === null ? "—" : `${growth >= 0 ? "+" : ""}${growth}%`}
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

        {/* CATEGORY FILTER (dropdown) */}
        {categoryOptions.length > 1 && (
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setCategoryDropdownOpen((open) => !open)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownButtonText}>
                {categoryOptions.find((o) => o.key === categoryFilter)?.label ??
                  "All Subjects"}
              </Text>
              <Ionicons
                name={categoryDropdownOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={COLORS.muted}
              />
            </TouchableOpacity>

            {categoryDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {categoryOptions.map((opt, i) => {
                  const active = categoryFilter === opt.key;
                  const isLast = i === categoryOptions.length - 1;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.dropdownItem,
                        !isLast && styles.dropdownItemBorder,
                        active && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setCategoryFilter(opt.key);
                        setCategoryDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          active && styles.dropdownItemTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {active && (
                        <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {loading && (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        )}

        {!loading && filtered.length === 0 && (
          <Text style={styles.emptyText}>
            No exams taken yet. Finish a mock exam to see it here.
          </Text>
        )}

        {!loading &&
          filtered.map((attempt, index) => {
            const passedThis = (attempt.score ?? 0) >= PASS_THRESHOLD;
            const prevInGroup = findPreviousInGroup(filtered, index);
            const vsPrev = prevInGroup
              ? (attempt.score ?? 0) - (prevInGroup.score ?? 0)
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
    marginBottom: 12,
  },

  dropdownWrapper: {
    marginHorizontal: 24,
    marginBottom: 24,
  },

  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E4E9F5",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  dropdownButtonText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
  },

  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },

  dropdownItemActive: {
    backgroundColor: "#F1F5FF",
  },

  dropdownItemText: {
    color: "#555",
    fontSize: 14,
    fontWeight: "600",
  },

  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
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