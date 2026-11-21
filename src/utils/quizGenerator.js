const DOMAIN_PLAUSIBLE_STATEMENTS = {
  Mathematics: [
    'A scalar invariant that remains strictly constant under all non-linear coordinate transformations',
    'A sequence of discrete integers whose partial sums always diverge toward negative infinity',
    'A geometric locus defined exclusively by points equidistant from two orthogonal hyperplanes',
    'A theorem proving that every discontinuous function possesses a unique real-valued antiderivative',
    'An identity restricting polynomial roots strictly to even rational multiples of π',
    'A matrix factorization valid only when all off-diagonal entries equal strictly negative integers',
  ],
  'Computer Science': [
    'A greedy scheduling heuristic that executes processes strictly in reverse alphabetical order',
    'A stateless caching layer that discards all intermediate results after every single CPU cycle',
    'A deterministic protocol guaranteeing O(1) worst-case runtime for all NP-complete graph problems',
    'A memory-allocation policy that forbids concurrent threads from sharing read-only heap structures',
    'A compiler optimization that eliminates all conditional branches prior to lexical analysis',
    'A network routing scheme that broadcasts every packet to all nodes simultaneously without TTL limits',
  ],
  Physics: [
    'A conservation law stating that thermal energy spontaneously flows from colder bodies to hotter ones',
    'A relativistic effect that increases rest mass proportionally with inverse gravitational potential',
    'A wave interference condition requiring identical phase velocities across all dispersive media',
    'A classical approximation assuming instantaneous force transmission independent of separation distance',
    'A quantum boundary rule restricting all particles to strictly zero-point orbital angular momentum',
    'An equilibrium constraint where net entropy decreases monotonically inside an isolated system',
  ],
  Biology: [
    'An anaerobic cytoplasmic pathway that synthesizes starch directly from atmospheric nitrogen gas',
    'A passive transport mechanism moving large proteins exclusively against their concentration gradient without ATP',
    'A structural lipid bilayer unique to prokaryotic cell walls that prevents all osmotic water flow',
    'A ribosomal editing process that permanently converts somatic messenger RNA back into nuclear chromosomes',
    'A photosynthetic dark reaction occurring solely inside animal muscle fibers during rapid contraction',
    'A mitotic checkpoint that fuses sister chromatids together rather than separating them to opposite poles',
  ],
  Economics: [
    'A monetary policy rule where raising interest rates automatically causes consumer demand to rise infinitely',
    'A market equilibrium state in which marginal cost always exceeds price under perfect competition',
    'An elasticity condition where quantity demanded stays strictly zero regardless of price reductions',
    'A fiscal multiplier effect proving that sales taxes are always borne 100% by consumers regardless of supply',
    'A trade principle claiming comparative advantage requires absolute superiority in every single sector',
    'A pricing model where monopolists maximize profit exclusively on the completely inelastic demand segment',
  ],
  History: [
    'A purely diplomatic maritime treaty signed in Europe with no domestic political or military conflict',
    'An economic trade agreement negotiated peacefully between colonial guilds during the late twentieth century',
    'A localized municipal tax reform that ended within a single week without spreading beyond one port city',
    'A constitutional referendum passed unanimously by an elected parliament to unify regional currencies',
    'A brief succession dispute settled peacefully through arbitration before any armed mobilization occurred',
    'An industrial labor guild charter focused exclusively on standardizing railway gauges across provinces',
  ],
  Chemistry: [
    'An exothermic phase change that breaks covalent nuclear bonds without altering molecular orbital energy',
    'A catalytic equilibrium shift that permanently alters the Gibbs free energy difference between products and reactants',
    'An ionic reaction occurring exclusively in noble gases at absolute zero without electron transfer',
    'A stoichiometric law stating molar mass doubles whenever reaction pressure increases isothermally',
  ],
  'Vocabulary & Concepts': [
    'A strictly mandatory bare-minimum requirement needed merely for basic survival with no extra comfort',
    'A narrow technical measurement unit used only to calculate physical distance or structural load',
    'An outdated legal penalty imposed when an obligation is left unfulfilled beyond its deadline',
    'A neutral procedural step that removes all aesthetic quality or personal preference from a choice',
  ],
  'General Knowledge': [
    'A standardized baseline version designed strictly for minimal cost with no distinguishing upgrades',
    'A temporary regulatory classification applied only during emergency inspections or short-term audits',
    'An abstract theoretical model that has never been observed or applied in real-world practice',
    'A secondary byproduct that occurs only when the primary mechanism fails to operate as intended',
  ],
};

