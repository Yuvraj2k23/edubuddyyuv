import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpRight,
  Timer,
  Play,
  Pause,
  Sliders,
  AlertCircle,
  Loader2,
  Clock,
  Target,
  RefreshCw,
  Shuffle,
} from 'lucide-react';
import { LEVELS } from '../data/knowledgeBase';
import { buildAdaptiveQuizSet, buildAdaptiveFlashcardDeck } from '../utils/quizGenerator';
import { generateLiveQuizWithAI, generateLiveFlashcardsWithAI } from '../utils/aiEngine';

const DIFFICULTY_CHOICES = [
  { id: 'eli5', label: 'Easy', desc: 'Beginner intuition', color: '#10b981' },
  { id: 'highschool', label: 'Medium', desc: 'High school logic', color: '#3b82f6' },
  { id: 'undergrad', label: 'Hard', desc: 'Undergrad rigor', color: '#8b5cf6' },
  { id: 'deepdive', label: 'Exam Mastery', desc: 'Traps & edge cases', color: '#f59e0b' },
  { id: 'mixed', label: 'Adaptive Mix', desc: 'Progressive challenge', color: '#ec4899' },
];

const QUESTION_COUNTS = [3, 5, 8, 10];

const TIME_PRESETS = [
  { minutes: 0, label: 'No Timer' },
  { minutes: 1, label: '1 Min' },
  { minutes: 2, label: '2 Min' },
  { minutes: 5, label: '5 Min' },
  { minutes: 10, label: '10 Min' },
];

