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
      route: "/dashboard",
    },
    {
      name: "document-text",
      label: "Exams",
      route: "/exams",
    },
    {
      name: "pie-chart",
      label: "History",
      route: "/stats",
    },
    {
      name: "person",
      label: "Profile",
      route: "/profile",
    },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((item) => {
        const isActive = pathname === item.route;
        // console.log("pathname:", pathname);
        // console.log(item.route, pathname === item.route);
        //  console.log("BottomNav rendered");

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