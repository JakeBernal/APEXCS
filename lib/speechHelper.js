import * as Speech from "expo-speech";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Halts any active text-to-speech immediately.
 */
export async function stopSpeaking() {
  try {
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      await Speech.stop();
    }
  } catch (err) {
    console.warn("Speech stop warning:", err);
  }
}

/**
 * Formats question, choices, or flashcards into natural speech strings with pauses.
 */
export function formatQuestionSpeech({
  questionNumber,
  total,
  questionText,
  choices = [],
  mode = "timed",
  isFlipped = false,
  explanation = "",
  selectedChoiceIndex,
  correctChoiceIndex,
}) {
  // FLASHCARDS MODE
  if (mode === "flashcards") {
    if (isFlipped) {
      const answerText = choices[correctChoiceIndex] || "No answer provided";
      return `Answer: ${answerText}.`;
    }
    return `Question ${questionNumber} of ${total}: ${questionText}.`;
  }

  // REVIEW MODE
  if (mode === "review" && selectedChoiceIndex !== undefined) {
    const isCorrect = selectedChoiceIndex === correctChoiceIndex;
    const selectedLetter = LETTERS[selectedChoiceIndex] || "";
    const selectedText = choices[selectedChoiceIndex] || "";
    const correctLetter = LETTERS[correctChoiceIndex] || "";
    const correctText = choices[correctChoiceIndex] || "";

    let speech = `Question ${questionNumber}: ${questionText}. `;

    if (isCorrect) {
      speech += `Correct! You selected Option ${selectedLetter}: ${selectedText}. `;
    } else {
      speech += `Not quite. You selected Option ${selectedLetter}: ${selectedText}. `;
      speech += `The correct answer is Option ${correctLetter}: ${correctText}. `;
    }

    if (explanation && explanation.trim().length > 0) {
      speech += `Explanation: ${explanation}.`;
    }

    return speech;
  }

  // STANDARD / TIMED MULTIPLE CHOICE
  let speech = `Question ${questionNumber} of ${total}. ${questionText}. `;

  if (Array.isArray(choices) && choices.length > 0) {
    choices.forEach((choice, idx) => {
      const letter = LETTERS[idx] || `${idx + 1}`;
      speech += `Option ${letter}: ${choice}. `;
    });
  }

  return speech;
}

/**
 * Reads the given formatted text out loud using native TextToSpeech.
 */
export async function speakText(
  text,
  {
    onStart,
    onDone,
    onStopped,
    onError,
    rate = 0.92,
    pitch = 1.0,
    language = "en-US",
  } = {}
) {
  if (!text || typeof text !== "string") return;

  try {
    // Always stop any prior ongoing audio
    await Speech.stop();

    Speech.speak(text, {
      language,
      rate,
      pitch,
      onStart: () => {
        if (onStart) onStart();
      },
      onDone: () => {
        if (onDone) onDone();
      },
      onStopped: () => {
        if (onStopped) onStopped();
      },
      onError: (err) => {
        console.warn("Speech synthesis error:", err);
        if (onError) onError(err);
      },
    });
  } catch (err) {
    console.warn("Failed to speak text:", err);
    if (onError) onError(err);
  }
}
