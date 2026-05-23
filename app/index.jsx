import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import { router } from "expo-router";

export default function Index() {
 
  const scaleAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim     = useRef(new Animated.Value(-100)).current;
  const fadeAnim      = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(1)).current;
  const textColorAnim = useRef(new Animated.Value(0)).current;
  const subtitleFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
   
      Animated.timing(scaleAnim, {
        toValue: 12,
        duration: 2200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
  
    ]).start(() => {

    
      Animated.parallel([
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]).start(() => {

        
        Animated.parallel([
          Animated.timing(circleOpacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(textColorAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: false, 
          }),
          Animated.timing(subtitleFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => {
            router.replace("/getstarted");
          }, 2000);
        });

      });
    });
  }, []);

  const apexColor = textColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#14143A"],
  });

  const csColor = textColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#386BF6"],
  });

  return (
    <View style={styles.container}>
     
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: scaleAnim }],
            opacity: circleOpacity,
          },
        ]}
      />

      {/* Logo + subtitle */}
      <Animated.View
        style={[
          styles.logoBlock,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.row}>
          <Animated.Text style={[styles.apex, { color: apexColor }]}>
            APEX
          </Animated.Text>
          <Animated.Text style={[styles.cs, { color: csColor }]}>
            cs
          </Animated.Text>
        </View>

        <Animated.Text style={[styles.txt, { opacity: subtitleFade }]}>
          Assessment & Practice Exam for Civil Service
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    overflow: "visible",
  },

  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#0F0E1A",
    position: "absolute",
   
    top: "50%",
    left: "50%",
    marginTop: -100,  // half of height
    marginLeft: -100, // half of width
  },

  logoBlock: {
    alignItems: "center",
    zIndex: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  apex: {
    fontSize: 70,
    fontWeight: "900",
    letterSpacing: 3,
  },

  cs: {
    fontSize: 30,
    fontWeight: "600",
    fontStyle: "italic",
    fontFamily: "Montserrat",
    marginTop: 42,
    marginLeft: 2,
  },

  txt: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});