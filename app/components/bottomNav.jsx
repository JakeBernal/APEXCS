import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

const COLORS = {
  primary: "#386BF6",
  muted: "#7D8FB3",
  border: "#EEF1F5",
};

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "home",
      label: "Home",
      route: "/tabs/dashboard",
    },
    {
      name: "document-text-outline",
      label: "Exams",
      route: "/tabs/exams",
    },
    {
      name: "pie-chart-outline",
      label: "Stats",
      route: "/tabs/stats",
    },
    {
      name: "person-outline",
      label: "Profile",
      route: "/tabs/profile",
    },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((item) => {
        const isActive = pathname === item.route;

        return (
          <TouchableOpacity
            key={item.label}
            style={styles.navItem}
            onPress={() => router.replace(item.route)}
          >
            <Ionicons
              name={item.name}
              size={22}
              color={isActive ? COLORS.primary : COLORS.muted}
            />

            <Text
              style={[
                styles.navText,
                isActive && {
                  color: COLORS.primary,
                  fontWeight: "700",
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 90,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  navItem: {
    alignItems: "center",
  },

  navText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
});