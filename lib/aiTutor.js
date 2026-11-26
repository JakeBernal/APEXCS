import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const MEMORY_CACHE = new Map();
const STORAGE_PREFIX = "@apex_ai_explain_";

/**
 * Retrieves Gemini API key from environment variable (developer/system config only).
 * Never prompts the user.
 */
function getSystemGeminiApiKey() {
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;
}

/**
 * Generates an intelligent, context-aware Civil Service pedagogical breakdown
 * when cloud AI is unreachable or unconfigured. Ensures zero downtime and zero
 * user-facing configuration hurdles.
 */
function generateContextualBreakdown({
  questionText,
  choices,
  userChoiceText,
  correctChoiceText,
  chapter,
  existingExplanation,
}) {
  const normChapter = (chapter || "").toLowerCase();

  // 1. Core Summary Takeaway
  let summary = `The correct answer is "${correctChoiceText}".`;
  if (existingExplanation && existingExplanation.trim() !== "") {
    const firstSentence = existingExplanation.trim().split(".")[0];
    if (firstSentence && firstSentence.length > 10) {
      summary = `${firstSentence.trim()}.`;
    }
  }

  // 2. Step-by-Step Logic
  let whyCorrect = "";
  if (existingExplanation && existingExplanation.trim() !== "") {
    whyCorrect = existingExplanation.trim();
  } else {
    whyCorrect = `In this question, "${correctChoiceText}" directly satisfies the criteria required for ${
      chapter || "this concept"
    }. Carefully examining the premise confirms that this option maintains grammatical, logical, and factual accuracy.`;
  }

  // 3. Common Trap / Misconception Analysis
  let userTrap = "";
  if (userChoiceText && userChoiceText !== correctChoiceText && userChoiceText !== "Skipped") {
    userTrap = `Selecting "${userChoiceText}" is a common distractor trap. In Civil Service exams, choices often use partially true facts or plausible-sounding phrasing designed to mislead examinees who scan too quickly.`;
  } else {
    userTrap = `Civil Service exam questions in ${
      chapter || "this section"
    } frequently include "plausible distractors"—options that look appealing at first glance but contain subtle logical flaws or extreme qualifiers.`;
  }

  // 4. CSC Pro-Tip / Test Strategy
  let examTip = "Always eliminate options containing absolute qualifiers like 'always', 'never', or 'in all cases' unless mandated by law.";
  if (normChapter.includes("analogy") || normChapter.includes("logic")) {
    examTip = "Formulate a clear bridge sentence connecting the first pair (e.g. 'A is a type of B'), then test each choice using that exact sentence.";
  } else if (
    normChapter.includes("number") ||
    normChapter.includes("numerical") ||
    normChapter.includes("series") ||
    normChapter.includes("math")
  ) {
    examTip = "Calculate differences between consecutive numbers first. If irregular, test alternating positions (skip counting) or 2nd-level differences.";
  } else if (
    normChapter.includes("grammar") ||
    normChapter.includes("verbal") ||
    normChapter.includes("agreement")
  ) {
    examTip = "Ignore intervening phrases (e.g. 'as well as', 'together with', 'including') to isolate the true subject and match the correct verb form.";
  } else if (
    normChapter.includes("clerical") ||
    normChapter.includes("filing") ||
    normChapter.includes("alphabet")
  ) {
    examTip = "Remember the standard CSC filing rule: Names of individuals are indexed: Surname first, Given name second, Middle name or initial last.";
  } else if (
    normChapter.includes("constitution") ||
    normChapter.includes("general") ||
    normChapter.includes("republic")
  ) {
    examTip = "Key CSC topics include RA 6713 (Code of Conduct & Ethical Standards) and constitutional accountability provisions for public officers.";
  }

  return {
    summary,
    whyCorrect,
    userTrap,
    examTip,
  };
}

/**
 * Parses Gemini response text into structured JSON.
 */
function parseGeminiJson(rawText) {
  if (!rawText) return null;

  try {
    let clean = rawText.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "");
    }
    const parsed = JSON.parse(clean);
    return {
      summary: parsed.summary || "",
      whyCorrect: parsed.whyCorrect || "",
      userTrap: parsed.userTrap || "",
      examTip: parsed.examTip || "",
    };
  } catch {
    return {
      summary: "AI Tutor Breakdown",
      whyCorrect: rawText.trim(),
      userTrap: "",
      examTip: "Read each option carefully and eliminate obvious outliers.",
    };
  }
}

/**
 * Calls Google Gemini REST API directly using 1.5-flash.
 */
