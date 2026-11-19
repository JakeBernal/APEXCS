/**
 * APEX-CS Seed Question Bank (Offline-First Fallback)
 *
 * Provides authentic, high-yield Philippine Civil Service Commission (CSC)
 * questions across all curriculum categories and chapters.
 *
 * Used immediately on fresh installations when offline, and merged with
 * cloud-synced questions whenever network connectivity is available.
 */

export const OFFLINE_SEED_QUESTIONS = [
  // =========================================================================
  // ANALYTICAL ABILITY (Professional Level)
  // =========================================================================
  {
    id: "seed_ana_001",
    question: "ARCHIPELAGO is to ISLAND as GALAXY is to:",
    choices: ["Solar System", "Star", "Milky Way", "Universe"],
    choiceIds: ["c_ana_1_1", "c_ana_1_2", "c_ana_1_3", "c_ana_1_4"],
    correctIndex: 1,
    explanation: "An archipelago is a group or cluster of islands. Similarly, a galaxy is a massive gravitationally bound system consisting of stars.",
    subjectTitle: "Analytical Ability",
    chapter: "Word Analogy",
    level: "professional",
  },
  {
    id: "seed_ana_002",
    question: "CANDID is to DISINGENUOUS as FRUGAL is to:",
    choices: ["Economical", "Spendthrift", "Prudent", "Miserly"],
    choiceIds: ["c_ana_2_1", "c_ana_2_2", "c_ana_2_3", "c_ana_2_4"],
    correctIndex: 1,
    explanation: "Candid (frank/honest) is the antonym of disingenuous (deceitful). Frugal (thrifty) is the antonym of spendthrift (wasteful with money).",
    subjectTitle: "Analytical Ability",
    chapter: "Word Analogy",
    level: "professional",
  },
  {
    id: "seed_ana_003",
    question: "Statement: 'All civil servants who uphold integrity promote public trust. Officer Santos consistently promotes public trust.'\n\nWhich of the following must be logically true?",
    choices: [
      "Officer Santos is a civil servant who upholds integrity.",
      "Promoting public trust is only done by civil servants.",
      "The statement does not provide sufficient certainty that Santos is a civil servant.",
      "Officer Santos must be a government official."
    ],
    choiceIds: ["c_ana_3_1", "c_ana_3_2", "c_ana_3_3", "c_ana_3_4"],
    correctIndex: 2,
    explanation: "Committing the fallacy of affirming the consequent: while all civil servants who uphold integrity promote trust, others may also promote public trust. Thus, it cannot be deduced with certainty that Santos is a civil servant.",
    subjectTitle: "Analytical Ability",
    chapter: "Assumptions & Conclusions",
    level: "professional",
  },
  {
    id: "seed_ana_004",
    question: "Statement: 'No non-citizens are allowed to vote in national elections. Maria was permitted to vote in the national elections.'\n\nConclusion:",
    choices: [
      "Maria is a registered voter but not necessarily a citizen.",
      "Maria is a citizen.",
      "Maria is an overseas Filipino worker.",
      "Maria works for the Commission on Elections."
    ],
    choiceIds: ["c_ana_4_1", "c_ana_4_2", "c_ana_4_3", "c_ana_4_4"],
    correctIndex: 1,
    explanation: "Since no non-citizens are allowed to vote, any person permitted to vote must be a citizen (modus tollens / valid deductive syllogism).",
    subjectTitle: "Analytical Ability",
    chapter: "Assumptions & Conclusions",
    level: "professional",
  },
  {
    id: "seed_ana_005",
    question: "If circle represents Public Administrators, triangle represents Lawyers, and square represents Economists, which region represents individuals who are both Public Administrators and Lawyers but NOT Economists?",
    choices: [
      "Intersection of circle and triangle outside the square",
      "Intersection of circle, triangle, and square",
      "Area only within the square",
      "Area outside all three geometrical figures"
    ],
    choiceIds: ["c_ana_5_1", "c_ana_5_2", "c_ana_5_3", "c_ana_5_4"],
    correctIndex: 0,
    explanation: "Individuals who are Public Administrators (circle) and Lawyers (triangle) but not Economists (square) lie in the region where circle and triangle overlap, excluding any portion inside the square.",
    subjectTitle: "Analytical Ability",
    chapter: "Symbolic Logic & Abstract Reasoning",
    level: "professional",
  },
  {
    id: "seed_ana_006",
    question: "A government department's personnel records show:\n2023: 120 staff members\n2024: 150 staff members\n2025: 180 staff members\n\nWhat is the percentage increase in staff from 2023 to 2025?",
    choices: ["33.3%", "40.0%", "50.0%", "60.0%"],
    choiceIds: ["c_ana_6_1", "c_ana_6_2", "c_ana_6_3", "c_ana_6_4"],
    correctIndex: 2,
    explanation: "Increase = 180 - 120 = 60. Percentage increase = (60 / 120) * 100 = 50.0%.",
    subjectTitle: "Analytical Ability",
    chapter: "Data Interpretation",
    level: "professional",
  },

  // =========================================================================
  // NUMERICAL ABILITY (Professional & Sub-Professional)
  // =========================================================================
  {
    id: "seed_num_001",
    question: "What is 45% of 640?",
    choices: ["288", "296", "312", "324"],
    choiceIds: ["c_num_1_1", "c_num_1_2", "c_num_1_3", "c_num_1_4"],
    correctIndex: 0,
    explanation: "45% of 640 = 0.45 * 640 = 288 (or 50% = 320, 5% = 32; 320 - 32 = 288).",
    subjectTitle: "Numerical Ability",
    chapter: "Basic Operations",
    level: null,
  },
  {
    id: "seed_num_002",
    question: "Simplify: (3/4 + 2/5) ÷ 23/20",
    choices: ["1/2", "1", "23/20", "46/20"],
    choiceIds: ["c_num_2_1", "c_num_2_2", "c_num_2_3", "c_num_2_4"],
    correctIndex: 1,
    explanation: "Common denominator for 3/4 and 2/5 is 20: (15/20 + 8/20) = 23/20. Then (23/20) ÷ (23/20) = 1.",
    subjectTitle: "Numerical Ability",
    chapter: "Basic Operations",
    level: null,
  },
  {
    id: "seed_num_003",
    question: "Find the missing term in the sequence: 4, 9, 19, 39, 79, __",
    choices: ["149", "159", "169", "179"],
    choiceIds: ["c_num_3_1", "c_num_3_2", "c_num_3_3", "c_num_3_4"],
    correctIndex: 1,
    explanation: "Pattern: multiply by 2 and add 1. 4*2+1=9; 9*2+1=19; 19*2+1=39; 39*2+1=79; 79*2+1=159.",
    subjectTitle: "Numerical Ability",
    chapter: "Number Sequence",
    level: null,
  },
  {
    id: "seed_num_004",
    question: "Identify the next number in the pattern: 2, 6, 12, 20, 30, 42, __",
    choices: ["54", "56", "58", "60"],
    choiceIds: ["c_num_4_1", "c_num_4_2", "c_num_4_3", "c_num_4_4"],
    correctIndex: 1,
    explanation: "The differences between successive terms are +4, +6, +8, +10, +12, so the next difference is +14. 42 + 14 = 56 (or n*(n+1): 1*2, 2*3, 3*4, ..., 7*8 = 56).",
    subjectTitle: "Numerical Ability",
    chapter: "Number Sequence",
    level: null,
  },
  {
    id: "seed_num_005",
    question: "If 5 government clerks can process 125 documents in 4 hours, how many documents can 8 clerks process in 6 hours at the same rate?",
    choices: ["250", "280", "300", "320"],
    choiceIds: ["c_num_5_1", "c_num_5_2", "c_num_5_3", "c_num_5_4"],
    correctIndex: 2,
    explanation: "Rate = 125 docs / (5 clerks * 4 hrs) = 125 / 20 = 6.25 docs per clerk-hour. For 8 clerks in 6 hours: 8 * 6 * 6.25 = 48 * 6.25 = 300 documents.",
    subjectTitle: "Numerical Ability",
    chapter: "Word Problems",
    level: null,
  },
  {
    id: "seed_num_006",
    question: "An item originally priced at ₱2,400 is discounted by 25%. What is the final selling price?",
    choices: ["₱1,600", "₱1,800", "₱1,950", "₱2,000"],
    choiceIds: ["c_num_6_1", "c_num_6_2", "c_num_6_3", "c_num_6_4"],
    correctIndex: 1,
    explanation: "Discount = 0.25 * 2400 = ₱600. Final Price = 2400 - 600 = ₱1,800 (or 75% of 2400 = ₱1,800).",
    subjectTitle: "Numerical Ability",
    chapter: "Word Problems",
    level: null,
  },

  // =========================================================================
  // VERBAL ABILITY (Professional & Sub-Professional)
  // =========================================================================
  {
    id: "seed_verb_001",
    question: "Choose the word that best completes the sentence:\nNeither the department head nor the section supervisors _____ present during the preliminary briefing.",
    choices: ["was", "were", "is", "has been"],
    choiceIds: ["c_verb_1_1", "c_verb_1_2", "c_verb_1_3", "c_verb_1_4"],
    correctIndex: 1,
    explanation: "In 'neither... nor' constructions, the verb agrees in number with the nearer subject. 'Section supervisors' is plural, so 'were' is correct.",
    subjectTitle: "Verbal Ability",
    chapter: "Grammar & Correct Usage",
    level: null,
  },
  {
    id: "seed_verb_002",
    question: "Which of the following sentences is grammatically correct?",
    choices: [
      "The committee has submitted their final evaluation report yesterday.",
      "The committee submitted its final evaluation report yesterday.",
      "The committee submit its final evaluation report yesterday.",
      "The committee have submitted its final evaluation report yesterday."
    ],
    choiceIds: ["c_verb_2_1", "c_verb_2_2", "c_verb_2_3", "c_verb_2_4"],
    correctIndex: 1,
    explanation: "'The committee' is treated as a singular collective unit taking 'its', and the specific past time marker 'yesterday' requires simple past tense ('submitted') rather than present perfect.",
    subjectTitle: "Verbal Ability",
    chapter: "Grammar & Correct Usage",
    level: null,
  },
  {
    id: "seed_verb_003",
    question: "Choose the word most nearly opposite in meaning to EPHEMERAL:",
    choices: ["Transient", "Permanent", "Ethereal", "Superficial"],
    choiceIds: ["c_verb_3_1", "c_verb_3_2", "c_verb_3_3", "c_verb_3_4"],
    correctIndex: 1,
    explanation: "Ephemeral means lasting for a very short time (fleeting, transient). Its antonym is permanent (lasting indefinitely).",
    subjectTitle: "Verbal Ability",
    chapter: "Vocabulary & Word Association",
    level: null,
  },
  {
    id: "seed_verb_004",
    question: "Choose the word that best replaces the underlined term:\n'The agency implemented an EXIGENT measure to protect classified public records.'",
    choices: ["Optional", "Urgent", "Complacent", "Lax"],
    choiceIds: ["c_verb_4_1", "c_verb_4_2", "c_verb_4_3", "c_verb_4_4"],
    correctIndex: 1,
    explanation: "'Exigent' means pressing, demanding, or requiring immediate action (urgent).",
    subjectTitle: "Verbal Ability",
    chapter: "Vocabulary & Word Association",
    level: null,
  },
  {
    id: "seed_verb_005",
    question: "Arrange the sentences into a logical paragraph:\n1. As a result, public service delivery becomes faster and more transparent.\n2. Digital transformation in government begins with modernizing legacy records.\n3. Once records are digitized, departments can automate citizen service workflows.\n4. Citizens therefore experience fewer delays when requesting official documents.",
    choices: ["2-3-1-4", "3-2-4-1", "2-1-3-4", "1-4-2-3"],
    choiceIds: ["c_verb_5_1", "c_verb_5_2", "c_verb_5_3", "c_verb_5_4"],
    correctIndex: 0,
    explanation: "Sentence 2 introduces the primary premise (digitizing legacy records). Sentence 3 explains what follows (workflow automation). Sentence 1 states the institutional result (faster delivery), and sentence 4 concludes with the citizen impact.",
    subjectTitle: "Verbal Ability",
    chapter: "Paragraph Organization",
    level: null,
  },
  {
    id: "seed_verb_006",
    question: "Read the passage:\n'Public office is a public trust. Public officers and employees must at all times be accountable to the people, serve them with utmost responsibility, integrity, loyalty, and efficiency, act with patriotism and justice, and lead modest lives.'\n\nWhat is the central theme of the passage?",
    choices: [
      "Civil service tenure and retirement benefits",
      "Ethical standards and public accountability in government service",
      "Salary standardization for public employees",
      "Administrative procedures in public bidding"
    ],
    choiceIds: ["c_verb_6_1", "c_verb_6_2", "c_verb_6_3", "c_verb_6_4"],
    correctIndex: 1,
    explanation: "The passage (Article XI Section 1 of the 1987 Constitution) emphasizes accountability, integrity, and ethical conduct required of all public servants.",
    subjectTitle: "Verbal Ability",
    chapter: "Reading Comprehension",
    level: null,
  },

  // =========================================================================
  // GENERAL INFORMATION (Philippine Constitution, RA 6713, Environment)
  // =========================================================================
  {
    id: "seed_gen_001",
    question: "Under the 1987 Philippine Constitution, what is the maximum number of consecutive terms a member of the House of Representatives may serve?",
    choices: ["Two consecutive terms", "Three consecutive terms", "Four consecutive terms", "No term limit"],
    choiceIds: ["c_gen_1_1", "c_gen_1_2", "c_gen_1_3", "c_gen_1_4"],
    correctIndex: 1,
    explanation: "Article VI Section 7: Members of the House of Representatives are elected for a term of three years and cannot serve for more than three consecutive terms.",
    subjectTitle: "General Information",
    chapter: "Philippine Constitution",
    level: null,
  },
  {
    id: "seed_gen_002",
    question: "Which branch of the Philippine government has the sole power to declare the existence of a state of war?",
    choices: [
      "The President of the Philippines",
      "The Supreme Court of the Philippines",
      "The Congress of the Philippines",
      "The National Security Council"
    ],
    choiceIds: ["c_gen_2_1", "c_gen_2_2", "c_gen_2_3", "c_gen_2_4"],
    correctIndex: 2,
    explanation: "Article VI Section 23: The Congress, by a vote of two-thirds of both Houses in joint session voting separately, has the sole power to declare the existence of a state of war.",
    subjectTitle: "General Information",
    chapter: "Philippine Constitution",
    level: null,
  },
  {
    id: "seed_gen_003",
    question: "Under Republic Act No. 6713 (Code of Conduct and Ethical Standards for Public Officials and Employees), what is the statutory deadline for public officials to respond to letters and telegrams sent by the public?",
    choices: [
      "Within 5 working days from receipt",
      "Within 10 working days from receipt",
      "Within 15 working days from receipt",
      "Within 30 calendar days from receipt"
    ],
    choiceIds: ["c_gen_3_1", "c_gen_3_2", "c_gen_3_3", "c_gen_3_4"],
    correctIndex: 2,
    explanation: "Section 5(a) of RA 6713: All public officials and employees shall, within fifteen (15) working days from receipt, respond to letters, telegrams or other means of communications sent by the public.",
    subjectTitle: "General Information",
    chapter: "Code of Conduct & Ethical Standards (RA 6713)",
    level: null,
  },
  {
    id: "seed_gen_004",
    question: "Under RA 6713, within what period after assumption of office must a public official file their Statement of Assets, Liabilities, and Net Worth (SALN)?",
    choices: ["Within 15 days", "Within 30 days", "Within 60 days", "Within 90 days"],
    choiceIds: ["c_gen_4_1", "c_gen_4_2", "c_gen_4_3", "c_gen_4_4"],
    correctIndex: 1,
    explanation: "Section 8 of RA 6713 requires public officials to file their SALN within thirty (30) days after assumption of office, on or before April 30 of every year thereafter, and within thirty (30) days after separation from service.",
    subjectTitle: "General Information",
    chapter: "Code of Conduct & Ethical Standards (RA 6713)",
    level: null,
  },
  {
    id: "seed_gen_005",
    question: "Republic Act No. 9003 is formally known as which environmental law in the Philippines?",
    choices: [
      "Clean Air Act of 1999",
      "Ecological Solid Waste Management Act of 2000",
      "Philippine Clean Water Act of 2004",
      "Climate Change Act of 2009"
    ],
    choiceIds: ["c_gen_5_1", "c_gen_5_2", "c_gen_5_3", "c_gen_5_4"],
    correctIndex: 1,
    explanation: "Republic Act No. 9003 is the Ecological Solid Waste Management Act of 2000, establishing institutional mechanisms for waste reduction and recycling.",
    subjectTitle: "General Information",
    chapter: "Environment & Disasters",
    level: null,
  },
  {
    id: "seed_gen_006",
    question: "What international human rights document was adopted by the United Nations General Assembly on December 10, 1948?",
    choices: [
      "Geneva Convention",
      "Universal Declaration of Human Rights",
      "International Covenant on Civil and Political Rights",
      "Treaty of Versailles"
    ],
    choiceIds: ["c_gen_6_1", "c_gen_6_2", "c_gen_6_3", "c_gen_6_4"],
    correctIndex: 1,
    explanation: "The Universal Declaration of Human Rights (UDHR) was proclaimed by the United Nations General Assembly in Paris on December 10, 1948.",
    subjectTitle: "General Information",
    chapter: "Peace & Human Rights",
    level: null,
  },

  // =========================================================================
  // CLERICAL ABILITY (Sub-Professional Level)
  // =========================================================================
  {
    id: "seed_cler_001",
    question: "According to standard alphabetical filing rules, which name should be filed FIRST?",
    choices: [
      "De la Cruz, Antonio",
      "Dela Cruz, Ana",
      "Del Rosario, Ben",
      "De Leon, Carlos"
    ],
    choiceIds: ["c_cler_1_1", "c_cler_1_2", "c_cler_1_3", "c_cler_1_4"],
    correctIndex: 0,
    explanation: "In alphabetical filing, prefixes like 'De la', 'Dela', 'Del', 'De' are indexed letter by letter as written or unified. Comparing letters: 'De la Cruz, Antonio' precedes 'Dela Cruz, Ana' when spaced ('D-E-L-A C-R-U-Z, A-N-T' vs 'D-E-L-A C-R-U-Z, A-N-A': Ana precedes Antonio, so Dela Cruz, Ana precedes Dela Cruz, Antonio; but 'De la' as separate word files before 'De Leon').",
    subjectTitle: "Clerical Ability",
    chapter: "Alphabetical Filing",
    level: "sub",
  },
  {
    id: "seed_cler_002",
    question: "Which of the following correctly orders the names in standard filing order (Surname, Given Name)?\n1. Santos, Juan A.\n2. Santos, Juan B.\n3. Santo, Juan A.\n4. Santos, Juana A.",
    choices: [
      "3, 1, 2, 4",
      "1, 2, 3, 4",
      "3, 4, 1, 2",
      "4, 3, 1, 2"
    ],
    choiceIds: ["c_cler_2_1", "c_cler_2_2", "c_cler_2_3", "c_cler_2_4"],
    correctIndex: 0,
    explanation: "'Santo' (shorter word) precedes 'Santos'. Among 'Santos': 'Juan A.' precedes 'Juan B.', which precedes 'Juana A.'. Correct order: 3, 1, 2, 4.",
    subjectTitle: "Clerical Ability",
    chapter: "Alphabetical Filing",
    level: "sub",
  },
  {
    id: "seed_cler_003",
    question: "Choose the word with the CORRECT spelling:",
    choices: ["Accomodate", "Accommodate", "Acomodate", "Acommodate"],
    choiceIds: ["c_cler_3_1", "c_cler_3_2", "c_cler_3_3", "c_cler_3_4"],
    correctIndex: 1,
    explanation: "'Accommodate' is spelled with double 'c' and double 'm'.",
    subjectTitle: "Clerical Ability",
    chapter: "Spelling",
    level: "sub",
  },
  {
    id: "seed_cler_004",
    question: "Choose the word with the CORRECT spelling:",
    choices: ["Liaison", "Liason", "Liasion", "Laision"],
    choiceIds: ["c_cler_4_1", "c_cler_4_2", "c_cler_4_3", "c_cler_4_4"],
    correctIndex: 0,
    explanation: "'Liaison' is correctly spelled with an 'i' after 'l' and an 'i' after 'a' (L-I-A-I-S-O-N).",
    subjectTitle: "Clerical Ability",
    chapter: "Spelling",
    level: "sub",
  },
  {
    id: "seed_cler_005",
    question: "In government correspondence, what abbreviation is conventionally used to indicate that copies of a memorandum are furnished to other offices?",
    choices: ["Attn:", "CC:", "Ref:", "P.S."],
    choiceIds: ["c_cler_5_1", "c_cler_5_2", "c_cler_5_3", "c_cler_5_4"],
    correctIndex: 1,
    explanation: "'CC' (originally Carbon Copy, now Courtesy Copy) indicates recipients who are provided copies of the communication for information or action.",
    subjectTitle: "Clerical Ability",
    chapter: "Clerical Operations",
    level: "sub",
  },
  {
    id: "seed_cler_006",
    question: "When an official communication is addressed 'Thru Channels', it means the document must:",
    choices: [
      "Be transmitted strictly via electronic mail",
      "Pass through each intermediate supervisory authority in the chain of command",
      "Be published in the government gazette",
      "Be delivered directly to the department secretary without staff review"
    ],
    choiceIds: ["c_cler_6_1", "c_cler_6_2", "c_cler_6_3", "c_cler_6_4"],
    correctIndex: 1,
    explanation: "'Thru Channels' denotes adherence to hierarchical routing, requiring a document to be reviewed by each supervisory level along the administrative hierarchy.",
    subjectTitle: "Clerical Ability",
    chapter: "Clerical Operations",
    level: "sub",
  },
];
