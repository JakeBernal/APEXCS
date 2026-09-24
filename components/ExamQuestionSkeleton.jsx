import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Skeleton } from "./skeleton";

export function ExamQuestionSkeleton() {
  return (
    <View style={styles.container}>
      {/* HEADER GRADIENT SKELETON */}
      <LinearGradient colors={["#4D79FF", "#2346B8"]} style={styles.header}>
        {/* Top Row: Back button, Title/Subtitle, Right icon */}
        <View style={styles.topRow}>
          <Skeleton
            width={42}
            height={42}
            borderRadius={21}
            style={styles.onDark}
          />
          <View style={styles.titleColumn}>
            <Skeleton
              width={140}
              height={16}
              borderRadius={6}
              style={styles.onDark}
            />
            <Skeleton
              width={90}
              height={12}
              borderRadius={6}
              style={[styles.onDark, { marginTop: 6 }]}
            />
          </View>
          <Skeleton
            width={42}
            height={42}
            borderRadius={21}
            style={styles.onDark}
          />
        </View>

        {/* Progress Bar Track */}
        <View style={styles.progressTrack}>
          <Skeleton
            width="35%"
            height={6}
            borderRadius={3}
            style={styles.onDarkLight}
          />
        </View>

        {/* Meta Row: Question pill & Timer pill */}
        <View style={styles.metaRow}>
          <Skeleton
            width={120}
            height={28}
            borderRadius={14}
            style={styles.onDark}
          />
          <Skeleton
            width={70}
            height={28}
            borderRadius={14}
            style={styles.onDark}
          />
        </View>
      </LinearGradient>

      {/* QUESTION BODY */}
      <View style={styles.questionArea}>
        {/* Question Header Bar: Index badge & Audio reader button */}
        <View style={styles.questionHeaderBar}>
          <Skeleton width={90} height={22} borderRadius={8} />
          <Skeleton width={80} height={32} borderRadius={16} />
        </View>

        {/* Question Prompt Text Lines */}
        <View style={styles.questionPromptBlock}>
          <Skeleton width="100%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="92%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={16} borderRadius={6} style={{ marginBottom: 20 }} />
        </View>

        {/* Multiple Choice Options */}
        <View style={styles.choicesWrapper}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.choiceCard}>
              <Skeleton width={26} height={26} borderRadius={13} style={{ marginRight: 12 }} />
              <Skeleton width={`${75 - (i % 3) * 12}%`} height={14} borderRadius={6} />
            </View>
          ))}
        </View>
      </View>

      {/* FOOTER BUTTONS */}
      <View style={styles.footer}>
        <Skeleton width="48%" height={48} borderRadius={14} />
        <Skeleton width="48%" height={48} borderRadius={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  titleColumn: {
    alignItems: "center",
  },
  onDark: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  onDarkLight: {
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  questionArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  questionHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  questionPromptBlock: {
    marginBottom: 8,
  },
  choicesWrapper: {
    gap: 12,
  },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#EEF1F5",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF1F5",
  },
});
