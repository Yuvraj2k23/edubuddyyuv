import { LEVELS, TOPICS, generateCustomTopic } from '../data/knowledgeBase.js';
import { sanitizeExternalUrl, sanitizeUserText } from './security.js';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Cleans natural-language student questions like:
 * "what is mitochondria?" -> "mitochondria"
 * "explain me the revolt of 1857 in one paragraph" -> "revolt of 1857"
 */
export function cleanAcademicQuery(raw) {
  const safeRaw = sanitizeUserText(raw, 400);
  if (!safeRaw) return '';
  let text = safeRaw;

  const prefixPattern =
    /^(hey\s+|hi\s+|bro\s+|please\s+|pls\s+|can\s+you\s+|could\s+you\s+|would\s+you\s+|what\s+is\s+(an?|the)\s+|what\s+is\s+|what\s+are\s+(the\s+)?|who\s+is\s+|who\s+was\s+|who\s+were\s+|explain\s+(to\s+)?(me\s+)?(about\s+)?(the\s+)?|define\s+(the\s+)?|tell\s+me\s+(about\s+)?(the\s+)?|write\s+(a\s+)?(short\s+)?(paragraph|note|summary|essay)\s+(on|about)\s+(the\s+)?|summarize\s+(the\s+)?|give\s+me\s+(a\s+)?(brief\s+|short\s+)?(summary|explanation|overview|definition)\s+(of|on|about)\s+(the\s+)?|how\s+does\s+(an?|the\s+)?|how\s+do\s+(the\s+)?|why\s+did\s+(the\s+)?|meaning\s+of\s+(the\s+)?|describe\s+(the\s+)?)/i;

  for (let i = 0; i < 4; i++) {
    const next = text.replace(prefixPattern, '').trim();
    if (next === text) break;
    text = next;
  }

  const suffixPattern =
    /\s+(in\s+(one|1|a|two|2|few|short|simple|brief|easy|plain)?\s*(paragraph|paragraphs|para|line|lines|sentence|sentences|words|terms|points|bullets|detail|details|short|brief)|briefly|simply|step\s+by\s+step|for\s+(kids|beginners|exam|exams|school|me)|like\s+(i'?m|i\s+am)\s+(a\s+)?\d+(\s+year\s+old|\s+yr\s+old)?|as\s+if\s+i'?m\s+\d+|work|works|mean|means|please|pls)\??$/i;

  for (let i = 0; i < 4; i++) {
    const next = text.replace(suffixPattern, '').trim();
    if (next === text) break;
    text = next;
  }

  return text.replace(/[?!.]+$/g, '').trim();
}

/**
 * Fetches exact lexical definitions, parts of speech, examples, synonyms & antonyms
 * from the Free Dictionary API (CORS-enabled, zero API key) for 1–2 word English concepts like "luxury", "empathy", "irony".
 */
async function fetchDictionaryDefinition(term) {
  const clean = term.trim().toLowerCase();
  if (!clean || clean.split(/\s+/).length > 2 || /[^a-z\s-]/.test(clean)) return null;
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry?.meanings?.length) return null;

    const phonetic =
      entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || '';
    const meanings = entry.meanings.map((m) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: (m.definitions || []).slice(0, 3).map((d) => ({
        definition: d.definition,
        example: d.example || '',
      })),
      synonyms: (m.synonyms || []).slice(0, 5),
      antonyms: (m.antonyms || []).slice(0, 5),
    }));

    const allSynonyms = [...new Set(meanings.flatMap((m) => m.synonyms))].slice(0, 6);
    const allAntonyms = [...new Set(meanings.flatMap((m) => m.antonyms))].slice(0, 6);
    const primaryDef = meanings[0]?.definitions?.[0]?.definition || '';
    const secondaryDef =
      meanings[0]?.definitions?.[1]?.definition ||
      meanings[1]?.definitions?.[0]?.definition ||
      '';
    const example =
      meanings.flatMap((m) => m.definitions).find((d) => d.example)?.example || '';

    return {
      word: entry.word.charAt(0).toUpperCase() + entry.word.slice(1),
      phonetic,
      meanings,
      primaryDef,
      secondaryDef,
      example,
      synonyms: allSynonyms,
      antonyms: allAntonyms,
    };
  } catch {
    return null;
  }
}

function isDisambiguationContent(summaryJson, fullText = '') {
  if (summaryJson?.type === 'disambiguation') return true;
  const desc = (summaryJson?.description || '').toLowerCase();
  if (desc.includes('topics referred to by the same term') || desc.includes('disambiguation')) {
    return true;
  }
  const head = (fullText || summaryJson?.extract || '').slice(0, 180).toLowerCase();
  if (/\bmay refer to:|\bcan refer to:|\bcommonly refers to:/.test(head)) return true;
  return false;
}

/**
 * Scores Wikipedia search candidates so exact concepts ("Luxury" -> "Luxury goods")
 * NEVER lose to narrow unrelated compound titles like "Luxury apartment", "ISG Luxury Management", or disambiguation pages.
 */
function rankWikiCandidates(results, query) {
  if (!results?.length) return [];
  const qLower = query.toLowerCase().trim();
  const qWords = qLower.split(/\s+/).filter(Boolean);

  const narrowNoise =
    /\b(apartment|apartments|hotel|hotels|car|cars|film|movie|song|album|band|tv series|episode|novel|video game|magazine|newspaper|brand|shopping|mall|resort|yacht|watch|management|school|college|university|company|inc\.|corp\.|airline)\b/i;

  const scored = results.map((hit, idx) => {
    const tLower = hit.title.toLowerCase();
    const snippetLower = (hit.snippet || '').toLowerCase();
    let score = 50 - idx * 6;

    // Strongly penalize disambiguation pages detected via title or snippet!
    if (
      /\(disambiguation\)/i.test(tLower) ||
      /\bmay refer to\b|\bcan refer to\b/.test(snippetLower)
    ) {
      score -= 1200;
    }

    if (tLower === qLower) score += 1000;
    else if (tLower === `${qLower}s` || tLower === `${qLower}es`) score += 700;
    else if (tLower.startsWith(`${qLower} (`) && !/\(disambiguation\)|\(film\)|\(song\)|\(album\)|\(band\)/i.test(tLower)) {
      score += 450;
    } else if (tLower.startsWith(`${qLower} `)) {
      const extraPart = tLower.slice(qLower.length + 1);
      if (/\b(goods|economics|concept|theory|principle|law|effect|system|process|cycle)\b/i.test(extraPart)) {
        score += 260;
      } else if (narrowNoise.test(extraPart) && !narrowNoise.test(qLower)) {
        score -= 550;
      } else {
        score -= 90;
      }
    } else if (qWords.length === 1 && !tLower.startsWith(qLower)) {
      // For a single-word query like "luxury", penalize random multi-word articles that just mention it mid-title like "ISG Luxury Management"
      score -= 320;
    }

    if (narrowNoise.test(tLower) && !narrowNoise.test(qLower)) score -= 450;
    if (qWords.every((w) => tLower.includes(w))) score += 80;

    return { hit, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > -120).map((s) => s.hit);
}

/**
 * Fetches an article from either English Wikipedia ('en') or Simple English Wikipedia ('simple').
 * Tries exact page title FIRST before ranked search, and skips disambiguation pages automatically!
 */
async function fetchWikiEdition(rawQuery, lang = 'en') {
  const cleaned = cleanAcademicQuery(rawQuery) || rawQuery.trim();
  if (!cleaned) return null;

  const base = `https://${lang}.wikipedia.org`;

  async function tryExactSummary(term) {
    try {
      const formatted = term.charAt(0).toUpperCase() + term.slice(1);
      const res = await fetch(
        `${base}/api/rest_v1/page/summary/${encodeURIComponent(formatted.replace(/ /g, '_'))}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      if (isDisambiguationContent(json) || !json?.extract || json.extract.length < 45) {
        return null;
      }
      return json;
    } catch {
      return null;
    }
  }

  async function searchWikiRankedList(term) {
    const url = `${base}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      term
    )}&srlimit=8&utf8=1&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.query?.search || [];
    return rankWikiCandidates(results, term);
  }

  try {
    let exactSummary = await tryExactSummary(cleaned);
    let canonicalTitle = exactSummary?.title || null;

    if (!canonicalTitle) {
      let candidates = await searchWikiRankedList(cleaned);
      if (candidates.length === 0) {
        const filler = new Set([
          'explain', 'me', 'the', 'what', 'is', 'are', 'about', 'in', 'one', 'two',
          'paragraph', 'short', 'brief', 'briefly', 'simple', 'words', 'lines', 'please',
          'tell', 'write', 'summary', 'summarize', 'define', 'how', 'does', 'do', 'for',
        ]);
        const fallbackKeywords = cleaned
          .split(/\s+/)
          .filter((w) => w.length > 1 && !filler.has(w.toLowerCase()))
          .join(' ');
        if (fallbackKeywords && fallbackKeywords !== cleaned) {
          candidates = await searchWikiRankedList(fallbackKeywords);
        }
      }

      // Inspect top ranked candidates and skip any disambiguation page!
      for (const cand of candidates.slice(0, 3)) {
        const candSum = await tryExactSummary(cand.title);
        if (candSum) {
          exactSummary = candSum;
          canonicalTitle = candSum.title;
          break;
        }
      }
      if (!canonicalTitle) return null;
    }

    const [extractRes, sectionsRes] = await Promise.all([
      fetch(
        `${base}/w/api.php?action=query&prop=extracts&explaintext=1&exchars=3200&titles=${encodeURIComponent(
          canonicalTitle
        )}&redirects=1&format=json&origin=*`
      ).catch(() => null),
      lang === 'en'
        ? fetch(
            `${base}/w/api.php?action=parse&page=${encodeURIComponent(
              canonicalTitle
            )}&prop=sections&format=json&origin=*`
          ).catch(() => null)
        : Promise.resolve(null),
    ]);

    const summaryJson = exactSummary;
    const extractJson = extractRes && extractRes.ok ? await extractRes.json() : null;
    const sectionsJson = sectionsRes && sectionsRes.ok ? await sectionsRes.json() : null;

    const pages = extractJson?.query?.pages || {};
    const pageObj = Object.values(pages)[0];
    const fullText = pageObj?.extract || summaryJson?.extract || '';
    if (!fullText || fullText.length < 40 || isDisambiguationContent(summaryJson, fullText)) {
      return null;
    }

    const paragraphs = fullText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40 && !p.startsWith('=='));

    const sentences = paragraphs
      .join(' ')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 22 && !s.startsWith('=='));

    const skipSections = /^(see also|references|external links|further reading|notes|bibliography|history of|gallery|citations|sources)/i;
    const sections = (sectionsJson?.parse?.sections || [])
      .filter((sec) => sec.toclevel === 1 && !skipSections.test(sec.line))
      .map((sec) => ({
        title: sec.line.replace(/<[^>]+>/g, '').trim(),
        index: sec.index,
      }))
      .slice(0, 5);

    return {
      lang,
      title: summaryJson?.title || canonicalTitle,
      canonicalTitle,
      description: summaryJson?.description || '',
      intro: summaryJson?.extract || paragraphs[0] || sentences.slice(0, 3).join(' '),
      paragraphs,
      sentences,
      sections,
      wikiUrl:
        summaryJson?.content_urls?.desktop?.page ||
        `${base}/wiki/${encodeURIComponent(canonicalTitle.replace(/ /g, '_'))}`,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches the REAL text of a specific Wikipedia section when a student clicks a Concept Map node
 * (e.g. "Background", "Causes", "Onset", "Mechanism", "Structure").
 */
export async function fetchWikiSectionDetail(pageTitle, sectionIndex, sectionName) {
  if (!pageTitle || !sectionIndex) return null;
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
      pageTitle
    )}&section=${encodeURIComponent(sectionIndex)}&prop=text&disabletoc=1&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const html = data?.parse?.text?.['*'];
    if (!html) return null;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Remove tables, infoboxes, citations, scripts, edit buttons, hatnotes, figures
    doc
      .querySelectorAll('table, sup, .mw-editsection, .hatnote, .thumb, figure, style, script, .shortdescription, .navbox')
      .forEach((el) => el.remove());

    const pTexts = Array.from(doc.querySelectorAll('p'))
      .map((p) => p.textContent.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim())
      .filter((t) => t.length > 45);

    if (pTexts.length === 0) return null;

    const combined = pTexts.slice(0, 2).join(' ');
    const sentences = combined
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const summary = sentences.slice(0, 4).join(' ');
    return summary || pTexts[0].slice(0, 520);
  } catch {
    return null;
  }
}

/**
 * Fetches real peer-reviewed academic papers from OpenAlex (free, zero API key, CORS-enabled).
 */
