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
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const COLORS = {
  primary: "#386BF6",
  navy: "#14143A",
  bg: "#FFFFFF",
  inputBg: "#F8FAFD",
  inputBorder: "#E2E8F0",
  inputBorderFocus: "#386BF6",
  text: "#14143A",
  muted: "#7D8FB3",
  border: "#EEF1F5",
};

export default function ForgotPassword() {
  // 1: Request 6-digit code | 2: Verify 6-digit code | 3: Enter New Password
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= STEP 1: SEND 6-DIGIT CODE ================= */
  const handleSendOtp = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      Alert.alert("Email Required", "Please enter your registered Gmail address.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    setLoading(false);

    if (error) {
      Alert.alert("Request Failed", error.message);
      return;
    }

    Alert.alert(
      "Code Sent",
      "We sent a 6-digit verification code to your Gmail. Please check your inbox (and spam folder)."
    );
    setStep(2);
  };

  /* ================= STEP 2: VERIFY 6-DIGIT NUMBER ================= */
  const handleVerifyOtp = async () => {
    const cleanCode = otpCode.trim();
    if (cleanCode.length < 6) {
      Alert.alert("Invalid Code", "Please enter the full 6-digit numeric code sent to your email.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: cleanCode,
      type: "recovery",
    });
    setLoading(false);

    if (error) {
      Alert.alert("Verification Failed", error.message || "Invalid or expired 6-digit code.");
      return;
    }

    setStep(3);
  };

  /* ================= STEP 3: SAVE NEW PASSWORD ================= */
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing Info", "Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Update Failed", error.message);
      return;
    }

    Alert.alert(
      "Password Reset Successful",
      "Your password has been updated. You can now log in.",
      [
        {
          text: "Back to Login",
          onPress: () => router.replace("/login"),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TOP BACK BUTTON */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.navy} />
          </TouchableOpacity>

          {/* ORIGINAL LOGO */}
          <View style={styles.logoWrapper}>
            <Text style={styles.apex}>APEX</Text>
            <Text style={styles.cs}>cs</Text>
          </View>

          {/* HEADINGS */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 1 && "Forgot Password"}
              {step === 2 && "Enter 6-Digit Code"}
              {step === 3 && "Create New Password"}
            </Text>
            <Text style={styles.instructions}>
              {step === 1 && "Enter your registered Gmail to receive a password reset code."}
              {step === 2 && `Enter the 6-digit numeric code sent to ${email}`}
              {step === 3 && "Enter your new password below."}
            </Text>
          </View>

          {/* STEP PROGRESS DOTS */}
          <View style={styles.stepsRow}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
          </View>

          {/* FORM CONTAINER */}
          <View style={styles.form}>
            {/* STEP 1: EMAIL */}
            {step === 1 && (
              <>
                <Text style={styles.label}>Registered Gmail Address</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.muted} style={styles.leadingIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="name@gmail.com"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                  disabled={loading}
                  onPress={handleSendOtp}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

          
            {step === 2 && (
              <>
                <Text style={styles.label}>6-Digit Verification Code</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="keypad-outline" size={20} color={COLORS.muted} style={styles.leadingIcon} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="123456"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpCode}
                    onChangeText={setOtpCode}
                  />
                </View>

                <TouchableOpacity
                  style={styles.resendRow}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Didn’t get the code? Resend</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                  disabled={loading}
                  onPress={handleVerifyOtp}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3: NEW PASSWORD */}
            {step === 3 && (
              <>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.muted} style={styles.leadingIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={COLORS.muted}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.muted} style={styles.leadingIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat new password"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                  disabled={loading}
                  onPress={handleUpdatePassword}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Save New Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* BACK TO LOGIN */}
          <TouchableOpacity
            style={styles.bottomLinkRow}
            onPress={() => router.replace("/login")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F4F6FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoWrapper: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  apex: { fontSize: 38, fontWeight: "900", color: "#14143A", letterSpacing: 3 },
  cs: { fontSize: 20, fontStyle: "italic", marginTop: 18, marginLeft: 2, color: "#386BF6" },
  header: { width: "100%", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#1F1F5A" },
  instructions: { fontSize: 14, color: COLORS.muted, marginTop: 6, lineHeight: 20 },
  stepsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", marginBottom: 24 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E2E8F0" },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepLine: { width: 40, height: 2, backgroundColor: "#E2E8F0", marginHorizontal: 4 },
  stepLineActive: { backgroundColor: COLORS.primary },
  form: { width: "100%" },
  label: { fontSize: 13, fontWeight: "600", color: "#1F1F5A", marginBottom: 6, marginTop: 10 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 10,
  },
  leadingIcon: { marginRight: 10 },
  input: { flex: 1, height: "100%", fontSize: 15, color: COLORS.text },
  otpInput: { fontSize: 22, letterSpacing: 8, fontWeight: "700" },
  resendRow: { alignSelf: "flex-end", marginTop: 4, marginBottom: 14 },
  resendText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    width: "100%",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  bottomLinkRow: { flexDirection: "row", alignItems: "center", marginTop: 28 },
  linkText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
});