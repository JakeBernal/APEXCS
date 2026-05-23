import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        {/* LOGO */}
        <View style={styles.logoWrapper}>
          <Text style={styles.apex}>APEX</Text>
          <Text style={styles.cs}>cs</Text>
        </View>

        {/* TITLE */}
        <Text style={styles.title}>Register</Text>

        {/* FORM */}
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} />

          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} keyboardType="email-address" />

          {/* PASSWORD */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordBox}>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* CONFIRM PASSWORD */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordBox}>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons
                name={showConfirm ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* TERMS */}
          <View style={styles.termsRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setAgree(!agree)}
            >
              {agree && <View style={styles.checked} />}
            </TouchableOpacity>

            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text
                style={styles.termsLink}
                onPress={() => router.push("/term")}
              >
                Terms & Conditions
              </Text>
            </Text>
          </View>
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { opacity: agree ? 1 : 0.5 }
          ]}
          disabled={!agree}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>

        {/* LINK */}
        <Text style={styles.bottomText}>
          Already have an account?{" "}
          <Text style={styles.link} onPress={() => router.push("/login")}>
            Login
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingTop: 80,
    alignItems: "center",
    paddingBottom: 40,
  },

  logoWrapper: {
    flexDirection: "row",
  },

  apex: {
    fontSize: 38,
    fontWeight: "900",
    color: "#14143A",
    letterSpacing: 3,
  },

  cs: {
    fontSize: 20,
    fontStyle: "italic",
    marginTop: 18,
    marginLeft: 2,
    color: "#386BF6",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 40,
    color: "#1F1F5A",
  },

  form: {
    width: "75%",
    marginTop: 30,
  },

  input: {
    backgroundColor: "#F2F2F2",
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
  },

  label: {
    fontWeight: "600",
    color: "#1F1F5A",
    marginBottom: 6,
    marginTop: 10,
  },

  passwordBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 18,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#386BF6",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  checked: {
    width: 10,
    height: 10,
    backgroundColor: "#386BF6",
    borderRadius: 2,
  },

  termsText: {
    color: "#444",
    fontSize: 13,
  },

  termsLink: {
    color: "#386BF6",
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  primaryBtn: {
    backgroundColor: "#386BF6",
    width: 315,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  bottomText: {
    marginTop: 20,
    color: "#666",
  },

  link: {
    color: "#386BF6",
    fontWeight: "700",
  },
});