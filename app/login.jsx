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

export default function Login() {
  const { signIn } = useAuth();

  const passwordInputRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [isEmailFocused, setIsEmailFocused] =
    useState(false);

  const [isPasswordFocused, setIsPasswordFocused] =
    useState(false);

  // ==========================================
  // EMAIL/PASSWORD LOGIN
  // ==========================================

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both your email address and password."
      );

      return;
    }

    setLoading(true);

    const { error } = await signIn({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
      if (
        error.message
          ?.toLowerCase()
          .includes("email not confirmed")
      ) {
        Alert.alert(
          "Email Not Confirmed",
          "Please check your Gmail inbox (and Spam folder) to confirm your email before signing in."
        );

        return;
      }

      Alert.alert(
        "Login Failed",
        error.message ||
          "Invalid email or password."
      );

      return;
    }

    router.replace("/dashboard");
  };

  // ==========================================
  // GOOGLE LOGIN
  // ==========================================

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      // Create the URL that Google/Supabase
      // should redirect back to.
      const redirectUrl =
        Linking.createURL("dashboard");

      console.log(
        "Google OAuth redirect URL:",
        redirectUrl
      );

      // Ask Supabase for the Google OAuth URL.
      const {
        data,
        error,
      } = await supabase.auth.signInWithOAuth({
        provider: "google",

        options: {
          redirectTo: redirectUrl,

          // We open the browser ourselves
          // using Expo WebBrowser.
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error(
          "Supabase did not return a Google authentication URL."
        );
      }

      console.log(
        "Opening Google authentication..."
      );

      // Open Google authentication.
      //
      // AuthContext is responsible for processing
      // the callback and creating the Supabase session.
      const result =
        await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

      console.log(
        "Google browser result:",
        result
      );

      // ========================================
      // SUCCESS
      // ========================================

      if (
        result.type === "success"
      ) {
        console.log(
          "Google returned successfully."
        );

        /*
         * DO NOT exchange the URL here.
         *
         * AuthContext already listens for the
         * deep link and handles:
         *
         * createSessionFromUrl()
         *
         * This prevents two parts of the app
         * from exchanging the same OAuth code.
         */

        // Give Supabase/AuthContext a moment to
        // finish updating the session.
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 500)
        );

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        console.log(
          "Session after Google login:",
          session?.user?.email ??
            "No session"
        );

        if (session) {
          router.replace("/dashboard");
        } else {
          console.log(
            "OAuth callback received, but session is not available yet."
          );

          Alert.alert(
            "Google Sign-In",
            "Google authentication completed, but the session could not be loaded. Please try again."
          );
        }
      }
    } catch (error) {
      console.error(
        "Google Sign-In error:",
        error
      );

      Alert.alert(
        "Google Sign-In",
        error?.message ||
          "Unable to sign in with Google."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        style="dark"
        backgroundColor={COLORS.bg}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
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

          {/* LOGO */}

          <View style={styles.logoWrapper}>
            <Text style={styles.apex}>
              APEX
            </Text>

            <Text style={styles.cs}>
              cs
            </Text>
          </View>

          {/* HEADER */}

          <View style={styles.header}>
            <Text style={styles.title}>
              Login
            </Text>

            <Text style={styles.instructions}>
              Sign in to continue your preparation
            </Text>
          </View>

          {/* FORM */}

          <View style={styles.form}>
            {/* EMAIL */}

            <Text style={styles.label}>
              Email Address
            </Text>

            <View
              style={[
                styles.inputBox,
                isEmailFocused &&
                  styles.inputBoxFocused,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={
                  isEmailFocused
                    ? COLORS.primary
                    : COLORS.muted
                }
                style={styles.leadingIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="name@gmail.com"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() =>
                  passwordInputRef.current?.focus()
                }
                blurOnSubmit={false}
                editable={
                  !loading && !googleLoading
                }
                value={email}
                onChangeText={setEmail}
                onFocus={() =>
                  setIsEmailFocused(true)
                }
                onBlur={() =>
                  setIsEmailFocused(false)
                }
              />
            </View>

            {/* PASSWORD */}

            <Text style={styles.label}>
              Password
            </Text>

            <View
              style={[
                styles.inputBox,
                isPasswordFocused &&
                  styles.inputBoxFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={
                  isPasswordFocused
                    ? COLORS.primary
                    : COLORS.muted
                }
                style={styles.leadingIcon}
              />

              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A0AEC0"
                secureTextEntry={
                  !showPassword
                }
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                editable={
                  !loading && !googleLoading
                }
                value={password}
                onChangeText={setPassword}
                onFocus={() =>
                  setIsPasswordFocused(true)
                }
                onBlur={() =>
                  setIsPasswordFocused(false)
                }
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                style={styles.trailingIcon}
                hitSlop={{
                  top: 10,
                  bottom: 10,
                  left: 10,
                  right: 10,
                }}
              >
                <Ionicons
                  name={
                    showPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={20}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            {/* FORGOT PASSWORD */}

            <TouchableOpacity
              onPress={() =>
                router.push(
                  "/forgot-password"
                )
              }
              style={styles.forgotWrap}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* LOGIN */}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                loading && {
                  opacity: 0.7,
                },
              ]}
              disabled={loading}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={
                    styles.primaryBtnText
                  }
                >
                  Login
                </Text>
              )}
            </TouchableOpacity>

            {/* DIVIDER */}

            <View style={styles.dividerRow}>
              <View
                style={styles.dividerLine}
              />

              <Text
                style={styles.dividerText}
              >
                or
              </Text>

              <View
                style={styles.dividerLine}
              />
            </View>

            {/* GOOGLE */}

            <TouchableOpacity
              style={[
                styles.googleBtn,
                googleLoading && {
                  opacity: 0.7,
                },
              ]}
              disabled={googleLoading}
              onPress={
                handleGoogleSignIn
              }
              activeOpacity={0.7}
            >
              {googleLoading ? (
                <ActivityIndicator color="#444" />
              ) : (
                <>
                  <Image
                    source={require("../assets/google.png")}
                    style={
                      styles.googleIcon
                    }
                  />

                  <Text
                    style={styles.googleText}
                  >
                    Sign in with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* REGISTER */}

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>
              Don’t have an account?{" "}
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push("/register")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.link}>
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

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

  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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

  header: {
    width: "100%",
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F1F5A",
  },

  instructions: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },

  form: {
    width: "100%",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1F5A",
    marginBottom: 6,
    marginTop: 10,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 8,
  },

  inputBoxFocused: {
    borderColor:
      COLORS.inputBorderFocus,
    backgroundColor: "#FFFFFF",
  },

  leadingIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: COLORS.text,
  },

  trailingIcon: {
    padding: 4,
  },

  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 20,
    paddingVertical: 4,
  },

  forgotText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 13,
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    width: "100%",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },

  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    color: COLORS.muted,
    fontSize: 13,
    marginHorizontal: 12,
    fontWeight: "500",
  },

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

  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: "contain",
  },

  googleText: {
    color: "#444",
    fontSize: 14,
    fontWeight: "600",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },

  bottomText: {
    color: "#666",
    fontSize: 14,
  },

  link: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
});