const DOMAIN_KEY_TERMS = {
  Mathematics: ['Determinant', 'Eigenvalue', 'Orthogonality', 'Gradient', 'Linearity', 'Convergence', 'Continuity', 'Vector Space'],
  'Computer Science': ['Recursion', 'Concurrency', 'Heuristic', 'Abstraction', 'Throughput', 'Latency', 'Backtracking', 'Memoization'],
  Physics: ['Entropy', 'Momentum', 'Superposition', 'Equilibrium', 'Resonance', 'Inertia', 'Potential', 'Radiation'],
  Biology: ['Homeostasis', 'Osmosis', 'Transcription', 'Metabolism', 'Catalysis', 'Symbiosis', 'Mitosis', 'Respiration'],
  Economics: ['Elasticity', 'Equilibrium', 'Inflation', 'Opportunity Cost', 'Utility', 'Monopoly', 'Surplus', 'Marginal Cost'],
  History: ['Sovereignty', 'Annexation', 'Rebellion', 'Treaty', 'Autonomy', 'Colonialism', 'Reform', 'Administration'],
  Chemistry: ['Catalyst', 'Equilibrium', 'Valence', 'Isotope', 'Enthalpy', 'Oxidation', 'Covalency', 'Molarity'],
  'Vocabulary & Concepts': ['Necessity', 'Austerity', 'Moderation', 'Utility', 'Simplicity', 'Scarcity', 'Standard', 'Pragmatism'],
  'General Knowledge': ['Baseline', 'Mechanism', 'Framework', 'Structure', 'Standard', 'Context', 'Principle', 'Outcome'],
};

function shuffleWithCorrect(options, correctIdx) {
  const tagged = options.map((text, idx) => ({ text, isCorrect: idx === correctIdx }));
  for (let i = tagged.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tagged[i], tagged[j]] = [tagged[j], tagged[i]];
  }
  return {
    options: tagged.map((t) => t.text),
    correctIndex: tagged.findIndex((t) => t.isCorrect),
  };
}