async function fetchOpenAlexPapers(rawQuery) {
  const cleaned = cleanAcademicQuery(rawQuery) || rawQuery.trim();
  if (!cleaned) return [];
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(
      cleaned
    )}&per-page=3&sort=cited_by_count:desc&select=id,title,publication_year,cited_by_count,primary_location`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results || [])
      .filter((w) => w.title)
      .map((w) => ({
        title: w.title,
        year: w.publication_year,
        citations: w.cited_by_count,
        url: w.primary_location?.landing_page_url || w.id,
        site: `OpenAlex Paper (${w.publication_year || 'Academic'})`,
      }));
  } catch {
    return [];
  }
}

/**
 * Queries MULTIPLE open web knowledge sources IN PARALLEL:
 * Dictionary API (exact lexical word senses, synonyms, antonyms) + Simple Wikipedia + Full Wikipedia + OpenAlex Academic Papers.
 */
export async function searchMultiWebSources(rawQuery) {
  const cleaned = cleanAcademicQuery(rawQuery) || rawQuery.trim();
  const [dictionary, enWiki, simpleWiki, papers] = await Promise.all([
    fetchDictionaryDefinition(cleaned),
    fetchWikiEdition(cleaned, 'en'),
    fetchWikiEdition(cleaned, 'simple'),
    fetchOpenAlexPapers(cleaned),
  ]);

  const webSources = [];
  if (dictionary) {
    webSources.push({
      site: 'English Dictionary',
      title: `${dictionary.word}${dictionary.phonetic ? ` ${dictionary.phonetic}` : ''}`,
      url: `https://en.wiktionary.org/wiki/${encodeURIComponent(dictionary.word.toLowerCase())}`,
      snippet: dictionary.primaryDef,
    });
  }
  if (enWiki) {
    webSources.push({
      site: 'Wikipedia Encyclopedia',
      title: enWiki.title,
      url: sanitizeExternalUrl(enWiki.wikiUrl),
      snippet: enWiki.sentences[0] || enWiki.intro.slice(0, 140),
    });
  }
  if (simpleWiki) {
    webSources.push({
      site: 'Simple English Wiki (ELI5)',
      title: simpleWiki.title,
      url: sanitizeExternalUrl(simpleWiki.wikiUrl),
      snippet: simpleWiki.sentences[0] || simpleWiki.intro.slice(0, 140),
    });
  }
  papers.slice(0, 2).forEach((p) => {
    const safePaperUrl = sanitizeExternalUrl(p.url);
    if (!safePaperUrl) return;
    webSources.push({
      site: p.site,
      title: p.title.length > 68 ? `${p.title.slice(0, 67)}…` : p.title,
      url: safePaperUrl,
      snippet: p.citations ? `Cited ${p.citations.toLocaleString()} times` : 'Peer-reviewed study',
    });
  });

  return { cleaned, dictionary, enWiki, simpleWiki, papers, webSources };
}

export function buildCompareLinks(queryText) {
  const q = encodeURIComponent(queryText.trim());
  return [
    { name: 'ChatGPT', url: `https://chatgpt.com/?q=${q}`, color: '#10a37f' },
    { name: 'Claude', url: `https://claude.ai/new?q=${q}`, color: '#d97757' },
    { name: 'Perplexity', url: `https://www.perplexity.ai/search?q=${q}`, color: '#20808d' },
    { name: 'Gemini', url: `https://gemini.google.com/app`, color: '#4285f4' },
    { name: 'Google Web', url: `https://www.google.com/search?q=${q}`, color: '#6366f1' },
  ];
}

function guessSubject(title, description, text) {
  const blob = `${title} ${description} ${text.slice(0, 400)}`.toLowerCase();
  if (/\b(rebellion|revolt|war|empire|revolution|dynasty|treaty|independence|colonial|mutiny|monarchy|battle|ancient|medieval|historical|history)\b/.test(blob))
    return 'History';
  if (/\b(cell|organelle|dna|rna|gene|protein|biology|plant|enzyme|organism|photosynthesis|bacteria|virus|mitosis|evolution|mitochondri|chloroplast)\b/.test(blob))
    return 'Biology';
  if (/\b(algorithm|computer|software|programming|network|protocol|data structure|neural network|machine learning|database|operating system|cpu|tcp|http)\b/.test(blob))
    return 'Computer Science';
  if (/\b(physics|quantum|thermodynamic|entropy|electron|photon|relativity|magnetic|velocity|newton|gravity|kinematics|electromagnetism)\b/.test(blob))
    return 'Physics';
  if (/\b(mathematics|theorem|equation|calculus|algebra|matrix|geometry|integral|derivative|probability|prime number|fourier|trigonometry|polynomial)\b/.test(blob))
    return 'Mathematics';
  if (/\b(chemistry|chemical|molecule|atom|reaction|acid|periodic table|compound|organic chemistry|covalent|ionic)\b/.test(blob))
    return 'Chemistry';
  if (/\b(economics|economic|inflation|gdp|supply and demand|elasticity|monetary|microeconomics|macroeconomics)\b/.test(blob))
    return 'Economics';
  return 'General Knowledge';
}

