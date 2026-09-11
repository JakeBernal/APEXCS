import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#386BF6",
  navy: "#152B65",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  textSecondary: "#475569",
  muted: "#7D8FB3",
  border: "#EEF1F5",
  panelBlue: "#EEF3FF",
  panelBlueBorder: "#DDE7FF",
  warning: "#F59E0B",
  warningBg: "#FEF7EE",
  warningBorder: "#FED7AA",
};

const TERMS_SECTIONS = [
  {
    icon: "shield-checkmark-outline",
    title: "1. Acceptance of Terms",
    content:
      "By creating an account, accessing, or using APEX-CS (Assessment & Practice Exam for Civil Service), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application.",
  },
  {
    icon: "school-outline",
    title: "2. Purpose of the Application",
    content:
      "APEX-CS is an independent self-paced learning and review platform designed to help examinees prepare for the Philippine Civil Service Examination (CSE - Professional and Sub-Professional levels).",
  },
  {
    icon: "alert-circle-outline",
    title: "3. Independent Reviewer Disclaimer",
    isNotice: true,
    content:
      "APEX-CS is an independent educational tool. It is NOT affiliated with, authorized, endorsed by, or in any way officially connected with the Civil Service Commission (CSC) or any government agency in the Philippines. Mock exam scores and readiness predictions do not guarantee passing the official civil service examination.",
  },
  {
    icon: "person-circle-outline",
    title: "4. User Accounts & Security",
    content:
      "You are responsible for maintaining the confidentiality of your account login credentials. You must provide a valid email address for account verification and password recovery. You agree to notify us immediately of any unauthorized use of your account.",
  },
  {
    icon: "document-text-outline",
    title: "5. Intellectual Property & Study Material",
    content:
      "All mock questions, explanations, formulas, analytics, and software interfaces in APEX-CS are intended solely for your personal, non-commercial review. Reproduction, redistribution, scraping, or commercial sale of app contents without explicit written consent is strictly prohibited.",
  },
  {
    icon: "analytics-outline",
    title: "6. User Data & Exam Analytics",
    content:
      "We record mock exam attempts, scores, and study streaks to calculate your subject readiness and performance dashboard. We do not sell your personal study records to third-party advertisers.",
  },
  {
    icon: "refresh-circle-outline",
    title: "7. Updates to Terms",
    content:
      "We reserve the right to revise or update these Terms and Conditions at any time. Continued use of APEX-CS after changes are posted constitutes acceptance of the modified terms.",
  },
];

export default function Terms() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor={COLORS.bg} />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.navy} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>Legal & Policies</Text>
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* SCROLL CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* WELCOME CALLOUT BANNER */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconBox}>
            <Ionicons name="book" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.heroTitle}>APEX-CS User Agreement</Text>
            <Text style={styles.heroText}>
              Please read these terms carefully before starting your Civil Service exam preparation journey.
            </Text>
            <View style={styles.badgePill}>
              <Ionicons name="time-outline" size={12} color={COLORS.primary} />
              <Text style={styles.badgeText}>Last updated: October 2026</Text>
            </View>
          </View>
        </View>

        {/* STRUCTURED SECTIONS */}
        {TERMS_SECTIONS.map((section, index) => (
          <View
            key={index}
            style={[
              styles.sectionCard,
              section.isNotice && styles.noticeCard,
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <View
                style={[
                  styles.sectionIconWrap,
                  section.isNotice && styles.noticeIconWrap,
                ]}
              >
                <Ionicons
                  name={section.icon}
                  size={18}
                  color={section.isNotice ? COLORS.warning : COLORS.primary}
                />
              </View>
              <Text
                style={[
                  styles.sectionTitle,
                  section.isNotice && { color: "#B45309" },
                ]}
              >
                {section.title}
              </Text>
            </View>

            <Text
              style={[
                styles.sectionContent,
                section.isNotice && styles.noticeContent,
              ]}
            >
              {section.content}
            </Text>
          </View>
        ))}

        {/* BOTTOM ACCEPT BUTTON */}
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.acceptButtonText}>I Understand & Agree</Text>
        </TouchableOpacity>

        <Text style={styles.footerBrand}>APEX-CS • Assessment & Practice Exam</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  headerTitleContainer: { alignItems: "center" },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.navy,
    marginTop: 2,
  },
  headerRightSpacer: { width: 40 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  heroBanner: {
    backgroundColor: COLORS.panelBlue,
    borderColor: COLORS.panelBlueBorder,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: { fontSize: 15, fontWeight: "700", color: COLORS.navy },
  heroText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginTop: 4 },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 10,
    gap: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: COLORS.primary },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.panelBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.navy, flex: 1 },
  sectionContent: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  noticeCard: { backgroundColor: COLORS.warningBg, borderColor: COLORS.warningBorder },
  noticeIconWrap: { backgroundColor: "#FFFBEB" },
  noticeContent: { color: "#92400E" },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    marginTop: 14,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  acceptButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  footerBrand: { textAlign: "center", fontSize: 11, color: COLORS.muted, marginTop: 18 },
});