function getDomainDistractors(subject, count = 3, excludeText = '') {
  const pool =
    DOMAIN_PLAUSIBLE_STATEMENTS[subject] || DOMAIN_PLAUSIBLE_STATEMENTS['General Knowledge'];
  const filtered = pool.filter(
    (s) => !excludeText || !excludeText.toLowerCase().includes(s.slice(0, 20).toLowerCase())
  );
  const copy = [...filtered];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function getDomainTerms(subject, excludeWords = []) {
  const pool = DOMAIN_KEY_TERMS[subject] || DOMAIN_KEY_TERMS['General Knowledge'];
  const lowerEx = new Set(excludeWords.map((w) => w.toLowerCase()));
  return pool.filter((w) => !lowerEx.has(w.toLowerCase()));
}

function trimSentence(str, maxLen = 155) {
  if (!str) return '';
  const clean = str.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const idx = cut.lastIndexOf(' ');
  return `${(idx > 90 ? cut.slice(0, idx) : cut).trim()}…`;
}

/**
 * Generates a challenging, same-domain MCQ set matching the user's chosen:
 * - difficulty: 'eli5' | 'highschool' | 'undergrad' | 'deepdive' | 'mixed'
 * - count: number of questions (3, 5, 8, 10)
 */
export function buildAdaptiveQuizSet(topic, difficulty = 'mixed', count = 5) {
  const subject = topic.subject || 'General Knowledge';
  const lvlKey = difficulty === 'mixed' ? 'highschool' : difficulty;
  const lvlData = topic.levels?.[lvlKey] || topic.levels?.highschool || topic.levels?.eli5;
  const allLevels = ['eli5', 'highschool', 'undergrad', 'deepdive'];

  const pool = [];
  const usedQuestions = new Set();

  const pushUnique = (qObj) => {
    const sig = qObj.question.toLowerCase().slice(0, 65);
    if (usedQuestions.has(sig)) return;
    // Guarantee all 4 options are distinct (no near-duplicate choices)
    const uniqueOpts = new Set(qObj.options.map((o) => o.toLowerCase().slice(0, 50)));
    if (uniqueOpts.size < 4) return;
    usedQuestions.add(sig);
    // Shuffle options so the correct choice isn't predictable
    const shuffled = shuffleWithCorrect(qObj.options, qObj.correctIndex);
    pool.push({
      ...qObj,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
    });
  };

  // 1. Prioritize handcrafted curated questions from the topic (filter out any old off-domain giveaway questions)
  const rawCurated = (topic.quiz || []).filter((q) => {
    const optsJoined = (q.options || []).join(' ').toLowerCase();
    // Skip legacy generic off-subject distractors if present on cached objects
    return !optsJoined.includes('encrypted email packets') && !optsJoined.includes('microprocessor caches');
  });

  const sortedCurated = [...rawCurated].sort((a, b) => {
    if (difficulty === 'mixed') return 0;
    const aMatch = a.level === difficulty ? 0 : 1;
    const bMatch = b.level === difficulty ? 0 : 1;
    return aMatch - bMatch;
  });

  sortedCurated.forEach((q) => pushUnique(q));

  // 2. Concept Map Role-Matching Questions (uses the topic's OWN sibling nodes as options — 100% same-topic & genuinely challenging!)
  const nodes = topic.conceptMap?.nodes || [];
  if (nodes.length >= 4) {
    nodes.forEach((targetNode, idx) => {
      if (!targetNode.detail || targetNode.detail.length < 22) return;
      const otherNodes = nodes.filter((_, j) => j !== idx).slice(0, 3);
      if (otherNodes.length < 3) return;

      pushUnique({
        level: idx % 2 === 0 ? 'highschool' : 'undergrad',
        question: `Within "${topic.title}", which key component or pillar is best described as: "${trimSentence(targetNode.detail, 130)}"?`,
        options: [targetNode.label, ...otherNodes.map((n) => n.label)],
        correctIndex: 0,
        hint: `Think about the role labeled "${targetNode.role}" in the ${topic.title} Concept Map.`,
        explanation: `${targetNode.label} (${targetNode.role}): ${targetNode.detail}`,
      });
    });
  }

  // 3. Common Misconception Trap Question (high-yield exam style!)
  if (lvlData?.commonMistake && lvlData?.steps?.length >= 2) {
    const trueStatements = [
      trimSentence(lvlData.steps[0].detail, 145),
      trimSentence(lvlData.steps[1].detail, 145),
      trimSentence(lvlData.summary, 145),
    ];
    pushUnique({
      level: difficulty === 'mixed' ? 'deepdive' : lvlKey,
      question: `Exam Trap Check: Which statement represents a COMMON MISCONCEPTION about "${topic.title}" that you should avoid?`,
      options: [trimSentence(lvlData.commonMistake, 150), ...trueStatements],
      correctIndex: 0,
      hint: `Three of these statements accurately describe ${topic.title}; spot the one mistake students frequently make.`,
      explanation: `Common misconception to avoid: ${lvlData.commonMistake}`,
    });
  }

  // 4. Same-Domain Definition & Core Principle Question
  if (lvlData?.summary) {
    const distractors = getDomainDistractors(subject, 3, lvlData.summary);
    pushUnique({
      level: difficulty === 'mixed' ? 'eli5' : lvlKey,
      question: `Which ${subject} statement most accurately defines "${topic.title}"?`,
      options: [trimSentence(lvlData.summary, 155), ...distractors],
      correctIndex: 0,
      hint: `Focus on the core ${subject} mechanism of ${topic.title} rather than look-alike ${subject} statements.`,
      explanation: lvlData.summary,
    });
  }

  // 5. Step-by-Step Identification Questions across difficulty levels
  allLevels.forEach((lk) => {
    const ld = topic.levels?.[lk];
    if (!ld?.steps?.length) return;
    ld.steps.forEach((step) => {
      if (!step.detail || step.detail.length < 30 || pool.length >= count + 6) return;
      const distractors = getDomainDistractors(subject, 3, step.detail);
      const cleanStepTitle = step.title.replace(/^\d+\.\s*/, '');
      pushUnique({
        level: lk,
        question: `When breaking down "${topic.title}", which statement accurately explains "${cleanStepTitle}"?`,
        options: [trimSentence(step.detail, 155), ...distractors],
        correctIndex: 0,
        hint: `Recall how "${cleanStepTitle}" fits into the step-by-step flow of ${topic.title}.`,
        explanation: `${cleanStepTitle}: ${step.detail}`,
      });
    });
  });

  // 6. Cloze / Fill-in-the-Blank Key Term Questions extracted from flashcards & steps
  const flashcards = topic.flashcards || [];
  flashcards.forEach((fc) => {
    if (pool.length >= count + 6 || !fc.front || !fc.back) return;
    const distractors = getDomainDistractors(subject, 3, fc.back);
    pushUnique({
      level: 'highschool',
      question: fc.front.endsWith('?') ? fc.front : `Active Recall (${topic.title}): ${fc.front}`,
      options: [trimSentence(fc.back, 150), ...distractors],
      correctIndex: 0,
      hint: fc.mnemonic || `Think carefully about the exact role inside ${topic.title}.`,
      explanation: `${fc.back}${fc.mnemonic ? ` (Memory anchor: ${fc.mnemonic})` : ''}`,
    });
  });

  // 7. Cloze blank-word check if still needing more questions for 8 or 10 question quizzes
  if (pool.length < count && lvlData?.summary) {
    const candidateTerms = (lvlData.summary.match(/\b[A-Z][a-z]{4,}\b|\b[a-z]{7,}\b/g) || [])
      .filter((w) => !['because', 'through', 'between', 'however', 'whereas', 'without', 'actually', 'usually'].includes(w.toLowerCase()));
    const uniqueTerms = [...new Set(candidateTerms)].slice(0, 4);
    uniqueTerms.forEach((term) => {
      if (pool.length >= count) return;
      const blanked = lvlData.summary.replace(new RegExp(`\\b${term}\\b`, 'i'), '________');
      if (blanked === lvlData.summary) return;
      const otherTerms = getDomainTerms(subject, [term]).slice(0, 3);
      if (otherTerms.length < 3) return;
      pushUnique({
        level: lvlKey,
        question: `Fill in the missing ${subject} term for "${topic.title}": "${trimSentence(blanked, 165)}"`,
        options: [term, ...otherTerms],
        correctIndex: 0,
        hint: `Which term completes the exact definition of ${topic.title}?`,
        explanation: `The missing term is "${term}": ${trimSentence(lvlData.summary, 180)}`,
      });
    });
  }

  // Prioritize questions matching the selected difficulty first, then fill to requested count
  const prioritized =
    difficulty === 'mixed'
      ? pool
      : [
          ...pool.filter((q) => q.level === difficulty),
          ...pool.filter((q) => q.level !== difficulty),
        ];

  return prioritized.slice(0, count);
}

/**
 * Generates an adaptive flashcard deck matching:
 * - mode: 'exam' (Exam Perspective — High-Yield Exam POV + clearly labeled "Not from Exam POV / Just for Knowledge" bonus cards)
 *       | 'revision' (Quick Revision — rapid-fire recall, 1-line summaries, step checks & mnemonics)
 * - count: desired number of cards (e.g. 3, 5, 8, 10, up to 15)
 */
export function buildAdaptiveFlashcardDeck(topic, mode = 'exam', count = 5) {
  const deck = [];
  const seenFronts = new Set();

  const addCard = (card) => {
    const sig = (card.front || '').toLowerCase().slice(0, 55);
    if (!sig || seenFronts.has(sig)) return;
    seenFronts.add(sig);
    deck.push({
      id: `${topic.id}-${mode}-fc-${deck.length}`,
      ...card,
    });
  };

  const eli5 = topic.levels?.eli5;
  const hs = topic.levels?.highschool;
  const ug = topic.levels?.undergrad;
  const deep = topic.levels?.deepdive;
  const nodes = topic.conceptMap?.nodes || [];
  const curatedCards = topic.flashcards || [];

  if (mode === 'exam') {
    // 1. High-Yield Exam Formula / Golden Rule
    if (ug?.formulaOrRule || hs?.formulaOrRule) {
      addCard({
        front: `State the core rule / formula examiners test for "${topic.title}".`,
        back: ug?.formulaOrRule || hs?.formulaOrRule,
        mnemonic: `Verify every symbol/condition before applying it on an exam.`,
        badge: 'High-Yield · Exam POV',
        badgeType: 'exam-high',
        povNote: 'Frequently tested directly in short-answer & MCQ questions.',
      });
    }

    // 2. #1 Exam Trap / Common Misconception
    if (deep?.commonMistake || ug?.commonMistake || hs?.commonMistake) {
      const trap = deep?.commonMistake || ug?.commonMistake || hs?.commonMistake;
      addCard({
        front: `Exam Trap Alert: What common mistake costs students marks on "${topic.title}"?`,
        back: trap,
        mnemonic: `Spot this trap immediately when reading tricky exam stems!`,
        badge: 'Exam Trap · High-Yield',
        badgeType: 'exam-trap',
        povNote: 'High-probability distractor on university & competitive exams.',
      });
    }

    // 3. Formal Exam Definition (3-Mark Answer)
    if (ug?.summary || hs?.summary) {
      addCard({
        front: `Write a crisp exam-ready definition of "${topic.title}" (2–3 marks).`,
        back: trimSentence(ug?.summary || hs?.summary, 240),
        mnemonic: hs?.headline || `Include the core mechanism + domain context for full credit.`,
        badge: 'High-Yield · Exam POV',
        badgeType: 'exam-high',
        povNote: 'Core definition expected in written & oral exams.',
      });
    }

    // 4. Curated Topic Flashcards (High-Yield)
    curatedCards.forEach((fc) => {
      addCard({
        front: fc.front,
        back: fc.back,
        mnemonic: fc.mnemonic || 'High-yield exam recall point.',
        badge: 'High-Yield · Exam POV',
        badgeType: 'exam-high',
        povNote: 'Important core concept from the syllabus.',
      });
    });

    // 5. Key Syllabus Pillars from Concept Map
    nodes.forEach((n, idx) => {
      addCard({
        front: `Exam Short Note: Explain the exact role of "${n.label}" in ${topic.title}.`,
        back: `${n.role}: ${n.detail}`,
        mnemonic: `Link "${n.label}" directly to "${topic.title}" when structuring long answers.`,
        badge: idx < 3 ? 'High-Yield · Exam POV' : 'Medium Priority · Exam POV',
        badgeType: idx < 3 ? 'exam-high' : 'exam-med',
        povNote: idx < 3 ? 'Core pillar frequently asked in structured questions.' : 'Good supporting point for full-mark essays.',
      });
    });

    // 6. Step-by-Step Mechanism Checks (Undergrad / Deep Dive)
    (ug?.steps || hs?.steps || []).forEach((st) => {
      const cleanTitle = st.title.replace(/^\d+\.\s*/, '');
      addCard({
        front: `In an exam breakdown of "${topic.title}", what happens during "${cleanTitle}"?`,
        back: st.detail,
        mnemonic: `Key stage to mention in sequence.`,
        badge: 'High-Yield · Exam POV',
        badgeType: 'exam-high',
        povNote: 'Important procedural/analytical step for exams.',
      });
    });

    // 7. Explicitly Labeled "Not from Exam POV · Just for Knowledge" Enrichment Cards!
    if (eli5?.analogy) {
      addCard({
        front: `Intuition Check: How can you visualize "${topic.title}" using an everyday analogy?`,
        back: eli5.analogy,
        mnemonic: 'Great for deep understanding — use formal terms when writing exam answers.',
        badge: 'Just for Knowledge · Not Exam POV',
        badgeType: 'knowledge-only',
        povNote: 'Not from exam POV — included purely to strengthen real-world intuition.',
      });
    }

    if (hs?.analogy && hs.analogy !== eli5?.analogy) {
      addCard({
        front: `Extra Enrichment: What real-world comparison illustrates "${topic.title}"?`,
        back: hs.analogy,
        mnemonic: 'Background intuition card — optional for exam cramming.',
        badge: 'Just for Knowledge · Not Exam POV',
        badgeType: 'knowledge-only',
        povNote: 'Not from exam POV — extra background context for curiosity.',
      });
    }

    if (deep?.headline && deep?.summary) {
      addCard({
        front: `Beyond-the-Syllabus Deep Context: What advanced perspective connects to "${topic.title}"?`,
        back: `${deep.headline} — ${trimSentence(deep.summary, 200)}`,
        mnemonic: 'Useful for bonus viva / interview questions.',
        badge: 'Just for Knowledge · Not Exam POV',
        badgeType: 'knowledge-only',
        povNote: 'Not typically required for standard exams — great for interviews & deeper mastery.',
      });
    }

    // Ensure at least 1 clearly labeled "Just for Knowledge" card appears when user asks for >= 5 cards
    // so they always see the exam-vs-knowledge distinction in action!
    const examCards = deck.filter((c) => c.badgeType !== 'knowledge-only');
    const bonusCards = deck.filter((c) => c.badgeType === 'knowledge-only');

    if (count >= 5 && bonusCards.length > 0) {
      const examSlice = examCards.slice(0, Math.max(1, count - 1));
      const combined = [...examSlice, bonusCards[0]];
      let extraIdx = 1;
      while (combined.length < count && extraIdx < bonusCards.length) {
        combined.push(bonusCards[extraIdx++]);
      }
      return combined.slice(0, count);
    }

    return [...examCards, ...bonusCards].slice(0, count);
  }

  // REVISION MODE: Rapid-fire active recall, 1-line summaries, step checks & memory anchors!
  if (eli5?.headline || eli5?.summary) {
    addCard({
      front: `1-Line Revision: Summarize "${topic.title}" in plain English.`,
      back: `${eli5.headline}. ${trimSentence(eli5.summary, 185)}`,
      mnemonic: `Quick Cue: ${eli5.formulaOrRule || hs?.formulaOrRule || topic.title}`,
      badge: '1-Line Revision',
      badgeType: 'rev-quick',
      povNote: 'Fast mental refresh to reactivate the big picture.',
    });
  }

  // Rapid Memory Anchors from curated cards
  curatedCards.forEach((fc) => {
    addCard({
      front: `Quick Recall: ${fc.front}`,
      back: fc.back,
      mnemonic: fc.mnemonic || 'Say this aloud once to lock it in!',
      badge: 'Active Recall',
      badgeType: 'rev-recall',
      povNote: 'Spaced-repetition recall drill.',
    });
  });

  // Rapid Step-by-Step Revision Cards
  (hs?.steps || eli5?.steps || []).forEach((st, i) => {
    const cleanTitle = st.title.replace(/^\d+\.\s*/, '');
    addCard({
      front: `Step ${i + 1} Check (${topic.title}): What is "${cleanTitle}"?`,
      back: trimSentence(st.detail, 200),
      mnemonic: `Step ${i + 1} of ${(hs?.steps || eli5?.steps || []).length}`,
      badge: 'Step Revision',
      badgeType: 'rev-step',
      povNote: 'Verifies you remember the logical flow in order.',
    });
  });

  // Analogy Anchor for fast retention
  if (eli5?.analogy || hs?.analogy) {
    addCard({
      front: `Memory Hook: Recall the everyday analogy for "${topic.title}".`,
      back: eli5?.analogy || hs?.analogy,
      mnemonic: 'Visual hooks stick 3× longer during revision.',
      badge: 'Memory Anchor',
      badgeType: 'rev-anchor',
      povNote: 'Associative memory trigger for quick recall.',
    });
  }

  // Concept Map Rapid Flash Checks
  nodes.forEach((n) => {
    addCard({
      front: `Rapid Term Check: In ${topic.title}, what does "${n.label}" do?`,
      back: `${n.role} — ${trimSentence(n.detail, 175)}`,
      mnemonic: `Role tag: ${n.role}`,
      badge: 'Concept Map Drill',
      badgeType: 'rev-recall',
      povNote: 'Quick term-to-role revision check.',
    });
  });

  // Formula / Key Rule Flash Check
  if (hs?.formulaOrRule || ug?.formulaOrRule) {
    addCard({
      front: `Formula / Rule Flash Check for "${topic.title}"`,
      back: hs?.formulaOrRule || ug?.formulaOrRule,
      mnemonic: 'Close your eyes and recite this once before flipping back!',
      badge: 'Rule Refresh',
      badgeType: 'rev-quick',
      povNote: 'High-speed rule recall.',
    });
  }

  // Misconception Quick Guard
  if (hs?.commonMistake) {
    addCard({
      front: `Quick Check: What mistake should you NOT repeat on "${topic.title}"?`,
      back: hs.commonMistake,
      mnemonic: 'Catch & correct during revision so it never slips on test day.',
      badge: 'Mistake Guard',
      badgeType: 'rev-step',
      povNote: 'Prevents repeating classic slip-ups.',
    });
  }

  return deck.slice(0, count);
}
