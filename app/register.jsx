import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { createSessionFromUrl } from "../lib/authHelper";

WebBrowser.maybeCompleteAuthSession();

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

export default function Register() {
  const { signUp } = useAuth();

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Live password validation
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Input focus highlights
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  /* ================= REGISTRATION HANDLER ================= */
  const handleRegister = async () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    // Number requirement check
    if (!/\d/.test(password)) {
      Alert.alert("Password Requirement", "Password must contain at least one number (0-9).");
      return;
    }

    if (!agree) {
      Alert.alert("Terms & Conditions", "Please agree to the Terms & Conditions to proceed.");
      return;
    }

    setLoading(true);
    const { data, error } = await signUp({
      fullName: cleanName,
      email: cleanEmail,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Registration Failed", error.message);
      return;
    }

    // Supabase confirmation flow
    if (!data.session) {
      Alert.alert(
        "Verification Email Sent",
        `We sent a confirmation link to ${cleanEmail}. Please verify your email in Gmail before signing in.`,
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } else {
      router.replace("/dashboard");
    }
  };

  /* ================= GOOGLE REGISTRATION VIA SUPABASE ================= */
  const handleGoogleSignIn = async () => {
    let linkingSub = null;
    try {
      setGoogleLoading(true);
      const redirectUrl = Linking.createURL("dashboard");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) {
        throw new Error("Supabase did not return an authentication URL. Please verify Google provider is enabled in your Supabase dashboard.");
      }

      // Channel 1: Listen for Android deep link intent while browser is open
      let redirected = false;
      linkingSub = Linking.addEventListener("url", async (event) => {
        if (!redirected && event.url && (event.url.includes("code=") || event.url.includes("access_token="))) {
          redirected = true;
          try {
            const s = await createSessionFromUrl(event.url);
            if (s) {
              router.replace("/dashboard");
            }
          } catch (e) {
            console.error("Linking redirect error:", e);
          }
        }
      });

      // Channel 2: Open Auth Session via browser
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (linkingSub) {
        linkingSub.remove();
        linkingSub = null;
      }

      if (result.type === "success" && result.url) {
        redirected = true;
        const session = await createSessionFromUrl(result.url);
        if (session) {
          router.replace("/dashboard");
          return;
        }
      }

      // Channel 3: Fallback check (handles cases where Android closed Custom Tabs upon deep link)
      let activeSession = (await supabase.auth.getSession()).data?.session;
      if (!activeSession) {
        for (let i = 0; i < 4; i++) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          activeSession = (await supabase.auth.getSession()).data?.session;
          if (activeSession) break;
        }
      }

      if (activeSession) {
        router.replace("/dashboard");
        return;
      }

      if (result.type !== "cancel" && result.type !== "dismiss") {
        Alert.alert("Google Sign-In", "No active session received. Please try again.");
      }
    } catch (err) {
      Alert.alert("Google Sign-In", err.message || "Unable to complete Google registration.");
    } finally {
      if (linkingSub) {
        linkingSub.remove();
      }
      setGoogleLoading(false);
    }
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
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* TOP BACK BUTTON */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.navy} />
          </TouchableOpacity>

          {/* ORIGINAL LOGO (UNTOUCHED) */}
          <View style={styles.logoWrapper}>
            <Text style={styles.apex}>APEX</Text>
            <Text style={styles.cs}>cs</Text>
          </View>

          {/* HEADINGS */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.instructions}>Start preparing for the Civil Service Exam</Text>
          </View>

          {/* FORM CONTAINER (100% MATCHING WIDTH) */}
          <View style={styles.form}>
            {/* FULL NAME */}
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputBox, isNameFocused && styles.inputBoxFocused]}>
              <Ionicons
                name="person-outline"
                size={20}
                color={isNameFocused ? COLORS.primary : COLORS.muted}
                style={styles.leadingIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Juan Dela Cruz"
                placeholderTextColor="#A0AEC0"
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                editable={!loading && !googleLoading}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
              />
            </View>

            {/* EMAIL */}
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputBox, isEmailFocused && styles.inputBoxFocused]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={isEmailFocused ? COLORS.primary : COLORS.muted}
                style={styles.leadingIcon}
              />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="name@gmail.com"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!loading && !googleLoading}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>

            {/* PASSWORD */}
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputBox, isPasswordFocused && styles.inputBoxFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isPasswordFocused ? COLORS.primary : COLORS.muted}
                style={styles.leadingIcon}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Create password"
                placeholderTextColor="#A0AEC0"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                editable={!loading && !googleLoading}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.trailingIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            {/* REAL-TIME PASSWORD CRITERIA PILLS */}
            {password.length > 0 && (
              <View style={styles.criteriaContainer}>
                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                    size={14}
                    color={hasMinLength ? "#10B981" : COLORS.muted}
                  />
                  <Text style={[styles.criteriaText, hasMinLength && styles.criteriaTextValid]}>
                    6+ characters
                  </Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={hasNumber ? "checkmark-circle" : "ellipse-outline"}
                    size={14}
                    color={hasNumber ? "#10B981" : COLORS.muted}
                  />
                  <Text style={[styles.criteriaText, hasNumber && styles.criteriaTextValid]}>
                    At least 1 number
                  </Text>
                </View>
              </View>
            )}

            {/* CONFIRM PASSWORD */}
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputBox, isConfirmFocused && styles.inputBoxFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isConfirmFocused ? COLORS.primary : COLORS.muted}
                style={styles.leadingIcon}
              />
              <TextInput
                ref={confirmRef}
                style={styles.input}
                placeholder="Repeat password"
                placeholderTextColor="#A0AEC0"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                editable={!loading && !googleLoading}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setIsConfirmFocused(true)}
                onBlur={() => setIsConfirmFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.trailingIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            {/* CONFIRM MATCH HINT */}
            {confirmPassword.length > 0 && (
              <View style={styles.criteriaContainer}>
                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={passwordsMatch ? "#10B981" : "#EF4444"}
                  />
                  <Text
                    style={[
                      styles.criteriaText,
                      passwordsMatch ? styles.criteriaTextValid : styles.criteriaTextInvalid,
                    ]}
                  >
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </Text>
                </View>
              </View>
            )}

            {/* TERMS & CONDITIONS ROW (FULL TOUCHABLE TARGET) */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgree(!agree)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agree }}
              accessibilityLabel="I agree to the Terms and Conditions"
            >
              <View style={[styles.checkbox, agree && styles.checkboxActive]}>
                {agree && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>

              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text
                  style={styles.termsLink}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push("/term");
                  }}
                >
                  Terms & Conditions
                </Text>
              </Text>
            </TouchableOpacity>

            {/* REGISTER BUTTON */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                (loading || googleLoading) && { opacity: 0.7 },
              ]}
              disabled={loading || googleLoading}
              onPress={handleRegister}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* DIVIDER */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* GOOGLE SIGN IN BUTTON */}
            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && { opacity: 0.7 }]}
              disabled={googleLoading}
              onPress={handleGoogleSignIn}
              activeOpacity={0.7}
            >
              {googleLoading ? (
                <ActivityIndicator color="#444" />
              ) : (
                <>
                  <Image
                    source={require("../assets/google.png")}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleText}>Sign up with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* LOGIN LINK */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")} activeOpacity={0.7}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 8,
  },
  logoWrapper: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  apex: { fontSize: 38, fontWeight: "900", color: "#14143A", letterSpacing: 3 },
  cs: { fontSize: 20, fontStyle: "italic", marginTop: 18, marginLeft: 2, color: "#386BF6" },
  header: { width: "100%", marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#1F1F5A" },
  instructions: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
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
    marginBottom: 6,
  },
  inputBoxFocused: { borderColor: COLORS.inputBorderFocus, backgroundColor: "#FFFFFF" },
  leadingIcon: { marginRight: 10 },
  input: { flex: 1, height: "100%", fontSize: 15, color: COLORS.text },
  trailingIcon: { padding: 4 },
  criteriaContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 2,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  criteriaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  criteriaText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "500",
  },
  criteriaTextValid: {
    color: "#059669",
    fontWeight: "600",
  },
  criteriaTextInvalid: {
    color: "#DC2626",
    fontWeight: "600",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    marginTop: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: { color: COLORS.text, fontSize: 13, flexShrink: 1 },
  termsLink: { color: COLORS.primary, fontWeight: "700", textDecorationLine: "underline" },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    width: "100%",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.muted, fontSize: 13, marginHorizontal: 12, fontWeight: "500" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: 52,
    borderRadius: 12,
  },
  googleIcon: { width: 20, height: 20, marginRight: 10, resizeMode: "contain" },
  googleText: { color: "#444", fontSize: 14, fontWeight: "600" },
  bottomRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28 },
  bottomText: { color: "#666", fontSize: 14 },
  link: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
});