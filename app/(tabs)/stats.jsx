import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const COLORS = {
  primary: "#386BF6",
  secondary: "#2346B8",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#8A94A6",
};

export default function Stats() {
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
            <Text style={styles.summaryNumber}>10</Text>
            <Text style={styles.summaryLabel}>Exam Taken</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>3</Text>
            <Text style={styles.summaryLabel}>Passed</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>72%</Text>
            <Text style={styles.summaryLabel}>Best Score</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>+11%</Text>
            <Text style={styles.summaryLabel}>Growth</Text>
          </View>
        </LinearGradient>

        {/* FILTERS */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filter}>
            <Text style={styles.filterText}>Professional</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filter}>
            <Text style={styles.filterText}>Sub-Professional</Text>
          </TouchableOpacity>
        </View>

        {/* HISTORY CARD */}
        <View style={styles.card}>
          {/* TOP */}
          <View style={styles.cardHeader}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>72%</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.examTitle}>Mock Exam #3</Text>
              <Text style={styles.examType}>Professional</Text>
            </View>

            <View style={styles.failedBadge}>
              <Text style={styles.failedText}>Failed</Text>
            </View>
          </View>

          {/* SUBJECTS */}
          <ProgressRow
            label="Verbal Ability"
            percent={72}
            color="#67C36D"
          />

          <ProgressRow
            label="Analytical Ability"
            percent={52}
            color="#D6DD55"
          />

          <ProgressRow
            label="Numerical Ability"
            percent={45}
            color="#F0AE65"
          />

          <ProgressRow
            label="General Information"
            percent={30}
            color="#EC6666"
          />

          {/* BOTTOM */}
          <View style={styles.bottomStats}>
            <View>
              <Text style={styles.bottomNumber}>122/170</Text>
              <Text style={styles.bottomLabel}>Score</Text>
            </View>

            <View>
              <Text style={styles.bottomNumber}>2h 48m</Text>
              <Text style={styles.bottomLabel}>Time</Text>
            </View>

            <View>
              <Text style={styles.bottomNumber}>+4%</Text>
              <Text style={styles.bottomLabel}>Vs Prev</Text>
            </View>
          </View>
        </View>
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

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
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
    backgroundColor: "#FDE0E0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  scoreBadgeText: {
    color: "#D44A4A",
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
    backgroundColor: "#FFE1E1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  failedText: {
    color: "#D44A4A",
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