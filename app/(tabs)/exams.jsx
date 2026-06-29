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

export default function Exams() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backBtn}>
        <Ionicons name="chevron-back" size={28} color="#111" />
      </TouchableOpacity>

      <Text style={styles.title}>Choose exam</Text>

      <Text style={styles.subtitle}>
        For positions requiring a college degree.
      </Text>
      <Text style={styles.subtitle}>
        Grants second-level government eligibility.
      </Text>

      {/* Professional Card */}
      <LinearGradient
        colors={["#4D7CFF", "#2447B8"]}
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
          For positions requiring a college degree.
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
          <TouchableOpacity
            style={styles.arrowWhite}
            onPress={() => router.push("/examType")}>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#fff"/>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Sub Professional */}
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
          For clerical and trades positions. Grants
        </Text>
        <Text style={styles.cardDesc}>
          first-level government eligibility.
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

          <TouchableOpacity style={styles.arrowBlue}>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#386BF6"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  backBtn: {
    width: 40,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#14143A",
  },

  subtitle: {
    textAlign: "center",
    color: "#8A8A8A",
    fontSize: 13,
  },

  proCard: {
    marginTop: 35,
    borderRadius: 18,
    padding: 22,
    elevation: 6,
  },

  card: {
    marginTop: 24,
    borderRadius: 18,
    padding: 22,
    backgroundColor: "#fff",
    elevation: 5,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitleWhite: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },

  cardTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },

  cardDescWhite: {
    color: "#E7EEFF",
    marginTop: 3,
    fontSize: 14,
  },

  cardDesc: {
    color: "#6E6E6E",
    marginTop: 3,
    fontSize: 14,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 28,
  },

  valueWhite: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 22,
  },

  valueBlue: {
    color: "#386BF6",
    fontWeight: "700",
    fontSize: 22,
  },

  labelWhite: {
    color: "#E7EEFF",
    marginTop: 3,
    fontSize: 12,
  },

  label: {
    color: "#888",
    marginTop: 3,
    fontSize: 12,
  },

  arrowWhite: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  arrowBlue: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
  },
});