import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  ArrowRight,
  MessageSquareText,
  BookOpen,
  BrainCircuit,
  FileText,
  BarChart3,
  History,
  Zap,
  Flame,
  Loader2,
  Compass,
} from 'lucide-react';
import { LEVELS } from '../data/knowledgeBase';

const STARTER_PROMPTS = [
  { label: 'What is Mitochondria?', mode: 'simplify' },
  { label: 'Explain Revolt of 1857 in one paragraph', mode: 'tutor' },
  { label: 'Neural Networks & Backpropagation', mode: 'simplify' },
  { label: 'What is Luxury?', mode: 'simplify' },
  { label: 'Dynamic Programming (DP)', mode: 'simplify' },
  { label: 'How does Photosynthesis work?', mode: 'tutor' },
];

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeHub({
  level,
  setLevel,
  xp,
  streak,
  topicsCount,
  historyCount,
  connectedAICount,
  isGenerating,
  onOmniSearch,
  onNavigate,
  recentSearches = [],
  onSelectHistoryItem,
}) {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('simplify'); // 'simplify' | 'tutor'
  const [glow, setGlow] = useState({ x: 50, y: 38 });

  const currentLevelObj = LEVELS.find((l) => l.id === level) || LEVELS[1];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isGenerating) return;
    onOmniSearch(query.trim(), searchMode);
    setQuery('');
  };

  const BENTO_TOOLS = [
    {
      id: 'simplifier',
      title: 'Concept Simplifier',
      subtitle: '4-level adaptive breakdowns, animated SVG concept maps & real-world analogies',
      meta: `${topicsCount} curated + live topics`,
      icon: Sparkles,
      accent: '#6366f1',
      featured: true,
    },
    {
      id: 'tutor',
      title: 'AI Socratic Tutor',
      subtitle: 'Multi-web search + Gemini, ChatGPT & Claude consensus with citations',
      meta: connectedAICount > 0 ? `${connectedAICount} live AI connected` : 'Multi-Web Engine active',
      icon: MessageSquareText,
      accent: '#38bdf8',
      featured: true,
    },
    {
      id: 'practice',
      title: 'Timed Quiz & Flashcards',
      subtitle: 'Same-domain quizzes with countdown timer + Exam POV & Quick Revision 3D decks',
      meta: 'Custom timer & count',
      icon: BrainCircuit,
      accent: '#f59e0b',
    },
    {
      id: 'resources',
      title: 'Resource Matcher',
      subtitle: 'Curated videos, labs & research papers ranked by % fit to your level',
      meta: `Tuned for ${currentLevelObj.shortLabel}`,
      icon: BookOpen,
      accent: '#10b981',
    },
    {
      id: 'notes',
      title: 'Note Simplifier',
      subtitle: 'Paste dense textbook paragraphs or upload .txt/.md for instant TL;DR & glossary',
      meta: 'Export Markdown',
      icon: FileText,
      accent: '#a855f7',
    },
    {
      id: 'history',
      title: 'Search History',
      subtitle: 'Revisit past topics organized by Today, Yesterday & exact day and date',
      meta: `${historyCount} saved searches`,
      icon: History,
      accent: '#ec4899',
    },
  ];

  return (
    <div className="page-container home-hub">
      {/* Apple × ChatGPT Hero Greeting & Direct Omni-Search Stage */}
      <section
        className="home-hero-stage"
        onMouseMove={handleMouseMove}
        style={{ '--hx': `${glow.x}%`, '--hy': `${glow.y}%` }}
      >
        <div className="home-aurora" aria-hidden="true" />

        <div className="home-status-row">
          <span className="pill-badge mb-0">
            <Sparkles size={13} />
            <span>EduBuddy Studio · AI Learning Platform</span>
          </span>
          <div className="home-live-pills">
            <span className="home-stat-chip">
              <Zap size={13} className="accent-amber" /> {xp} XP
            </span>
            <span className="home-stat-chip">
              <Flame size={13} className="accent-rose" /> {streak}d Streak
            </span>
          </div>
        </div>

        <div className="home-greeting-center">
          <h1 className="home-display-title">
            {getGreeting()}.{' '}
            <span className="hero-gradient-text">What do you want to master?</span>
          </h1>
          <p className="home-display-sub">
            Ask any academic question or drop in a complex topic — EduBuddy simplifies it to your
            exact understanding level, maps how ideas connect, and builds timed quizzes & flashcards.
          </p>

          {/* Direct Omni-Search Capsule */}
          <form className="home-omni-form" onSubmit={handleSubmit}>
            <div className="omni-mode-switch">
              <button
                type="button"
                className={`omni-mode-pill ${searchMode === 'simplify' ? 'active' : ''}`}
                onClick={() => setSearchMode('simplify')}
              >
                <Compass size={13} /> Simplify Topic
              </button>
              <button
                type="button"
                className={`omni-mode-pill ${searchMode === 'tutor' ? 'active' : ''}`}
                onClick={() => setSearchMode('tutor')}
              >
                <MessageSquareText size={13} /> Ask AI Tutor
              </button>
            </div>

            <div className="omni-input-row">
              <Search size={19} className="search-icon" />
              <input
                type="text"
                className="home-omni-input"
                placeholder={
                  searchMode === 'simplify'
                    ? 'Search any topic (e.g., "Mitochondria", "Revolt of 1857", "Matrices", "Luxury")...'
                    : 'Ask anything (e.g., "Explain Revolt of 1857 in one paragraph", "What is ATP?")...'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isGenerating}
              />
              <button
                type="submit"
                className="btn-primary omni-go-btn"
                disabled={isGenerating || !query.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="spin" /> Loading...
                  </>
                ) : (
                  <>
                    <span>{searchMode === 'simplify' ? 'Explore' : 'Ask'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Starter Prompt Chips */}
          <div className="home-starter-chips">
            {STARTER_PROMPTS.map((sp) => (
              <button
                key={sp.label}
                className="starter-chip"
                onClick={() => onOmniSearch(sp.label, sp.mode)}
                disabled={isGenerating}
              >
                <span className="starter-dot" />
                <span>{sp.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Instant Level Strip */}
      <div className="home-level-strip">
        <span className="muted-xs">Current Understanding Level:</span>
        <div className="flex-row gap-2 wrap">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              className={`mini-lvl-tag ${level === l.id ? 'active' : ''}`}
              style={{ '--lvl-color': l.color }}
              onClick={() => setLevel(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Handy Quick-Launch Bento Grid (All Sidebar Tools Right on Home!) */}
      <section className="home-bento-section">
        <div className="bento-section-head">
          <div>
            <h2>Your Learning Workspace</h2>
            <p className="muted-sm">Everything from your sidebar, one click away.</p>
          </div>
          <button className="btn-outline btn-sm" onClick={() => onNavigate('dashboard')}>
            <BarChart3 size={14} /> My Progress Dashboard
          </button>
        </div>

        <div className="home-bento-grid">
          {BENTO_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className={`bento-tool-card ${tool.featured ? 'featured' : ''}`}
                style={{ '--bento-accent': tool.accent }}
                onClick={() => onNavigate(tool.id)}
              >
                <div className="bento-card-top">
                  <div className="bento-icon-wrap">
                    <Icon size={20} />
                  </div>
                  <span className="bento-meta-pill">{tool.meta}</span>
                </div>
                <div className="bento-card-title">{tool.title}</div>
                <p className="bento-card-sub">{tool.subtitle}</p>
                <div className="bento-card-cta">
                  <span>Open tool</span>
                  <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Jump Back Into Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="card home-recent-strip">
          <div className="flex-row justify-between wrap gap-2 mb-2">
            <div className="flex-row gap-2">
              <History size={16} className="accent-indigo" />
              <h3>Continue Where You Left Off</h3>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => onNavigate('history')}>
              View full history →
            </button>
          </div>
          <div className="home-recent-pills">
            {recentSearches.slice(0, 5).map((item) => (
              <button
                key={item.id}
                className="topic-chip"
                onClick={() => onSelectHistoryItem(item)}
              >
                <span>{item.query}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
