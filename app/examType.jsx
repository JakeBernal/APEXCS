import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import ExamSession from "./ExamSession";
import { router, useLocalSearchParams } from "expo-router";
import { getCurriculum, EXAM_LEVELS } from "../lib/curriculum";

export default function ExamType() {
  const { level } = useLocalSearchParams();

  const [showMode, setShowMode] = useState(false);
  const [selectedMode, setSelectedMode] = useState("review");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [activeSession, setActiveSession] = useState(false);

  const [selected, setSelected] = useState(
    level === "sub" ? "sub" : "professional"
  );


  /*
   * EXAM INFORMATION
   */

  const examConfig = EXAM_LEVELS[selected] || EXAM_LEVELS.professional;
  const exam = {
    title:
      selected === "professional"
        ? "Professional\nLevel"
        : "Sub-Professional\nLevel",
    description: examConfig.description,
    items: `${examConfig.totalItems}`,
    duration: `${examConfig.durationHours} hrs`,
    passing: `${examConfig.passingScore}%`,
    icon:
      selected === "professional"
        ? "briefcase-outline"
        : "school-outline",
  };

  /*
   * SUBJECTS (Loaded from centralized curriculum)
   */

  const subjects = getCurriculum(selected);

  /*
   * MODE DESCRIPTIONS
   */

  const modeDescriptions = {
    review:
      "Go through each question at your own pace with detailed explanations to help you learn as you go.",

    timed:
      "Simulate real exam conditions with a strict time limit to build speed, focus, and confidence.",

    flashcards:
      "Quickly flip through bite-sized flashcards to memorize key concepts and terms fast.",
  };

  /*
   * FUNCTIONS
   */

  const toggleExpand = (index) => {
    setExpandedIndex(
      expandedIndex === index ? null : index
    );
  };

  const openExamFor = (subject = null, chapter = null) => {
    setSelectedSubject(subject);
    setSelectedChapter(chapter);
    setShowMode(true);
  };

  /*
   * EXAM SESSION
   */

  return activeSession ? (
    <ExamSession
      subject={selectedSubject}
      chapter={selectedChapter}
      level={selected}
      mode={selectedMode === "flashcards" ? "flashcard" : selectedMode}
      onExit={() => {
        setActiveSession(false);
        setSelectedSubject(null);
        setSelectedChapter(null);
      }}
    />
  ) : (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* HEADER */}

        <LinearGradient
          colors={["#4D79FF", "#2346B8"]}
          style={styles.header}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.replace("/exams")}
            >
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
              <Text style={styles.title}>
                {exam.title}
              </Text>

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
              <Text style={styles.number}>
                {exam.items}
              </Text>

              <Text style={styles.label}>
                ITEMS
              </Text>
            </View>

            <View>
              <Text style={styles.number}>
                {exam.duration}
              </Text>

              <Text style={styles.label}>
                DURATION
              </Text>
            </View>

            <View>
              <Text style={styles.number}>
                {exam.passing}
              </Text>

              <Text style={styles.label}>
                TO PASS
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* PROFESSIONAL / SUB-PROFESSIONAL TOGGLE */}

        <View style={styles.switchWrapper}>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              selected === "professional" &&
                styles.activeBtn,
            ]}
            onPress={() => {
              setSelected("professional");
              setExpandedIndex(null);
              setSelectedSubject(null);
            }}
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
            onPress={() => {
              setSelected("sub");
              setExpandedIndex(null);
              setSelectedSubject(null);
            }}
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

        {subjects.map((item, index) => {
          const isExpanded =
            expandedIndex === index;

          return (
            <View
              key={index}
              style={styles.subjectCard}
            >
              <TouchableOpacity
                style={styles.subjectCardHeader}
                onPress={() =>
                  toggleExpand(index)
                }
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        item.color,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={28}
                    color="#386BF6"
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                    marginLeft: 14,
                  }}
                >
                  <Text
                    style={styles.subjectTitle}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={styles.subjectSub}
                  >
                    {item.subtitle}
                  </Text>

                  <View
                    style={styles.lessonBadge}
                  >
                    <Text
                      style={styles.lessonText}
                    >
                      {item.chapters?.length || 0} Topics
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name={
                    isExpanded
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={22}
                  color="#386BF6"
                />
              </TouchableOpacity>

              {isExpanded && (
                <View
                  style={styles.topicsWrapper}
                >
                  {item.chapters?.map((chapter, tIndex) => (
                    <View
                      key={chapter.id || tIndex}
                      style={styles.topicRow}
                    >
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push({
                            pathname: "/chapterDetails",
                            params: {
                              category: item.title,
                              chapter: chapter.title,
                              level: selected,
                            },
                          })
                        }
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <MaterialCommunityIcons
                            name="circle-medium"
                            size={18}
                            color="#386BF6"
                          />
                          <Text
                            style={styles.topicText}
                          >
                            {chapter.title}
                          </Text>
                        </View>
                        {chapter.description ? (
                          <Text
                            style={styles.chapterSubText}
                            numberOfLines={1}
                          >
                            {chapter.description}
                          </Text>
                        ) : null}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.chapterPracticeMiniBtn}
                        onPress={() => openExamFor(item, chapter)}
                      >
                        <Text style={styles.chapterPracticeMiniText}>Practice</Text>
                        <Ionicons name="arrow-forward" size={11} color="#386BF6" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={
                      styles.categoryExamBtn
                    }
                    onPress={() =>
                      openExamFor(item, null)
                    }
                  >
                    <Text
                      style={
                        styles.categoryExamText
                      }
                    >
                      Practice Entire {item.title}
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color="#386BF6"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.categoryDetailsBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/categoryDetails",
                        params: {
                          category: item.title,
                          level: selected,
                        },
                      })
                    }
                  >
                    <Text style={styles.categoryDetailsBtnText}>
                      View Chapters & Mastery
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="#7D8FB3"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* STICKY TAKE EXAM BUTTON */}

      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.takeExam}
          onPress={() => openExamFor(null)}
        >
          <Text style={styles.takeText}>
            Take Exam
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODE OVERLAY */}

      {showMode && (
        <View style={styles.overlay}>
          <LinearGradient
            colors={["#4D79FF", "#2346B8"]}
            style={styles.modeCard}
          >
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setShowMode(false);
                setSelectedSubject(null);
                setSelectedChapter(null);
              }}
            >
              <Ionicons
                name="chevron-down"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            <Text style={styles.modeTitle}>
              {selectedChapter
                ? selectedChapter.title
                : selectedSubject
                ? selectedSubject.title
                : "All Categories"}
            </Text>

            {selectedChapter && selectedSubject && (
              <Text style={styles.modeSubcategory}>
                Part of {selectedSubject.title}
              </Text>
            )}

            {/* MODE TABS */}

            <View style={styles.modeTabs}>
              {[
                "review",
                "timed",
                "flashcards",
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.modeTab,
                    selectedMode === item &&
                      styles.modeTabActive,
                  ]}
                  onPress={() =>
                    setSelectedMode(item)
                  }
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      selectedMode === item &&
                        styles.modeTabTextActive,
                    ]}
                  >
                    {item
                      .charAt(0)
                      .toUpperCase() +
                      item.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={styles.modeDescription}
            >
              {
                modeDescriptions[
                  selectedMode
                ]
              }
            </Text>

            <Text style={styles.modeScope}>
              {selectedChapter
                ? `Practicing "${selectedChapter.title}" · Max 30 items · 40 mins`
                : selectedSubject
                ? `Practicing all ${selectedSubject.chapters?.length || 0} topics in ${selectedSubject.title} · Max 50 items · 1 hr`
                : `Full Mock Exam covering all ${subjects.length} categories · ${selected === "professional" ? "170 items · 3 hrs" : "165 items · 2 hrs"}`}
            </Text>

            <TouchableOpacity
              style={styles.practiceBtn}
              onPress={() => {
                setShowMode(false);
                setActiveSession(true);
              }}
            >
              <Text
                style={styles.practiceText}
              >
                {selectedMode ===
                "flashcards"
                  ? "Start Flashcards"
                  : "Start Exam"}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    backgroundColor:
      "rgba(255,255,255,0.15)",
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
    borderTopColor:
      "rgba(255,255,255,0.2)",
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
    fontSize: 12,
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

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  subjectCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  topicsWrapper: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EEF2FF",
  },

  topicRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },

  topicText: {
    flex: 1,
    marginLeft: 10,
    color: "#4A5578",
    fontSize: 14,
    lineHeight: 20,
  },

  categoryExamBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },

  categoryExamText: {
    color: "#386BF6",
    fontWeight: "700",
    fontSize: 14,
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

  /* STICKY FOOTER */

  stickyFooter: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEF2FF",
  },

  takeExam: {
    backgroundColor: "#386BF6",
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

  /* OVERLAY */

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modeCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 25,
    paddingBottom: 40,
  },

  closeBtn: {
    alignSelf: "flex-end",
  },

  modeTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  modeTabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 4,
  },

  modeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  modeTabActive: {
    backgroundColor: "#386BF6",
  },

  modeTabText: {
    color: "#386BF6",
    fontWeight: "700",
  },

  modeTabTextActive: {
    color: "#fff",
  },

  modeDescription: {
    color: "#DCE6FF",
    textAlign: "center",
    marginTop: 22,
    lineHeight: 22,
  },

  modeScope: {
    color: "#B9C9FF",
    textAlign: "center",
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  practiceBtn: {
    marginTop: 28,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    height: 55,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  practiceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  modeSubcategory: {
    color: "#DCE6FF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: -14,
    marginBottom: 16,
  },

  chapterSubText: {
    fontSize: 11,
    color: "#7D8FB3",
    marginLeft: 18,
    marginTop: 2,
  },

  chapterPracticeMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },

  chapterPracticeMiniText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#386BF6",
  },

  categoryDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
    marginTop: 4,
  },

  categoryDetailsBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7D8FB3",
  },
});