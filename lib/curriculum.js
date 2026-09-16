/**
 * APEX-CS Civil Service Examination Curriculum Configuration (2026 Scope)
 *
 * Defines the 3-tier hierarchy:
 * Exam Level (Professional / Sub-Professional)
 *   └── Category (Subject)
 *         └── Chapter (Topic)
 *
 * NOTE: Estimated category weights are approximations for study planning
 * and are NOT officially published CSC ratios.
 */

export const PASS_THRESHOLD = 80;
export const WEAK_THRESHOLD = 70;

export const EXAM_LEVELS = {
  professional: {
    key: "professional",
    label: "Professional Level",
    shortLabel: "Professional",
    totalItems: 170,
    durationHours: 3,
    passingScore: 80,
    description: "For positions requiring a college degree. Grants 2nd-level eligibility.",
  },
  sub: {
    key: "sub",
    label: "Sub-Professional Level",
    shortLabel: "Sub-Professional",
    totalItems: 165,
    durationHours: 2,
    passingScore: 80,
    description: "For clerical and trades positions. Grants 1st-level eligibility.",
  },
};

export const CURRICULUM = {
  professional: [
    {
      id: "prof_analytical",
      title: "Analytical Ability",
      shortTitle: "Analytical",
      subtitle: "Reasoning, Logic & Data Interpretation",
      estimatedWeight: 0.35, // ~35%
      estimatedWeightLabel: "~35% Estimated Exam Coverage",
      icon: "brain",
      iconType: "material",
      color: "#FFE9EF",
      badgeColor: "#F43F5E",
      description: "Tests critical reasoning, abstract pattern identification, and logical deduction.",
      chapters: [
        {
          id: "word_analogy",
          title: "Word Analogy",
          description: "Identify relationships between word pairs and complete analogous patterns.",
          keywords: ["analogy", "analogous", "is to", "relationship", "pairs"],
        },
        {
          id: "symbolic_logic",
          title: "Symbolic Logic & Abstract Reasoning",
          description: "Analyze non-verbal figures, symbol series, pattern progression, and Venn diagrams.",
          keywords: ["symbolic", "abstract", "sequence of shapes", "pattern", "figure", "logic"],
        },
        {
          id: "assumptions_conclusions",
          title: "Assumptions & Conclusions",
          description: "Evaluate statements to distinguish sound assumptions from valid logical conclusions.",
          keywords: ["assumption", "conclusion", "premise", "deduction", "implies", "infer"],
        },
        {
          id: "data_interpretation",
          title: "Data Interpretation",
          description: "Read, interpret, and calculate metrics from charts, tables, and graphs.",
          keywords: ["table", "chart", "graph", "percentage increase", "pie chart", "data"],
        },
      ],
    },
    {
      id: "prof_numerical",
      title: "Numerical Ability",
      shortTitle: "Numerical",
      subtitle: "Basic Operations, Number Sequences & Problems",
      estimatedWeight: 0.30, // ~30%
      estimatedWeightLabel: "~30% Estimated Exam Coverage",
      icon: "calculator-variant-outline",
      iconType: "material",
      color: "#EEF2FF",
      badgeColor: "#4F46E5",
      description: "Tests mathematical aptitude, numerical patterns, and real-world problem solving.",
      chapters: [
        {
          id: "basic_operations",
          title: "Basic Operations",
          description: "Fractions, decimals, percentages, ratio and proportion, and arithmetic.",
          keywords: ["÷", "+", "−", "×", "fraction", "decimal", "ratio", "proportion", "evaluate"],
        },
        {
          id: "number_sequence",
          title: "Number Sequence",
          description: "Find the next term or missing numbers in complex mathematical sequences.",
          keywords: ["sequence", "next number", "series", "pattern", "term", "missing number"],
        },
        {
          id: "word_problems",
          title: "Word Problems",
          description: "Algebra, age problems, work-rate, speed-distance-time, interest, and discount.",
          keywords: ["costs", "discount", "worker", "earn", "salary", "train", "speed", "age", "invest"],
        },
      ],
    },
    {
      id: "prof_verbal",
      title: "Verbal Ability",
      shortTitle: "Verbal",
      subtitle: "Word Meaning, Grammar & Reading",
      estimatedWeight: 0.30, // ~30%
      estimatedWeightLabel: "~30% Estimated Exam Coverage",
      icon: "text-box-outline",
      iconType: "material",
      color: "#E8F7FF",
      badgeColor: "#0284C7",
      description: "Tests English and Filipino vocabulary, grammar conventions, and reading comprehension.",
      chapters: [
        {
          id: "word_meaning",
          title: "Word Meaning",
          description: "Synonyms, antonyms, idiomatic expressions, and contextual vocabulary.",
          keywords: ["closest in meaning", "opposite of", "synonym", "antonym", "definition", "meaning"],
        },
        {
          id: "sentence_completion",
          title: "Sentence Completion",
          description: "Select the most appropriate word or phrase to complete the context of a sentence.",
          keywords: ["complete the sentence", "praised because", "fill in the blank", "appropriate word"],
        },
        {
          id: "error_recognition",
          title: "Error Recognition",
          description: "Spot grammatical errors, subject-verb agreement issues, and tense inconsistencies.",
          keywords: ["error", "incorrect part", "grammatically incorrect", "spot the error"],
        },
        {
          id: "sentence_structure",
          title: "Sentence Structure",
          description: "Identify grammatically sound sentence construction, modifiers, and parallelism.",
          keywords: ["grammatically correct", "sentence structure", "neither", "parallelism"],
        },
        {
          id: "paragraph_organization",
          title: "Paragraph Organization",
          description: "Arrange jumbled sentences into a cohesive, logical, and structured paragraph.",
          keywords: ["arrange the sentences", "proper order", "paragraph", "sequence of sentences"],
        },
        {
          id: "reading_comprehension",
          title: "Reading Comprehension",
          description: "Extract central themes, supporting details, tone, and inferences from passages.",
          keywords: ["passage", "according to the text", "author implies", "main idea", "comprehension"],
        },
      ],
    },
    {
      id: "prof_geninfo",
      title: "General Information",
      shortTitle: "General Info",
      subtitle: "Philippine Constitution, Laws & Environment",
      estimatedWeight: 0.05, // ~5%
      estimatedWeightLabel: "~5% Estimated Exam Coverage",
      icon: "lightbulb-outline",
      iconType: "material",
      color: "#FFF6DA",
      badgeColor: "#D97706",
      description: "Tests civic duty, constitutional provisions, administrative ethics, and environmental stewardship.",
      chapters: [
        {
          id: "philippine_constitution",
          title: "Philippine Constitution",
          description: "Bill of Rights, three branches of government, citizenship, and state policies.",
          keywords: ["constitution", "bill of rights", "branch of the", "legislative", "supreme court", "highest law"],
        },
        {
          id: "code_of_conduct_ra6713",
          title: "Code of Conduct / R.A. 6713",
          description: "Ethical standards, accountability, public officer duties, and prohibited acts.",
          keywords: ["6713", "code of conduct", "ethical standards", "civil service", "ombudsman", "public official"],
        },
        {
          id: "peace_human_rights",
          title: "Peace and Human Rights Issues and Concepts",
          description: "Universal declaration of human rights, national peace policies, and equality.",
          keywords: ["human rights", "peace", "equality", "united nations", "discrimination", "commission on human rights"],
        },
        {
          id: "environmental_management",
          title: "Environmental Management and Protection",
          description: "Ecological laws (clean air, solid waste, clean water) and climate change initiatives.",
          keywords: ["environment", "ecological", "waste management", "clean air", "climate", "pollution", "natural resources"],
        },
      ],
    },
  ],

  sub: [
    {
      id: "sub_clerical",
      title: "Clerical Ability",
      shortTitle: "Clerical",
      subtitle: "Filing, Indexing & Spelling",
      estimatedWeight: 0.20, // ~20%
      estimatedWeightLabel: "~20% Estimated Exam Coverage",
      icon: "file-document-outline",
      iconType: "material",
      color: "#F0E8FF",
      badgeColor: "#9333EA",
      description: "Tests clerical aptitude, alphabetical and numerical filing systems, and orthography.",
      chapters: [
        {
          id: "filing",
          title: "Filing",
          description: "Alphabetical indexing, numerical filing rules, and official record-keeping procedures.",
          keywords: ["alphabetically", "filing", "names alphabetically", "which comes first", "indexing", "records"],
        },
        {
          id: "spelling",
          title: "Spelling",
          description: "Correct English and Filipino spelling, homophones, and frequently misspelled terms.",
          keywords: ["spelled", "spelling", "correct spelling", "misspelled", "orthography"],
        },
      ],
    },
    {
      id: "sub_numerical",
      title: "Numerical Ability",
      shortTitle: "Numerical",
      subtitle: "Basic Operations, Number Sequences & Problems",
      estimatedWeight: 0.30, // ~30%
      estimatedWeightLabel: "~30% Estimated Exam Coverage",
      icon: "calculator-variant-outline",
      iconType: "material",
      color: "#EEF2FF",
      badgeColor: "#4F46E5",
      description: "Tests mathematical aptitude, arithmetic, and problem solving for clerical support roles.",
      chapters: [
        {
          id: "basic_operations",
          title: "Basic Operations",
          description: "Fractions, decimals, percentages, ratio and proportion, and arithmetic.",
          keywords: ["÷", "+", "−", "×", "fraction", "decimal", "ratio", "proportion", "evaluate"],
        },
        {
          id: "number_sequence",
          title: "Number Sequence",
          description: "Find the next term or missing numbers in complex mathematical sequences.",
          keywords: ["sequence", "next number", "series", "pattern", "term", "missing number"],
        },
        {
          id: "word_problems",
          title: "Word Problems",
          description: "Algebra, age problems, work-rate, speed-distance-time, interest, and discount.",
          keywords: ["costs", "discount", "worker", "earn", "salary", "train", "speed", "age", "invest"],
        },
      ],
    },
    {
      id: "sub_verbal",
      title: "Verbal Ability",
      shortTitle: "Verbal",
      subtitle: "Word Meaning, Grammar & Reading",
      estimatedWeight: 0.30, // ~30%
      estimatedWeightLabel: "~30% Estimated Exam Coverage",
      icon: "text-box-outline",
      iconType: "material",
      color: "#E8F7FF",
      badgeColor: "#0284C7",
      description: "Tests communication proficiency, grammar rules, vocabulary, and paragraph interpretation.",
      chapters: [
        {
          id: "word_meaning",
          title: "Word Meaning",
          description: "Synonyms, antonyms, idiomatic expressions, and contextual vocabulary.",
          keywords: ["closest in meaning", "opposite of", "synonym", "antonym", "definition", "meaning"],
        },
        {
          id: "sentence_completion",
          title: "Sentence Completion",
          description: "Select the most appropriate word or phrase to complete the context of a sentence.",
          keywords: ["complete the sentence", "praised because", "fill in the blank", "appropriate word"],
        },
        {
          id: "error_recognition",
          title: "Error Recognition",
          description: "Spot grammatical errors, subject-verb agreement issues, and tense inconsistencies.",
          keywords: ["error", "incorrect part", "grammatically incorrect", "spot the error"],
        },
        {
          id: "sentence_structure",
          title: "Sentence Structure",
          description: "Identify grammatically sound sentence construction, modifiers, and parallelism.",
          keywords: ["grammatically correct", "sentence structure", "neither", "parallelism"],
        },
        {
          id: "paragraph_organization",
          title: "Paragraph Organization",
          description: "Arrange jumbled sentences into a cohesive, logical, and structured paragraph.",
          keywords: ["arrange the sentences", "proper order", "paragraph", "sequence of sentences"],
        },
        {
          id: "reading_comprehension",
          title: "Reading Comprehension",
          description: "Extract central themes, supporting details, tone, and inferences from passages.",
          keywords: ["passage", "according to the text", "author implies", "main idea", "comprehension"],
        },
      ],
    },
    {
      id: "sub_geninfo",
      title: "General Information",
      shortTitle: "General Info",
      subtitle: "Philippine Constitution, Laws & Environment",
      estimatedWeight: 0.05, // ~5%
      estimatedWeightLabel: "~5% Estimated Exam Coverage",
      icon: "lightbulb-outline",
      iconType: "material",
      color: "#FFF6DA",
      badgeColor: "#D97706",
      description: "Tests civic knowledge, Philippine constitution, code of conduct, and human rights.",
      chapters: [
        {
          id: "philippine_constitution",
          title: "Philippine Constitution",
          description: "Bill of Rights, three branches of government, citizenship, and state policies.",
          keywords: ["constitution", "bill of rights", "branch of the", "legislative", "supreme court", "highest law"],
        },
        {
          id: "code_of_conduct_ra6713",
          title: "Code of Conduct / R.A. 6713",
          description: "Ethical standards, accountability, public officer duties, and prohibited acts.",
          keywords: ["6713", "code of conduct", "ethical standards", "civil service", "ombudsman", "public official"],
        },
        {
          id: "peace_human_rights",
          title: "Peace and Human Rights Issues and Concepts",
          description: "Universal declaration of human rights, national peace policies, and equality.",
          keywords: ["human rights", "peace", "equality", "united nations", "discrimination", "commission on human rights"],
        },
        {
          id: "environmental_management",
          title: "Environmental Management and Protection",
          description: "Ecological laws (clean air, solid waste, clean water) and climate change initiatives.",
          keywords: ["environment", "ecological", "waste management", "clean air", "climate", "pollution", "natural resources"],
        },
      ],
    },
  ],
};

