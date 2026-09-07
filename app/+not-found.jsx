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
          Sorry, we couldn't find the page you're looking for.
          It may have been moved or no longer exists.
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
    width: "100%",
    height: 360,
    marginBottom: 10,
  },

  content: {
    width: "100%",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#14143A",
    textAlign: "center",
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: "#7D8FB3",
    textAlign: "center",
    maxWidth: 330,
    marginBottom: 24,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#386BF6",

    paddingHorizontal: 24,
    height: 52,

    borderRadius: 26,

    shadowColor: "#386BF6",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },

  buttonIcon: {
    marginRight: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});