import React, { useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";

export function Skeleton({ width, height, borderRadius = 8, style }) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius, opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: "#DADFEB",
  },
});