function simplifySentenceForELI5(sentence) {
  return sentence
    .replace(/\([^)]{18,}\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Builds a dedicated 4-level Word Meaning & Nuance topic when the student asked for an exact word
 * (e.g. "luxury", "empathy", "irony") whose primary meaning is lexical rather than a narrow Wikipedia sub-article.
 */
function buildWordMeaningTopic(dictionary, enWiki, simpleWiki, papers) {
  const { word, phonetic, meanings, primaryDef, secondaryDef, example, synonyms, antonyms } = dictionary;
  const encoded = encodeURIComponent(word);
  const posList = meanings.map((m) => m.partOfSpeech).join(' / ');
  const wikiContext = enWiki?.sentences?.[0] || simpleWiki?.sentences?.[0] || '';
  const wikiExtra = enWiki?.sentences?.[1] || '';

  const allSenseSteps = meanings.flatMap((m) =>
    m.definitions.map((d, i) => ({
      title: `${m.partOfSpeech.toUpperCase()} — Sense ${i + 1}`,
      detail: `${d.definition}${d.example ? ` (Example: "${d.example}")` : ''}`,
    }))
  );

  const mapNodes = [
    {
      label: 'Core Meaning',
      role: posList || 'Definition',
      detail: primaryDef,
    },
    ...(secondaryDef
      ? [
          {
            label: 'Secondary Sense',
            role: 'Nuance / Context',
            detail: secondaryDef,
          },
        ]
      : []),
    ...(synonyms.length
      ? [
          {
            label: 'Close Synonyms',
            role: 'Similar Words',
            detail: `Words closely related to "${word}": ${synonyms.join(', ')}. Each carries a slightly different tone or intensity.`,
          },
        ]
      : []),
    ...(antonyms.length
      ? [
          {
            label: 'Opposites (Antonyms)',
            role: 'Key Contrast',
            detail: `Contrasting words for "${word}": ${antonyms.join(', ')}. Knowing the opposite sharpens the exact boundary of "${word}".`,
          },
        ]
      : []),
    ...(enWiki
      ? [
          {
            label: enWiki.title,
            role: 'Broader Academic Concept',
            wikiPage: enWiki.canonicalTitle || enWiki.title,
            sectionIndex: enWiki.sections?.[0]?.index || null,
            detail: wikiContext || `Related academic topic: ${enWiki.title}.`,
          },
        ]
      : [
          {
            label: 'In a Sentence',
            role: 'Real Usage',
            detail: example
              ? `"${example}"`
              : `Use "${word}" precisely when referring to: ${primaryDef}`,
          },
        ]),
  ].slice(0, 5);

  const quiz = [
    {
      level: 'eli5',
      question: `Which definition accurately captures the exact core meaning of "${word}"?`,
      options: [
        primaryDef,
        'A strictly mandatory bare-minimum requirement needed merely for basic survival with no extra comfort',
        'A routine administrative obligation that must be completed on a fixed legal schedule',
        'A temporary shortage of everyday supplies caused by sudden seasonal changes',
      ],
      correctIndex: 0,
      hint: `Focus on the primary ${meanings[0]?.partOfSpeech || ''} definition of "${word}".`,
      explanation: `${word} (${meanings[0]?.partOfSpeech || 'word'}): ${primaryDef}`,
    },
    ...(antonyms.length
      ? [
          {
            level: 'highschool',
            question: `Which word is the OPPOSITE (antonym) of "${word}"?`,
            options: [
              synonyms[0] || 'similar',
              antonyms[0],
              synonyms[1] || 'comfort',
              word,
            ],
            correctIndex: 1,
            hint: `Contrast "${word}" with what is strictly required or bare minimum.`,
            explanation: `"${antonyms[0]}" contrasts directly with "${word}".`,
          },
        ]
      : []),
  ];

  const flashcards = [
    {
      front: `Define "${word}" (${meanings[0]?.partOfSpeech || 'word'}) accurately.`,
      back: primaryDef,
      mnemonic: example ? `Example: "${example}"` : `Anchor on its exact meaning, not a narrow compound phrase.`,
    },
    ...(secondaryDef
      ? [
          {
            front: `What is a second shade of meaning (nuance) of "${word}"?`,
            back: secondaryDef,
            mnemonic: synonyms.length ? `Synonyms: ${synonyms.slice(0, 3).join(', ')}` : `Notice how context shifts "${word}".`,
          },
        ]
      : []),
    ...(antonyms.length || synonyms.length
      ? [
          {
            front: `Synonyms vs Antonyms of "${word}"?`,
            back: `Synonyms: ${synonyms.join(', ') || '—'} | Antonyms: ${antonyms.join(', ') || '—'}`,
            mnemonic: `Contrast "${word}" against "${antonyms[0] || 'its opposite'}" to never misuse it.`,
          },
        ]
      : []),
  ];

  const resources = [
    {
      title: `${word} — Wiktionary Etymology & All Senses`,
      type: 'Reading Guide',
      platform: 'Wiktionary',
      duration: '5 min',
      level: 'eli5',
      url: `https://en.wiktionary.org/wiki/${encoded.toLowerCase()}`,
      whyItFits: 'Complete breakdown of every shade of meaning, etymology, and usage.',
    },
    ...(enWiki
      ? [
          {
            title: `${enWiki.title} — Conceptual & Academic Context`,
            type: 'Reading Guide',
            platform: 'Wikipedia',
            duration: '12 min',
            level: 'highschool',
            url: enWiki.wikiUrl,
            whyItFits: `Explores how "${word}" functions conceptually in economics & society.`,
          },
        ]
      : []),
    {
      title: `${word} — Explained Visually`,
      type: 'Video',
      platform: 'YouTube Edu',
      duration: '8 min',
      level: 'undergrad',
      url: `https://www.youtube.com/results?search_query=what+is+${encoded}+meaning+explained`,
      whyItFits: 'Examples and nuanced explanations in everyday and academic contexts.',
    },
    ...papers.slice(0, 1).map((p) => ({
      title: p.title.length > 72 ? `${p.title.slice(0, 71)}…` : p.title,
      type: 'Practice',
      platform: p.site,
      duration: '25 min',
      level: 'deepdive',
      url: p.url,
      whyItFits: 'Peer-reviewed academic literature analyzing this concept.',
    })),
  ];

  return {
    id: `word-${word.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: word,
    subject: enWiki && /economic|goods/i.test(enWiki.title) ? 'Economics' : 'Vocabulary & Concepts',
    difficulty: phonetic || posList || 'Exact Meaning',
    estimatedMinutes: 6,
    tags: [posList || 'Definition', ...synonyms.slice(0, 2)],
    isLiveKnowledge: true,
    levels: {
      eli5: {
        headline: `${word} ${phonetic} (${posList}) — Complete plain-English meaning`,
        summary: `"${word}" means ${primaryDef.charAt(0).toLowerCase() + primaryDef.slice(1)}${
          secondaryDef
            ? ` In everyday life, it also refers to ${secondaryDef.charAt(0).toLowerCase() + secondaryDef.slice(1)}`
            : ''
        }${
          antonyms.length
            ? ` Unlike a basic "${antonyms[0]}", a "${word.toLowerCase()}" is something extra you enjoy for comfort, quality, or pleasure rather than survival.`
            : ''
        }`,
        steps: [
          {
            title: `1. What "${word}" Means in Everyday Life`,
            detail: `${primaryDef}${example ? ` For example: "${example}"` : ''}`,
          },
          ...(secondaryDef
            ? [
                {
                  title: '2. Second Shade of Meaning (Important Nuance)',
                  detail: secondaryDef,
                },
              ]
            : []),
          {
            title: antonyms.length ? `3. "${word}" vs. "${antonyms[0]}"` : '3. Related Words & Subtle Differences',
            detail: antonyms.length
              ? `A "${antonyms[0]}" is something you strictly need (like basic food, water, or simple shelter). "${word}" is the upgraded, high-comfort, or expensive version beyond the basics.${
                  synonyms.length ? ` Close synonyms include: ${synonyms.join(', ')}.` : ''
                }`
              : synonyms.length
              ? `Close synonyms include ${synonyms.join(', ')}, each with a slightly different tone.`
              : `Notice that "${word}" describes the broad idea itself—not just one specific object.`,
          },
          ...(wikiContext
            ? [
                {
                  title: `4. How "${word}" Is Used in ${enWiki?.title || 'Economics & Society'}`,
                  detail: simplifySentenceForELI5(wikiContext),
                },
              ]
            : []),
        ],
        analogy: antonyms.length
          ? `Think of "${word}" by comparing it to its opposite ("${antonyms[0]}"): "${antonyms[0]}" is the basic essential you need, whereas "${word}" is the extra comfort, elegance, or indulgence above the basics.`
          : `Think of "${word}" as the underlying concept itself—not just one specific object—so you can recognize it in any context.`,
        formulaOrRule: `${word} (${meanings[0]?.partOfSpeech || 'term'}): ${primaryDef}`,
        commonMistake: `Confusing the broad concept "${word}" with one narrow compound example (like a "${word.toLowerCase()} apartment" or "${word.toLowerCase()} brand") instead of its actual core definition.`,
      },
      highschool: {
        headline: `Shades of meaning, synonyms & conceptual distinctions of "${word}"`,
        summary: `${primaryDef} ${secondaryDef || ''} ${wikiContext}`.trim(),
        steps: allSenseSteps.slice(0, 4).length
          ? allSenseSteps.slice(0, 4)
          : [{ title: '1. Core Definition', detail: primaryDef }],
        analogy: `Mastering minute word distinctions works like tuning focus on a camera: "${word}" has a distinct boundary compared to close synonyms (${
          synonyms.slice(0, 3).join(', ') || 'related words'
        }) and opposites (${antonyms.slice(0, 3).join(', ') || 'contrasting terms'}).`,
        formulaOrRule: `Synonyms: ${synonyms.join(', ') || '—'}  |  Antonyms: ${antonyms.join(', ') || '—'}`,
        commonMistake: `Treating synonyms as 100% interchangeable—each carries subtle differences in formality, intensity, and context.`,
      },
      undergrad: {
        headline: `Lexical nuances & academic framing of "${word}"${enWiki ? ` (${enWiki.title})` : ''}`,
        summary: `${primaryDef} ${wikiContext} ${wikiExtra}`.trim(),
        steps: [
          { title: '1. Lexical Definition(s)', detail: `${primaryDef}${secondaryDef ? ` / ${secondaryDef}` : ''}` },
          ...(wikiContext ? [{ title: `2. Academic Context (${enWiki?.title || 'Concept'})`, detail: `${wikiContext} ${wikiExtra}`.trim() }] : []),
          {
            title: '3. Semantic Boundaries (Synonyms vs Antonyms)',
            detail: `Related terms: ${synonyms.join(', ') || 'none listed'}. Contrasts with: ${antonyms.join(', ') || 'basic necessities'}.`,
          },
        ],
        analogy: `In academic writing, distinguish the everyday dictionary meaning of "${word}" from its technical domain meaning${
          enWiki ? ` (such as "${enWiki.title}" in formal theory)` : ''
        }.`,
        formulaOrRule: `${word} = Lexical Sense (${posList}) + Domain Context (${enWiki?.title || 'General'})`,
        commonMistake: `Mixing up casual everyday usage of "${word}" with its strict technical definition in exams (e.g., in economics, a "luxury good" specifically means income elasticity > 1!).`,
      },
      deepdive: {
        headline: `Precision semantics, technical bifurcations & domain mastery for "${word}"`,
        summary: `${primaryDef} ${secondaryDef || ''} ${enWiki?.paragraphs?.slice(0, 2).join(' ') || wikiContext}`.trim(),
        steps: [
          ...allSenseSteps.slice(0, 2),
          ...(wikiContext ? [{ title: `Domain Formalization (${enWiki?.title})`, detail: `${wikiContext} ${wikiExtra}`.trim() }] : []),
          {
            title: 'Exam Precision Rule',
            detail: `Always specify WHICH sense of "${word}" you mean (general vs technical) and contrast it clearly against "${antonyms[0] || 'its baseline counterpart'}".`,
          },
        ],
        analogy: `Precision in language is like using a scalpel instead of a butter knife: separating "${word}" from closely related words prevents ambiguity in essays and exams.`,
        formulaOrRule: `Exact Word: ${word} ${phonetic}  |  All Senses: ${meanings.length} part(s) of speech`,
        commonMistake: `Overlooking secondary parts of speech or technical domain definitions (e.g., noun vs adjective usage, or economic vs sociological definitions).`,
      },
    },
    conceptMap: {
      center: word,
      nodes: mapNodes,
    },
    resources,
    quiz,
    flashcards,
  };
}

/**
 * Converts real Multi-Web knowledge (Dictionary + Simple Wiki + Full Wiki + OpenAlex) into a 4-level EduBuddy interactive topic!
 */
function buildRealTopicFromMultiWeb({ cleaned, dictionary, enWiki, simpleWiki, papers }) {
  // If user searched a 1–2 word English concept that exists in the Dictionary, AND Wikipedia did NOT match that exact title
  // (e.g., user asked "luxury" and Wikipedia only has "Luxury goods" or "Luxury apartment"), prioritize the EXACT Word Meaning topic!
  const exactWikiMatch =
    enWiki && enWiki.title.toLowerCase() === cleaned.toLowerCase();
  const isSingleWord = cleaned.split(/\s+/).length === 1;

  if (dictionary && (!enWiki || (isSingleWord && !exactWikiMatch))) {
    return buildWordMeaningTopic(dictionary, enWiki, simpleWiki, papers);
  }

  const primary = enWiki || simpleWiki;
  const { title, canonicalTitle, description, intro, paragraphs, sentences, sections, wikiUrl } = primary;
  const sectionNames = (sections || []).map((s) => (typeof s === 'string' ? s : s.title));
  const subject = guessSubject(title, description, intro);
  const encoded = encodeURIComponent(title);

  // Only use Simple English Wikipedia if its article title genuinely matches the primary topic!
  const simpleMatchesPrimary =
    simpleWiki &&
    enWiki &&
    (simpleWiki.title.toLowerCase() === enWiki.title.toLowerCase() ||
      simpleWiki.title.toLowerCase().includes(enWiki.title.toLowerCase()) ||
      enWiki.title.toLowerCase().includes(simpleWiki.title.toLowerCase()));

  const eli5Sentences =
    simpleMatchesPrimary && simpleWiki?.sentences?.length >= 2 ? simpleWiki.sentences : sentences;
  const e0 = simplifySentenceForELI5(eli5Sentences[0] || intro);
  const e1 = simplifySentenceForELI5(eli5Sentences[1] || '');
  const e2 = simplifySentenceForELI5(eli5Sentences[2] || '');
  const e3 = simplifySentenceForELI5(eli5Sentences[3] || '');

  const s0 = sentences[0] || intro;
  const s1 = sentences[1] || paragraphs[1]?.split(/(?<=[.!?])\s+/)[0] || '';
  const s2 = sentences[2] || '';
  const s3 = sentences[3] || '';
  const s4 = sentences[4] || '';
  const s5 = sentences[5] || '';
  const s6 = sentences[6] || '';
  const s7 = sentences[7] || '';

  const eli5Summary = [e0, e1, e0.length + e1.length < 180 ? e2 : '']
    .filter(Boolean)
    .join(' ');

  const eli5Steps = [
    {
      title: `1. Core Meaning of "${title}"`,
      detail: e0,
    },
    ...(e1 || s1
      ? [
          {
            title: '2. Key Features & What Sets It Apart',
            detail: simplifySentenceForELI5(e1 || s1),
          },
        ]
      : []),
    ...(e2 || s2 || e3 || s3
      ? [
          {
            title: '3. Real-World Examples & Context',
            detail: simplifySentenceForELI5([e2 || s2, e3 || s3].filter(Boolean).join(' ')),
          },
        ]
      : []),
    ...(sectionNames.length >= 2
      ? [
          {
            title: '4. Explore Deeper Parts (Concept Map →)',
            detail: `Click any node on the Interactive Concept Map to read detailed breakdowns of: ${sectionNames.slice(0, 4).join(', ')}.`,
          },
        ]
      : []),
  ];

  const hsSummary = sentences.slice(0, 3).join(' ') || intro;
  const ugSummary = paragraphs.slice(0, 2).join(' ') || sentences.slice(0, 5).join(' ');
  const deepSummary =
    (paragraphs[1] ? `${paragraphs[0]} ${paragraphs[1]}` : sentences.slice(0, 6).join(' ')) || intro;

  const mapNodes =
    sections.length >= 3
      ? sections.slice(0, 5).map((sec, idx) => {
          const secTitle = typeof sec === 'string' ? sec : sec.title;
          const secIndex = typeof sec === 'string' ? null : sec.index;
          return {
            label: secTitle,
            role: `Section ${idx + 1} · Click to Read`,
            wikiPage: canonicalTitle || title,
            sectionIndex: secIndex,
            detail:
              sentences[idx + 1] ||
              `Click to load the full "${secTitle}" breakdown for ${title}.`,
          };
        })
      : [
          { label: 'Core Definition', role: 'What It Is', detail: s0 },
          { label: 'Key Mechanism', role: 'How It Works', detail: s1 || s0 },
          { label: 'Structure / Role', role: 'Key Function', detail: s2 || s1 || s0 },
          { label: 'Context', role: subject, detail: s3 || description || `Foundational topic in ${subject}.` },
          { label: 'Applications', role: 'Why It Matters', detail: s4 || s2 || s0 },
        ];

  // Leave quiz empty on raw multi-web object so buildAdaptiveQuizSet generates
  // genuinely same-domain challenging questions matching the user's chosen difficulty & count!
  const quiz = [];

  const flashcards = [
    {
      front: `What is ${title}?`,
      back: e0,
      mnemonic: description ? `Quick tag: ${title} = ${description}` : `Focus on its core role in ${subject}.`,
    },
    ...(sectionNames[0]
      ? [
          {
            front: `What is a key fact or role of ${title}?`,
            back: `${s1}${s2 ? ` ${s2}` : ''}`.slice(0, 260),
            mnemonic: `Key area to recall: ${sectionNames[0]}`,
          },
        ]
      : s1
      ? [
          {
            front: `What is a key fact or role of ${title}?`,
            back: `${s1}${s2 ? ` ${s2}` : ''}`.slice(0, 260),
            mnemonic: `Link ${title} to its main mechanism.`,
          },
        ]
      : []),
    ...(sectionNames.length >= 2
      ? [
          {
            front: `Name the major sub-topics you should know for ${title} on an exam.`,
            back: sectionNames.join(' • '),
            mnemonic: `Remember the ${sectionNames.length} pillars: ${sectionNames.slice(0, 3).join(', ')}.`,
          },
        ]
      : []),
  ];

  const resources = [
    ...(simpleWiki
      ? [
          {
            title: `${title} — Beginner-Friendly Plain Guide`,
            type: 'Reading Guide',
            platform: 'Simple Wikipedia',
            duration: '6 min',
            level: 'eli5',
            url: simpleWiki.wikiUrl,
            whyItFits: 'Written specifically in plain, jargon-free beginner English.',
          },
        ]
      : []),
    {
      title: `${title} — Visual Explainer Videos`,
      type: 'Video',
      platform: 'YouTube Edu',
      duration: '10 min',
      level: 'eli5',
      url: `https://www.youtube.com/results?search_query=${encoded}+explained+visually`,
      whyItFits: 'Visual animations and step-by-step walkthroughs.',
    },
    {
      title: `${title} — Full Encyclopedia Reference`,
      type: 'Reading Guide',
      platform: 'Wikipedia',
      duration: '14 min',
      level: 'highschool',
      url: wikiUrl,
      whyItFits: `Comprehensive breakdown covering ${sectionNames.slice(0, 3).join(', ') || title}.`,
    },
    {
      title: `${title} — Guided Lessons & Practice`,
      type: 'Interactive',
      platform: 'Khan Academy',
      duration: '20 min',
      level: 'undergrad',
      url: `https://www.khanacademy.org/search?page_search_query=${encoded}`,
      whyItFits: 'Structured lessons and practice questions.',
    },
    ...papers.slice(0, 2).map((p) => ({
      title: p.title.length > 72 ? `${p.title.slice(0, 71)}…` : p.title,
      type: 'Practice',
      platform: p.site,
      duration: '30 min',
      level: 'deepdive',
      url: p.url,
      whyItFits: p.citations
        ? `Peer-reviewed academic publication cited ${p.citations.toLocaleString()} times.`
        : 'Peer-reviewed academic literature for exam/research mastery.',
    })),
  ];

  return {
    id: `wiki-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
    title,
    subject,
    difficulty: description ? description.slice(0, 24) : subject,
    estimatedMinutes: 10,
    tags: [subject, ...sectionNames.slice(0, 3)],
    isLiveKnowledge: true,
    wikiUrl,
    levels: {
      eli5: {
        headline: description ? `${title}: ${description}` : `Plain-language breakdown of ${title}`,
        summary: eli5Summary,
        steps: eli5Steps,
        analogy: `Anchor ${title} to its core identity (${description || subject}) first, then connect its main parts (${
          sectionNames.slice(0, 2).join(' & ') || 'key features and real-world impact'
        }) step-by-step.`,
        formulaOrRule: `Core Meaning: ${e0.slice(0, 165)}`,
        commonMistake: `Memorizing long definitions of ${title} before being able to summarize it in one plain sentence.`,
      },
      highschool: {
        headline: `Structured intuition & key facts about ${title}`,
        summary: hsSummary,
        steps: [
          { title: '1. Core Definition', detail: s0 },
          ...(s1 ? [{ title: '2. Primary Mechanism / Context', detail: s1 }] : []),
          ...(s2 ? [{ title: '3. Supporting Details', detail: s2 }] : []),
          ...(s3 ? [{ title: '4. Broader Significance', detail: s3 }] : []),
        ],
        analogy: `Think of ${title} in ${subject} as a cause-and-effect chain: identify what triggered or drives it, what happens during it, and its lasting result.`,
        formulaOrRule: description ? `${title} — ${description}` : `${title} (${subject})`,
        commonMistake: `Confusing ${title} with related concepts in ${subject} — inspect each pillar in the Concept Map on the right.`,
      },
      undergrad: {
        headline: `Detailed academic overview of ${title}`,
        summary: ugSummary,
        steps: [
          { title: '1. Formal Scope', detail: `${s0} ${s1}`.trim() },
          ...(s2 || s3 ? [{ title: '2. Detailed Breakdown', detail: `${s2} ${s3}`.trim() }] : []),
          ...(s4 || s5 ? [{ title: '3. Extended Context', detail: `${s4} ${s5}`.trim() }] : []),
        ],
        analogy: `Analyze ${title} through its key pillars (${sectionNames.slice(0, 3).join(', ') || 'context, mechanism, and impact'}) for clear structured answers.`,
        formulaOrRule: sectionNames.length ? `Key Study Pillars: ${sectionNames.join(' | ')}` : `Domain: ${subject}`,
        commonMistake: `Overlooking critical details or dates/conditions when comparing ${title} across ${subject} case studies.`,
      },
      deepdive: {
        headline: `Comprehensive exam mastery & research synthesis for ${title}`,
        summary: deepSummary,
        steps: [
          { title: '1. Core Foundation', detail: `${s0} ${s1}`.trim() },
          ...(s2 || s3 ? [{ title: '2. Mechanism & Evidence', detail: `${s2} ${s3}`.trim() }] : []),
          ...(s4 || s5 ? [{ title: '3. Advanced Context', detail: `${s4} ${s5}`.trim() }] : []),
          ...(s6 || s7 ? [{ title: '4. Deep Nuances', detail: `${s6} ${s7}`.trim() }] : []),
        ],
        analogy: `To ace exam questions on ${title}, practice explaining all key pillars from memory: ${
          sectionNames.slice(0, 4).join(', ') || 'definition, mechanism, evidence, and impact'
        }.`,
        formulaOrRule: `Verified Multi-Web Sources: Wikipedia${simpleWiki ? ' + Simple Wiki' : ''}${
          papers.length ? ` + ${papers.length} OpenAlex Papers` : ''
        }`,
        commonMistake: `Stopping at the intro paragraph — advanced exams test deeper sections (${sectionNames.slice(0, 3).join(', ') || 'causes, edge cases & evidence'}).`,
      },
    },
    conceptMap: {
      center: title,
      nodes: mapNodes,
    },
    resources,
    quiz,
    flashcards,
  };
}

/* ============================================================================
 * MULTI-AI MODEL CALLERS (Gemini, ChatGPT/OpenAI, Claude/Anthropic, OpenRouter)
 * ============================================================================ */

async function callGemini(apiKey, prompt, expectJson = false, attachment = null) {
  const parts = [{ text: prompt }];
  if (attachment?.kind === 'image' && attachment.base64 && attachment.mimeType) {
    parts.push({
      inline_data: {
        mime_type: attachment.mimeType,
        data: attachment.base64,
      },
    });
  } else if (attachment?.kind === 'text' && attachment.textContent) {
    parts[0].text += `\n\n--- ATTACHED FILE (${attachment.name}) ---\n${attachment.textContent.slice(0, 6000)}\n--- END FILE ---`;
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: expectJson ? 0.4 : 0.65,
      ...(expectJson ? { responseMimeType: 'application/json' } : {}),
    },
  };
  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey.trim(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini (${res.status}): ${errText.slice(0, 120)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text.trim();
}

async function callOpenAI(apiKey, prompt, attachment = null) {
  let userContent = prompt;
  if (attachment?.kind === 'image' && attachment.dataUrl) {
    userContent = [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: attachment.dataUrl } },
    ];
  } else if (attachment?.kind === 'text' && attachment.textContent) {
    userContent = `${prompt}\n\n--- ATTACHED FILE (${attachment.name}) ---\n${attachment.textContent.slice(0, 6000)}\n--- END FILE ---`;
  }

  const res = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are EduBuddy, a clear, accurate AI Student Learning Assistant.' },
        { role: 'user', content: userContent },
      ],
      temperature: 0.6,
      max_tokens: 480,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OpenAI (${res.status}): ${err.slice(0, 120)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty OpenAI response');
  return text.trim();
}

async function callClaude(apiKey, prompt, attachment = null) {
  let content = prompt;
  if (attachment?.kind === 'image' && attachment.base64 && attachment.mimeType) {
    content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: attachment.mimeType,
          data: attachment.base64,
        },
      },
      { type: 'text', text: prompt },
    ];
  } else if (attachment?.kind === 'text' && attachment.textContent) {
    content = `${prompt}\n\n--- ATTACHED FILE (${attachment.name}) ---\n${attachment.textContent.slice(0, 6000)}\n--- END FILE ---`;
  }

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 480,
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Claude (${res.status}): ${err.slice(0, 120)}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Empty Claude response');
  return text.trim();
}

async function callOpenRouterModel(apiKey, modelId, prompt) {
  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'EduBuddy Student Learning Assistant',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: 'You are EduBuddy, a clear, accurate AI Student Learning Assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 420,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OpenRouter (${res.status}): ${err.slice(0, 120)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty OpenRouter response');
  return text.trim();
}

export async function testProviderKey(provider, key) {
  const testPrompt = 'Reply with exactly: EduBuddy Connected';
  if (provider === 'gemini') return callGemini(key, testPrompt, false);
  if (provider === 'openai') return callOpenAI(key, testPrompt);
  if (provider === 'claude') return callClaude(key, testPrompt);
  if (provider === 'openrouter') return callOpenRouterModel(key, 'google/gemini-2.0-flash-001', testPrompt);
  throw new Error('Unknown provider');
}

/**
 * Generates genuinely challenging, same-domain MCQ questions via Gemini API when connected.
 */
export async function generateLiveQuizWithAI({ topic, difficulty, count, apiKeys }) {
  const geminiKey = typeof apiKeys === 'string' ? apiKeys : apiKeys?.gemini || '';
  if (!geminiKey.trim()) return null;

  const diffLabels = {
    eli5: 'Easy / Beginner (clear concepts, zero unfair jargon, plausible same-subject wrong options)',
    highschool: 'Medium / High School (conceptual reasoning, plausible same-subject distractors)',
    undergrad: 'Hard / Undergraduate (analytical, subtle distinctions, all 4 options strictly within the same academic subject)',
    deepdive: 'Exam Mastery (edge cases, exam traps, very close plausible distractors within the exact same domain)',
    mixed: 'Progressive Mix from Medium to Exam Mastery',
  };

  const prompt = `You are an expert professor creating a challenging multiple-choice quiz on "${topic.title}" (Subject: ${topic.subject}).
Difficulty: ${diffLabels[difficulty] || diffLabels.highschool}
Number of questions: ${count}
CRITICAL RULE: ALL 4 options for every question MUST belong strictly to ${topic.subject} / "${topic.title}" and look equally plausible in tone and length — NEVER include obvious joke or unrelated-subject distractors!
Return ONLY a valid JSON array of ${count} objects:
[
  {
    "level": "${difficulty === 'mixed' ? 'highschool' : difficulty}",
    "question": "Specific challenging question?",
    "options": ["Plausible option A", "Plausible option B", "Plausible option C", "Plausible option D"],
    "correctIndex": 0,
    "hint": "Helpful conceptual hint",
    "explanation": "Clear explanation of why the correct option is right"
  }
]`;

  try {
    const raw = await callGemini(geminiKey, prompt, true);
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr
      .filter((q) => q?.question && Array.isArray(q.options) && q.options.length === 4)
      .slice(0, count);
  } catch {
    return null;
  }
}

/**
 * Generates customized flashcards via Gemini API matching the user's chosen count & purpose:
 * - mode === 'exam': High-Yield Exam POV cards + explicitly labeled "Just for Knowledge · Not Exam POV" for any non-exam enrichment cards
 * - mode === 'revision': Fast active-recall revision cards (1-line refresh, memory anchors, rapid checks)
 */
export async function generateLiveFlashcardsWithAI({ topic, mode, count, apiKeys }) {
  const geminiKey = typeof apiKeys === 'string' ? apiKeys : apiKeys?.gemini || '';
  if (!geminiKey.trim()) return null;

  const modePrompt =
    mode === 'exam'
      ? `PURPOSE: EXAM PERSPECTIVE. Focus primarily on the most important, high-yield exam topics (core definitions, formulas, exam traps, key mechanisms). Label those cards with badge "High-Yield · Exam POV" and badgeType "exam-high" (or "exam-trap" for traps). If you include 1–2 less important background/enrichment cards, EXPLICITLY mark them with badge "Just for Knowledge · Not Exam POV", badgeType "knowledge-only", and povNote explaining it is NOT from exam POV (just for knowledge).`
      : `PURPOSE: QUICK REVISION. Create rapid-fire, concise revision flashcards (1-line refreshers, step checks, memory hooks, key-term recall) designed for fast active recall. Use badges like "1-Line Revision", "Active Recall", "Step Revision", or "Memory Anchor" with badgeType "rev-quick" or "rev-recall".`;

  const prompt = `You are EduBuddy creating ${count} flashcards for "${topic.title}" (${topic.subject}).
${modePrompt}
Return ONLY a valid JSON array of ${count} objects:
[
  {
    "front": "Concise active-recall question?",
    "back": "Clear, accurate answer",
    "mnemonic": "Short memory trick",
    "badge": "High-Yield · Exam POV",
    "badgeType": "exam-high",
    "povNote": "1-line note on why this card matters"
  }
]`;

  try {
    const raw = await callGemini(geminiKey, prompt, true);
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr
      .filter((c) => c?.front && c?.back)
      .slice(0, count)
      .map((c, idx) => ({ ...c, id: `${topic.id}-ai-${mode}-fc-${idx}` }));
  } catch {
    return null;
  }
}

/**
 * Queries ALL connected AI models in parallel!
 * If OpenRouter is configured, it automatically queries Gemini + ChatGPT + Claude in parallel from ONE key!
 */
async function queryAllConnectedModels(prompt, apiKeys = {}, attachment = null, selectedModels = null) {
  const allow = (name) => !selectedModels || selectedModels.includes(name);
  const jobs = [];

  if (allow('Gemini') && apiKeys.gemini?.trim()) {
    jobs.push({
      provider: 'Gemini',
      model: 'Gemini 2.5 Flash',
      color: '#4285f4',
      run: () => callGemini(apiKeys.gemini, prompt, false, attachment),
    });
  }
  if (allow('ChatGPT') && apiKeys.openai?.trim()) {
    jobs.push({
      provider: 'ChatGPT',
      model: 'GPT-4o Mini',
      color: '#10a37f',
      run: () => callOpenAI(apiKeys.openai, prompt, attachment),
    });
  }
  if (allow('Claude') && apiKeys.claude?.trim()) {
    jobs.push({
      provider: 'Claude',
      model: 'Claude 3.5 Haiku',
      color: '#d97757',
      run: () => callClaude(apiKeys.claude, prompt, attachment),
    });
  }

  // If user added an OpenRouter key, fill in any of Gemini / ChatGPT / Claude not already added directly!
  if (apiKeys.openrouter?.trim()) {
    const has = new Set(jobs.map((j) => j.provider));
    if (allow('Gemini') && !has.has('Gemini')) {
      jobs.push({
        provider: 'Gemini',
        model: 'Gemini 2.0 Flash (OpenRouter)',
        color: '#4285f4',
        run: () => callOpenRouterModel(apiKeys.openrouter, 'google/gemini-2.0-flash-001', prompt),
      });
    }
    if (allow('ChatGPT') && !has.has('ChatGPT')) {
      jobs.push({
        provider: 'ChatGPT',
        model: 'GPT-4o Mini (OpenRouter)',
        color: '#10a37f',
        run: () => callOpenRouterModel(apiKeys.openrouter, 'openai/gpt-4o-mini', prompt),
      });
    }
    if (allow('Claude') && !has.has('Claude')) {
      jobs.push({
        provider: 'Claude',
        model: 'Claude 3.5 Haiku (OpenRouter)',
        color: '#d97757',
        run: () => callOpenRouterModel(apiKeys.openrouter, 'anthropic/claude-3.5-haiku', prompt),
      });
    }
  }

  if (jobs.length === 0) return [];

  const settled = await Promise.allSettled(jobs.map((j) => j.run()));
  return jobs
    .map((job, idx) => {
      const outcome = settled[idx];
      if (outcome.status === 'fulfilled') {
        return {
          provider: job.provider,
          model: job.model,
          color: job.color,
          text: outcome.value,
          ok: true,
        };
      }
      return {
        provider: job.provider,
        model: job.model,
        color: job.color,
        text: `Unavailable right now (${outcome.reason?.message || 'API error'})`,
        ok: false,
      };
    })
    .filter((r) => r.ok || jobs.length === 1);
}

/**
 * Resolves ANY searched topic in Concept Simplifier:
 * 1. Live Gemini AI (if Gemini key configured)
 * 2. Live Multi-Web Academic Engine (Simple Wikipedia + Full Wikipedia + OpenAlex Papers — ZERO API key!)
 * 3. Offline fallback template only if completely disconnected
 */
export async function resolveAnyTopic(rawQuery, apiKeys = {}) {
  const cleaned = cleanAcademicQuery(rawQuery) || rawQuery.trim();
  const geminiKey = typeof apiKeys === 'string' ? apiKeys : apiKeys?.gemini || '';

  if (geminiKey.trim()) {
    try {
      return await generateLiveTopicWithAI(cleaned, geminiKey);
    } catch {
      // Fall through to Multi-Web Engine
    }
  }

  const webBundle = await searchMultiWebSources(cleaned);
  if (webBundle.dictionary || webBundle.enWiki || webBundle.simpleWiki) {
    return buildRealTopicFromMultiWeb(webBundle);
  }

  return generateCustomTopic(cleaned);
}

export async function generateLiveTopicWithAI(query, apiKey) {
  const prompt = `You are EduBuddy, an interactive AI Student Learning Assistant.
Generate a structured JSON learning guide for the academic topic: "${query}".
Return ONLY valid JSON matching this exact schema:
{
  "title": "Clean formatted topic title",
  "subject": "One of: Computer Science, Physics, Biology, Mathematics, Chemistry, Economics, History",
  "difficulty": "2-word badge like Core CS or Modern History",
  "estimatedMinutes": 10,
  "tags": ["tag1", "tag2", "tag3"],
  "levels": {
    "eli5": {
      "headline": "Short friendly hook",
      "summary": "2-3 simple sentences, zero jargon",
      "steps": [{"title": "1. ...", "detail": "..."}, {"title": "2. ...", "detail": "..."}, {"title": "3. ...", "detail": "..."}],
      "analogy": "Vivid everyday analogy",
      "formulaOrRule": "Simple plain-English rule",
      "commonMistake": "1 common misconception"
    },
    "highschool": {
      "headline": "...", "summary": "...", "steps": [{"title": "...", "detail": "..."}], "analogy": "...", "formulaOrRule": "...", "commonMistake": "..."
    },
    "undergrad": {
      "headline": "...", "summary": "...", "steps": [{"title": "...", "detail": "..."}], "analogy": "...", "formulaOrRule": "...", "commonMistake": "..."
    },
    "deepdive": {
      "headline": "...", "summary": "...", "steps": [{"title": "...", "detail": "..."}], "analogy": "...", "formulaOrRule": "...", "commonMistake": "..."
    }
  },
  "conceptMap": {
    "center": "Short Center Name",
    "nodes": [
      {"label": "Node 1", "role": "Role", "detail": "1 sentence explanation"},
      {"label": "Node 2", "role": "Role", "detail": "1 sentence explanation"},
      {"label": "Node 3", "role": "Role", "detail": "1 sentence explanation"},
      {"label": "Node 4", "role": "Role", "detail": "1 sentence explanation"},
      {"label": "Node 5", "role": "Role", "detail": "1 sentence explanation"}
    ]
  },
  "quiz": [
    {
      "level": "eli5",
      "question": "Clear question?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 1,
      "hint": "Helpful hint",
      "explanation": "Why the answer is correct"
    },
    {
      "level": "highschool",
      "question": "Clear question?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "hint": "Helpful hint",
      "explanation": "Why the answer is correct"
    }
  ],
  "flashcards": [
    {"front": "Question 1", "back": "Concise answer 1", "mnemonic": "Memory trick 1"},
    {"front": "Question 2", "back": "Concise answer 2", "mnemonic": "Memory trick 2"}
  ]
}`;

  const raw = await callGemini(apiKey, prompt, true);
  const parsed = JSON.parse(raw);
  const encoded = encodeURIComponent(parsed.title || query);
  return {
    ...parsed,
    id: `ai-${Date.now()}`,
    isLiveAI: true,
    resources: [
      {
        title: `${parsed.title} — Visual Intro Videos`,
        type: 'Video',
        platform: 'YouTube Edu',
        duration: '12 min',
        level: 'eli5',
        url: `https://www.youtube.com/results?search_query=${encoded}+explained+visually`,
        whyItFits: 'Visual-first intuition for beginners.',
      },
      {
        title: `${parsed.title} — Guided Practice`,
        type: 'Interactive',
        platform: 'Khan Academy',
        duration: '20 min',
        level: 'highschool',
        url: `https://www.khanacademy.org/search?page_search_query=${encoded}`,
        whyItFits: 'Structured lessons and practice problems.',
      },
      {
        title: `${parsed.title} — University Lecture Notes`,
        type: 'Reading Guide',
        platform: 'MIT OCW',
        duration: '30 min',
        level: 'undergrad',
        url: `https://ocw.mit.edu/search/?q=${encoded}`,
        whyItFits: 'Formal undergraduate notes and derivations.',
      },
      {
        title: `${parsed.title} — Research & Deep Dive`,
        type: 'Practice',
        platform: 'Google Scholar',
        duration: '40 min',
        level: 'deepdive',
        url: `https://scholar.google.com/scholar?q=${encoded}`,
        whyItFits: 'Primary literature and advanced problem sets.',
      },
    ],
  };
}

