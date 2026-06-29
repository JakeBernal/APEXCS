import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#386BF6",
  secondary: "#1F46C7",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  muted: "#8A94A6",
};

export default function Profile() {
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
            <Text style={styles.avatarText}>J</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.name}>Juan Dela Cruz</Text>
            <Text style={styles.email}>juandelacruz@gmail.com</Text>

            <View style={styles.locationRow}>
              <Ionicons
                name="location"
                size={14}
                color="#FF6B6B"
              />
              <Text style={styles.location}>
                CSC - Region I • Ilocos
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Exams</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statNumber}>72%</Text>
              <Text style={styles.statLabel}>Best</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statNumber}>52%</Text>
              <Text style={styles.statLabel}>Top</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Study Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Study Progress</Text>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Overall Readiness
            </Text>

            <Text style={styles.progressValue}>72%</Text>
          </View>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: "72%" },
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
              <Text style={styles.smallValue}>Intermediate</Text>
            </View>

            <View>
              <Text style={styles.smallTitle}>Last Exam</Text>
              <Text style={styles.smallValue}>72%</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Achievements</Text>

          <View style={styles.achievement}>
            <Ionicons
              name="trophy"
              size={22}
              color="#F7B500"
            />
            <Text style={styles.achievementText}>
              First Mock Exam Completed
            </Text>
          </View>

          <View style={styles.achievement}>
            <Ionicons
              name="flame"
              size={22}
              color="#FF7A00"
            />
            <Text style={styles.achievementText}>
              5-Day Study Streak
            </Text>
          </View>

          <View style={styles.achievement}>
            <Ionicons
              name="star"
              size={22}
              color="#FFD700"
            />
            <Text style={styles.achievementText}>
              Best Score: 72%
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>

          <SettingItem
            icon="person-outline"
            title="Edit Profile"
          />

          <SettingItem
            icon="notifications-outline"
            title="Notifications"
          />

          <SettingItem
            icon="lock-closed-outline"
            title="Change Password"
          />

          <SettingItem
            icon="log-out-outline"
            title="Logout"
            danger
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SettingItem({ icon, title, danger }) {
  return (
    <TouchableOpacity style={styles.settingItem}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? "#E74C3C" : "#386BF6"}
      />

      <Text
        style={[
          styles.settingText,
          danger && { color: "#E74C3C" },
        ]}
      >
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#B8B8B8"
      />
    </TouchableOpacity>
  );
}

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