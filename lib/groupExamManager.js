import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase.js";
import { buildQuestionSet, buildQuestionSetByIds } from "./examData.js";
import { PASS_THRESHOLD } from "./curriculum.js";
import { getCachedAttempts } from "./offlineManager.js";

const STORAGE_KEYS = {
  ACTIVE_ROOM: "@apex_group_active_room_v1",
  LOCAL_ROOMS: "@apex_group_rooms_cache_v1",
  LOCAL_LEADERBOARDS: "@apex_group_leaderboards_v1",
};

/**
 * Generates an authentic room code (e.g. APX-408, APX-812).
 */
export function generateRoomCode() {
  const digits = Math.floor(100 + Math.random() * 900);
  return `APX-${digits}`;
}

/**
 * Creates a standardized examination room.
 * Locks the exact array of question IDs so all participants get identical questions.
 */
export async function createExamRoom({
  level = "Professional",
  questionCount = 50,
  timeLimitMinutes = 45,
  title = null,
  customCode = null,
}) {
  const normLevel = level.toLowerCase().includes("sub") ? "sub" : "professional";
  const effectiveTitle = title || `${level} Level Batch Exam`;
  const roomCode = customCode ? customCode.trim().toUpperCase() : generateRoomCode();

  // 1. Sample standardized question pool matching the level and count deterministically by roomCode
  const sampledQuestions = await buildQuestionSet(null, normLevel, null, {
    limit: questionCount,
    shuffle: true,
    roomCode: roomCode,
  });

  const questionIds = sampledQuestions.map((q) => q.id);

  // 2. Identify current authenticated user (or fallback host)
  let hostId = "guest_host";
  let hostName = "Instructor";
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      hostId = data.user.id;
      hostName = data.user.user_metadata?.full_name || "Instructor";
    }
  } catch {}

  const roomPayload = {
    id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    room_code: roomCode,
    host_id: hostId,
    host_name: hostName,
    title: effectiveTitle,
    level: normLevel,
    level_label: level,
    question_count: sampledQuestions.length,
    time_limit_minutes: timeLimitMinutes,
    status: "waiting", // "waiting" | "in_progress" | "completed"
    question_ids: questionIds,
    created_at: new Date().toISOString(),
  };

  // 3. Persist to Supabase if available
  let cloudRoomId = null;
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 8000)
    );
    const insertPromise = supabase
      .from("exam_rooms")
      .insert({
        room_code: roomPayload.room_code,
        host_id: hostId === "guest_host" ? null : hostId,
        title: roomPayload.title,
        level: roomPayload.level,
        question_count: roomPayload.question_count,
        time_limit_minutes: roomPayload.time_limit_minutes,
        status: "waiting",
        question_ids: roomPayload.question_ids,
      })
      .select()
      .single();

    const { data: cloudRoom, error } = await Promise.race([insertPromise, timeoutPromise]);
    if (!error && cloudRoom?.id) {
      cloudRoomId = cloudRoom.id;
      roomPayload.id = cloudRoom.id;
    }
  } catch (err) {
    console.log("Cloud room creation fallback to local:", err?.message);
  }

  // 4. Cache room locally for instant access & offline resiliency
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_ROOMS);
    const roomsMap = raw ? JSON.parse(raw) : {};
    roomsMap[roomPayload.room_code] = roomPayload;
    if (cloudRoomId) roomsMap[cloudRoomId] = roomPayload;
    await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_ROOMS, JSON.stringify(roomsMap));
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_ROOM, JSON.stringify(roomPayload));
  } catch (cacheErr) {
    console.warn("Room cache save error:", cacheErr);
  }

  return {
    room: roomPayload,
    questions: sampledQuestions,
  };
}

/**
 * Finds and joins an existing exam room by its 6-character code (or QR payload).
 * Loads the locked standardized questions for this room.
 */
