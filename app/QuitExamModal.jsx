import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function QuitExamModal({ visible, onContinue, onQuit }) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image
            source={require("../assets/Quitting exam.png")}
            style={styles.illustration}
            resizeMode="contain"
          />

          <Text style={styles.title}>Quit Exam?</Text>
          <Text style={styles.subtitle}>
            Are you sure you want to exit? Your answers will be discarded and
            this session will not affect your exam readiness or statistics.
          </Text>

          <View style={styles.btnColumn}>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueText}>Continue Exam</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quitBtn}
              onPress={onQuit}
              activeOpacity={0.8}
            >
              <Ionicons name="exit-outline" size={18} color="#DC2626" />
              <Text style={styles.quitText}>Quit Exam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 58, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 26,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  illustration: {
    width: 180,
    height: 180,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#14143A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#7D8FB3",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  btnColumn: {
    width: "100%",
    gap: 10,
  },
  continueBtn: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
  },
  continueText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  quitBtn: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  quitText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },
});
