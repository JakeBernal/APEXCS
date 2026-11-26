import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  AppState,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { toQR } from "toqr";
import { useAuth } from "../../context/AuthContext";
import { setExamActive } from "../../lib/examActiveState";

import {
  createExamRoom,
  joinExamRoom,
  broadcastExamStart,
  subscribeToRoomChannel,
  submitGroupExamScore,
  fetchRoomParticipants,
  getRecentBatchSessions,
} from "../../lib/groupExamManager";
import { buildQuestionSetByIds } from "../../lib/examData";
import { saveAttempt } from "../../lib/attempts";
import ExamQuestionScreen from "../ExamQuestionScreen";
import SubmitExamModal from "../SubmitExamModal";
import QuitExamModal from "../QuitExamModal";
import GroupResultScreen from "../groupResults";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#386BF6",
  primaryDark: "#1D4ED8",
  primaryBg: "#EFF6FF",
  bg: "#F7F9FC",
  card: "#FFFFFF",
  text: "#14143A",
  muted: "#7D8FB3",
  border: "#EEF1F5",
  success: "#10B981",
  successBg: "#ECFDF5",
};

/**
 * Robustly parses a group exam room code from scanned QR string.
 * Handles plain code ("APX-408"), unhyphenated ("APX408"), JSON payload, or URLs.
 */
function parseRoomCodeFromScannedData(rawData) {
  if (!rawData || typeof rawData !== "string") return null;
  const str = rawData.trim();

  // 1. JSON payload support
  try {
    const parsed = JSON.parse(str);
    if (parsed?.roomCode) return String(parsed.roomCode).trim().toUpperCase();
    if (parsed?.code) return String(parsed.code).trim().toUpperCase();
  } catch {}

  // 2. Look for APX-XXXX or APX-XXX pattern anywhere in the string/URL
  const regex = /APX-?[A-Z0-9]{3,6}/i;
  const match = str.match(regex);
  if (match) {
    let code = match[0].toUpperCase();
    if (!code.includes("-")) {
      code = `APX-${code.slice(3)}`;
    }
    return code;
  }

  // 3. Fallback: 4 to 8 characters alphanumeric code
  if (str.length >= 4 && str.length <= 8 && /^[A-Z0-9-]+$/i.test(str)) {
    return str.toUpperCase();
  }

  return null;
}

/**
 * 100% offline, zero-network QR code component.
 * Uses toqr encoder to render genuine, scan-ready QR code matrices.
 */