export async function joinExamRoom({ roomCode, displayName = "Reviewee" }) {
  const cleanCode = (roomCode || "").trim().toUpperCase();
  if (!cleanCode || cleanCode.length < 4) {
    throw new Error("Please enter a valid 6-character room code.");
  }

  let room = null;

  // 1. Try querying Supabase
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 8000)
    );
    const queryPromise = supabase
      .from("exam_rooms")
      .select("*")
      .eq("room_code", cleanCode)
      .single();

    const { data: cloudRoom, error } = await Promise.race([queryPromise, timeoutPromise]);
    if (!error && cloudRoom) {
      room = cloudRoom;
    }
  } catch {}

  // 2. Fallback to local rooms cache if cloud query timed out or offline
  if (!room) {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_ROOMS);
      const roomsMap = raw ? JSON.parse(raw) : {};
      room = roomsMap[cleanCode] || null;
    } catch {}
  }

  // 3. Fallback: If code is a demo code (e.g. APX-408) and room not created yet, create a ready session
  if (!room) {
    if (cleanCode.startsWith("APX-") || cleanCode.startsWith("APEX-") || cleanCode.startsWith("REV-") || cleanCode.length === 6 || cleanCode.length === 7 || cleanCode.length === 8) {
      const isSub = cleanCode.includes("SUB");
      const generated = await createExamRoom({
        level: isSub ? "Sub-Professional" : "Professional",
        questionCount: 20,
        timeLimitMinutes: 25,
        title: `${cleanCode} Standardized Batch Exam`,
        customCode: cleanCode,
      });
      room = generated.room;
      room.room_code = cleanCode;
    } else {
      throw new Error(`Room "${cleanCode}" was not found. Please verify the code with your instructor.`);
    }
  }

  // Robustly parse question_ids (handle array or JSON string)
  let questionIds = room.question_ids;
  if (typeof questionIds === "string") {
    try {
      questionIds = JSON.parse(questionIds);
    } catch {
      questionIds = [];
    }
  }

  // 4. Fetch the exact locked questions by their IDs
  let lockedQuestions = await buildQuestionSetByIds(questionIds || []);

  // If lockedQuestions is empty or could not be resolved, generate deterministically from room.room_code
  if (!lockedQuestions || lockedQuestions.length === 0) {
    lockedQuestions = await buildQuestionSet(null, room.level || "professional", null, {
      limit: room.question_count || 20,
      shuffle: true,
      roomCode: room.room_code,
    });
  }

  // 5. Build participant record
  let userId = "guest_taker";
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) userId = data.user.id;
  } catch {}

  const participant = {
    id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    room_id: room.id,
    user_id: userId,
    display_name: displayName || "Reviewee",
    is_finished: false,
    score: 0,
    joined_at: new Date().toISOString(),
  };

  // 6. Persist real participant record in Supabase
  if (room.id && !String(room.id).startsWith("room_")) {
    try {
      const insertPromise = supabase
        .from("room_participants")
        .insert({
          room_id: room.id,
          user_id: userId === "guest_taker" ? null : userId,
          display_name: displayName || "Reviewee",
          is_finished: false,
          score: 0,
        })
        .select()
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );

      const { data: savedParticipant } = await Promise.race([insertPromise, timeoutPromise]);
      if (savedParticipant?.id) {
        participant.id = savedParticipant.id;
      }
    } catch {}
  }

  // 7. Save active room to storage
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_ROOM, JSON.stringify(room));

  return {
    room,
    questions: lockedQuestions,
    participant,
  };
}

/**
 * Fetches real examinees who have joined this room.
 */
export async function fetchRoomParticipants(roomCode) {
  const cleanCode = (roomCode || "").trim().toUpperCase();
  if (!cleanCode) return [];

  try {
    const { data, error } = await supabase
      .from("room_participants")
      .select("id, display_name, is_finished, score, joined_at, exam_rooms!inner(room_code)")
      .eq("exam_rooms.room_code", cleanCode)
      .order("joined_at", { ascending: true });

    if (!error && Array.isArray(data)) {
      return data.map((p) => ({
        id: p.id,
        name: p.display_name || "Reviewee",
        status: p.is_finished ? "Finished" : "Ready",
        score: p.score ?? 0,
      }));
    }
  } catch {}

  return [];
}

/**
 * Subscribes to room events (attendance presence, active count, & start broadcast).
 * Returns an unsubscribe function.
 */