/**
 * Answers sub-questions directly from an uploaded plain-text / markdown / code / CSV file (zero-key offline capable!).
 */
function answerFromTextAttachment(attachment, userMessage) {
  const raw = attachment.textContent || '';
  const lines = raw
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8);
  const queryWords = (userMessage.toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter(
    (w) => !['what', 'this', 'from', 'the', 'about', 'explain', 'file', 'note', 'tell', 'image', 'picture', 'question'].includes(w)
  );

  const scored = lines.map((line, idx) => {
    const low = line.toLowerCase();
    let score = idx < 2 ? 1 : 0;
    queryWords.forEach((w) => {
      if (low.includes(w)) score += 3;
    });
    return { line, score, idx };
  });

  const best = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.line);

  return best.length
    ? best.map((l) => `• ${l.slice(0, 220)}`).join('\n')
    : `• ${raw.slice(0, 320).trim()}`;
}

/**
 * AI COUNCIL DEBATE MODE:
 * Queries selected AI models (and/or Live Web Sources) in parallel, runs a cross-critique debate round,
 * and synthesizes one unified Moderator Consensus Answer!
 */
export async function runAICouncilDebate({
  userMessage,
  topic,
  chatContext = null,
  levelId,
  selectedModels = ['Gemini', 'ChatGPT', 'Claude'],
  apiKeys = {},
  attachment = null,
}) {
  const levelInfo = LEVELS.find((l) => l.id === levelId) || LEVELS[1];
  const compareLinks = buildCompareLinks(userMessage);
  const extractedSubject = cleanAcademicQuery(userMessage) || chatContext?.title || topic.title;

  const basePrompt = `Student Level: ${levelInfo.label} (${levelInfo.tagline})
Question: "${userMessage}"
${attachment?.kind === 'image' ? 'The student attached an image — carefully inspect the image to answer their question or sub-question.' : ''}
Give a sharp, accurate 2–3 sentence answer from your perspective. Include one specific point other models often miss.`;

  const [liveModels, webBundle] = await Promise.all([
    queryAllConnectedModels(basePrompt, apiKeys, attachment, selectedModels),
    searchMultiWebSources(extractedSubject),
  ]);

  const workingLive = liveModels.filter((m) => m.ok);

  // CASE A: 2+ Live AI Models connected (e.g. Gemini + ChatGPT + Claude or OpenRouter!) -> REAL 2-Round Cross-Model Debate!
  if (workingLive.length >= 2) {
    const round1Transcript = workingLive
      .map((m) => `[${m.provider} (${m.model})]: ${m.text}`)
      .join('\n\n');

    const debatePrompt = `You are the EduBuddy Council Moderator. Multiple AI models just answered the student's question: "${userMessage}" (Level: ${levelInfo.label}).
Here are their Round 1 answers:
${round1Transcript}

Synthesize a crisp JSON verdict with:
{
  "critiques": [
    {"provider": "ProviderName", "point": "1-sentence critique or unique insight this model contributed during debate"}
  ],
  "agreement": "1 sentence on what all models agree on",
  "finalVerdict": "Crystal-clear 3–4 sentence synthesized best answer combining the strongest points for a ${levelInfo.label} student"
}
Return ONLY valid JSON.`;

    let verdictJson = null;
    try {
      const judgeKey = apiKeys.gemini?.trim();
      if (judgeKey) {
        const raw = await callGemini(judgeKey, debatePrompt, true);
        verdictJson = JSON.parse(raw);
      } else if (apiKeys.openai?.trim()) {
        const raw = await callOpenAI(apiKeys.openai, debatePrompt);
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) verdictJson = JSON.parse(match[0]);
      } else if (apiKeys.claude?.trim()) {
        const raw = await callClaude(apiKeys.claude, debatePrompt);
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) verdictJson = JSON.parse(match[0]);
      }
    } catch {
      // Graceful fallback synthesis
    }

    const panelists = workingLive.map((m) => {
      const crit = verdictJson?.critiques?.find(
        (c) => c.provider?.toLowerCase() === m.provider.toLowerCase()
      );
      return {
        name: m.provider,
        role: m.model,
        color: m.color,
        live: true,
        argument: m.text,
        critique:
          crit?.point ||
          `Cross-checked against ${workingLive
            .filter((x) => x.provider !== m.provider)
            .map((x) => x.provider)
            .join(' & ')} for accuracy.`,
      };
    });

    return {
      source: `⚔️ Live AI Council Debate (${workingLive.map((m) => m.provider).join(' vs ')})`,
      text: verdictJson?.finalVerdict || workingLive[0].text,
      debate: {
        mode: 'Live Multi-Model API Debate',
        agreement:
          verdictJson?.agreement ||
          `All ${workingLive.length} live AI models aligned on the core concept while adding complementary nuances.`,
        finalVerdict: verdictJson?.finalVerdict || workingLive[0].text,
        panelists,
      },
      webSources: webBundle.webSources,
      compareLinks,
      resolvedContext:
        webBundle.enWiki || webBundle.simpleWiki
          ? {
              title: (webBundle.enWiki || webBundle.simpleWiki).title,
              description: (webBundle.enWiki || webBundle.simpleWiki).description,
              enWiki: webBundle.enWiki,
              simpleWiki: webBundle.simpleWiki,
              webSources: webBundle.webSources,
            }
          : chatContext,
    };
  }

  // CASE B: 1 Live AI Model connected (e.g., Gemini Free Key!) -> Live 3-Specialist AI Council powered by that live model (with Vision support!)
  if (workingLive.length === 1) {
    const activeProvider = workingLive[0];
    const singleKeyPrompt = `You are running an EduBuddy 3-Panelist AI Council Debate for a ${levelInfo.label} student asking: "${userMessage}".
${attachment?.kind === 'image' ? 'Carefully read and analyze the attached picture/question!' : ''}
Produce ONLY valid JSON with 3 distinct specialist perspectives that constructively challenge each other, plus a synthesized Final Verdict:
{
  "agreement": "1 sentence core truth all panelists agree on",
  "finalVerdict": "Best crystal-clear synthesized answer for the student (3-4 sentences)",
  "panelists": [
    {"name": "Clarity Advocate", "role": "Simple Intuition (${activeProvider.provider})", "color": "#38bdf8", "argument": "2 sentence plain-English explanation", "critique": "Calls out jargon students get stuck on"},
    {"name": "Academic Rigor", "role": "Deep Technical (${activeProvider.provider})", "color": "#a78bfa", "argument": "2 sentence precise technical/formal explanation", "critique": "Adds crucial nuance the simple version omits"},
    {"name": "Exam Strategist", "role": "Mistake & Exam Trap (${activeProvider.provider})", "color": "#f59e0b", "argument": "2 sentence high-yield exam insight or step-by-step solve", "critique": "Flags the #1 trap students fall for"}
  ]
}`;

    try {
      let rawJson = null;
      if (apiKeys.gemini?.trim()) {
        rawJson = await callGemini(apiKeys.gemini, singleKeyPrompt, true, attachment);
      } else if (apiKeys.openai?.trim()) {
        rawJson = await callOpenAI(apiKeys.openai, singleKeyPrompt, attachment);
      } else if (apiKeys.claude?.trim()) {
        rawJson = await callClaude(apiKeys.claude, singleKeyPrompt, attachment);
      }
      const match = rawJson?.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : null;
      if (parsed?.finalVerdict && Array.isArray(parsed.panelists)) {
        return {
          source: `⚔️ Live AI Council (${activeProvider.provider} Multi-Agent Debate)`,
          text: parsed.finalVerdict,
          debate: {
            mode: `Powered by Live ${activeProvider.model} · Add more keys in Settings for cross-vendor debate`,
            agreement: parsed.agreement,
            finalVerdict: parsed.finalVerdict,
            panelists: parsed.panelists.map((p) => ({ ...p, live: true })),
          },
          webSources: webBundle.webSources,
          compareLinks,
          resolvedContext: chatContext,
        };
      }
    } catch {
      // Fall through cleanly
    }

    return {
      source: `⚔️ ${activeProvider.provider} Live AI + Web Council`,
      text: activeProvider.text,
      webSources: webBundle.webSources,
      compareLinks,
      resolvedContext: chatContext,
    };
  }

  // CASE C: Zero API Keys Connected -> Transparent Live Multi-Source Web Council Debate!
  const primary = webBundle.enWiki || webBundle.simpleWiki;
  const simple = webBundle.simpleWiki || webBundle.enWiki;
  const dict = webBundle.dictionary;
  const paper = webBundle.papers?.[0];

  const clarityArg =
    dict?.primaryDef
      ? `"${dict.word}" means: ${dict.primaryDef}${dict.secondaryDef ? ` It can also mean: ${dict.secondaryDef}` : ''}`
      : simple?.sentences?.slice(0, 2).map(simplifySentenceForELI5).join(' ') ||
        topic.levels?.eli5?.summary ||
        'Focus on the plain-language core mechanism before memorizing technical terms.';

  const rigorArg =
    primary?.sentences?.slice(0, 2).join(' ') ||
    topic.levels?.undergrad?.summary ||
    'Verify the formal definition, exact dates/conditions, and underlying structure.';

  const evidenceArg = attachment?.kind === 'text'
    ? `From your uploaded file (${attachment.name}): ${answerFromTextAttachment(attachment, userMessage).replace(/\n/g, ' ')}`
    : paper
    ? `Peer-reviewed literature ("${paper.title}", ${paper.year || 'academic'}) highlights deeper analytical context beyond introductory summaries.`
    : dict?.antonyms?.length
    ? `Watch the exact boundary: contrast "${dict.word}" against its opposite ("${dict.antonyms[0]}") so you never mix up related words.`
    : primary?.sentences?.[2] ||
      topic.levels?.deepdive?.commonMistake ||
      'Double-check boundary conditions and common exam misconceptions before finalizing your answer.';

  const targetTitle = dict?.word || primary?.title || extractedSubject;
  const finalVerdict =
    attachment?.kind === 'image'
      ? `I've attached your picture (**${attachment.name}**)! Because no Vision AI key is connected yet, I synthesized multi-web context on **${targetTitle}**: ${clarityArg}\n\n💡 **To read text, equations & diagrams directly inside your picture**, click **Connect AI Models** and paste a free Google Gemini API key (takes 10 seconds at aistudio.google.com)!`
      : `**Synthesized Consensus on ${targetTitle}:** ${clarityArg} ${
          rigorArg !== clarityArg ? rigorArg.split(/(?<=[.!?])\s+/)[0] : ''
        }`.trim();

  const panelists = [
    {
      name: 'Clarity Panelist',
      role: dict ? 'English Dictionary / Plain Sense' : 'Simple English Wiki (ELI5)',
      color: '#38bdf8',
      live: false,
      argument: clarityArg,
      critique: 'Pushes back against dense textbook jargon so beginners grasp the core meaning immediately.',
    },
    {
      name: 'Academic Rigor',
      role: primary ? `Wikipedia (${primary.title})` : 'Curated Academic Base',
      color: '#a78bfa',
      live: false,
      argument: rigorArg,
      critique: 'Counters oversimplification by adding formal precision, exact context, and key mechanisms.',
    },
    {
      name: 'Evidence & Exam Critic',
      role: attachment?.kind === 'text' ? `File: ${attachment.name}` : paper ? 'OpenAlex Research Paper' : 'Misconception Guard',
      color: '#f59e0b',
      live: false,
      argument: evidenceArg,
      critique: 'Challenges both views to ensure subtle distinctions and exam traps are not overlooked.',
    },
  ];

  return {
    source: `⚔️ Multi-Web Council Debate (${selectedModels.join(' · ')} Ready)`,
    text: finalVerdict,
    debate: {
      mode: 'Live Multi-Source Web Council · Connect Gemini / ChatGPT / Claude keys in Settings for direct live LLM debate!',
      agreement: `All panelists anchor on the core meaning of "${targetTitle}" while balancing plain clarity with academic precision.`,
      finalVerdict,
      panelists,
    },
    webSources: webBundle.webSources,
    compareLinks,
    resolvedContext: primary
      ? {
          title: dict && primary.title.toLowerCase() !== extractedSubject.toLowerCase() ? dict.word : primary.title,
          description: primary.description,
          enWiki: webBundle.enWiki,
          simpleWiki: webBundle.simpleWiki,
          webSources: webBundle.webSources,
        }
      : chatContext,
  };
}