/**
 * Returns curriculum categories for the selected level.
 */
export function getCurriculum(level = "professional") {
  const normLevel = level === "sub" ? "sub" : "professional";
  return CURRICULUM[normLevel] || CURRICULUM.professional;
}

/**
 * Finds a specific category by title or id.
 */
export function getCategoryConfig(level, categoryTitle) {
  if (!categoryTitle) return null;
  const categories = getCurriculum(level);
  const target = categoryTitle.trim().toLowerCase();
  return (
    categories.find(
      (c) =>
        c.title.toLowerCase() === target ||
        c.shortTitle.toLowerCase() === target ||
        c.id.toLowerCase() === target
    ) || null
  );
}

/**
 * Finds a specific chapter by title under a category.
 */
export function getChapterConfig(level, categoryTitle, chapterTitle) {
  const category = getCategoryConfig(level, categoryTitle);
  if (!category || !chapterTitle) return null;
  const target = chapterTitle.trim().toLowerCase();
  return (
    category.chapters.find(
      (ch) =>
        ch.title.toLowerCase() === target ||
        ch.id.toLowerCase() === target
    ) || null
  );
}

/**
 * Classifies an untagged question into the best-matching chapter.
 * Fallback mechanism ensuring backward compatibility with legacy questions.
 */
export function classifyQuestionChapter(questionText = "", categoryTitle = "", level = "professional") {
  const category = getCategoryConfig(level, categoryTitle);
  if (!category || !category.chapters?.length) {
    return "General";
  }

  const textLower = (questionText || "").toLowerCase();

  for (const chapter of category.chapters) {
    if (!chapter.keywords?.length) continue;
    for (const kw of chapter.keywords) {
      if (textLower.includes(kw.toLowerCase())) {
        return chapter.title;
      }
    }
  }

  // Fallback to first chapter in category
  return category.chapters[0]?.title || "General";
}