export function subscribeToRoomChannel({
  roomCode,
  participantName,
  isHost = false,
  onParticipantJoin,
  onPresenceSync,
  onExamStarted,
}) {
  const cleanCode = (roomCode || "general").trim().toUpperCase();
  const channelName = `room_${cleanCode}`;
  const presenceKey = `${isHost ? "host" : "user"}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const channel = supabase.channel(channelName, {
    config: {
      presence: { key: presenceKey },
    },
  });

  channel
    .on("presence", { event: "sync" }, () => {
      try {
        const state = channel.presenceState() || {};
        const activeMembers = [];
        const seenKeys = new Set();

        Object.entries(state).forEach(([key, presences]) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const meta = presences[0];
            const memberId = meta?.id || key;
            if (!seenKeys.has(memberId)) {
              seenKeys.add(memberId);
              activeMembers.push({
                id: memberId,
                name: meta?.name || "Reviewee",
                role: meta?.role || "student",
                time: "Active",
              });
            }
          }
        });

        if (typeof onPresenceSync === "function") {
          onPresenceSync({
            activeCount: activeMembers.length,
            participants: activeMembers,
          });
        }
      } catch {}
    })
    .on("broadcast", { event: "exam_started" }, ({ payload }) => {
      if (typeof onExamStarted === "function") {
        onExamStarted(payload);
      }
    })
    .on("broadcast", { event: "participant_joined" }, ({ payload }) => {
      if (typeof onParticipantJoin === "function" && payload) {
        onParticipantJoin(payload);
      }
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          await channel.track({
            id: presenceKey,
            name: participantName || (isHost ? "Instructor" : "Reviewee"),
            role: isHost ? "host" : "student",
            joinedAt: new Date().toISOString(),
          });
        } catch {}

        if (participantName && participantName !== "Instructor") {
          // Broadcast arrival of genuine examinee to instructor lobby
          channel.send({
            type: "broadcast",
            event: "participant_joined",
            payload: {
              id: presenceKey,
              name: participantName,
              time: "Ready",
            },
          });
        }
      }
    });

  return () => {
    channel.untrack().catch(() => {});
    supabase.removeChannel(channel);
  };
}

/**
 * Host triggers the synchronized exam start across all connected devices.
 */
export async function broadcastExamStart(roomCode, extraPayload = {}) {
  const cleanCode = (roomCode || "").trim().toUpperCase();
  const channelName = `room_${cleanCode}`;
  const channel = supabase.channel(channelName);

  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 2500);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      }
    });
  });

  await channel.send({
    type: "broadcast",
    event: "exam_started",
    payload: {
      startedAt: new Date().toISOString(),
      roomCode: cleanCode,
      ...extraPayload,
    },
  });

  // Update room status in Supabase if online
  try {
    const updateObj = { status: "in_progress" };
    if (extraPayload.questionIds && Array.isArray(extraPayload.questionIds)) {
      updateObj.question_ids = extraPayload.questionIds;
    }
    await supabase
      .from("exam_rooms")
      .update(updateObj)
      .eq("room_code", cleanCode);
  } catch {}
}

/**
 * Submits the examinee's completed group exam score to the shared room leaderboard.
 */
export async function submitGroupExamScore({
  roomId,
  roomCode,
  displayName,
  results,
  durationSeconds,
}) {
  const cleanCode = (roomCode || "").trim().toUpperCase();
  const total = results?.total || 0;
  const correct = results?.correct || 0;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPassed = score >= PASS_THRESHOLD;

  let userId = "guest_taker";
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) userId = data.user.id;
  } catch {}

  const resultRecord = {
    id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    room_id: roomId,
    room_code: cleanCode,
    user_id: userId,
    display_name: displayName || "Reviewee",
    score,
    correct_count: correct,
    wrong_count: results?.wrong || 0,
    skipped_count: results?.skipped || 0,
    total_questions: total,
    duration_seconds: durationSeconds || 0,
    is_passed: isPassed,
    is_finished: true,
    submitted_at: new Date().toISOString(),
  };

  // 1. Try uploading to Supabase room_participants
  try {
    await supabase.from("room_participants").insert({
      room_id: roomId,
      user_id: userId === "guest_taker" ? null : userId,
      display_name: resultRecord.display_name,
      score: resultRecord.score,
      correct_count: resultRecord.correct_count,
      duration_seconds: resultRecord.duration_seconds,
      is_finished: true,
      submitted_at: resultRecord.submitted_at,
    });
  } catch {}

  // 2. Save to local leaderboard cache
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_LEADERBOARDS);
    const boards = raw ? JSON.parse(raw) : {};
    const roomBoard = boards[cleanCode] || [];
    roomBoard.push(resultRecord);
    boards[cleanCode] = roomBoard;
    await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_LEADERBOARDS, JSON.stringify(boards));
  } catch (err) {
    console.warn("Leaderboard local cache error:", err);
  }

  return resultRecord;
}

/**
 * Retrieves the compiled group leaderboard and batch diagnostics.
 */
export async function getRoomLeaderboard(roomCode) {
  const cleanCode = (roomCode || "").trim().toUpperCase();
  let participants = [];

  // 1. Try fetching from Supabase
  try {
    const { data, error } = await supabase
      .from("room_participants")
      .select("*, exam_rooms!inner(room_code)")
      .eq("exam_rooms.room_code", cleanCode)
      .order("score", { ascending: false })
      .order("duration_seconds", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      participants = data.map((p) => ({
        id: p.id,
        display_name: p.display_name || "Reviewee",
        score: p.score ?? 0,
        correct_count: p.correct_count ?? 0,
        duration_seconds: p.duration_seconds ?? 0,
        is_passed: (p.score ?? 0) >= PASS_THRESHOLD,
      }));
    }
  } catch {}

  // 2. Overlay / Fallback to local storage leaderboard
  if (participants.length === 0) {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_LEADERBOARDS);
      const boards = raw ? JSON.parse(raw) : {};
      const localList = boards[cleanCode] || [];

      if (localList.length > 0) {
        participants = localList;
      }
    } catch {}
  }

  // Sort: Highest score first, then lowest duration
  participants.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.duration_seconds || 0) - (b.duration_seconds || 0);
  });

  // Calculate Batch Statistics
  const totalTakers = participants.length;
  const passedCount = participants.filter((p) => (p.score ?? 0) >= PASS_THRESHOLD).length;
  const passRate = totalTakers > 0 ? Math.round((passedCount / totalTakers) * 100) : 0;
  const avgScore = totalTakers > 0
    ? Math.round(participants.reduce((sum, p) => sum + (p.score ?? 0), 0) / totalTakers)
    : 0;
  const highestScore = participants[0]?.score ?? 0;
  const lowestScore = participants[participants.length - 1]?.score ?? 0;

  return {
    roomCode: cleanCode,
    totalTakers,
    passedCount,
    passRate,
    avgScore,
    highestScore,
    lowestScore,
    participants,
  };
}

/**
 * Retrieves the user's real recent group examination sessions.
 * Combines completed attempts matching "Group Exam" or "group" mode
 * and local room leaderboards.
 */
export async function getRecentBatchSessions() {
  const sessions = [];
  const seenCodes = new Set();

  // 1. From local attempt history
  try {
    const allAttempts = await getCachedAttempts();
    const groupAttempts = (allAttempts || []).filter((att) => {
      const title = (att.subject_title || "").toLowerCase();
      const mode = (att.mode || "").toLowerCase();
      return title.includes("group exam") || title.includes("apx-") || mode === "group";
    });

    for (const att of groupAttempts) {
      const match = (att.subject_title || "").match(/APX-[A-Z0-9]+/i);
      const code = match ? match[0].toUpperCase() : "APX-BATCH";
      seenCodes.add(code);
      const total = att.total_questions || 0;
      const correct = att.correct_count || 0;
      const score = att.score ?? (total > 0 ? Math.round((correct / total) * 100) : 0);
      const duration = att.duration_seconds || 0;

      sessions.push({
        id: att.id,
        roomCode: code,
        title: `Batch Exam (${code})`,
        itemCount: total,
        score,
        correct,
        duration,
        isPassed: score >= PASS_THRESHOLD,
        completedAt: att.completed_at || new Date().toISOString(),
      });
    }
  } catch {}

  // 2. From local leaderboards cache (for rooms created or joined)
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_LEADERBOARDS);
    const boards = raw ? JSON.parse(raw) : {};
    for (const [code, participants] of Object.entries(boards)) {
      if (!seenCodes.has(code) && Array.isArray(participants) && participants.length > 0) {
        seenCodes.add(code);
        const topUser = participants[0];
        sessions.push({
          id: `board_${code}`,
          roomCode: code,
          title: `Batch Exam (${code})`,
          itemCount: topUser.total || 50,
          score: topUser.score ?? 0,
          correct: topUser.correct_count ?? 0,
          duration: topUser.duration_seconds ?? 0,
          isPassed: (topUser.score ?? 0) >= PASS_THRESHOLD,
          completedAt: new Date().toISOString(),
        });
      }
    }
  } catch {}

  return sessions;
}