/**
 * Multi-AI + Multi-Web Socratic Tutor Engine!
 * - Supports AI Council Debate Mode, Multimodal Image/File Uploads + Sub-Questions,
 *   Parallel Live AI Models, and Zero-Key Multi-Web Synthesis!
 */
export async function getTutorReply({
  userMessage,
  topic,
  chatContext = null,
  levelId,
  socraticMode,
  councilMode = false,
  selectedModels = ['Gemini', 'ChatGPT', 'Claude'],
  apiKeys = {},
  attachment = null,
}) {
  if (councilMode) {
    return runAICouncilDebate({
      userMessage,
      topic,
      chatContext,
      levelId,
      selectedModels,
      apiKeys,
      attachment,
    });
  }

  const levelInfo = LEVELS.find((l) => l.id === levelId) || LEVELS[1];
  const activeContextTopic = chatContext?.curatedTopic || topic;
  const levelData = activeContextTopic.levels[levelId] || activeContextTopic.levels.highschool;
  const compareLinks = buildCompareLinks(userMessage);
  const q = userMessage.toLowerCase().trim();
  const extractedSubject = cleanAcademicQuery(userMessage);

  const isCommandForActiveTopic =
    /^(explain this|make it simpler|give me an? analogy|give me a memorable|create a mnemonic|test me with|what is the biggest mistake|break down the key formula)/i.test(
      q
    ) ||
    ['simpler', 'eli5', 'analogy', 'mnemonic', 'quiz me', 'formula'].includes(q);

  const wantsELI5 =
    /\b(like\s+(i'?m|i\s+am)\s+(a\s+)?(5|10|kid|child)|eli5|simpler|simple\s+words|for\s+kids|explain\s+easily)\b/i.test(
      q
    );

  const hasAnyAIKey = Boolean(
    apiKeys?.gemini?.trim() ||
      apiKeys?.openai?.trim() ||
      apiKeys?.claude?.trim() ||
      apiKeys?.openrouter?.trim()
  );

  // 1. If ANY live AI key is connected (Gemini, ChatGPT, Claude, or OpenRouter), run ALL selected connected models (+ Vision/File!) + Live Web Search IN PARALLEL!
  if (hasAnyAIKey) {
    const contextName = chatContext?.title || topic.title;
    const systemStyle = socraticMode
      ? 'Give a clear, accurate explanation tailored to the student level, and end with ONE short Socratic question to check understanding (unless the student explicitly asked for a strict one-paragraph summary or direct solution to an uploaded question).'
      : 'Give a direct, accurate, well-structured explanation with relatable intuition.';
    const attachInstruction =
      attachment?.kind === 'image'
        ? `The student uploaded an image ("${attachment.name}"). Examine the image carefully (read any text, math equations, diagrams, or multiple-choice questions inside it) and answer their exact question or sub-question step by step!`
        : attachment?.kind === 'text'
        ? `The student attached the file "${attachment.name}". Answer their question or sub-question directly based on the attached file content.`
        : '';

    const prompt = `Student Understanding Level: ${levelInfo.label} (${levelInfo.tagline})
Most Recently Discussed Topic: ${contextName}
${attachInstruction}
Style: ${systemStyle}
Student Question: "${userMessage}"
Keep response clear, concise, and factually accurate.`;

    const searchTarget = isCommandForActiveTopic ? contextName : extractedSubject || userMessage;
    const [modelResponses, webBundle] = await Promise.all([
      queryAllConnectedModels(prompt, apiKeys, attachment, selectedModels),
      searchMultiWebSources(searchTarget),
    ]);

    const workingModels = modelResponses.filter((m) => m.ok);
    if (workingModels.length > 0) {
      const providerNames = workingModels.map((m) => m.provider).join(' + ');
      const nextContext =
        !isCommandForActiveTopic && (webBundle.enWiki || webBundle.simpleWiki)
          ? {
              title: (webBundle.enWiki || webBundle.simpleWiki).title,
              description: (webBundle.enWiki || webBundle.simpleWiki).description,
              enWiki: webBundle.enWiki,
              simpleWiki: webBundle.simpleWiki,
              webSources: webBundle.webSources,
            }
          : chatContext;
      return {
        source:
          attachment?.kind === 'image'
            ? `👁️ ${providerNames} Live Vision AI`
            : workingModels.length > 1
            ? `Multi-AI Consensus (${providerNames}) + Live Web`
            : `${workingModels[0].provider} AI + Live Web`,
        text: workingModels[0].text,
        modelResponses: workingModels,
        webSources: webBundle.webSources,
        compareLinks,
        resolvedContext: nextContext,
      };
    }
  }

  // 1b. Zero-Key Attached File or Image Handler!
  if (attachment?.kind === 'text' && attachment.textContent) {
    const fileFindings = answerFromTextAttachment(attachment, userMessage);
    const webBundle =
      extractedSubject.length >= 3 ? await searchMultiWebSources(extractedSubject) : { webSources: [] };
    return {
      source: `📄 File Reader (${attachment.name}) + Live Web`,
      text: `**Relevant excerpts from \`${attachment.name}\`:**\n\n${fileFindings}\n\n${
        socraticMode
          ? `🤔 **Follow-up:** You can keep asking sub-questions about \`${attachment.name}\` (e.g., *"summarize part 2"*, *"explain this term simpler"*) — it stays attached until you clear it!`
          : `💡 Add a free Gemini API key in **Connect AI Models** for full generative reasoning over uploaded files.`
      }`,
      webSources: webBundle.webSources,
      compareLinks,
      resolvedContext: chatContext,
    };
  }

  if (attachment?.kind === 'image') {
    const webBundle =
      extractedSubject.length >= 3 && !/^(this|image|picture|photo|solve this|explain this)$/i.test(extractedSubject)
        ? await searchMultiWebSources(extractedSubject)
        : null;
    const wikiSnippet = webBundle?.enWiki?.sentences?.[0] || webBundle?.dictionary?.primaryDef || '';
    return {
      source: `🖼️ Image Attached (${attachment.name})`,
      text: `I have your picture **${attachment.name}** attached and ready for sub-questions!${
        wikiSnippet ? `\n\n📚 **Related Concept Context:** ${wikiSnippet}` : ''
      }\n\n👁️ **Enable Live Image Vision (10 seconds, Free):** To read handwritten text, math equations, or diagrams directly inside your picture and answer sub-questions about it, click **Connect AI Models** above and paste your free **Google Gemini API key** from \`aistudio.google.com/apikey\` (or an OpenAI / Claude key)!`,
      webSources: webBundle?.webSources || [],
      compareLinks,
      needsVisionKey: true,
      resolvedContext: chatContext,
    };
  }

  // 2. Zero-Key Multi-Web + Curated Academic Engine!
  const wantsOneParagraph = /\b(one|1|a|short|single)\s+(paragraph|para)\b|\bbriefly\b|\bin\s+short\b/i.test(q);
  const wantsBullets = /\b(bullet|points|steps|list)\b/i.test(q);

  const currentFocusTitle = chatContext?.title || topic.title;
  const mentionsActiveTopic =
    extractedSubject.length >= 3 &&
    (currentFocusTitle.toLowerCase().includes(extractedSubject.toLowerCase()) ||
      extractedSubject.toLowerCase().includes(currentFocusTitle.toLowerCase().split(' (')[0]));

  const isExplicitTopicQuery =
    !isCommandForActiveTopic &&
    /^(hey\s+|hi\s+|please\s+|can\s+you\s+|could\s+you\s+)?(what\s+is|what\s+are|who\s+is|who\s+was|who\s+were|define|explain|tell\s+me|write|summarize|describe|give\s+me|how\s+does|how\s+do|why\s+did|meaning\s+of)\b/i.test(
      q
    );

  // Check follow-up commands ("Explain like I'm 10", "Give an analogy", "Quiz me", etc.)
  // IMPORTANT: If the student was just discussing a live-web topic (like Revolt of 1857) in chat, answer about THAT topic!
  if (isCommandForActiveTopic || (mentionsActiveTopic && !isExplicitTopicQuery)) {
    // Handle live-web conversation context (e.g., Indian Rebellion of 1857!)
    if (chatContext && !chatContext.curatedTopic && (chatContext.simpleWiki || chatContext.enWiki)) {
      const ctxTitle = chatContext.title;
      const simple = chatContext.simpleWiki || chatContext.enWiki;
      const full = chatContext.enWiki || chatContext.simpleWiki;
      const s0 = simplifySentenceForELI5(simple.sentences[0] || simple.intro);
      const s1 = simplifySentenceForELI5(simple.sentences[1] || '');
      const s2 = simplifySentenceForELI5(simple.sentences[2] || '');

      if (wantsELI5 || q.includes('simpler') || q.includes('eli5') || q.includes('easy') || q.includes('10') || q.includes('confused')) {
        return {
          source: `EduBuddy ELI5 (${chatContext.simpleWiki ? 'Simple English Wiki' : 'Simplified Live Knowledge'})`,
          text: `Let's explain **${ctxTitle}** simply like you're 10! 🌟\n\n**In Plain Words:** ${s0} ${s1}\n\n${
            s2 ? `**What happened next:** ${s2}\n\n` : ''
          }**Easy Way to Picture It:** Think of **${ctxTitle}** as a chain of big causes leading to a major turning point — once tension built up too high, people pushed back to change the rules.\n\n${
            socraticMode
              ? `🤔 **Quick Check:** If you had to tell a friend what **${ctxTitle}** was in just ONE sentence, how would you say it?`
              : `💡 Tip: Search **"${ctxTitle}"** in Concept Simplifier to click each section (Background, Causes, etc.) on the Concept Map!`
          }`,
          webSources: chatContext.webSources,
          compareLinks: buildCompareLinks(`explain ${ctxTitle} like I am 10 years old`),
          resolvedContext: chatContext,
        };
      }

      if (q.includes('analog') || q.includes('example') || q.includes('real world') || q.includes('real-world')) {
        return {
          source: 'EduBuddy Multi-Web Engine',
          text: `💡 **Simple Analogy for ${ctxTitle}:**\n\nImagine a school or neighborhood where new strict rules are suddenly forced on everyone without asking them — frustration piles up quietly until one final spark makes everyone stand up together. That is the core pattern behind **${ctxTitle}**!\n\n**Real Fact:** ${s0}`,
          webSources: chatContext.webSources,
          compareLinks: buildCompareLinks(`real world analogy for ${ctxTitle}`),
          resolvedContext: chatContext,
        };
      }

      if (q.includes('mnemonic') || q.includes('memor') || q.includes('trick') || q.includes('remember')) {
        const pillars = (full.sections || []).map((sec) => (typeof sec === 'string' ? sec : sec.title)).slice(0, 4);
        return {
          source: 'EduBuddy Multi-Web Engine',
          text: `🧠 **Memory Trick for ${ctxTitle}:**\n\nRemember the 3-step story arc: **Spark → Turning Point → Result**.\n\n**Core Anchor:** \`${s0.slice(0, 140)}\`${
            pillars.length ? `\n\n**Key Exam Headings to Recall:** ${pillars.join(' → ')}` : ''
          }`,
          webSources: chatContext.webSources,
          compareLinks: buildCompareLinks(`memory trick for ${ctxTitle}`),
          resolvedContext: chatContext,
        };
      }

      if (q.includes('quiz') || q.includes('test') || q.includes('question') || q.includes('practice')) {
        return {
          source: 'EduBuddy Multi-Web Engine',
          text: `🎯 **Pop Check on ${ctxTitle}:**\n\nWhich of the following is TRUE about **${ctxTitle}**?\n\nA) ${s0.slice(0, 150)}\nB) It was a modern computer networking protocol invented in 2015\nC) It is an organelle found only inside plant leaves\nD) It is a formula used strictly in trigonometry\n\n_Reply with A, B, C, or D!_`,
          webSources: chatContext.webSources,
          compareLinks: buildCompareLinks(`practice quiz on ${ctxTitle}`),
          resolvedContext: chatContext,
        };
      }

      if (q.includes('mistake') || q.includes('trap') || q.includes('exam') || q.includes('hard')) {
        return {
          source: 'EduBuddy Multi-Web Engine',
          text: `⚠️ **Common Exam Trap on ${ctxTitle}:**\n\nStudents often memorize only the headline date/name without connecting the **underlying causes** and **final outcomes**.\n\n**Anchor Fact:** ${s0} ${s1}`,
          webSources: chatContext.webSources,
          compareLinks: buildCompareLinks(`common exam mistakes about ${ctxTitle}`),
          resolvedContext: chatContext,
        };
      }

      if (q.includes('formula') || q.includes('math') || q.includes('equation')) {
        const pillars = (full.sections || []).map((sec) => (typeof sec === 'string' ? sec : sec.title)).slice(0, 4);
        return {
          source: 'EduBuddy Multi-Web Engine',
          text: `📐 **Core Framework for ${ctxTitle}:**\n\n\`${ctxTitle}${chatContext.description ? ` — ${chatContext.description}` : ''}\`\n\n• **Core Fact:** ${s0}${
            s1 ? `\n• **Key Detail:** ${s1}` : ''
          }${pillars.length ? `\n• **Key Pillars:** ${pillars.join(' · ')}` : ''}`,
          webSources: chatContext.webSources,
          compareLinks: buildCompareLinks(`key points of ${ctxTitle}`),
          resolvedContext: chatContext,
        };
      }
    }

    // Handle curated active topic (Neural Networks, Mitochondria, DP, etc.)
    if (wantsELI5 || q.includes('simpler') || q.includes('eli5') || q.includes('easy') || q.includes('10') || q.includes('confused')) {
      const eli5 = activeContextTopic.levels.eli5;
      return {
        source: 'EduBuddy Multi-Web Engine',
        text: `Let's dial down the jargon completely for **${activeContextTopic.title}**! 🌟\n\n**Simple Picture:** ${eli5.summary}\n\n**Everyday Analogy:** ${eli5.analogy}\n\n${
          socraticMode
            ? `**Quick check-in:** Based on that analogy, what do you think happens first in ${activeContextTopic.title}?`
            : `**Key Rule:** ${eli5.formulaOrRule}`
        }`,
        compareLinks,
        resolvedContext: chatContext,
      };
    }
    if (q.includes('analog') || q.includes('example') || q.includes('real world') || q.includes('real-world')) {
      return {
        source: 'EduBuddy Multi-Web Engine',
        text: `Here is a concrete way to picture **${activeContextTopic.title}** at the **${levelInfo.label}** level:\n\n💡 **Analogy:** ${levelData.analogy}\n\n**Why it clicks:** ${levelData.steps[0]?.detail || levelData.summary}\n\n${
          socraticMode
            ? `**Your turn:** Can you think of another everyday situation that behaves like this?`
            : `**Watch out for:** ${levelData.commonMistake}`
        }`,
        compareLinks,
        resolvedContext: chatContext,
      };
    }
    if (q.includes('mnemonic') || q.includes('memor') || q.includes('trick') || q.includes('remember')) {
      const cards = activeContextTopic.flashcards || [];
      const tricks = cards
        .slice(0, 2)
        .map((c, i) => `${i + 1}. **${c.mnemonic}** — _(${c.front})_`)
        .join('\n');
      return {
        source: 'EduBuddy Multi-Web Engine',
        text: `🧠 **Memory Anchors for ${activeContextTopic.title}:**\n\n${tricks || `Anchor on: **${levelData.formulaOrRule}**`}\n\n**Golden Rule:** \`${levelData.formulaOrRule}\``,
        compareLinks,
        resolvedContext: chatContext,
      };
    }
    if (q.includes('quiz') || q.includes('test') || q.includes('question') || q.includes('practice')) {
      const sampleQ = activeContextTopic.quiz?.[0];
      if (sampleQ) {
        return {
          source: 'EduBuddy Multi-Web Engine',
          text: `🎯 **Pop Check on ${activeContextTopic.title}:**\n\n${sampleQ.question}\n\n${sampleQ.options
            .map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`)
            .join('\n')}\n\n_Reply with your guess (Hint: ${sampleQ.hint})!_`,
          compareLinks,
          resolvedContext: chatContext,
        };
      }
    }
    if (q.includes('mistake') || q.includes('trap') || q.includes('exam') || q.includes('hard')) {
      return {
        source: 'EduBuddy Multi-Web Engine',
        text: `⚠️ **#1 Exam Trap in ${activeContextTopic.title} (${levelInfo.label}):**\n\n${levelData.commonMistake}\n\n**How to beat it:** Always double-check \`${levelData.formulaOrRule}\`.`,
        compareLinks,
        resolvedContext: chatContext,
      };
    }
    if (q.includes('formula') || q.includes('math') || q.includes('equation')) {
      return {
        source: 'EduBuddy Multi-Web Engine',
        text: `📐 **Core Formula / Rule (${levelInfo.label}):**\n\n\`${levelData.formulaOrRule}\`\n\n${levelData.steps
          .slice(0, 3)
          .map((s) => `• **${s.title}:** ${s.detail}`)
          .join('\n')}`,
        compareLinks,
        resolvedContext: chatContext,
      };
    }
  }

  // Check curated topics if asking about another curated concept
  if (extractedSubject.length >= 3 && !isCommandForActiveTopic) {
    const curatedHit = TOPICS.find(
      (t) =>
        t.title.toLowerCase().includes(extractedSubject.toLowerCase()) ||
        t.id.includes(extractedSubject.toLowerCase()) ||
        t.tags?.some((tag) => tag.toLowerCase() === extractedSubject.toLowerCase())
    );
    if (curatedHit && (!mentionsActiveTopic || isExplicitTopicQuery)) {
      const curatedLvl = wantsELI5 ? curatedHit.levels.eli5 : curatedHit.levels[levelId] || curatedHit.levels.highschool;
      const webBundle = await searchMultiWebSources(curatedHit.title.split(' (')[0]);
      const nextContext = {
        title: curatedHit.title,
        curatedTopic: curatedHit,
        webSources: webBundle.webSources,
      };
      if (wantsOneParagraph) {
        return {
          source: 'EduBuddy Knowledge + Live Web',
          text: `**${curatedHit.title}:** ${curatedLvl.summary} ${curatedLvl.analogy}`,
          webSources: webBundle.webSources,
          compareLinks,
          resolvedContext: nextContext,
        };
      }
      return {
        source: 'EduBuddy Knowledge + Live Web',
        text: `**${curatedHit.title}** _(${wantsELI5 ? 'ELI5 Beginner' : levelInfo.label} Level)_:\n\n${curatedLvl.summary}\n\n💡 **Analogy:** ${curatedLvl.analogy}\n\n**Key Rule:** \`${curatedLvl.formulaOrRule}\`\n\n${
          socraticMode
            ? `🤔 **Socratic Check:** Based on this, what do you think is the most essential part of **${curatedHit.title.split(' (')[0]}**?`
            : `⚠️ **Watch out:** ${curatedLvl.commonMistake}`
        }`,
        webSources: webBundle.webSources,
        compareLinks,
        resolvedContext: nextContext,
      };
    }
  }

  // Multi-Website Live Search across Dictionary + Simple Wikipedia + Full Wikipedia + OpenAlex Academic Papers!
  if (extractedSubject.length >= 2 && !isCommandForActiveTopic) {
    const webBundle = await searchMultiWebSources(extractedSubject);
    const exactWikiMatch =
      webBundle.enWiki &&
      webBundle.enWiki.title.toLowerCase() === extractedSubject.toLowerCase();
    const isSingleWord = extractedSubject.split(/\s+/).length === 1;

    // If user asked for a single English word like "what is luxury" and Dictionary has the exact meaning (while Wiki only has a compound/shifted page), lead with the EXACT word meaning!
    if (webBundle.dictionary && (!webBundle.enWiki || (isSingleWord && !exactWikiMatch))) {
      const d = webBundle.dictionary;
      const synLine = d.synonyms.length ? `\n\n**Synonyms:** ${d.synonyms.join(', ')}` : '';
      const antLine = d.antonyms.length ? ` · **Opposites:** ${d.antonyms.join(', ')}` : '';
      const wikiNote = webBundle.enWiki?.sentences?.[0]
        ? `\n\n📚 **Related Concept (${webBundle.enWiki.title}):** ${webBundle.enWiki.sentences[0]}`
        : '';

      const nextContext = {
        title: d.word,
        description: `${d.meanings[0]?.partOfSpeech || 'word'} — ${d.primaryDef.slice(0, 70)}`,
        enWiki: webBundle.enWiki,
        simpleWiki: webBundle.simpleWiki || {
          title: d.word,
          sentences: [d.primaryDef, d.secondaryDef].filter(Boolean),
          intro: d.primaryDef,
        },
        webSources: webBundle.webSources,
      };

      return {
        source: `Exact Dictionary + Multi-Web (${webBundle.webSources.length} Sources)`,
        text: `**${d.word}** ${d.phonetic ? `\`${d.phonetic}\` ` : ''}_(${d.meanings[0]?.partOfSpeech || 'word'})_:\n\n1. **Core Meaning:** ${d.primaryDef}${
          d.secondaryDef ? `\n2. **Nuance / 2nd Sense:** ${d.secondaryDef}` : ''
        }${d.example ? `\n\n💬 **Example:** _"${d.example}"_` : ''}${synLine}${antLine}${wikiNote}`,
        webSources: webBundle.webSources,
        compareLinks,
        resolvedContext: nextContext,
      };
    }

    const useSimpleFirst = wantsELI5 || levelId === 'eli5';
    const primary = useSimpleFirst && webBundle.simpleWiki ? webBundle.simpleWiki : webBundle.enWiki || webBundle.simpleWiki;
    const secondary = useSimpleFirst ? webBundle.enWiki : webBundle.simpleWiki;

    if (primary) {
      const nextContext = {
        title: primary.title,
        description: primary.description,
        enWiki: webBundle.enWiki,
        simpleWiki: webBundle.simpleWiki,
        webSources: webBundle.webSources,
      };

      if (wantsELI5) {
        const p0 = simplifySentenceForELI5(primary.sentences[0] || primary.intro);
        const p1 = simplifySentenceForELI5(primary.sentences[1] || '');
        const p2 = simplifySentenceForELI5(primary.sentences[2] || '');
        return {
          source: `Multi-Web ELI5 (${webBundle.simpleWiki ? 'Simple English Wiki + Web' : 'Simplified Web'})`,
          text: `Here is **${primary.title}** explained simply like you're 10! 🌟\n\n${p0} ${p1}${
            p2 ? `\n\n**In short:** ${p2}` : ''
          }`,
          webSources: webBundle.webSources,
          compareLinks,
          resolvedContext: nextContext,
        };
      }

      if (wantsOneParagraph) {
        return {
          source: `Multi-Web Search (${webBundle.webSources.length} Sources)`,
          text: `**${primary.title}**${primary.description ? ` _(${primary.description})_` : ''}\n\n${primary.sentences
            .slice(0, 4)
            .join(' ')}`,
          webSources: webBundle.webSources,
          compareLinks,
          resolvedContext: nextContext,
        };
      }

      if (wantsBullets) {
        const bullets = primary.sentences
          .slice(0, 4)
          .map((s) => `• ${s}`)
          .join('\n');
        return {
          source: `Multi-Web Search (${webBundle.webSources.length} Sources)`,
          text: `**${primary.title} — Synthesized Key Points:**\n\n${bullets}`,
          webSources: webBundle.webSources,
          compareLinks,
          resolvedContext: nextContext,
        };
      }

      const mainAns = primary.sentences.slice(0, 3).join(' ');
      const extraNote =
        secondary && secondary.sentences[0] && secondary.sentences[0] !== primary.sentences[0]
          ? `\n\n🌐 **${useSimpleFirst ? 'Academic Detail (Wikipedia)' : 'Plain-English Summary (Simple Wiki)'}:** ${secondary.sentences[0]}`
          : primary.sentences[3]
          ? `\n\n📌 **Key Detail:** ${primary.sentences[3]}`
          : '';

      return {
        source: `Multi-Web Search (${webBundle.webSources.length} Sources)`,
        text: `**${primary.title}**${primary.description ? ` — _${primary.description}_` : ''}\n\n${mainAns}${extraNote}\n\n${
          socraticMode
            ? `🤔 **Socratic Check:** In your own words, what is the single biggest takeaway about **${primary.title}**?`
            : `💡 Tip: Search **"${primary.title}"** in Concept Simplifier for a 4-level breakdown, Concept Map & quiz!`
        }`,
        webSources: webBundle.webSources,
        compareLinks,
        resolvedContext: nextContext,
      };
    }
  }

  // Final fallback for active topic context
  const matchedNode = topic.conceptMap?.nodes?.find((n) =>
    q.includes(n.label.toLowerCase().split(' ')[0])
  );
  if (matchedNode) {
    return {
      source: 'EduBuddy Smart Mode',
      text: `Great question about **${matchedNode.label}** (${matchedNode.role}) in **${topic.title}**!\n\n${matchedNode.detail}\n\nIn context: ${levelData.summary}`,
      compareLinks,
    };
  }

  return {
    source: 'EduBuddy Smart Mode',
    text: `Here is how **${topic.title}** connects at the **${levelInfo.label}** level:\n\n${levelData.summary}\n\n💡 **Analogy:** ${levelData.analogy}\n\n_Want live answers directly from ChatGPT, Claude & Gemini side-by-side? Add API keys in Settings or click any compare button below!_`,
    compareLinks,
  };
}

const JARGON_DICTIONARY = {
  algorithm: 'A clear, step-by-step recipe a computer follows to solve a problem.',
  gradient: 'A vector pointing in the steepest uphill direction on a curved surface.',
  entropy: 'A measure of how spread out energy (or uncertainty) is across possible states.',
  differentiable: 'Smooth enough at every point to have a well-defined tangent slope (no sharp corners).',
  recursion: 'A function solving a big problem by calling itself on a smaller version of the same problem.',
  memoization: 'Saving the result of expensive calculations in memory so you never compute them twice.',
  eigenvalue: 'A special scaling factor showing how much a matrix stretches a vector without rotating it.',
  mitochondria: 'Double-membrane organelles in plant and animal eukaryotic cells that convert glucose and oxygen into usable ATP energy.',
  chloroplast: 'Plant-cell organelles containing chlorophyll that capture sunlight to produce glucose via photosynthesis.',
  photosynthesis: 'How plants capture sunlight to turn CO₂ and water into sugar and oxygen.',
  catalyst: 'A helper substance that speeds up a chemical reaction without getting used up.',
  homeostasis: 'How a living body keeps its internal balance steady (like temperature or blood sugar).',
  polymorphism: 'Allowing one interface or method name to behave differently for different data types.',
  asymptotic: 'How an algorithm\'s speed or memory behaves when the input size grows huge.',
  heuristic: 'A smart rule-of-thumb shortcut that finds a good answer fast when exact search is too slow.',
  stochastic: 'Involving randomness or probability rather than fixed predictable outcomes.',
  equilibrium: 'A balanced state where opposing forces (like supply and demand) cancel out evenly.',
  elasticity: 'How strongly buyers or sellers react when price or income changes.',
  endonuclease: 'An enzyme that acts like molecular scissors cutting DNA inside a strand.',
  superposition: 'A quantum system existing in a weighted combination of multiple states until measured.',
  deadlock: 'A permanent freeze where two or more tasks each wait for a resource held by the other.',
  backpropagation: 'Sending error feedback backward through a neural network to measure how to adjust weights.',
  isotope: 'Atoms of the same element that have the same protons but different numbers of neutrons.',
};

export async function simplifyStudentNotes(rawText, levelId, apiKeys = {}) {
  const levelInfo = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  const geminiKey = typeof apiKeys === 'string' ? apiKeys : apiKeys?.gemini || '';

  if (geminiKey.trim()) {
    try {
      const prompt = `You are EduBuddy. Simplify the following dense academic notes for a "${levelInfo.label}" (${levelInfo.tagline}) student.
Return ONLY valid JSON:
{
  "tldr": "One crisp 1-2 sentence TL;DR",
  "simplifiedExplanation": "Clear rewritten explanation matching ${levelInfo.label} level",
  "keyTakeaways": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "analogy": "One relatable real-world analogy",
  "jargonGlossary": [{"term": "word", "plainMeaning": "simple meaning"}],
  "studyQuestions": ["Active recall question 1?", "Active recall question 2?", "Active recall question 3?"]
}
Notes:
"""${rawText.slice(0, 4000)}"""`;
      const res = await callGemini(geminiKey, prompt, true);
      return { ...JSON.parse(res), source: 'Live Gemini AI' };
    } catch {
      // Fallback to smart local summarizer
    }
  }

  const cleaned = rawText.replace(/\s+/g, ' ').trim();
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 18);

  const words = cleaned.toLowerCase().match(/[a-z]{4,}/g) || [];
  const freq = {};
  const stopwords = new Set([
    'that', 'this', 'with', 'from', 'have', 'they', 'their', 'which', 'when', 'where',
    'what', 'there', 'these', 'those', 'into', 'about', 'because', 'through', 'while',
    'between', 'being', 'more', 'most', 'also', 'such', 'only', 'then', 'than', 'very',
    'each', 'other', 'some', 'many', 'make', 'used', 'using', 'based', 'over', 'under',
    'computes', 'updates', 'causes', 'becomes', 'creates', 'allows', 'makes', 'directs',
    'induces', 'initiates', 'provided', 'respect', 'across', 'either', 'without',
  ]);
  for (const w of words) {
    if (!stopwords.has(w)) freq[w] = (freq[w] || 0) + 1;
  }

  const topKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  const scored = sentences.map((s, idx) => {
    const lower = s.toLowerCase();
    let score = idx === 0 ? 3 : 0;
    topKeywords.forEach((kw) => {
      if (lower.includes(kw)) score += 2;
    });
    if (s.length > 40 && s.length < 210) score += 1.5;
    return { s, score, idx };
  });

  const best = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(4, Math.max(2, sentences.length)))
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.s);

  const detectedJargon = [];
  for (const [term, meaning] of Object.entries(JARGON_DICTIONARY)) {
    if (cleaned.toLowerCase().includes(term)) {
      detectedJargon.push({
        term: term.charAt(0).toUpperCase() + term.slice(1),
        plainMeaning: meaning,
      });
    }
  }

  if (detectedJargon.length < 3) {
    const complexWords = [
      ...new Set(words.filter((w) => w.length >= 10 && !JARGON_DICTIONARY[w])),
    ].slice(0, 3 - detectedJargon.length);
    complexWords.forEach((cw) => {
      detectedJargon.push({
        term: cw.charAt(0).toUpperCase() + cw.slice(1),
        plainMeaning: `Key technical term appearing in your notes — connect it directly to "${topKeywords[0] || 'this topic'}".`,
      });
    });
  }

  const mainConcept = topKeywords[0]
    ? topKeywords[0].charAt(0).toUpperCase() + topKeywords[0].slice(1)
    : 'This topic';

  const levelPrefix = {
    eli5: `In plain everyday words: this passage explains how ${topKeywords.slice(0, 3).join(', ')} work together without overcomplicating it.`,
    highschool: `Core intuition: focus on how ${topKeywords.slice(0, 3).join(' and ')} connect through cause-and-effect steps.`,
    undergrad: `Structured academic synthesis: this excerpt defines the formal mechanisms linking ${topKeywords.slice(0, 3).join(', ')}.`,
    deepdive: `Exam-focused distillation: verify the underlying assumptions and edge cases governing ${topKeywords.slice(0, 3).join(', ')}.`,
  };

  return {
    source: 'EduBuddy Smart Mode',
    tldr: best[0] || cleaned.slice(0, 180),
    simplifiedExplanation: `${levelPrefix[levelId] || levelPrefix.highschool} ${best.slice(0, 2).join(' ')}`,
    keyTakeaways: best.length > 0 ? best : [cleaned.slice(0, 160)],
    analogy: `Think of "${mainConcept}" like a relay team: each stage passes its result cleanly to the next step (${topKeywords.slice(0, 3).join(' → ')}). If one runner drops the baton, the final output changes!`,
    jargonGlossary: detectedJargon,
    studyQuestions: [
      `In your own words, how would you explain "${mainConcept}" to a friend in 20 seconds?`,
      `How do ${topKeywords[0] || 'the main concept'} and ${topKeywords[1] || 'its supporting mechanism'} depend on each other?`,
      `What happens to the outcome if one key condition described in these notes is removed or reversed?`,
    ],
  };
}
