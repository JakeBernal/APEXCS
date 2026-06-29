import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ExamType() {

  
const COLORS = {
  primary: "#386BF6",
  secondary: "#1F46C7",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  muted: "#8A94A6",
};

  const [selected, setSelected] = useState("professional");

  const exam =
    selected === "professional"
      ? {
          title: "Professional\nLevel",
          description:
            "For positions requiring a college degree.\nGrants second-level government eligibility.",
          items: "170",
          duration: "3 hrs",
          passing: "80%",
          icon: "briefcase-outline",
        }
      : {
          title: "Sub-Professional\nLevel",
          description:
            "For clerical and trades positions.\nGrants first-level government eligibility.",
          items: "165",
          duration: "2 hrs",
          passing: "80%",
          icon: "school-outline",
        };

  const subjects = [
    {
      title: "Numerical Ability",
      subtitle: "Basic Operations, Fractions & Algebra",
      lessons: 8,
      icon: "calculator-variant-outline",
      color: "#EEF2FF",
    },
    {
      title: "Analytical Ability",
      subtitle: "Problem Solving & Logic",
      lessons: 8,
      icon: "brain",
      color: "#FFE9EF",
    },
    {
      title: "Verbal Ability",
      subtitle: "Grammar, Vocabulary & Reading",
      lessons: 8,
      icon: "text-box-outline",
      color: "#E8F7FF",
    },
    {
      title: "General Information",
      subtitle: "Philippines, Constitution & Current Events",
      lessons: 8,
      icon: "lightbulb-outline",
      color: "#FFF6DA",
    },
  ];

  return (
    
    <View style={styles.container}>
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingBottom: 40 }}
  ></ScrollView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER */}
        <LinearGradient
          colors={["#4D79FF", "#2346B8"]}
          style={styles.header}
        >
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backBtn}>
              <Ionicons
                name="chevron-back"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            <Text style={styles.smallTitle}>
              Civil Service Exam
            </Text>
          </View>

          <View style={styles.middle}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{exam.title}</Text>

              <Text style={styles.desc}>
                {exam.description}
              </Text>
            </View>

            <Ionicons
              name={exam.icon}
              size={42}
              color="#fff"
            />
          </View>

          <View style={styles.stats}>
            <View>
              <Text style={styles.number}>{exam.items}</Text>
              <Text style={styles.label}>ITEMS</Text>
            </View>

            <View>
              <Text style={styles.number}>
                {exam.duration}
              </Text>
              <Text style={styles.label}>DURATION</Text>
            </View>

            <View>
              <Text style={styles.number}>
                {exam.passing}
              </Text>
              <Text style={styles.label}>TO PASS</Text>
            </View>
          </View>
        </LinearGradient>

        {/* TOGGLE */}
        <View style={styles.switchWrapper}>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              selected === "professional" &&
                styles.activeBtn,
            ]}
            onPress={() => setSelected("professional")}
          >
            <Text
              style={[
                styles.switchText,
                selected === "professional" &&
                  styles.activeText,
              ]}
            >
              Professional
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchBtn,
              selected === "sub" &&
                styles.activeBtn,
            ]}
            onPress={() => setSelected("sub")}
          >
            <Text
              style={[
                styles.switchText,
                selected === "sub" &&
                  styles.activeText,
              ]}
            >
              Sub-Professional
            </Text>
          </TouchableOpacity>
        </View>

        {/* SUBJECTS */}

        {subjects.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.subjectCard}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: item.color },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={28}
                color="#386BF6"
              />
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.subjectTitle}>
                {item.title}
              </Text>

              <Text style={styles.subjectSub}>
                {item.subtitle}
              </Text>

              <View style={styles.lessonBadge}>
                <Text style={styles.lessonText}>
                  {item.lessons} Lessons
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-down"
              size={22}
              color="#386BF6"
            />
          </TouchableOpacity>
        ))}

        {/* BUTTON */}

        <TouchableOpacity style={styles.takeExam}>
          <Text style={styles.takeText}>
            Take Exam
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* HEADER */
header: {
  paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 24,
  overflow: "hidden",
},

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  smallTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  middle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },

  desc: {
    color: "#E6ECFF",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    width: "90%",
  },

  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },

  number: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  label: {
    color: "#DDE7FF",
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 4,
    textAlign: "center",
  },

  /* TOGGLE */

  switchWrapper: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 22,
    padding: 5,
  },

  switchBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  activeBtn: {
    backgroundColor: "#386BF6",
  },

  switchText: {
    color: "#7D8FB3",
    fontWeight: "600",
    fontSize: 14,
  },

  activeText: {
    color: "#fff",
  },

  /* SUBJECT CARDS */

  subjectCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  subjectTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#14143A",
  },

  subjectSub: {
    marginTop: 4,
    color: "#7D8FB3",
    fontSize: 13,
    lineHeight: 18,
  },

  lessonBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },

  lessonText: {
    color: "#386BF6",
    fontSize: 12,
    fontWeight: "700",
  },

  /* BUTTON */

  takeExam: {
    backgroundColor: "#386BF6",
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 30,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#386BF6",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 5,
  },

  takeText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});