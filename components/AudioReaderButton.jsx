import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AudioReaderButton({
  isSpeaking = false,
  onPress,
  compact = false,
  disabled = false,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        compact && styles.btnCompact,
        isSpeaking && styles.btnSpeaking,
        disabled && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={
        isSpeaking ? "Stop reading question" : "Read question and choices aloud"
      }
      accessibilityHint={
        isSpeaking
          ? "Double tap to halt audio narration"
          : "Double tap to have speech synthesizer read the question and choices"
      }
      accessibilityState={{ busy: isSpeaking }}
    >
      <Ionicons
        name={isSpeaking ? "stop-circle" : "volume-high-outline"}
        size={compact ? 16 : 18}
        color={isSpeaking ? "#2563EB" : "#386BF6"}
      />

      {!compact && (
        <Text
          style={[
            styles.label,
            isSpeaking && styles.labelSpeaking,
          ]}
        >
          {isSpeaking ? "Stop Audio" : "Listen"}
        </Text>
      )}

      {isSpeaking && !compact && (
        <View style={styles.liveIndicator}>
          <View style={[styles.pulseDot, styles.dot1]} />
          <View style={[styles.pulseDot, styles.dot2]} />
          <View style={[styles.pulseDot, styles.dot3]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF3FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDE7FF",
    gap: 6,
  },
  btnCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
  },
  btnSpeaking: {
    backgroundColor: "#E0ECFF",
    borderColor: "#386BF6",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#386BF6",
  },
  labelSpeaking: {
    color: "#2563EB",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 2,
  },
  pulseDot: {
    width: 3,
    height: 9,
    borderRadius: 1.5,
    backgroundColor: "#386BF6",
  },
  dot1: {
    height: 6,
  },
  dot2: {
    height: 11,
  },
  dot3: {
    height: 7,
  },
});
