import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useIsExamActive } from "../lib/examActiveState";

const COLORS = {
  primary: "#386BF6",
  primaryDark: "#1D4ED8",
  primaryBg: "#EFF6FF",
  text: "#14143A",
  muted: "#7D8FB3",
  border: "rgba(226, 232, 240, 0.85)",
};

export default function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  const leftTabs = [
    {
      name: "home",
      activeName: "home",
      inactiveName: "home-outline",
      label: "Home",
      route: "/dashboard",
    },
    {
      name: "document-text",
      activeName: "document-text",
      inactiveName: "document-text-outline",
      label: "Exams",
      route: "/exams",
    },
  ];

  const rightTabs = [
    {
      name: "pie-chart",
      activeName: "pie-chart",
      inactiveName: "pie-chart-outline",
      label: "History",
      route: "/stats",
    },
    {
      name: "person",
      activeName: "person",
      inactiveName: "person-outline",
      label: "Profile",
      route: "/profile",
    },
  ];

  const handleTabPress = (route) => {
    if (pathname !== route) {
      Haptics.selectionAsync().catch(() => {});
      router.replace(route);
    }
  };

  const isGroupActive = pathname === "/groupExam";
  const isExamActive = useIsExamActive();

  if (isExamActive) {
    return null;
  }

  return (
    <View
      style={[
        styles.bottomNav,
        {
          paddingBottom: bottomPadding,
          height: 60 + bottomPadding,
        },
      ]}
    >
      {/* LEFT 2 TABS */}
      {leftTabs.map((item) => {
        const isActive = pathname === item.route;
        return (
          <TouchableOpacity
            key={item.label}
            style={styles.navItem}
            onPress={() => handleTabPress(item.route)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={isActive ? item.activeName : item.inactiveName}
                size={21}
                color={isActive ? COLORS.primary : COLORS.muted}
              />
            </View>
            <Text
              style={[
                styles.navText,
                isActive ? styles.navTextActive : styles.navTextInactive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* CENTER HERO ELEVATED BUTTON: GROUP EXAM (BNB-03) */}
      <View style={styles.centerButtonWrapper}>
        <TouchableOpacity
          style={[
            styles.centerButton,
            isGroupActive && styles.centerButtonActive,
          ]}
          onPress={() => handleTabPress("/groupExam")}
          activeOpacity={0.88}
          accessibilityRole="tab"
          accessibilityState={{ selected: isGroupActive }}
          accessibilityLabel="Group Examination Hub"
        >
          <Ionicons name="people" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text
          style={[
            styles.centerNavText,
            isGroupActive ? styles.navTextActive : styles.navTextInactive,
          ]}
        >
          Group
        </Text>
      </View>

      {/* RIGHT 2 TABS */}
      {rightTabs.map((item) => {
        const isActive = pathname === item.route;
        return (
          <TouchableOpacity
            key={item.label}
            style={styles.navItem}
            onPress={() => handleTabPress(item.route)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={isActive ? item.activeName : item.inactiveName}
                size={21}
                color={isActive ? COLORS.primary : COLORS.muted}
              />
            </View>
            <Text
              style={[
                styles.navText,
                isActive ? styles.navTextActive : styles.navTextInactive,
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    overflow: "visible", // Critical for protruding center button
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: -4 },
      },
      android: {
        elevation: 14,
      },
    }),
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 2,
  },

  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  iconWrapActive: {
    backgroundColor: COLORS.primaryBg,
  },

  navText: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.1,
  },

  centerNavText: {
    fontSize: 10,
    marginTop: 1,
    letterSpacing: 0.1,
  },

  navTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  navTextInactive: {
    color: COLORS.muted,
    fontWeight: "500",
  },

  /* BNB-03 Center Floating Hero Button */
  centerButtonWrapper: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20, // Protrudes above navbar edge
    zIndex: 20,
  },

  centerButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.38,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  centerButtonActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: "#EFF6FF",
    transform: [{ scale: 1.04 }],
  },
});
