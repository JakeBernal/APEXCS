import React, { useRef, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Calculates estimated minutes for a given question count.
 * Approx 1.3 - 1.4 minutes per item matching civil service exam standards.
 */
export function getEstimatedMinutes(count) {
  if (!count || count <= 0) return 0;
  if (count <= 10) return 15;
  if (count <= 15) return 20;
  if (count <= 20) return 25;
  if (count <= 25) return 35;
  if (count <= 30) return 40;
  if (count <= 40) return 50;
  if (count <= 50) return 60;
  return Math.round(count * 1.3);
}

/**
 * QuestionCountSlider
 *
 * Interactive slider UI with tactile discrete step pills:
 * - Sub-categories: [10, 15, 25]
 * - Categories: [20, 30, 40]
 *
 * @param {number} value - Currently selected question count
 * @param {Function} onChange - Callback (newCount: number) => void
 * @param {number[]} options - Array of available counts, e.g. [10, 15, 25] or [20, 30, 40]
 * @param {"light"|"dark"} [variant="light"] - Visual theme variant
 * @param {"timed"|"review"|"flashcards"} [mode="timed"] - Current practice mode for contextual duration display
 */
export default function QuestionCountSlider({
  value,
  onChange,
  options = [10, 15, 25],
  variant = "light",
  mode = "timed",
}) {
  const isDark = variant === "dark";
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef(null);

  const safeOptions = useMemo(
    () => (options && options.length > 0 ? options : [10, 15, 25]),
    [options]
  );
  const currentIndex = Math.max(
    0,
    safeOptions.findIndex((opt) => opt === value)
  );
  const selectedCount = safeOptions[currentIndex] ?? safeOptions[0];

  const handleSelectIndex = useCallback(
    (idx) => {
      const clamped = Math.max(0, Math.min(safeOptions.length - 1, idx));
      if (safeOptions[clamped] !== value) {
        onChange(safeOptions[clamped]);
      }
    },
    [safeOptions, value, onChange]
  );

  const handleTrackTouch = useCallback(
    (pageX) => {
      if (!trackRef.current || trackWidth <= 0) return;
      trackRef.current.measure((x, y, width, height, absX) => {
        const touchX = pageX - absX;
        const ratio = Math.max(0, Math.min(1, touchX / width));
        const targetIndex = Math.round(ratio * (safeOptions.length - 1));
        handleSelectIndex(targetIndex);
      });
    },
    [trackWidth, safeOptions, handleSelectIndex]
  );

  // Fraction for track progress (0 to 1)
  const progressRatio =
    safeOptions.length > 1
      ? currentIndex / (safeOptions.length - 1)
      : 0;

  const estimatedMins = getEstimatedMinutes(selectedCount);

  return (
    <View style={styles.container}>
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons
            name="list-outline"
            size={18}
            color={isDark ? "#93C5FD" : "#386BF6"}
          />
          <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
            Question Count
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            isDark ? styles.badgeDark : styles.badgeLight,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isDark ? styles.badgeTextDark : styles.badgeTextLight,
            ]}
          >
            {selectedCount} Questions
          </Text>
        </View>
      </View>

      {/* INTERACTIVE TRACK */}
      <View
        ref={trackRef}
        style={styles.trackTouchArea}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(evt) => handleTrackTouch(evt.nativeEvent.pageX)}
        onResponderMove={(evt) => handleTrackTouch(evt.nativeEvent.pageX)}
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel={`Question count: ${selectedCount} questions`}
        accessibilityValue={{
          min: safeOptions[0],
          max: safeOptions[safeOptions.length - 1],
          now: selectedCount,
        }}
      >
        {/* Track Line */}
        <View
          style={[
            styles.trackBg,
            isDark ? styles.trackBgDark : styles.trackBgLight,
          ]}
        >
          {/* Active Fill */}
          <View
            style={[
              styles.trackFill,
              { width: `${progressRatio * 100}%` },
              isDark ? styles.trackFillDark : styles.trackFillLight,
            ]}
          />
        </View>

        {/* Discrete Step Ticks */}
        <View style={styles.ticksContainer} pointerEvents="none">
          {safeOptions.map((opt, idx) => {
            const isPassed = idx <= currentIndex;
            return (
              <View
                key={opt}
                style={[
                  styles.tick,
                  isPassed
                    ? isDark
                      ? styles.tickActiveDark
                      : styles.tickActiveLight
                    : isDark
                    ? styles.tickInactiveDark
                    : styles.tickInactiveLight,
                ]}
              />
            );
          })}
        </View>

        {/* Slider Thumb */}
        <View
          style={[
            styles.thumb,
            { left: `${progressRatio * 100}%` },
            isDark ? styles.thumbDark : styles.thumbLight,
          ]}
          pointerEvents="none"
        />
      </View>

      {/* PILL BUTTONS */}
      <View style={styles.pillsRow}>
        {safeOptions.map((opt, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.pill,
                isDark ? styles.pillDark : styles.pillLight,
                isSelected && (isDark ? styles.pillSelectedDark : styles.pillSelectedLight),
              ]}
              onPress={() => handleSelectIndex(idx)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${opt} questions`}
            >
              <Text
                style={[
                  styles.pillText,
                  isDark ? styles.pillTextDark : styles.pillTextLight,
                  isSelected &&
                    (isDark
                      ? styles.pillTextSelectedDark
                      : styles.pillTextSelectedLight),
                ]}
              >
                {opt} Items
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CONTEXTUAL ESTIMATED TIME BADGE */}
      <View
        style={[
          styles.contextInfoRow,
          isDark ? styles.contextInfoDark : styles.contextInfoLight,
        ]}
      >
        <Ionicons
          name={mode === "timed" ? "timer-outline" : "bulb-outline"}
          size={14}
          color={isDark ? "#BFDBFE" : "#475569"}
        />
        <Text
          style={[
            styles.contextInfoText,
            isDark ? styles.contextInfoTextDark : styles.contextInfoTextLight,
          ]}
        >
          {mode === "timed"
            ? `${selectedCount} questions · ${estimatedMins} min time limit`
            : mode === "review"
            ? `${selectedCount} questions · Self-paced with explanations`
            : `${selectedCount} questions · Fast concept flashcards`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  textLight: {
    color: "#14143A",
  },
  textDark: {
    color: "#FFFFFF",
  },

  /* BADGE */
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLight: {
    backgroundColor: "#EEF2FF",
  },
  badgeDark: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextLight: {
    color: "#386BF6",
  },
  badgeTextDark: {
    color: "#FFFFFF",
  },

  /* TRACK & SLIDER */
  trackTouchArea: {
    height: 36,
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 10,
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  trackBgLight: {
    backgroundColor: "#E2E8F0",
  },
  trackBgDark: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  trackFill: {
    height: "100%",
    borderRadius: 3,
  },
  trackFillLight: {
    backgroundColor: "#386BF6",
  },
  trackFillDark: {
    backgroundColor: "#FFFFFF",
  },

  /* TICKS */
  ticksContainer: {
    position: "absolute",
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tick: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tickActiveLight: {
    backgroundColor: "#386BF6",
  },
  tickInactiveLight: {
    backgroundColor: "#CBD5E1",
  },
  tickActiveDark: {
    backgroundColor: "#FFFFFF",
  },
  tickInactiveDark: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },

  /* THUMB */
  thumb: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -1, // center alignment with paddingHorizontal: 10
    top: 7,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  thumbLight: {
    backgroundColor: "#386BF6",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  thumbDark: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2.5,
    borderColor: "#2563EB",
  },

  /* PILLS */
  pillsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
  },
  pill: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
  },
  pillLight: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  pillDark: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  pillSelectedLight: {
    backgroundColor: "#386BF6",
    borderColor: "#386BF6",
  },
  pillSelectedDark: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pillTextLight: {
    color: "#334155",
  },
  pillTextDark: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  pillTextSelectedLight: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  pillTextSelectedDark: {
    color: "#1D4ED8",
    fontWeight: "700",
  },

  /* CONTEXT INFO */
  contextInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contextInfoLight: {
    backgroundColor: "#F1F5F9",
  },
  contextInfoDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  contextInfoText: {
    fontSize: 12,
    fontWeight: "500",
  },
  contextInfoTextLight: {
    color: "#475569",
  },
  contextInfoTextDark: {
    color: "#DBEAFE",
  },
});