async function callGeminiDirectly({
  apiKey,
  questionText,
  choices,
  userChoiceText,
  correctChoiceText,
  chapter,
  existingExplanation,
}) {
  const choicesFormatted = choices
    .map((c, i) => {
      const text = typeof c === "string" ? c : c?.choice_text || "";
      return `${String.fromCharCode(65 + i)}) ${text}`;
    })
    .join("\n");

  const prompt = `You are a friendly, encouraging, and expert Philippine Civil Service Examination (CSC) tutor.
Analyze the following exam question and explain it so the examinee thoroughly understands the concept for their upcoming Civil Service Exam.

Topic/Chapter: ${chapter || "General"}
Question: ${questionText}

Choices:
${choicesFormatted}

Correct Answer: ${correctChoiceText || "Not specified"}
User Selected: ${userChoiceText || "Skipped / Reviewing concept"}
${existingExplanation ? `Existing Notes: ${existingExplanation}` : ""}

Return a strictly valid JSON object with EXACTLY these four keys (no text outside JSON):
{
  "summary": "A concise 1-sentence bottom-line explaining the core takeaway.",
  "whyCorrect": "Clear, step-by-step logic demonstrating why the correct answer is right.",
  "userTrap": "Why the user's chosen answer (or the most tempting distractor) is a common CSC trap and why it is wrong.",
  "examTip": "A memorable rule of thumb, shortcut, formula, or mnemonic specifically useful for this type of CSC question."
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return parseGeminiJson(rawText);
}

/**
 * Fetches an AI explanation for an exam question.
 *
 * Fully automated:
 * 1. Checks Memory and AsyncStorage Cache (0ms, 0 tokens)
 * 2. Attempts Supabase Edge Function (`explain-question`)
 * 3. Falls back to direct Gemini API call if backend key exists
 * 4. Falls back to built-in pedagogical engine (zero user configuration)
 */
export async function getAiExplanation({
  questionId,
  questionText,
  choices = [],
  selectedChoiceId,
  selectedChoiceIndex,
  correctChoiceId,
  correctChoiceIndex,
  chapter = "",
  existingExplanation = "",
  userChoiceText: explicitUserChoiceText,
  correctChoiceText: explicitCorrectChoiceText,
}) {
  // Resolve user choice text
  let userChoiceText = explicitUserChoiceText || "";
  if (!userChoiceText && typeof selectedChoiceIndex === "number" && choices[selectedChoiceIndex]) {
    const ch = choices[selectedChoiceIndex];
    userChoiceText = typeof ch === "string" ? ch : ch?.choice_text || "";
  } else if (!userChoiceText && selectedChoiceId && Array.isArray(choices)) {
    const ch = choices.find((c) => c.id === selectedChoiceId);
    userChoiceText = ch?.choice_text || "";
  }

  // Resolve correct choice text
  let correctChoiceText = explicitCorrectChoiceText || "";
  if (!correctChoiceText && typeof correctChoiceIndex === "number" && choices[correctChoiceIndex]) {
    const ch = choices[correctChoiceIndex];
    correctChoiceText = typeof ch === "string" ? ch : ch?.choice_text || "";
  } else if (!correctChoiceText && correctChoiceId && Array.isArray(choices)) {
    const ch = choices.find((c) => c.id === correctChoiceId);
    correctChoiceText = ch?.choice_text || "";
  }

  const cacheKey = `${STORAGE_PREFIX}${questionId || questionText?.slice(0, 30) || "q"}_${
    userChoiceText?.slice(0, 20) || "none"
  }`;

  // 1. Check memory cache
  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey);
  }

  // 2. Check AsyncStorage
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      MEMORY_CACHE.set(cacheKey, parsed);
      return parsed;
    }
  } catch {}

  let result = null;

  // 3. Try Supabase Edge Function
  try {
    const { data, error } = await supabase.functions.invoke("explain-question", {
      body: {
        questionId,
        questionText,
        choices,
        userChoiceText,
        correctChoiceText,
        chapter,
        existingExplanation,
      },
    });

    if (!error && data && data.whyCorrect) {
      result = data;
    }
  } catch {
    // Edge function not deployed or unreachable
  }

  // 4. Try Direct Gemini Call (if system key configured)
  if (!result) {
    const systemApiKey = getSystemGeminiApiKey();
    if (systemApiKey) {
      try {
        result = await callGeminiDirectly({
          apiKey: systemApiKey,
          questionText,
          choices,
          userChoiceText,
          correctChoiceText,
          chapter,
          existingExplanation,
        });
      } catch {
        // Fall through to offline educational engine
      }
    }
  }

  // 5. Intelligent Fallback (Zero user setup required)
  if (!result) {
    result = generateContextualBreakdown({
      questionText,
      choices,
      userChoiceText,
      correctChoiceText,
      chapter,
      existingExplanation,
    });
  }

  // Cache result
  MEMORY_CACHE.set(cacheKey, result);
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {}

  return result;
}
