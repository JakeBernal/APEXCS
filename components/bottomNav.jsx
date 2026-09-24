import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  primary: "#386BF6",
  muted: "#7D8FB3",
  border: "#EEF1F5",
};

export default function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

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
    <View
      style={[
        styles.bottomNav,
        {
          paddingBottom: bottomPadding,
          height: 56 + bottomPadding,
        },
      ]}
    >
      {tabs.map((item) => {
        const isActive = pathname === item.route;

        return (
          <TouchableOpacity
            key={item.label}
            style={styles.navItem}
            onPress={() => router.replace(item.route)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
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
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 54,
    minHeight: 44,
    paddingHorizontal: 8,
  },

  navText: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.muted,
    marginTop: 3,
  },
});