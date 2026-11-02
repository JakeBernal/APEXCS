import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9FC" />

      {/* Illustration */}
      <Image
        source={require("../assets/404 error.png")}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Text */}
      <View style={styles.content}>
        <Text style={styles.title}>Page Not Found</Text>

        <Text style={styles.description}>
          {"Sorry, we couldn't find the page you're looking for."}
          {" It may have been moved or no longer exists."}
        </Text>

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => router.replace("dashboard")}
        >
          <Ionicons
            name="home-outline"
            size={20}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />

          <Text style={styles.buttonText}>Go to Homepage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  image: {
    width: 260,
    height: 260,
    marginBottom: 8,
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#386BF6",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: "#386BF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