function formatSeconds(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function QuizAndFlashcards({
  activeTopic,
  level,
  setLevel,
  apiKeys,
  onQuizComplete,
  masteredCardIds,
  onToggleCardMastered,
}) {
  const [subTab, setSubTab] = useState('quiz'); // 'quiz' | 'flashcards'

  // Quiz Setup Configuration
  const [difficulty, setDifficulty] = useState(level || 'highschool');
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimitMin, setTimeLimitMin] = useState(2); // 0 = untimed
  const [customMinInput, setCustomMinInput] = useState('');

  // Quiz Runtime State
  const [phase, setPhase] = useState('setup'); // 'setup' | 'loading' | 'active' | 'results'
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [answersLog, setAnswersLog] = useState([]);
  const [quizSourceLabel, setQuizSourceLabel] = useState('Domain-Aware Adaptive Engine');

  // Timer State
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const finishTriggeredRef = useRef(false);

  // Flashcards Studio state
  const [fcMode, setFcMode] = useState('exam'); // 'exam' | 'revision'
  const [fcCount, setFcCount] = useState(5);
  const [fcCustomCount, setFcCustomCount] = useState('');
  const [fcDeck, setFcDeck] = useState([]);
  const [fcLoading, setFcLoading] = useState(false);
  const [fcExamOnlyFilter, setFcExamOnlyFilter] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Reset to clean setup screen & build default flashcard deck whenever the active topic changes
  useEffect(() => {
    setPhase('setup');
    setQuestions([]);
    setQIndex(0);
    setSelectedOpt(null);
    setShowHint(false);
    setScore(0);
    setAnswersLog([]);
    setTimedOut(false);
    setTimerPaused(false);
    finishTriggeredRef.current = false;
    setCardIdx(0);
    setFlipped(false);
    setFcExamOnlyFilter(false);
    setFcDeck(buildAdaptiveFlashcardDeck(activeTopic, fcMode, fcCount));
  }, [activeTopic.id]);

  const handleGenerateFlashcards = async (overrideMode = fcMode, overrideCount = fcCount) => {
    setFcLoading(true);
    setFlipped(false);
    setCardIdx(0);
    setFcExamOnlyFilter(false);
    try {
      let liveCards = null;
      if (apiKeys?.gemini?.trim()) {
        liveCards = await generateLiveFlashcardsWithAI({
          topic: activeTopic,
          mode: overrideMode,
          count: overrideCount,
          apiKeys,
        });
      }
      if (liveCards && liveCards.length > 0) {
        setFcDeck(liveCards);
      } else {
        setFcDeck(buildAdaptiveFlashcardDeck(activeTopic, overrideMode, overrideCount));
      }
    } catch {
      setFcDeck(buildAdaptiveFlashcardDeck(activeTopic, overrideMode, overrideCount));
    } finally {
      setFcLoading(false);
    }
  };

  const handleShuffleDeck = () => {
    setFlipped(false);
    setCardIdx(0);
    setFcDeck((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  };

  const visibleCards =
    fcMode === 'exam' && fcExamOnlyFilter
      ? fcDeck.filter((c) => c.badgeType !== 'knowledge-only')
      : fcDeck;
  const safeCardIdx = visibleCards.length ? Math.min(cardIdx, visibleCards.length - 1) : 0;

  // Countdown & elapsed timer loop during active quiz
  useEffect(() => {
    if (phase !== 'active' || timerPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((e) => e + 1);
      if (timeLimitMin > 0) {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (!finishTriggeredRef.current) {
              finishTriggeredRef.current = true;
              setTimedOut(true);
              setPhase('results');
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, timerPaused, timeLimitMin]);

  // Trigger XP completion callback once upon entering results
  useEffect(() => {
    if (phase === 'results' && questions.length > 0) {
      onQuizComplete({
        topicId: activeTopic.id,
        topicTitle: activeTopic.title,
        score,
        total: questions.length,
      });
    }
  }, [phase]);

  const startQuiz = async () => {
    setPhase('loading');
    finishTriggeredRef.current = false;
    setTimedOut(false);
    setTimerPaused(false);
    setQIndex(0);
    setSelectedOpt(null);
    setShowHint(false);
    setScore(0);
    setAnswersLog([]);
    setElapsedSeconds(0);
    setSecondsLeft(timeLimitMin > 0 ? Math.round(timeLimitMin * 60) : 0);

    try {
      let generated = null;
      if (apiKeys?.gemini?.trim()) {
        generated = await generateLiveQuizWithAI({
          topic: activeTopic,
          difficulty,
          count: questionCount,
          apiKeys,
        });
      }

      if (generated && generated.length > 0) {
        setQuestions(generated);
        setQuizSourceLabel('Live Gemini AI Exam Generator');
      } else {
        const smartSet = buildAdaptiveQuizSet(activeTopic, difficulty, questionCount);
        setQuestions(smartSet);
        setQuizSourceLabel('Same-Domain Challenging Engine');
      }
      setPhase('active');
    } catch {
      const smartSet = buildAdaptiveQuizSet(activeTopic, difficulty, questionCount);
      setQuestions(smartSet);
      setQuizSourceLabel('Same-Domain Challenging Engine');
      setPhase('active');
    }
  };

  const currentQ = questions[qIndex];
  const currentCard = visibleCards[safeCardIdx];
  const currentCardId = currentCard?.id || `${activeTopic.id}-card-${safeCardIdx}`;
  const isCardMastered = masteredCardIds.includes(currentCardId);

  const handleSelectOption = (idx) => {
    if (selectedOpt !== null || !currentQ) return;
    setSelectedOpt(idx);
    const isRight = idx === currentQ.correctIndex;
    if (isRight) {
      setScore((s) => s + 1);
    }
    setAnswersLog((prev) => [
      ...prev,
      {
        question: currentQ.question,
        chosen: currentQ.options[idx],
        correct: currentQ.options[currentQ.correctIndex],
        isRight,
        explanation: currentQ.explanation,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
      setSelectedOpt(null);
      setShowHint(false);
    } else {
      finishTriggeredRef.current = true;
      setPhase('results');
    }
  };

  const handleCustomMinApply = (val) => {
    setCustomMinInput(val);
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 120) {
      setTimeLimitMin(parsed);
    }
  };

  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const currentLevelIdx = LEVELS.findIndex((l) => l.id === level);
  const recommendedLevel =
    pct >= 80 && currentLevelIdx < LEVELS.length - 1
      ? LEVELS[currentLevelIdx + 1]
      : pct < 60 && currentLevelIdx > 0
      ? LEVELS[currentLevelIdx - 1]
      : null;

  const timerUrgency =
    timeLimitMin > 0 && secondsLeft <= 10
      ? 'danger'
      : timeLimitMin > 0 && secondsLeft <= 30
      ? 'warn'
      : 'normal';

  const selectedDiffObj =
    DIFFICULTY_CHOICES.find((d) => d.id === difficulty) || DIFFICULTY_CHOICES[1];

  return (
    <div className="page-container">
      <div className="page-header-card compact">
        <div>
          <div className="pill-badge">
            <BrainCircuit size={13} />
            <span>Timed Adaptive Quiz & 3D Active Recall</span>
          </div>
          <h1 className="page-title">Practice: {activeTopic.title}</h1>
          <p className="page-subtitle">
            Customize your difficulty, question count, and self-stipulated exam timer with plausible same-subject options — or drill 3D flashcards.
          </p>
        </div>

        <div className="segmented-tabs">
          <button
            className={`seg-btn ${subTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setSubTab('quiz')}
          >
            Timed Adaptive Quiz
          </button>
          <button
            className={`seg-btn ${subTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setSubTab('flashcards')}
          >
            3D Flashcards ({visibleCards.length})
          </button>
        </div>
      </div>

      {subTab === 'quiz' ? (
        <div className="card quiz-card">
          {phase === 'setup' && (
            <div className="quiz-setup-studio">
              <div className="setup-head">
                <div className="flex-row gap-2">
                  <Sliders size={18} className="accent-indigo" />
                  <h2>Configure Your Quiz Session</h2>
                </div>
                <span className="subject-pill">{activeTopic.subject}</span>
              </div>
              <p className="muted-sm mb-3">
                All 4 choices in every question stay strictly within <strong>{activeTopic.subject}</strong> so you genuinely test your mastery.
              </p>

              {/* 1. Difficulty Level Selector */}
              <div className="setup-block">
                <div className="setup-label">1. Select Difficulty Level</div>
                <div className="setup-diff-grid">
                  {DIFFICULTY_CHOICES.map((d) => (
                    <button
                      key={d.id}
                      className={`diff-choice-card ${difficulty === d.id ? 'active' : ''}`}
                      style={{ '--d-color': d.color }}
                      onClick={() => setDifficulty(d.id)}
                    >
                      <div className="diff-choice-name">{d.label}</div>
                      <div className="diff-choice-desc">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Number of Questions */}
              <div className="setup-block">
                <div className="setup-label">2. Number of Questions</div>
                <div className="setup-pills-row">
                  {QUESTION_COUNTS.map((cnt) => (
                    <button
                      key={cnt}
                      className={`setup-pill ${questionCount === cnt ? 'active' : ''}`}
                      onClick={() => setQuestionCount(cnt)}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Stipulated Time Limit */}
              <div className="setup-block">
                <div className="setup-label">
                  <Timer size={14} /> 3. Stipulated Time Limit
                </div>
                <div className="setup-pills-row">
                  {TIME_PRESETS.map((tp) => (
                    <button
                      key={tp.label}
                      className={`setup-pill ${
                        timeLimitMin === tp.minutes && !customMinInput ? 'active' : ''
                      }`}
                      onClick={() => {
                        setTimeLimitMin(tp.minutes);
                        setCustomMinInput('');
                      }}
                    >
                      {tp.label}
                    </button>
                  ))}
                  <div className="custom-time-input-wrap">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      step="1"
                      className="custom-min-input"
                      placeholder="Custom"
                      value={customMinInput}
                      onChange={(e) => handleCustomMinApply(e.target.value)}
                    />
                    <span className="muted-xs">min</span>
                  </div>
                </div>
              </div>

              {/* Summary & Start CTA */}
              <div className="setup-launch-bar">
                <div className="launch-summary">
                  <strong>{questionCount} Questions</strong> ·{' '}
                  <span style={{ color: selectedDiffObj.color }}>{selectedDiffObj.label}</span> ·{' '}
                  <span>
                    {timeLimitMin > 0 ? `${timeLimitMin} min countdown` : 'Untimed practice'}
                  </span>
                </div>
                <button className="btn-primary" onClick={startQuiz}>
                  <Play size={16} />
                  <span>{timeLimitMin > 0 ? 'Start Timed Quiz' : 'Start Practice Quiz'}</span>
                </button>
              </div>
            </div>
          )}

          {phase === 'loading' && (
            <div className="quiz-loading-box">
              <Loader2 size={28} className="spin accent-indigo" />
              <h3>Crafting {questionCount} challenging {activeTopic.subject} questions…</h3>
              <p className="muted-sm">Building plausible same-domain choices for {selectedDiffObj.label} difficulty.</p>
            </div>
          )}

          {phase === 'active' && currentQ && (
            <div>
              {/* Live Exam HUD */}
              <div className="exam-hud-bar">
                <div className="flex-row gap-2 wrap">
                  <span className="subject-pill">
                    Q {qIndex + 1} / {questions.length}
                  </span>
                  <span className="meta-pill">{selectedDiffObj.label}</span>
                  <span className="muted-xs">{quizSourceLabel}</span>
                </div>

                <div className="flex-row gap-2">
                  {timeLimitMin > 0 ? (
                    <div className={`timer-pill ${timerUrgency}`}>
                      <Timer size={15} />
                      <span className="timer-digits">{formatSeconds(secondsLeft)}</span>
                      <button
                        className="timer-pause-btn"
                        onClick={() => setTimerPaused((p) => !p)}
                        title={timerPaused ? 'Resume timer' : 'Pause timer'}
                        aria-label={timerPaused ? 'Resume timer' : 'Pause timer'}
                      >
                        {timerPaused ? <Play size={12} /> : <Pause size={12} />}
                      </button>
                    </div>
                  ) : (
                    <div className="timer-pill normal">
                      <Clock size={14} />
                      <span className="timer-digits">{formatSeconds(elapsedSeconds)}</span>
                    </div>
                  )}

                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => setPhase('setup')}
                    title="Change difficulty, count, or timer"
                  >
                    <Sliders size={13} /> Setup
                  </button>
                </div>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      ((qIndex + (selectedOpt !== null ? 1 : 0)) / Math.max(1, questions.length)) * 100
                    }%`,
                  }}
                />
              </div>

              {timerPaused && (
                <div className="paused-banner">
                  <Pause size={15} /> Quiz timer paused — click Resume when you're ready to continue.
                </div>
              )}

              <h3 className="quiz-question">{currentQ.question}</h3>

              <div className="quiz-options">
                {currentQ.options.map((opt, idx) => {
                  let stateClass = '';
                  if (selectedOpt !== null) {
                    if (idx === currentQ.correctIndex) stateClass = 'correct';
                    else if (idx === selectedOpt) stateClass = 'wrong';
                    else stateClass = 'dimmed';
                  }
                  return (
                    <button
                      key={idx}
                      className={`quiz-opt-btn ${stateClass}`}
                      onClick={() => handleSelectOption(idx)}
                      disabled={selectedOpt !== null || timerPaused}
                    >
                      <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                      <span className="opt-text">{opt}</span>
                      {selectedOpt !== null && idx === currentQ.correctIndex && (
                        <CheckCircle2 size={18} className="opt-icon ok" />
                      )}
                      {selectedOpt !== null && idx === selectedOpt && idx !== currentQ.correctIndex && (
                        <XCircle size={18} className="opt-icon bad" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedOpt === null && currentQ.hint && (
                <div className="hint-row">
                  {showHint ? (
                    <div className="hint-box">
                      <Lightbulb size={15} className="accent-amber" />
                      <span>{currentQ.hint}</span>
                    </div>
                  ) : (
                    <button className="btn-ghost btn-sm" onClick={() => setShowHint(true)}>
                      <Lightbulb size={14} /> Need a hint?
                    </button>
                  )}
                </div>
              )}

              {selectedOpt !== null && (
                <div className="explanation-feedback">
                  <div className="feedback-head">
                    {selectedOpt === currentQ.correctIndex ? '✅ Spot on!' : '💡 Let\'s clarify:'}
                  </div>
                  <p>{currentQ.explanation}</p>
                  <button className="btn-primary mt-3" onClick={handleNextQuestion}>
                    {qIndex + 1 < questions.length ? 'Next Question →' : 'See Final Results'}
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === 'results' && (
            <div className="quiz-result-box">
              {timedOut && (
                <div className="timeout-banner">
                  <AlertCircle size={16} />
                  <span>Time's up! Your completed answers were submitted automatically.</span>
                </div>
              )}
              <div className="trophy-ring">
                <Trophy size={34} />
              </div>
              <h2>{timedOut ? 'Timed Session Ended' : 'Quiz Complete!'}</h2>
              <div className="score-display">
                {score} / {questions.length} Correct ({pct}%)
              </div>

              <div className="result-stats-strip">
                <span className="meta-pill">
                  <Timer size={13} /> Time Used: {formatSeconds(elapsedSeconds)}
                  {timeLimitMin > 0 ? ` / ${formatSeconds(timeLimitMin * 60)}` : ''}
                </span>
                <span className="meta-pill">Difficulty: {selectedDiffObj.label}</span>
                <span className="meta-pill">Answered: {answersLog.length}/{questions.length}</span>
              </div>

              <p className="result-msg">
                {pct >= 80
                  ? 'Outstanding mastery! You handled challenging same-subject options with precision.'
                  : pct >= 50
                  ? 'Solid work! Review any missed explanations below, then retry under a tighter timer.'
                  : 'Good warm-up! Review the concepts or switch to Easy difficulty to build confidence.'}
              </p>

              {recommendedLevel && (
                <div className="adaptive-rec-banner">
                  <Sparkles size={18} className="accent-indigo" />
                  <div>
                    <strong>Adaptive Recommendation:</strong>{' '}
                    {pct >= 80
                      ? `You're ready to level up to ${recommendedLevel.label}!`
                      : `Try switching to ${recommendedLevel.label} for clearer intuition.`}
                  </div>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => setLevel(recommendedLevel.id)}
                  >
                    Switch to {recommendedLevel.shortLabel} <ArrowUpRight size={14} />
                  </button>
                </div>
              )}

              {answersLog.length > 0 && (
                <div className="review-list">
                  <div className="review-heading">Answer Review</div>
                  {answersLog.map((item, idx) => (
                    <div key={idx} className={`review-item ${item.isRight ? 'ok' : 'bad'}`}>
                      <div className="review-q">
                        <strong>Q{idx + 1}:</strong> {item.question}
                      </div>
                      <div className="review-ans">
                        Your answer: <span>{item.chosen}</span>
                        {!item.isRight && (
                          <>
                            {' '}· Correct: <strong>{item.correct}</strong>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-row gap-3 justify-center mt-4 wrap">
                <button className="btn-primary" onClick={startQuiz}>
                  <RotateCcw size={15} /> Retake Quiz
                </button>
                <button className="btn-outline" onClick={() => setPhase('setup')}>
                  <Sliders size={15} /> Change Difficulty / Timer
                </button>
                <button className="btn-outline" onClick={() => setSubTab('flashcards')}>
                  <Layers size={15} /> Review Flashcards
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flashcard-workspace">
          {/* Flashcard Studio Configurator */}
          <div className="card fc-studio-card">
            <div className="fc-studio-top">
              <div className="flex-row gap-2">
                <Sparkles size={17} className="accent-indigo" />
                <h3>AI Flashcard Studio</h3>
              </div>
              <div className="flex-row gap-2">
                <button className="btn-ghost btn-sm" onClick={handleShuffleDeck} title="Shuffle cards">
                  <Shuffle size={14} /> Shuffle
                </button>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => handleGenerateFlashcards(fcMode, fcCount)}
                  disabled={fcLoading}
                >
                  {fcLoading ? (
                    <>
                      <Loader2 size={14} className="spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate {fcCount} Cards
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Purpose Selector: Exam Perspective vs Quick Revision */}
            <div className="fc-mode-grid">
              <button
                className={`fc-mode-btn ${fcMode === 'exam' ? 'active' : ''}`}
                onClick={() => {
                  setFcMode('exam');
                  handleGenerateFlashcards('exam', fcCount);
                }}
              >
                <div className="flex-row gap-2 mb-1">
                  <Target size={16} className="accent-amber" />
                  <strong>Exam Perspective</strong>
                </div>
                <span className="muted-xs">
                  Focuses on high-yield exam concepts & explicitly labels extra cards as "Not Exam POV · Just for Knowledge".
                </span>
              </button>

              <button
                className={`fc-mode-btn ${fcMode === 'revision' ? 'active' : ''}`}
                onClick={() => {
                  setFcMode('revision');
                  handleGenerateFlashcards('revision', fcCount);
                }}
              >
                <div className="flex-row gap-2 mb-1">
                  <RefreshCw size={16} className="accent-emerald" />
                  <strong>Quick Revision</strong>
                </div>
                <span className="muted-xs">
                  Rapid-fire 1-line summaries, step checks, memory hooks & active-recall drills for fast review.
                </span>
              </button>
            </div>

            {/* Count Selector + Exam Filter */}
            <div className="fc-controls-row">
              <div className="flex-row gap-2 wrap">
                <span className="setup-label">Cards:</span>
                {[3, 5, 8, 10].map((cnt) => (
                  <button
                    key={cnt}
                    className={`setup-pill sm ${fcCount === cnt && !fcCustomCount ? 'active' : ''}`}
                    onClick={() => {
                      setFcCount(cnt);
                      setFcCustomCount('');
                      handleGenerateFlashcards(fcMode, cnt);
                    }}
                  >
                    {cnt}
                  </button>
                ))}
                <div className="custom-time-input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="15"
                    step="1"
                    className="custom-min-input"
                    placeholder="Custom"
                    value={fcCustomCount}
                    onChange={(e) => {
                      setFcCustomCount(e.target.value);
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v) && v >= 1 && v <= 15) {
                        setFcCount(v);
                      }
                    }}
                  />
                  <span className="muted-xs">cards</span>
                </div>
              </div>

              {fcMode === 'exam' && (
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={fcExamOnlyFilter}
                    onChange={(e) => {
                      setFcExamOnlyFilter(e.target.checked);
                      setCardIdx(0);
                      setFlipped(false);
                    }}
                  />
                  <span className="muted-xs">Exam POV Only (hide bonus knowledge cards)</span>
                </label>
              )}
            </div>
          </div>

          {fcLoading ? (
            <div className="card quiz-loading-box">
              <Loader2 size={26} className="spin accent-indigo" />
              <h3>Generating {fcCount} {fcMode === 'exam' ? 'Exam Perspective' : 'Quick Revision'} flashcards…</h3>
            </div>
          ) : !currentCard ? (
            <div className="card empty-state">No flashcards available for this filter.</div>
          ) : (
            <>
              <div className="flashcard-top-meta">
                <span className="muted-sm">
                  Card {safeCardIdx + 1} of {visibleCards.length} · Click card to flip
                </span>
                <span className="subject-pill">
                  {visibleCards.filter((c) => masteredCardIds.includes(c.id)).length} / {visibleCards.length} Mastered
                </span>
              </div>

              <div
                className={`flashcard-scene ${flipped ? 'is-flipped' : ''}`}
                onClick={() => setFlipped((f) => !f)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setFlipped((f) => !f);
                  }
                }}
              >
                <div className="flashcard-inner">
                  <div className="flashcard-face front">
                    <div className="fc-face-top">
                      <span className={`fc-pov-badge ${currentCard.badgeType || 'exam-high'}`}>
                        {currentCard.badge || (fcMode === 'exam' ? 'High-Yield · Exam POV' : 'Quick Revision')}
                      </span>
                    </div>
                    <div className="face-text">{currentCard.front}</div>
                    <div className="fc-face-bottom">
                      {currentCard.povNote && (
                        <div
                          className={`fc-pov-note ${
                            currentCard.badgeType === 'knowledge-only' ? 'bonus' : ''
                          }`}
                        >
                          {currentCard.povNote}
                        </div>
                      )}
                      <div className="flip-cue">Click or press Space to reveal answer</div>
                    </div>
                  </div>
                  <div className="flashcard-face back">
                    <div className="fc-face-top">
                      <span className="fc-pov-badge back-pill">
                        ANSWER · {currentCard.badge || 'ACTIVE RECALL'}
                      </span>
                    </div>
                    <div className="face-text">{currentCard.back}</div>
                    {currentCard.mnemonic && (
                      <div className="mnemonic-pill">
                        <Sparkles size={14} />
                        <span>{currentCard.mnemonic}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flashcard-controls">
                <button
                  className="btn-outline"
                  onClick={() => {
                    setFlipped(false);
                    setCardIdx((i) => (i - 1 + visibleCards.length) % visibleCards.length);
                  }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <button
                  className={isCardMastered ? 'btn-success' : 'btn-primary'}
                  onClick={() => onToggleCardMastered(currentCardId)}
                >
                  <CheckCircle2 size={16} />
                  <span>{isCardMastered ? 'Mastered!' : 'Mark Mastered (+20 XP)'}</span>
                </button>

                <button
                  className="btn-outline"
                  onClick={() => {
                    setFlipped(false);
                    setCardIdx((i) => (i + 1) % visibleCards.length);
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
