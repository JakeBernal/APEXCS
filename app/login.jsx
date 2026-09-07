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
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    const { error } = await signIn({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Login failed", error.message);
      return;
    }

    router.push("/dashboard");
  };

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

       
        <View style={styles.logoWrapper}>
          <Text style={styles.apex}>APEX</Text>
          <Text style={styles.cs}>cs</Text>
        </View>

        <Text style={styles.title}>Login</Text>

    
        <View style={styles.form}>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordBox}>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

         
          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotWrap}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { opacity: loading ? 0.5 : 1 }]}
          disabled={loading}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Login</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.or}>Or</Text>
        <TouchableOpacity style={styles.googleBtn}>
         <Image
          source={require("../assets/google.png")}
          style={styles.googleIcon}/>
         <Text style={styles.googleText}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* LINK */}
        <Text style={styles.bottomText}>
          Don’t have an account?{" "}
          <Text style={styles.link} onPress={() => router.push("/register")}>
            Register
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
    color: "#2a2929",
  },

  forgotWrap: {
    alignItems: "flex-end",
    marginTop: 5,
  },

  forgotText: {
    color: "#386BF6",
    fontWeight: "600",
    fontSize: 13,
  },

  primaryBtn: {
    backgroundColor: "#386BF6",
    width: 315,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 50,
  },

  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    width: 315,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },

  googleText: {
    marginLeft: 10,
    color: "#444",
    fontWeight: "600",
  },

  bottomText: {
    marginTop: 20,
    color: "#666",
  },

  link: {
    color: "#386BF6",
    fontWeight: "700",
  },
  googleIcon: {
  width: 20,
  height: 20,
  marginRight: 10,
  resizeMode: "contain",
},
or:{
    marginTop:40,
    marginBottom:20,
}
});