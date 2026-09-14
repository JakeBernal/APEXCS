import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SubmitExamModal({ visible, onCancel, onSubmit, onQuit }) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="cellphone-check"
            size={36}
            color="#386BF6"
          />
        </View>

        <Text style={styles.title}>Submit Exam?</Text>
        <Text style={styles.subtitle}>
          Unanswered questions will be marked as skipped. You can't undo this.
        </Text>

        <View style={styles.row}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>

        {onQuit ? (
          <TouchableOpacity
            style={styles.quitLink}
            onPress={onQuit}
            activeOpacity={0.7}
          >
            <Text style={styles.quitLinkText}>
              Discard session & quit without saving
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 26,
    alignItems: "center",
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#14143A",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 13,
    color: "#7D8FB3",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },

  row: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: "#386BF6",
    fontWeight: "700",
    fontSize: 15,
  },

  submitBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#386BF6",
    justifyContent: "center",
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  quitLink: {
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  quitLinkText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
