import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { router } from "expo-router";

export default function ReadyToStart() {
  return (
    <View style={styles.container}>

      {/* LOGO */}
      <View style={styles.logoWrapper}>
        <Text style={styles.apex}>APEX</Text>
        <Text style={styles.cs}>cs</Text>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>

        <Text style={styles.title}>Ready To Start?</Text>

        <Image
          source={require("../assets/test-pana.png")}
          style={styles.image}
          resizeMode="contain"
        />

      </View>

      {/* BUTTONS */}
      <View style={styles.buttonContainer}>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.primaryBtnText}>
            Create an Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/login")}>
            
          <Text style={styles.secondaryBtnText}>
            I Already Have an Account
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 80,
    alignItems: "center",
  },

  /* LOGO */
  logoWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  apex: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 3,
    color: "#14143A",
  },

  cs: {
    fontSize: 20,
    fontWeight: "600",
    fontStyle: "italic",
    marginTop: 18,
    marginLeft: 2,
    color: "#386BF6",
  },

  /* CONTENT */
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1F1F5A",
    marginBottom: 10,
  },

  image: {
    marginTop:70,
    width: 300,
    height: 300,
  },

  /* BUTTONS */
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 90,
  },

  primaryBtn: {
    backgroundColor: "#386BF6",
    width: 320,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryBtn: {
    borderWidth: 2,
    borderColor: "#386BF6",
    width: 320,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  secondaryBtnText: {
    color: "#386BF6",
    fontSize: 16,
    fontWeight: "700",
  },
});