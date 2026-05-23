    import React, { useRef, useState, useEffect } from "react";
    import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    FlatList,
    ScrollView,
    } from "react-native";
    import { Ionicons } from "@expo/vector-icons";

    const { width } = Dimensions.get("window");

    const COLORS = {
    primary: "#386BF6",
    bg: "#F7F9FC",
    card: "#FFFFFF",
    text: "#14143A",
    muted: "#7D8FB3",
    border: "#EEF1F5",
    };

    const SPACING = {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    };

    const RADIUS = {
    sm: 14,
    md: 22,
    lg: 28,
    };

    const cards = [
    { id: "1", type: "progress" },
    { id: "2", type: "schedule" },
    ];

    const EXAM_DATE = "2026-05-18T08:00:00";

    function getCountdown(targetDate) {
    const now = new Date();
    const diff = new Date(targetDate) - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return { days, hours, minutes };
    }

    export default function Dashboard() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("home");
    const [countdown, setCountdown] = useState(getCountdown(EXAM_DATE));

    const flatListRef = useRef();

    useEffect(() => {
        const timer = setInterval(() => {
        setCountdown(getCountdown(EXAM_DATE));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const onScroll = (e) => {
        const index = Math.round(
        e.nativeEvent.contentOffset.x / (width - 50)
        );
        setCurrentIndex(index);
    };

    const renderCard = ({ item, index }) => {
        const isActive = index === currentIndex;

        if (item.type === "progress") {
        return (
            <View
            style={[
                styles.progressCard,
                { transform: [{ scale: isActive ? 1 : 0.93 }] },
            ]}
            >
            <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>Good Morning,</Text>
                <Text style={styles.userName}>Juan Dela Cruz</Text>
                <Text style={styles.cardSubtext}>Ready to ace the exams?</Text>
                <TouchableOpacity style={styles.reviewBtn}>
                <Text style={styles.reviewBtnText}>Continue Review</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressOuter}>
                <Text style={styles.progressPercent}>82%</Text>
                <Text style={styles.progressSmall}>Progress</Text>
                </View>
            </View>
            </View>
        );
        }

    
        return (
        <View
            style={[
            styles.scheduleCard,
            { transform: [{ scale: isActive ? 1 : 0.93 }] },
            ]}
        >
            {/* TOP ROW */}
            <View style={styles.scheduleTopRow}>
            <Text style={styles.examLabel}>UPCOMING EXAM</Text>
            <View style={styles.examBadge}>
                <Text style={styles.examBadgeText}>Civil Service Exam</Text>
            </View>
            </View>

            {/* DATE */}
            <Text style={styles.examDateText}>May 18, 2026</Text>

            {/* DIVIDER */}
            <View style={styles.divider} />

            {/* COUNTDOWN */}
            <View style={styles.countdownRow}>
            <Text style={styles.countdownLabel}>Time remaining</Text>
            <View style={styles.countdownBlocks}>
                <View style={styles.countBlock}>
                <Text style={styles.countNum}>
                    {String(countdown.days).padStart(3, "0")}
                </Text>
                <Text style={styles.countUnit}>DAYS</Text>
                </View>
                <Text style={styles.countSep}>:</Text>
                <View style={styles.countBlock}>
                <Text style={styles.countNum}>
                    {String(countdown.hours).padStart(2, "0")}
                </Text>
                <Text style={styles.countUnit}>HRS</Text>
                </View>
                <Text style={styles.countSep}>:</Text>
                <View style={styles.countBlock}>
                <Text style={styles.countNum}>
                    {String(countdown.minutes).padStart(2, "0")}
                </Text>
                <Text style={styles.countUnit}>MIN</Text>
                </View>
            </View>
            </View>
        </View>
        );
    };

    return (
        <View style={styles.container}>
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
        >
            {/* HEADER */}
            <View style={styles.header}>
            <View>
                <Text style={styles.welcome}>Welcome Back</Text>
                <Text style={styles.dashboard}>Dashboard</Text>
            </View>

            <View style={styles.headerRight}>
                <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={22} color="#111" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.avatar}>
                <Ionicons name="person" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
            </View>

            {/* HERO CAROUSEL */}
            <FlatList
            ref={flatListRef}
            data={cards}
            renderItem={renderCard}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={onScroll}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            />

            {/* DOTS */}
            <View style={styles.dotsContainer}>
            {cards.map((_, i) => (
                <View
                key={i}
                style={[styles.dot, currentIndex === i && styles.activeDot]}
                />
            ))}
            </View>

            {/* QUICK ACTIONS */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickCard}>
                <View style={styles.quickIcon}>
                <Ionicons name="book-outline" size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.quickTitle}>Reviewers</Text>
                <Text style={styles.quickDesc}>Study modules & lessons</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard}>
                <View style={styles.quickIcon}>
                <Ionicons
                    name="help-circle-outline"
                    size={22}
                    color={COLORS.primary}
                />
                </View>
                <Text style={styles.quickTitle}>Mock Exam</Text>
                <Text style={styles.quickDesc}>Practice exam questions</Text>
            </TouchableOpacity>
            </View>

            {/* PERFORMANCE */}
            <Text style={styles.sectionTitle}>Performance</Text>

            <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>Average Score</Text>
                <Text style={styles.performanceValue}>87%</Text>
            </View>

            <View style={styles.progressBarBg}>
                <View style={styles.progressBarFill} />
            </View>

            <View style={styles.performanceBottom}>
                <Text style={styles.performanceSmall}>24 Exams Completed</Text>
                <Text style={styles.performanceSmall}>Top 15%</Text>
            </View>
            </View>
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
            {[
            { name: "home", label: "Home" },
            { name: "document-text-outline", label: "Exams" },
            { name: "pie-chart-outline", label: "Stats" },
            { name: "person-outline", label: "Profile" },
            ].map((item) => {
            const isActive = activeTab === item.label.toLowerCase();
            return (
                <TouchableOpacity
                key={item.label}
                style={styles.navItem}
                onPress={() => setActiveTab(item.label.toLowerCase())}
                >
                <Ionicons
                    name={item.name}
                    size={22}
                    color={isActive ? COLORS.primary : COLORS.muted}
                />
                <Text
                    style={[
                    styles.navText,
                    isActive && { color: COLORS.primary, fontWeight: "700" },
                    ]}
                >
                    {item.label}
                </Text>
                </TouchableOpacity>
            );
            })}
        </View>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        paddingTop: 65,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },

    welcome: {
        fontSize: 14,
        color: COLORS.muted,
    },

    dashboard: {
        fontSize: 30,
        fontWeight: "800",
        color: COLORS.text,
    },

    headerRight: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
    },

    /* HERO CARDS */
    progressCard: {
        width: width - 50,
        height: 200,
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginRight: 15,
        flexDirection: "row",
        alignItems: "center",
    },

    cardLabel: {
        color: COLORS.muted,
        fontSize: 14,
    },

    userName: {
        fontSize: 26,
        fontWeight: "800",
        color: COLORS.text,
        marginTop: 6,
    },

    cardSubtext: {
        color: "#777",
        marginTop: 6,
    },

    reviewBtn: {
        backgroundColor: COLORS.primary,
        alignSelf: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        marginTop: 16,
    },

    reviewBtnText: {
        color: "#fff",
        fontWeight: "600",
    },

    progressContainer: {
        marginLeft: 10,
    },

    progressOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 10,
        borderColor: "#DCE3F5",
        justifyContent: "center",
        alignItems: "center",
    },

    progressPercent: {
        fontSize: 22,
        fontWeight: "800",
        color: COLORS.text,
    },

    progressSmall: {
        fontSize: 12,
        color: COLORS.muted,
    },

    /* SCHEDULE CARD — Option C */
    scheduleCard: {
        width: width - 50,
        height: 200,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.lg,
        paddingHorizontal: 22,
        paddingVertical: 20,

        justifyContent: "space-between",
    },

    scheduleTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    examLabel: {
        color: "#DCE6FF",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.2,
    },

    examBadge: {
        backgroundColor: "rgba(255,255,255,0.18)",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 50,
    },

    examBadgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },

    examDateText: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "900",
    },

    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.2)",
    },

    countdownRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    countdownLabel: {
        color: "#DCE6FF",
        fontSize: 12,
        fontWeight: "500",
    },

    countdownBlocks: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 4,
    },

    countBlock: {
        alignItems: "center",
    },

    countNum: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "900",
        lineHeight: 26,
    },

    countUnit: {
        color: "#DCE6FF",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 0.8,
        marginTop: 2,
    },

    countSep: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 20,
        fontWeight: "300",
        marginTop: 2,
    },

    /* DOTS */
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 10,
    },

    dot: {
        width: 7,
        height: 7,
        borderRadius: 10,
        backgroundColor: "#C7D2FE",
        marginHorizontal: 4,
    },

    activeDot: {
        width: 20,
        backgroundColor: COLORS.primary,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.text,
        marginTop: 30,
        marginBottom: 16,
        paddingHorizontal: SPACING.lg,
    },

    /* QUICK ACTIONS */
    quickGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: SPACING.lg,
    },

    quickCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: RADIUS.md,
        padding: 18,
    },

    quickIcon: {
        width: 50,
        height: 50,
        borderRadius: 18,
        backgroundColor: "#EEF4FF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },

    quickTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
    },

    quickDesc: {
        color: COLORS.muted,
        marginTop: 6,
        fontSize: 13,
    },

    /* PERFORMANCE */
    performanceCard: {
        backgroundColor: "#fff",
        marginHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        padding: 20,
    },

    performanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    performanceLabel: {
        color: COLORS.muted,
    },

    performanceValue: {
        fontSize: 24,
        fontWeight: "800",
    },

    progressBarBg: {
        height: 12,
        backgroundColor: "#E7ECF5",
        borderRadius: 20,
        marginTop: 16,
    },

    progressBarFill: {
        width: "87%",
        height: "100%",
        backgroundColor: COLORS.primary,
        borderRadius: 20,
    },

    performanceBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
    },

    performanceSmall: {
        color: COLORS.muted,
    },

    /* BOTTOM NAV */
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