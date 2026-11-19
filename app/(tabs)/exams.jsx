import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

export default function Exams() {
  const handleSelectExam = (level) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/examType?level=${level}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={28} color="#14143A" />
      </TouchableOpacity>

      <Text style={styles.title}>Choose exam</Text>

      <Text style={styles.subtitle}>
        Choose the Civil Service Exam level you want to prepare for.
      </Text>

      {/* Professional Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleSelectExam("professional")}
        accessibilityRole="button"
        accessibilityLabel="Select Professional Civil Service Exam"
      >
        <LinearGradient
          colors={["#386BF6", "#1D4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.proCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitleWhite}>Professional</Text>

            <Ionicons
              name="briefcase-outline"
              size={24}
              color="#fff"
            />
          </View>

          <Text style={styles.cardDescWhite}>
            For positions requiring a four-year college degree.
          </Text>

          <Text style={styles.cardDescWhite}>
            Grants second-level government eligibility.
          </Text>

          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.valueWhite}>170</Text>
              <Text style={styles.labelWhite}>ITEMS</Text>
            </View>

            <View>
              <Text style={styles.valueWhite}>3 hrs</Text>
              <Text style={styles.labelWhite}>DURATION</Text>
            </View>

            <View>
              <Text style={styles.valueWhite}>80%</Text>
              <Text style={styles.labelWhite}>TO PASS</Text>
            </View>

            <View style={styles.arrowWhite}>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#fff"
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Sub-Professional Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleSelectExam("sub")}
        accessibilityRole="button"
        accessibilityLabel="Select Sub-Professional Civil Service Exam"
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sub-Professional</Text>

            <Ionicons
              name="school-outline"
              size={24}
              color="#386BF6"
            />
          </View>

          <Text style={styles.cardDesc}>
            For clerical, custodial, and trades positions.
          </Text>

          <Text style={styles.cardDesc}>
            Grants first-level government eligibility.
          </Text>

          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.valueBlue}>165</Text>
              <Text style={styles.label}>ITEMS</Text>
            </View>

            <View>
              <Text style={styles.valueBlue}>2 hrs</Text>
              <Text style={styles.label}>DURATION</Text>
            </View>

            <View>
              <Text style={styles.valueBlue}>80%</Text>
              <Text style={styles.label}>TO PASS</Text>
            </View>

            <View style={styles.arrowBlue}>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#386BF6"
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    marginBottom: 6,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#0F172A",
  },

  subtitle: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },

  /* PROFESSIONAL CARD */
  proCard: {
    marginTop: 32,
    borderRadius: 20,
    padding: 22,
    elevation: 8,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },

  /* SUB-PROFESSIONAL CARD */
  card: {
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    backgroundColor: "#FFFFFF",
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitleWhite: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  cardTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },

  cardDescWhite: {
    color: "#E0E7FF",
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },

  cardDesc: {
    color: "#475569",
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 26,
  },

  valueWhite: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 22,
    fontVariant: ["tabular-nums"],
  },

  valueBlue: {
    color: "#2563EB",
    fontWeight: "800",
    fontSize: 22,
    fontVariant: ["tabular-nums"],
  },

  labelWhite: {
    color: "#C7D2FE",
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  label: {
    color: "#64748B",
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  arrowWhite: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  arrowBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
});
