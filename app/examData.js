// STUB DATA — replace with your real question bank / API response.
// Shape expected per question: { id, question, choices: [4 strings], correctIndex, explanation }

export const sampleQuestions = {
  "Numerical Ability": [
    {
      id: "num-1",
      question:
        "A bus travels 240 km in 4 hours. At the same speed, how far will it travel in 6 hours?",
      choices: ["300 Km", "360 Km", "320 Km", "380 Km"],
      correctIndex: 1,
      explanation: "Speed = 240 ÷ 4 = 60 km/h. Distance in 6 hrs = 60 × 6 = 360 km.",
    },
    {
      id: "num-2",
      question:
        "A cyclist rides 90 km in 5 hours. How many kilometers can they travel in 8 hours at the same rate?",
      choices: ["126 Km", "144 Km", "150 Km", "160 Km"],
      correctIndex: 1,
      explanation: "Speed = 90 ÷ 5 = 18 km/h. Distance in 8 hrs = 18 × 8 = 144 km.",
    },
    {
      id: "num-3",
      question: "What is 3/4 expressed as a percentage?",
      choices: ["70%", "75%", "80%", "34%"],
      correctIndex: 1,
      explanation: "3 ÷ 4 = 0.75 = 75%.",
    },
    {
      id: "num-4",
      question: "If x + 12 = 30, what is the value of x?",
      choices: ["12", "18", "20", "42"],
      correctIndex: 1,
      explanation: "x = 30 − 12 = 18.",
    },
    {
      id: "num-5",
      question: "A shirt priced at ₱500 is on a 20% discount. What is the sale price?",
      choices: ["₱400", "₱420", "₱450", "₱480"],
      correctIndex: 0,
      explanation: "20% of 500 = 100. Sale price = 500 − 100 = ₱400.",
    },
  ],

  "Analytical Ability": [
    {
      id: "ana-1",
      question: "Book is to Reading as Fork is to ___?",
      choices: ["Kitchen", "Eating", "Spoon", "Plate"],
      correctIndex: 1,
      explanation: "A book is used for reading, just as a fork is used for eating.",
    },
    {
      id: "ana-2",
      question: "What comes next in the series: 2, 4, 8, 16, __?",
      choices: ["24", "30", "32", "20"],
      correctIndex: 2,
      explanation: "Each number doubles the previous one: 16 × 2 = 32.",
    },
    {
      id: "ana-3",
      question:
        "All cats are animals. Some animals are pets. Which statement must be true?",
      choices: [
        "All cats are pets",
        "Some cats are pets",
        "No cats are pets",
        "None of the above can be concluded",
      ],
      correctIndex: 3,
      explanation:
        "The premises don't guarantee any cat is specifically a pet — no valid conclusion can be drawn.",
    },
    {
      id: "ana-4",
      question: "Find the odd one out: Triangle, Square, Circle, Blue",
      choices: ["Triangle", "Square", "Circle", "Blue"],
      correctIndex: 3,
      explanation: "The others are shapes; blue is a color.",
    },
    {
      id: "ana-5",
      question: "If all Zips are Zaps, and all Zaps are Zops, then all Zips are:",
      choices: ["Zaps only", "Zops", "Neither", "Cannot be determined"],
      correctIndex: 1,
      explanation: "By transitivity, Zip → Zap → Zop, so all Zips are Zops.",
    },
  ],

  "Verbal Ability": [
    {
      id: "verb-1",
      question: "Choose the correctly punctuated sentence.",
      choices: [
        "Its a beautiful day, isnt it?",
        "It's a beautiful day, isn't it?",
        "Its' a beautiful day, isn't it?",
        "It's a beautiful day, isnt' it?",
      ],
      correctIndex: 1,
      explanation: "\"It's\" (it is) and \"isn't\" (is not) both need apostrophes for the contractions.",
    },
    {
      id: "verb-2",
      question: "Select the word closest in meaning to 'meticulous'.",
      choices: ["Careless", "Careful", "Fast", "Loud"],
      correctIndex: 1,
      explanation: "'Meticulous' means showing great attention to detail — closest to 'careful'.",
    },
    {
      id: "verb-3",
      question: "Choose the grammatically correct sentence.",
      choices: [
        "She don't like coffee.",
        "She doesn't likes coffee.",
        "She doesn't like coffee.",
        "She not like coffee.",
      ],
      correctIndex: 2,
      explanation: "Third-person singular negative present tense: 'doesn't' + base verb 'like'.",
    },
    {
      id: "verb-4",
      question: "Select the antonym of 'transparent'.",
      choices: ["Clear", "Opaque", "Visible", "Bright"],
      correctIndex: 1,
      explanation: "'Opaque' means not able to be seen through — the opposite of 'transparent'.",
    },
    {
      id: "verb-5",
      question: "Which word correctly completes: 'Neither the manager nor the staff ___ available.'",
      choices: ["is", "are", "was", "be"],
      correctIndex: 0,
      explanation: "With 'neither/nor', the verb agrees with the noun closest to it — 'staff' takes 'is' here as the closer singular reference in formal usage.",
    },
  ],

  "General Information": [
    {
      id: "gen-1",
      question: "Under the 1987 Philippine Constitution, sovereignty resides in:",
      choices: ["Congress", "The President", "The people", "The Supreme Court"],
      correctIndex: 2,
      explanation: "Article II, Section 1 states sovereignty resides in the people and all government authority emanates from them.",
    },
    {
      id: "gen-2",
      question: "Which government agency administers the Civil Service Exam in the Philippines?",
      choices: ["DepEd", "CSC", "DOLE", "COMELEC"],
      correctIndex: 1,
      explanation: "The Civil Service Commission (CSC) administers the exam.",
    },
    {
      id: "gen-3",
      question: "The Philippine flag's blue field represents:",
      choices: ["Peace and truth", "Patriotism and valor", "Equality", "Unity"],
      correctIndex: 0,
      explanation: "Blue stands for peace, truth, and justice; red stands for patriotism and valor.",
    },
    {
      id: "gen-4",
      question: "Republic Act 6713 primarily governs:",
      choices: [
        "Code of Conduct for Public Officials",
        "Local Government Code",
        "Labor Code",
        "National Building Code",
      ],
      correctIndex: 0,
      explanation: "RA 6713 is the Code of Conduct and Ethical Standards for Public Officials and Employees.",
    },
    {
      id: "gen-5",
      question: "How many branches of government does the Philippines have?",
      choices: ["Two", "Three", "Four", "Five"],
      correctIndex: 1,
      explanation: "Executive, Legislative, and Judicial — three branches.",
    },
  ],
};

// Builds the question set for a session.
// subjectTitle = null means "All Categories" (combined, tagged per question).
export function buildQuestionSet(subjectTitle) {
  if (subjectTitle && sampleQuestions[subjectTitle]) {
    return sampleQuestions[subjectTitle].map((q) => ({
      ...q,
      subjectTitle,
    }));
  }

  return Object.entries(sampleQuestions).flatMap(([title, questions]) =>
    questions.map((q) => ({ ...q, subjectTitle: title }))
  );
}
