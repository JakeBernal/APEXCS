import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "./skeleton";

export function ProfileStatsSkeleton() {
  return (
    <View style={styles.statsRow}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ alignItems: "center" }}>
          <Skeleton width={30} height={20} borderRadius={6} style={styles.onDark} />
          <Skeleton width={40} height={10} borderRadius={6} style={[styles.onDark, { marginTop: 6 }]} />
        </View>
      ))}
    </View>
  );
}

export function ProfileProgressSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={140} height={16} borderRadius={6} style={{ marginBottom: 20 }} />
      <View style={styles.progressHeader}>
        <Skeleton width={110} height={12} borderRadius={6} />
        <Skeleton width={34} height={12} borderRadius={6} />
      </View>
      <Skeleton width="100%" height={12} borderRadius={20} style={{ marginTop: 12, marginBottom: 18 }} />
      <View style={styles.progressBottom}>
        <Skeleton width={40} height={26} borderRadius={6} />
        <Skeleton width={40} height={26} borderRadius={6} />
        <Skeleton width={40} height={26} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },
  onDark: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 22,
    borderRadius: 20,
    padding: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});