function OfflineQRCode({ value, size = 180, color = "#0F172A", bgColor = "#FFFFFF" }) {
  const matrix = useMemo(() => {
    try {
      if (!value) return null;
      const modules = toQR(String(value));
      const dimension = Math.round(Math.sqrt(modules.length));
      if (!dimension || dimension < 10) return null;

      const rows = [];
      for (let r = 0; r < dimension; r++) {
        const row = [];
        let currVal = modules[r * dimension] === 1;
        let count = 1;
        for (let c = 1; c < dimension; c++) {
          const val = modules[r * dimension + c] === 1;
          if (val === currVal) {
            count++;
          } else {
            row.push({ isDark: currVal, count });
            currVal = val;
            count = 1;
          }
        }
        row.push({ isDark: currVal, count });
        rows.push(row);
      }
      return { dimension, rows };
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) {
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="qr-code" size={size * 0.8} color={color} />
      </View>
    );
  }

  const cellSize = size / matrix.dimension;

  return (
    <View style={{ width: size, height: size, backgroundColor: bgColor, padding: 6, borderRadius: 12 }}>
      {matrix.rows.map((row, rIdx) => (
        <View key={`r-${rIdx}`} style={{ flexDirection: "row", height: cellSize }}>
          {row.map((seg, sIdx) => (
            <View
              key={`s-${sIdx}`}
              style={{
                width: seg.count * cellSize,
                height: cellSize,
                backgroundColor: seg.isDark ? color : bgColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function GroupExamScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const currentUserName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Reviewee";

  // State
  const [roomCode, setRoomCode] = useState("");
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Live Camera QR Scanner State
  const [cameraPermission, requestCameraPermission, getCameraPermission] = useCameraPermissions();
  const [isScanningActive, setIsScanningActive] = useState(true);
  const isScanningActiveRef = useRef(true);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isCameraMounted, setIsCameraMounted] = useState(false);
  const [cameraMountError, setCameraMountError] = useState(null);

  // Delay CameraView mount slightly until Modal transition settles (prevents black surface on Android)
  useEffect(() => {
    if (!showScannerModal || !cameraPermission?.granted) {
      return;
    }
    const timer = setTimeout(() => {
      setIsCameraMounted(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [showScannerModal, cameraPermission?.granted]);

  // Re-check camera permissions when the user returns from device Settings
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active" && typeof getCameraPermission === "function") {
        getCameraPermission().catch(() => {});
      }
    };
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, [getCameraPermission]);

  // Host configuration state
  const [selectedLevel, setSelectedLevel] = useState("Professional");
  const [selectedItemCount, setSelectedItemCount] = useState(50);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState(45); // in minutes
  const [hostRoomCode, setHostRoomCode] = useState("APX-408");
  const [hostCreatedRoom, setHostCreatedRoom] = useState(null);

  // Realtime Joined Students List - Starts EMPTY for genuine participants
  const [joinedStudents, setJoinedStudents] = useState([]);

  // Active Group Exam Session State
  // { room, questions, isHost, isStarted, answers, currentIndex, timeLeft, initialDuration }
  const [activeSession, setActiveSession] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);

  // Group Leaderboard Results Modal State
  const [viewingLeaderboard, setViewingLeaderboard] = useState(null);

  // Recent Real Batch Sessions History
  const [recentSessions, setRecentSessions] = useState([]);

  const refreshRecentSessions = () => {
    getRecentBatchSessions()
      .then((data) => setRecentSessions(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    let isMounted = true;
    getRecentBatchSessions()
      .then((data) => {
        if (isMounted) {
          setRecentSessions(data || []);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup active room channel on unmount
  const unsubscribeRef = useRef(null);
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Synchronize global exam active state to hide bottom tab navigation during active exams or results
  useEffect(() => {
    const isExamRunning = !!((activeSession && activeSession.isStarted) || viewingLeaderboard);
    setExamActive(isExamRunning);
    return () => {
      setExamActive(false);
    };
  }, [activeSession, viewingLeaderboard]);

  // =========================================================================
  // JOIN ROOM HANDLERS
  // =========================================================================

  const handleJoinWithCode = useCallback(
    async (customCode = null) => {
      const targetCode = (customCode || roomCode).trim().toUpperCase();
      if (targetCode.length < 4) {
        Alert.alert("Invalid Code", "Please enter a valid 6-character room code.");
        return;
      }

      setIsJoining(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      try {
        const { room, questions, participant } = await joinExamRoom({
          roomCode: targetCode,
          displayName: currentUserName,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        const durationSecs = (room.time_limit_minutes || 45) * 60;
        const sessionState = {
          room,
          questions,
          isHost: false,
          isStarted: room.status === "in_progress",
          answers: {},
          currentIndex: 0,
          timeLeft: durationSecs,
          initialDuration: durationSecs,
        };

        // Subscribe to host's start broadcast
        if (unsubscribeRef.current) unsubscribeRef.current();
        unsubscribeRef.current = subscribeToRoomChannel({
          roomCode: room.room_code,
          participantName: participant.display_name,
          onExamStarted: async (payload) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

            // If the host broadcast contains locked questionIds, synchronize questions immediately
            if (payload?.questionIds && Array.isArray(payload.questionIds) && payload.questionIds.length > 0) {
              const hostIds = payload.questionIds;
              const syncedQuestions = await buildQuestionSetByIds(hostIds);
              if (syncedQuestions && syncedQuestions.length > 0) {
                setActiveSession((prev) => (prev ? { ...prev, questions: syncedQuestions, isStarted: true } : prev));
                return;
              }
            }

            setActiveSession((prev) => (prev ? { ...prev, isStarted: true } : prev));
          },
        });

        setActiveSession(sessionState);
        setRoomCode("");
      } catch (err) {
        Alert.alert("Unable to Join Room", err.message || "Failed to connect to the examination room.");
      } finally {
        setIsJoining(false);
      }
    },
    [roomCode, currentUserName]
  );

  const handleOpenScanner = async () => {
    isScanningActiveRef.current = true;
    setIsScanningActive(true);
    setIsTorchOn(false);
    setIsCameraMounted(false);
    setCameraMountError(null);

    if (!cameraPermission?.granted) {
      if (cameraPermission?.canAskAgain === false) {
        Alert.alert(
          "Camera Permission Required",
          "Camera access is disabled in your device settings. Please enable it to scan QR codes, or enter the code manually.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings().catch(() => {});
              },
            },
          ]
        );
        setShowScannerModal(true);
        return;
      }
      try {
        const res = await requestCameraPermission();
        if (!res?.granted && !res?.canAskAgain) {
          Alert.alert(
            "Camera Access Needed",
            "Please enable camera access in your device settings to scan QR codes.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings().catch(() => {}) },
            ]
          );
        }
      } catch {}
    }
    setShowScannerModal(true);
  };

  const handleGrantCamera = async () => {
    try {
      if (cameraPermission?.canAskAgain === false) {
        Linking.openSettings().catch(() => {});
        return;
      }
      const res = await requestCameraPermission();
      if (!res?.granted && !res?.canAskAgain) {
        Alert.alert(
          "Camera Access Required",
          "Camera access was denied. Please allow camera access in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings().catch(() => {}) },
          ]
        );
      }
    } catch {
      Linking.openSettings().catch(() => {});
    }
  };

  const handleLaunchSystemScanner = async () => {
    try {
      if (CameraView?.launchScanner) {
        setShowScannerModal(false);
        await CameraView.launchScanner({ barcodeTypes: ["qr"] });
      }
    } catch {}
  };

  const handleCloseScanner = () => {
    isScanningActiveRef.current = false;
    setIsScanningActive(false);
    setIsTorchOn(false);
    setIsCameraMounted(false);
    setCameraMountError(null);
    setShowScannerModal(false);
  };

  const handleSimulatedScan = (code) => {
    isScanningActiveRef.current = false;
    setIsScanningActive(false);
    setIsTorchOn(false);
    setShowScannerModal(false);
    handleJoinWithCode(code);
  };

  const handleLiveBarcodeScanned = useCallback(
    (scannedResult) => {
      if (!isScanningActiveRef.current || !scannedResult) return;

      const rawData =
        scannedResult?.data ||
        scannedResult?.nativeEvent?.data ||
        scannedResult?.raw ||
        scannedResult?.nativeEvent?.raw ||
        (typeof scannedResult === "string" ? scannedResult : null);

      if (!rawData) return;

      isScanningActiveRef.current = false;
      setIsScanningActive(false);

      const extractedCode = parseRoomCodeFromScannedData(rawData);
      if (extractedCode) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setIsTorchOn(false);
        setShowScannerModal(false);
        handleJoinWithCode(extractedCode);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Alert.alert(
          "Unrecognized QR Code",
          `The scanned code ("${rawData}") is not a valid APEX Group Exam code. Please scan the instructor's screen or enter the code manually.`,
          [
            {
              text: "Try Again",
              onPress: () => {
                isScanningActiveRef.current = true;
                setIsScanningActive(true);
              },
            },
          ]
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomCode, currentUserName]
  );

  const barcodeScannerSettings = useMemo(
    () => ({
      barcodeTypes: ["qr"],
    }),
    []
  );

  // Modern Barcode Scanner (Google Code Scanner / iOS DataScanner) listener
  useEffect(() => {
    if (CameraView?.isModernBarcodeScannerAvailable && typeof CameraView?.onModernBarcodeScanned === "function") {
      const sub = CameraView.onModernBarcodeScanned((result) => {
        const rawData =
          result?.data ||
          result?.raw ||
          result?.nativeEvent?.data ||
          (typeof result === "string" ? result : null);
        if (rawData) {
          const code = parseRoomCodeFromScannedData(rawData);
          if (code) {
            setShowScannerModal(false);
            handleJoinWithCode(code);
          }
        }
      });
      return () => {
        sub?.remove?.();
      };
    }
  }, [handleJoinWithCode]);

  // =========================================================================
  // HOST ROOM HANDLERS
  // =========================================================================

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setJoinedStudents([]); // Reset to empty list for newly hosted room
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const { room, questions } = await createExamRoom({
        level: selectedLevel,
        questionCount: selectedItemCount,
        timeLimitMinutes: selectedTimeLimit,
      });

      setHostRoomCode(room.room_code);
      setHostCreatedRoom({ room, questions });

      // Subscribe to real-time student attendance in the lobby
      if (unsubscribeRef.current) unsubscribeRef.current();
      unsubscribeRef.current = subscribeToRoomChannel({
        roomCode: room.room_code,
        participantName: "Instructor",
        onParticipantJoin: (newStudent) => {
          if (!newStudent || !newStudent.name || newStudent.name === "Instructor") return;
          setJoinedStudents((prev) => {
            if (prev.some((s) => s.id === newStudent.id || s.name === newStudent.name)) {
              return prev;
            }
            return [...prev, newStudent];
          });
        },
      });

      // Query any participants who already joined in the database
      fetchRoomParticipants(room.room_code).then((existing) => {
        if (existing && existing.length > 0) {
          setJoinedStudents((prev) => {
            const combined = [...prev];
            existing.forEach((p) => {
              if (!combined.some((c) => c.id === p.id || c.name === p.name)) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      });

      setShowHostModal(true);
    } catch (_err) {
      Alert.alert("Room Creation Error", "Failed to create examination room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartExamAsHost = async () => {
    if (!hostCreatedRoom) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setShowHostModal(false);

    const questionIds = (hostCreatedRoom.questions || []).map((q) => q.id);

    // Broadcast START_EXAM with the host's locked questionIds to all joined student devices!
    await broadcastExamStart(hostRoomCode, {
      questionIds,
      level: hostCreatedRoom.room.level,
      questionCount: hostCreatedRoom.questions.length,
      timeLimitMinutes: hostCreatedRoom.room.time_limit_minutes,
    });

    const durationSecs = (hostCreatedRoom.room.time_limit_minutes || 45) * 60;
    setActiveSession({
      room: hostCreatedRoom.room,
      questions: hostCreatedRoom.questions,
      isHost: true,
      isStarted: true,
      answers: {},
      currentIndex: 0,
      timeLeft: durationSecs,
      initialDuration: durationSecs,
    });
  };

  const handleCopyCode = () => {
    Haptics.selectionAsync().catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // =========================================================================
  // ACTIVE EXAM SESSION ACTIONS
  // =========================================================================

  const handleFinishExam = async () => {
    if (!activeSession) return;
    setShowSubmitModal(false);

    const { room, questions, answers, timeLeft, initialDuration } = activeSession;
    const durationSeconds = initialDuration - timeLeft;

    // Calculate score results
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questions.forEach((q) => {
      const selected = answers[q.id];
      if (selected === undefined) {
        skipped++;
      } else if (selected === q.correctIndex) {
        correct++;
      } else {
        wrong++;
      }
    });

    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const results = {
      correct,
      wrong,
      skipped,
      total,
      score,
      durationSeconds,
    };

    // 1. Save attempt to personal history & dashboard analytics
    try {
      await saveAttempt({
        subjectTitle: `Group Exam (${room.room_code})`,
        level: room.level || "professional",
        mode: "timed",
        results,
        answers,
        questions,
        durationSeconds,
      });
    } catch {}

    // 2. Submit score to shared group leaderboard
    try {
      await submitGroupExamScore({
        roomId: room.id,
        roomCode: room.room_code,
        displayName: activeSession.isHost ? "Instructor" : currentUserName,
        results,
        durationSeconds,
      });
    } catch {}

    // 3. Clear active exam and present Group Leaderboard
    setActiveSession(null);
    refreshRecentSessions();
    setViewingLeaderboard({
      roomCode: room.room_code,
      userScore: score,
      userCorrect: correct,
      userTotal: total,
      userDuration: durationSeconds,
    });
  };

  // =========================================================================
  // VIEW: SYNCHRONIZED WAITING LOBBY (STUDENT WAITING FOR INSTRUCTOR)
  // =========================================================================
  if (activeSession && !activeSession.isStarted) {
    return (
      <View style={[styles.lobbyContainer, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.lobbyContent}>
          {/* Animated Pulsing Signal Badge */}
          <View style={styles.signalBadge}>
            <View style={styles.signalDot} />
            <Text style={styles.signalText}>CONNECTED TO ROOM {activeSession.room?.room_code}</Text>
          </View>

          <Text style={styles.lobbyTitle}>Classroom Waiting Lobby</Text>
          <Text style={styles.lobbySubtitle}>
            Your question set has been locked and synchronized. Please wait for your instructor to start the examination.
          </Text>

          <View style={styles.lobbyCard}>
            <View style={styles.lobbyCardRow}>
              <Text style={styles.lobbyCardLabel}>EXAM TRACK</Text>
              <Text style={styles.lobbyCardValue}>{activeSession.room?.level_label || "Professional"}</Text>
            </View>
            <View style={styles.lobbyCardDivider} />
            <View style={styles.lobbyCardRow}>
              <Text style={styles.lobbyCardLabel}>STANDARDIZED ITEMS</Text>
              <Text style={styles.lobbyCardValue}>{activeSession.questions?.length} Items</Text>
            </View>
            <View style={styles.lobbyCardDivider} />
            <View style={styles.lobbyCardRow}>
              <Text style={styles.lobbyCardLabel}>TIME ALLOCATION</Text>
              <Text style={styles.lobbyCardValue}>{activeSession.room?.time_limit_minutes || 45} Minutes</Text>
            </View>
          </View>

          <View style={styles.lobbyWaitingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.lobbyWaitingText}>Synchronizing with instructor...</Text>
          </View>

          {/* Quick Demo Test Action for Solo Testing */}
          <TouchableOpacity
            style={styles.demoStartBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setActiveSession((prev) => ({ ...prev, isStarted: true }));
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.demoStartBtnText}>Start Immediately (Self-Paced)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.lobbyExitBtn}
            onPress={() => {
              if (unsubscribeRef.current) unsubscribeRef.current();
              setActiveSession(null);
            }}
          >
            <Text style={styles.lobbyExitBtnText}>Leave Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // VIEW: ACTIVE EXAMINATION SESSION (ALL STUDENTS ANSWER IDENTICAL QUESTIONS)
  // =========================================================================
  if (activeSession && activeSession.isStarted) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ExamQuestionScreen
          mode="timed"
          subjectLabel={`Room ${activeSession.room?.room_code}`}
          levelLabel={activeSession.room?.level_label || "Standardized Batch"}
          questions={activeSession.questions}
          currentIndex={activeSession.currentIndex}
          setCurrentIndex={(idx) => setActiveSession((prev) => ({ ...prev, currentIndex: idx }))}
          answers={activeSession.answers}
          setAnswers={(ans) => {
            const resolved = typeof ans === "function" ? ans(activeSession.answers) : ans;
            setActiveSession((prev) => ({ ...prev, answers: resolved }));
          }}
          timeLeft={activeSession.timeLeft}
          setTimeLeft={(t) => {
            const resolved = typeof t === "function" ? t(activeSession.timeLeft) : t;
            setActiveSession((prev) => ({ ...prev, timeLeft: resolved }));
          }}
          onBack={() => setShowQuitModal(true)}
          onRequestSubmit={() => setShowSubmitModal(true)}
          onTimeUp={handleFinishExam}
        />

        <SubmitExamModal
          visible={showSubmitModal}
          onCancel={() => setShowSubmitModal(false)}
          onSubmit={handleFinishExam}
          onQuit={() => {
            setShowSubmitModal(false);
            setActiveSession(null);
          }}
        />

        <QuitExamModal
          visible={showQuitModal}
          onContinue={() => setShowQuitModal(false)}
          onCancel={() => setShowQuitModal(false)}
          onQuit={() => {
            setShowQuitModal(false);
            setActiveSession(null);
          }}
        />
      </View>
    );
  }

  // =========================================================================
  // VIEW: GROUP RESULTS & LEADERBOARD MODAL
  // =========================================================================
  if (viewingLeaderboard) {
    return (
      <GroupResultScreen
        roomCode={viewingLeaderboard.roomCode}
        userScore={viewingLeaderboard.userScore}
        userCorrect={viewingLeaderboard.userCorrect}
        userTotal={viewingLeaderboard.userTotal}
        userDuration={viewingLeaderboard.userDuration}
        onReviewAnswers={() => {
          Alert.alert("Review Mode", "Answer key and full question review are saved in your History tab.");
        }}
        onClose={() => setViewingLeaderboard(null)}
      />
    );
  }

  // =========================================================================
  // VIEW: MAIN GROUP EXAMINATION HUB
  // =========================================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.badgeRow}>
            <View style={styles.trackBadge}>
              <View style={styles.trackDot} />
              <Text style={styles.trackBadgeText}>REVIEW CENTER BATCH MODE</Text>
            </View>
          </View>
          <Text style={styles.title}>Group Examination</Text>
          <Text style={styles.subtitle}>
            Standardized mock examinations with synchronized question sets
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 95 }]}
      >
        {/* ======================================================== */}
        {/* 1. HERO CARD: JOIN LIVE REVIEW BATCH (STUDENTS / TAKERS) */}
        {/* ======================================================== */}
        <View style={styles.joinCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="qr-code" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Join Review Session</Text>
              <Text style={styles.cardSubtitle}>
                Take the exact same questions with your class
              </Text>
            </View>
          </View>

          {/* Quick Scan QR Code Button */}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleOpenScanner}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Scan Instructor QR Code"
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scanButtonGradient}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>Scan Instructor QR Code</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR ENTER 6-DIGIT CODE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Manual Code Input Form */}
          <View style={styles.codeInputWrapper}>
            <Ionicons name="keypad-outline" size={20} color={COLORS.muted} style={{ marginLeft: 14 }} />
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. APX-408"
              placeholderTextColor={COLORS.muted}
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />
            {roomCode.length > 0 && (
              <TouchableOpacity
                onPress={() => setRoomCode("")}
                style={styles.clearBtn}
                hitSlop={10}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.muted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.enterRoomBtn,
                roomCode.trim().length >= 4 && !isJoining ? styles.enterRoomBtnActive : styles.enterRoomBtnDisabled,
              ]}
              onPress={() => handleJoinWithCode()}
              disabled={roomCode.trim().length < 4 || isJoining}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.enterRoomBtnText}>Join</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. INSTRUCTOR TOOLS: CREATE STANDARDIZED BATCH EXAM     */}
        {/* ======================================================== */}
        <View style={styles.instructorCard}>
          <View style={styles.instructorHeaderRow}>
            <View style={styles.instructorIconWrap}>
              <Ionicons name="school" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instructorTitle}>Host Classroom Examination</Text>
              <Text style={styles.instructorSubtitle}>
                Instructor mode: lock identical questions for the entire batch
              </Text>
            </View>
          </View>

          {/* Examination Level Selector */}
          <Text style={styles.configLabel}>EXAMINATION LEVEL</Text>
          <View style={styles.levelSelectorRow}>
            {[
              { id: "Professional", label: "Professional", icon: "briefcase-outline" },
              { id: "Sub-Professional", label: "Sub-Professional", icon: "school-outline" },
            ].map((track) => {
              const isSelected = selectedLevel === track.id;
              return (
                <TouchableOpacity
                  key={track.id}
                  style={[styles.levelCardPill, isSelected && styles.levelCardPillSelected]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedLevel(track.id);
                    if (track.id === "Sub-Professional" && selectedItemCount === 170) {
                      setSelectedItemCount(165);
                    } else if (track.id === "Professional" && selectedItemCount === 165) {
                      setSelectedItemCount(170);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={track.icon}
                    size={16}
                    color={isSelected ? "#FFFFFF" : COLORS.primary}
                  />
                  <Text style={[styles.levelCardPillText, isSelected && styles.levelCardPillTextSelected]}>
                    {track.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Item Count & Duration Selector */}
          <View style={styles.selectorGrid}>
            <View style={styles.selectorItem}>
              <Text style={styles.configLabel}>ITEMS</Text>
              <View style={styles.optionRow}>
                {(selectedLevel === "Sub-Professional" ? [20, 50, 165] : [20, 50, 170]).map((count) => {
                  const isSelected = selectedItemCount === count;
                  return (
                    <TouchableOpacity
                      key={count}
                      style={[styles.smallPill, isSelected && styles.smallPillSelected]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedItemCount(count);
                      }}
                    >
                      <Text style={[styles.smallPillText, isSelected && styles.smallPillTextSelected]}>
                        {count}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.selectorItem}>
              <Text style={styles.configLabel}>TIME LIMIT</Text>
              <View style={styles.optionRow}>
                {[25, 45, 90].map((mins) => {
                  const isSelected = selectedTimeLimit === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.smallPill, isSelected && styles.smallPillSelected]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedTimeLimit(mins);
                      }}
                    >
                      <Text style={[styles.smallPillText, isSelected && styles.smallPillTextSelected]}>
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={styles.createRoomButton}
            onPress={handleCreateRoom}
            disabled={isCreating}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Create Standardized Batch Room"
          >
            {isCreating ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.createRoomButtonText}>Generate Room &amp; Display QR Code</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* 3. RECENT BATCH SESSIONS / HISTORY                      */}
        {/* ======================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Batch Sessions</Text>
          <Text style={styles.sectionCounter}>
            {recentSessions.length === 0 ? "0 Completed" : `${recentSessions.length} Completed`}
          </Text>
        </View>

        {recentSessions.length === 0 ? (
          <View style={styles.emptyHistoryCard}>
            <View style={styles.emptyHistoryIconBox}>
              <Ionicons name="podium-outline" size={26} color={COLORS.muted} />
            </View>
            <Text style={styles.emptyHistoryTitle}>No Batch Sessions Yet</Text>
            <Text style={styles.emptyHistorySubtitle}>
              Completed classroom exams will appear here with your batch ranking and score breakdown.
            </Text>
          </View>
        ) : (
          <View style={styles.historyCard}>
            {recentSessions.map((session, index) => (
              <React.Fragment key={session.id}>
                {index > 0 && <View style={styles.historyDivider} />}
                <TouchableOpacity
                  style={styles.historyItem}
                  activeOpacity={0.75}
                  onPress={() =>
                    setViewingLeaderboard({
                      roomCode: session.roomCode,
                      userScore: session.score,
                      userCorrect: session.correct,
                      userTotal: session.itemCount,
                      userDuration: session.duration,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`View batch session ${session.roomCode}`}
                >
                  <View style={styles.historyIconBox}>
                    <Ionicons
                      name={session.isPassed ? "podium" : "clipboard-outline"}
                      size={20}
                      color={session.isPassed ? COLORS.primary : "#F59E0B"}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>{session.title}</Text>
                    <Text style={styles.historyMeta}>
                      {session.itemCount} Items • Tap for class rankings
                    </Text>
                  </View>
                  <View style={styles.historyStats}>
                    <Text style={styles.historyScore}>{session.score}%</Text>
                    <View
                      style={[
                        styles.passBadge,
                        !session.isPassed && { backgroundColor: "#FEF2F2" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.passBadgeText,
                          !session.isPassed && { color: "#EF4444" },
                        ]}
                      >
                        {session.isPassed ? "PASSED" : "FAILED"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL 1: QR CODE SCANNER VIEWFINDER                      */}
      {/* ======================================================== */}
      <Modal
        visible={showScannerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseScanner}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.scannerModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Scan Classroom QR Code</Text>
                <Text style={styles.modalSubtitle}>Point camera at the instructor screen</Text>
              </View>
              <View style={styles.scannerHeaderActions}>
                {cameraPermission?.granted && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setIsTorchOn((prev) => !prev);
                    }}
                    style={[styles.torchBtn, isTorchOn && styles.torchBtnActive]}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle Camera Flashlight"
                  >
                    <Ionicons
                      name={isTorchOn ? "flashlight" : "flashlight-outline"}
                      size={18}
                      color={isTorchOn ? "#FFFFFF" : COLORS.text}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleCloseScanner}
                  style={styles.closeBtn}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close QR Scanner"
                >
                  <Ionicons name="close" size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.scannerInstructions}>
              Align the QR code within the frame to automatically join the examination room.
            </Text>

            {CameraView?.isModernBarcodeScannerAvailable && (
              <TouchableOpacity
                style={styles.systemScannerPillBtn}
                onPress={handleLaunchSystemScanner}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Open Google Code Scanner"
              >
                <Ionicons name="scan-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.systemScannerPillText}>Open Google Code Scanner</Text>
              </TouchableOpacity>
            )}

            {/* Viewfinder Graphic / Live Camera Container */}
            <View style={styles.viewfinderBox}>
              {!cameraPermission ? (
                <View style={styles.cameraLoadingBox}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.cameraLoadingText}>Checking camera access...</Text>
                </View>
              ) : !cameraPermission.granted ? (
                <View style={styles.cameraPermissionBox}>
                  <Ionicons name="videocam-off-outline" size={44} color="#94A3B8" />
                  <Text style={styles.cameraPermissionTitle}>Camera Access Required</Text>
                  <Text style={styles.cameraPermissionSubtitle}>
                    {cameraPermission?.canAskAgain === false
                      ? "Camera permission is disabled in your device settings. Tap below to enable it or use Google Code Scanner."
                      : "APEX-CS requires camera permission to scan classroom QR codes."}
                  </Text>
                  <View style={styles.permissionActionGroup}>
                    {cameraPermission?.canAskAgain === false ? (
                      <TouchableOpacity
                        style={styles.grantCameraBtn}
                        onPress={() => Linking.openSettings().catch(() => {})}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Open App Settings"
                      >
                        <Ionicons name="settings-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.grantCameraBtnText}>Open App Settings</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.grantCameraBtn}
                        onPress={handleGrantCamera}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Grant Camera Access"
                      >
                        <Ionicons name="camera-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.grantCameraBtnText}>Grant Camera Access</Text>
                      </TouchableOpacity>
                    )}
                    {CameraView?.isModernBarcodeScannerAvailable && (
                      <TouchableOpacity
                        style={styles.modernScannerFallbackBtn}
                        onPress={handleLaunchSystemScanner}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Use Google Code Scanner without permissions"
                      >
                        <Ionicons name="scan-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.modernScannerFallbackText}>Use Google Scanner (No Permission Needed)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={{ width: "100%", height: "100%", position: "relative" }}>
                  {cameraMountError ? (
                    <View style={styles.cameraPermissionBox}>
                      <Ionicons name="alert-circle-outline" size={40} color="#F59E0B" />
                      <Text style={styles.cameraPermissionTitle}>Camera Preview Unavailable</Text>
                      <Text style={styles.cameraPermissionSubtitle}>
                        {cameraMountError}
                      </Text>
                      <TouchableOpacity
                        style={styles.grantCameraBtn}
                        onPress={() => {
                          setCameraMountError(null);
                          setIsCameraMounted(false);
                          setTimeout(() => setIsCameraMounted(true), 200);
                        }}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Retry Camera"
                      >
                        <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.grantCameraBtnText}>Retry Camera</Text>
                      </TouchableOpacity>
                    </View>
                  ) : isCameraMounted ? (
                    <CameraView
                      style={{ width: "100%", height: "100%" }}
                      facing="back"
                      enableTorch={isTorchOn}
                      barcodeScannerSettings={barcodeScannerSettings}
                      onBarcodeScanned={isScanningActive ? handleLiveBarcodeScanned : undefined}
                      onMountError={(event) => {
                        setCameraMountError(
                          event?.message || "Unable to initialize the device camera."
                        );
                      }}
                    />
                  ) : (
                    <View style={styles.cameraLoadingBox}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                      <Text style={styles.cameraLoadingText}>Starting camera...</Text>
                    </View>
                  )}

                  {/* Corner Target Reticles */}
                  <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
                  <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
                  <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
                  <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />

                  {/* Scanning Laser Line */}
                  {isCameraMounted && !cameraMountError && isScanningActive && (
                    <View style={styles.scannerLaser} pointerEvents="none" />
                  )}

                  {/* Floating Frame Reticle Guide */}
                  <View style={styles.scannerOverlay} pointerEvents="none">
                    <View style={styles.scannerHintBadge}>
                      <Text style={styles.scannerHintText}>
                        {isScanningActive ? "ALIGN QR CODE IN FRAME" : "PROCESSING CODE..."}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Quick Demo Test Action */}
            <View style={styles.demoTestCard}>
              <Text style={styles.demoTestText}>Testing without a second device?</Text>
              <TouchableOpacity
                style={styles.demoTestBtn}
                onPress={() => handleSimulatedScan("APX-408")}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Simulate Instant QR Scan APX-408"
              >
                <Text style={styles.demoTestBtnText}>Simulate Instant QR Scan (APX-408)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: INSTRUCTOR QR CODE DISPLAY & LOBBY VIEW         */}
      {/* ======================================================== */}
      <Modal
        visible={showHostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHostModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.hostModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Classroom QR Code</Text>
                <Text style={styles.modalSubtitle}>{selectedLevel} Level • {selectedItemCount} Items</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowHostModal(false)}
                style={styles.closeBtn}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close Classroom Modal"
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* High-Contrast QR Code Card */}
            <View style={styles.qrDisplayCard}>
              <View style={styles.qrMockFrame}>
                <OfflineQRCode value={hostRoomCode} size={180} />
              </View>

              {/* Text Room Code */}
              <View style={styles.roomCodeRow}>
                <Text style={styles.roomCodeText}>{hostRoomCode}</Text>
                <TouchableOpacity
                  style={styles.copyCodeBtn}
                  onPress={handleCopyCode}
                  activeOpacity={0.8}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Copy room code"
                >
                  <Ionicons
                    name={isCopied ? "checkmark" : "copy-outline"}
                    size={16}
                    color={isCopied ? COLORS.success : COLORS.primary}
                  />
                  <Text style={[styles.copyCodeText, isCopied && { color: COLORS.success }]}>
                    {isCopied ? "Copied" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Attendance & Student Lobby Count */}
            <View
              style={[
                styles.attendanceBar,
                joinedStudents.length === 0 && { backgroundColor: "#F1F5F9" },
              ]}
            >
              <View
                style={[
                  styles.attendanceDot,
                  joinedStudents.length === 0 && { backgroundColor: COLORS.muted },
                ]}
              />
              <Text
                style={[
                  styles.attendanceText,
                  joinedStudents.length === 0 && { color: COLORS.muted },
                ]}
              >
                {joinedStudents.length === 0
                  ? "Waiting for reviewees to scan or enter code..."
                  : `${joinedStudents.length} reviewee${joinedStudents.length > 1 ? "s" : ""} ready in lobby`}
              </Text>
            </View>

            {/* Realtime Joined Avatars */}
            {joinedStudents.length === 0 ? (
              <View style={styles.emptyLobbyCard}>
                <Ionicons name="people-outline" size={24} color={COLORS.muted} style={{ marginBottom: 4 }} />
                <Text style={styles.emptyLobbyTitle}>No reviewees joined yet</Text>
                <Text style={styles.emptyLobbySubtitle}>
                  Students scanning this QR code or entering {hostRoomCode} will appear here in real time.
                </Text>
              </View>
            ) : (
              <View style={styles.studentsRow}>
                {joinedStudents.map((s) => (
                  <View key={s.id} style={styles.studentChip}>
                    <Ionicons name="person-circle" size={18} color={COLORS.primary} />
                    <Text style={styles.studentChipText}>{s.name}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Start Examination Action */}
            <TouchableOpacity
              style={styles.startExamBtn}
              onPress={handleStartExamAsHost}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startExamGradient}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" />
                <Text style={styles.startExamBtnText}>Start Standardized Exam</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  trackBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  trackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  trackBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  /* 1. Join Card */
  joinCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryBg,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
  },
  scanButton: {
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 48,
  },
  scanButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 8,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
    letterSpacing: 0.6,
  },
  codeInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 50,
  },
  codeInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    paddingHorizontal: 12,
    letterSpacing: 1.5,
  },
  clearBtn: {
    paddingHorizontal: 8,
  },
  enterRoomBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 6,
    minHeight: 38,
  },
  enterRoomBtnActive: {
    backgroundColor: COLORS.primary,
  },
  enterRoomBtnDisabled: {
    backgroundColor: "#94A3B8",
  },
  enterRoomBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* 2. Instructor Card */
  instructorCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginBottom: 20,
  },
  instructorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  instructorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  instructorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  instructorSubtitle: {
    fontSize: 11,
    color: "#2563EB",
    marginTop: 1,
  },
  configLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E40AF",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  levelSelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  levelCardPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    minHeight: 44,
  },
  levelCardPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  levelCardPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E40AF",
  },
  levelCardPillTextSelected: {
    color: "#FFFFFF",
  },
  selectorGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  selectorItem: {
    flex: 1,
  },
  optionRow: {
    flexDirection: "row",
    gap: 6,
  },
  smallPill: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
  },
  smallPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  smallPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
  },
  smallPillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  createRoomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 46,
  },
  createRoomButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  /* 3. History */
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  sectionCounter: {
    fontSize: 12,
    color: COLORS.muted,
  },
  emptyHistoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyHistoryIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyHistorySubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 290,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  historyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  historyMeta: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  historyStats: {
    alignItems: "flex-end",
  },
  historyScore: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  passBadge: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  passBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.success,
  },
  historyDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  scannerModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  hostModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  scannerHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  torchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  systemScannerPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryBg,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  systemScannerPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  torchBtnActive: {
    backgroundColor: COLORS.primary,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scannerInstructions: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  viewfinderBox: {
    width: width - 80,
    height: width - 80,
    alignSelf: "center",
    backgroundColor: "#0F172A",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    marginBottom: 20,
  },
  cameraLoadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cameraLoadingText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 10,
  },
  cameraPermissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  cameraPermissionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  cameraPermissionSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 17,
  },
  permissionActionGroup: {
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  grantCameraBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  grantCameraBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  modernScannerFallbackBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  modernScannerFallbackText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 16,
  },
  scannerHintBadge: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  scannerHintText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: COLORS.primary,
    zIndex: 10,
  },
  cornerTL: {
    top: 14,
    left: 14,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 14,
    right: 14,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerLaser: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: "#EF4444",
    opacity: 0.85,
    zIndex: 10,
  },
  demoTestCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  demoTestText: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
  },
  demoTestBtn: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  demoTestBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  /* Host Modal Elements */
  qrDisplayCard: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: 14,
  },
  qrMockFrame: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  roomCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roomCodeText: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 3,
    color: "#1E3A8A",
  },
  copyCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyCodeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  attendanceBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.successBg,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  attendanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  attendanceText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.success,
  },
  emptyLobbyCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  emptyLobbyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
  },
  emptyLobbySubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 280,
  },
  studentsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 18,
  },
  studentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E40AF",
  },
  startExamBtn: {
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 48,
  },
  startExamGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  startExamBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* Synchronized Lobby Screen Elements */
  lobbyContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  lobbyContent: {
    width: width - 40,
    alignItems: "center",
  },
  signalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  signalText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.6,
  },
  lobbyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
  },
  lobbySubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  lobbyCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  lobbyCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lobbyCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
  },
  lobbyCardValue: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  lobbyCardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  lobbyWaitingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  lobbyWaitingText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  demoStartBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  demoStartBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  lobbyExitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  lobbyExitBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
});
