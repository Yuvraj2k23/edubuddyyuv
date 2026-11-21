import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Volume2,
  Square,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Compass,
  Clock,
  BookOpen,
  BrainCircuit,
  MessageSquareText,
  Loader2,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  XCircle,
  Sparkle,
} from 'lucide-react';
import { LEVELS, SUBJECTS } from '../data/knowledgeBase';
import { fetchWikiSectionDetail } from '../utils/aiEngine';

function ConceptMapSVG({ conceptMap, selectedNode, setSelectedNode, accentColor }) {
  const [sectionCache, setSectionCache] = useState({});
  const [loadingKey, setLoadingKey] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const nodes = conceptMap?.nodes?.slice(0, 5) || [];
  const activeNode = nodes[selectedNode];

  // Prefetch all live Wikipedia section summaries in the background so hover previews are instant!
  useEffect(() => {
    const toFetch = nodes.filter(
      (n) => n.wikiPage && n.sectionIndex && !sectionCache[`${n.wikiPage}::${n.sectionIndex}`]
    );
    if (toFetch.length === 0) return;

    let cancelled = false;
    const activeKey =
      activeNode?.wikiPage && activeNode?.sectionIndex
        ? `${activeNode.wikiPage}::${activeNode.sectionIndex}`
        : null;
    if (activeKey && !sectionCache[activeKey]) {
      setLoadingKey(activeKey);
    }

    toFetch.forEach((n) => {
      const cacheKey = `${n.wikiPage}::${n.sectionIndex}`;
      fetchWikiSectionDetail(n.wikiPage, n.sectionIndex, n.label)
        .then((text) => {
          if (!cancelled && text) {
            setSectionCache((prev) => ({ ...prev, [cacheKey]: text }));
          }
        })
        .finally(() => {
          if (!cancelled && cacheKey === activeKey) {
            setLoadingKey((curr) => (curr === cacheKey ? null : curr));
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, [conceptMap?.center, nodes.length]);

  // Also ensure the currently selected node shows loading state if clicked before prefetch completes
  useEffect(() => {
    if (!activeNode?.wikiPage || !activeNode?.sectionIndex) return;
    const cacheKey = `${activeNode.wikiPage}::${activeNode.sectionIndex}`;
    if (sectionCache[cacheKey]) {
      if (loadingKey === cacheKey) setLoadingKey(null);
      return;
    }

    let cancelled = false;
    setLoadingKey(cacheKey);
    fetchWikiSectionDetail(activeNode.wikiPage, activeNode.sectionIndex, activeNode.label)
      .then((text) => {
        if (!cancelled && text) {
          setSectionCache((prev) => ({ ...prev, [cacheKey]: text }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingKey((curr) => (curr === cacheKey ? null : curr));
      });

    return () => {
      cancelled = true;
    };
  }, [activeNode?.wikiPage, activeNode?.sectionIndex, activeNode?.label]);

  if (!nodes.length) return null;
  const cx = 250;
  const cy = 168;
  const rx = 164;
  const ry = 120;

  const getNodeText = (node) => {
    if (!node) return '';
    const key = node.wikiPage && node.sectionIndex ? `${node.wikiPage}::${node.sectionIndex}` : null;
    return (key && sectionCache[key]) || node.detail || '';
  };

  const makeHoverSnippet = (text) => {
    if (!text) return 'Fetching preview...';
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= 135) return clean;
    const cut = clean.slice(0, 135);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
  };

  const activeCacheKey =
    activeNode?.wikiPage && activeNode?.sectionIndex
      ? `${activeNode.wikiPage}::${activeNode.sectionIndex}`
      : null;
  const resolvedDetail = getNodeText(activeNode);
  const isFetchingNode = Boolean(
    activeCacheKey && loadingKey === activeCacheKey && !sectionCache[activeCacheKey]
  );

  // Compute hovered tooltip info (only when hovering a different node than the currently selected one)
  const hoveredObj =
    hoveredNode !== null && hoveredNode !== selectedNode ? nodes[hoveredNode] : null;
  let tooltipStyle = null;
  if (hoveredObj) {
    const angle = (hoveredNode * 2 * Math.PI) / nodes.length - Math.PI / 2;
    const nx = cx + rx * Math.cos(angle);
    const ny = cy + ry * Math.sin(angle);
    const leftPct = Math.min(72, Math.max(28, (nx / 500) * 100));
    const showBelow = ny < 120;
    const topPct = showBelow ? ((ny + 28) / 336) * 100 : ((ny - 28) / 336) * 100;
    tooltipStyle = {
      left: `${leftPct}%`,
      top: `${topPct}%`,
      transform: showBelow ? 'translate(-50%, 6px)' : 'translate(-50%, calc(-100% - 6px))',
    };
  }

  return (
    <div className="concept-map-wrap">
      <div className="concept-map-stage" onMouseLeave={() => setHoveredNode(null)}>
        <svg viewBox="0 0 500 344" className="concept-map-svg" role="img" aria-label="Interactive concept map">
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.34" />
              <stop offset="55%" stopColor={accentColor} stopOpacity="0.10" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="centerPillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={accentColor} floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Subtle ambient orbital rings like an Apple Silicon neural diagram */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 7"
            className="map-orbit-ring"
          />
          <circle cx={cx} cy={cy} r="84" fill="url(#centerGlow)" />
          <circle
            cx={cx}
            cy={cy}
            r="52"
            fill="none"
            stroke={accentColor}
            strokeWidth="1.2"
            className="map-pulse-ring"
          />

          {/* Connector wires — terminated cleanly at node perimeters with animated energy spark on active wire */}
          {nodes.map((node, i) => {
            const angle = (i * 2 * Math.PI) / nodes.length - Math.PI / 2;
            const nx = cx + rx * Math.cos(angle);
            const ny = cy + ry * Math.sin(angle);
            const dx = nx - cx;
            const dy = ny - cy;
            const dist = Math.hypot(dx, dy) || 1;
            // Shorten start & end so wire connects cleanly to the outer edges (never cuts through text!)
            const startX = cx + (dx / dist) * 40;
            const startY = cy + (dy / dist) * 24;
            const endX = nx - (dx / dist) * 50;
            const endY = ny - (dy / dist) * 24;
            const isSelected = selectedNode === i;
            const isHovered = hoveredNode === i;
            const pathId = `wire-path-${i}`;
            const dPath = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
            return (
              <g key={`wire-${node.label}`}>
                <path
                  id={pathId}
                  d={dPath}
                  fill="none"
                  stroke={isSelected || isHovered ? accentColor : 'var(--border-strong)'}
                  strokeWidth={isSelected ? 2.4 : isHovered ? 2 : 1.3}
                  strokeDasharray={isSelected ? 'none' : '5 5'}
                  strokeLinecap="round"
                  className={isSelected ? 'map-wire-active' : 'map-wire-idle'}
                />
                {(isSelected || isHovered) && (
                  <>
                    <circle cx={endX} cy={endY} r="3.5" fill={accentColor} />
                    <circle r="4" fill="#ffffff" stroke={accentColor} strokeWidth="2">
                      <animateMotion dur="1.7s" repeatCount="indefinite" path={dPath} />
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {/* Center Core Pill */}
          <g className="map-center-group">
            <rect
              x={cx - 72}
              y={cy - 23}
              width="144"
              height="46"
              rx="23"
              fill="url(#centerPillGrad)"
              className="map-center-rect"
            />
            <rect
              x={cx - 71}
              y={cy - 22}
              width="142"
              height="44"
              rx="22"
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1"
            />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11.5"
              fontWeight="800"
            >
              {conceptMap.center.length > 19
                ? `${conceptMap.center.slice(0, 18)}…`
                : conceptMap.center}
            </text>
          </g>

          {/* Satellite Nodes — solid opaque backing so zero lines ever bleed through text */}
          {nodes.map((node, i) => {
            const angle = (i * 2 * Math.PI) / nodes.length - Math.PI / 2;
            const nx = cx + rx * Math.cos(angle);
            const ny = cy + ry * Math.sin(angle);
            const isSelected = selectedNode === i;
            const isHovered = hoveredNode === i;
            const label = node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label;
            return (
              <g
                key={node.label}
                className={`map-sat-node ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                onClick={() => {
                  setSelectedNode(i);
                  setHoveredNode(null);
                }}
                onMouseEnter={() => setHoveredNode(i)}
                onMouseLeave={() => setHoveredNode((curr) => (curr === i ? null : curr))}
                style={{ cursor: 'pointer' }}
              >
                {/* Solid opaque card base */}
                <rect
                  x={nx - 75}
                  y={ny - 22}
                  width="150"
                  height="44"
                  rx="13"
                  fill="var(--map-node-solid)"
                  filter={isSelected ? 'url(#nodeGlow)' : undefined}
                />
                {/* Subtle luminous active tint overlay */}
                <rect
                  x={nx - 75}
                  y={ny - 22}
                  width="150"
                  height="44"
                  rx="13"
                  fill={isSelected ? accentColor : isHovered ? accentColor : 'transparent'}
                  fillOpacity={isSelected ? 0.16 : isHovered ? 0.09 : 0}
                  stroke={isSelected || isHovered ? accentColor : 'var(--border-strong)'}
                  strokeWidth={isSelected ? 2 : isHovered ? 1.6 : 1.1}
                />
                {/* Active status dot */}
                <circle
                  cx={nx - 63}
                  cy={ny - 10}
                  r="2.8"
                  fill={isSelected || isHovered ? accentColor : 'var(--border-strong)'}
                />
                <text
                  x={nx}
                  y={ny - 2}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="10.8"
                  fontWeight="700"
                >
                  {label}
                </text>
                <text
                  x={nx}
                  y={ny + 13}
                  textAnchor="middle"
                  fill={isSelected ? accentColor : 'var(--text-muted)'}
                  fontSize="9"
                  fontWeight={isSelected ? '600' : '500'}
                >
                  {node.role}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredObj && tooltipStyle && (
          <div
            className="map-hover-tooltip"
            style={{ ...tooltipStyle, '--tip-accent': accentColor }}
            role="tooltip"
          >
            <div className="hover-tip-title">{hoveredObj.label}</div>
            <p className="hover-tip-text">{makeHoverSnippet(getNodeText(hoveredObj))}</p>
            <div className="hover-tip-cta">Click to read more →</div>
          </div>
        )}
      </div>

      {activeNode && (
        <div
          key={`${activeNode.label}-${selectedNode}`}
          className="map-node-inspector"
          style={{ '--insp-accent': accentColor }}
        >
          <div className="inspector-badge">
            {activeNode.wikiPage ? `${activeNode.label} · Live Section Breakdown` : activeNode.role}
          </div>
          <div className="inspector-title">{activeNode.label}</div>
          {isFetchingNode ? (
            <p className="inspector-desc flex-row gap-2">
              <Loader2 size={14} className="spin accent-indigo" /> Loading exact details for "{activeNode.label}"...
            </p>
          ) : (
            <p className="inspector-desc">{resolvedDetail}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConceptSimplifier({
  topics,
  activeTopic,
  setActiveTopic,
  level,
  setLevel,
  onSearchCustomTopic,
  isGenerating,
  masteredTopicIds,
  onToggleMastered,
  onNavigate,
  searchHistory,
  onSelectHistoryItem,
  onRemoveHistoryItem,
  onClearHistory,
}) {
  const [searchInput, setSearchInput] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [selectedNode, setSelectedNode] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [analogyOpen, setAnalogyOpen] = useState(false);
  const [analogyMode, setAnalogyMode] = useState('primary'); // 'primary' | 'game' | 'daily'
  const [misconceptionOpen, setMisconceptionOpen] = useState(false);
  const [heroGlow, setHeroGlow] = useState({ x: 50, y: 35 });

  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHeroGlow({ x, y });
  };

  const currentLevelObj = LEVELS.find((l) => l.id === level) || LEVELS[1];
  const levelData = activeTopic.levels[level] || activeTopic.levels.highschool;
  const isMastered = masteredTopicIds.includes(activeTopic.id);

  useEffect(() => {
    setSelectedNode(0);
    setAnalogyOpen(false);
    setAnalogyMode('primary');
    setMisconceptionOpen(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeTopic.id, level]);

  const mapPillars = (activeTopic.conceptMap?.nodes || []).slice(0, 3);
  const alternateAnalogies = {
    primary: levelData.analogy,
    game: `Picture "${activeTopic.title}" like a strategy video game: "${mapPillars[0]?.label || 'the starting rule'}" sets up your move, "${mapPillars[1]?.label || 'the core mechanism'}" decides how the turn plays out, and "${mapPillars[2]?.label || 'the outcome'}" is the winning score condition.`,
    daily: `Think of "${activeTopic.title}" during a busy morning routine: every piece (${mapPillars.map((n) => n.label).join(', ') || 'input, process, output'}) has one specific job—if one step gets skipped or rushed, the whole final result changes!`,
  };

  const filteredTopics = topics.filter(
    (t) => subjectFilter === 'All' || t.subject === subjectFilter
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onSearchCustomTopic(searchInput.trim());
    setSearchInput('');
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const textToRead = `${activeTopic.title}, ${currentLevelObj.label} explanation. ${levelData.headline}. ${levelData.summary}. Real world analogy: ${levelData.analogy}`;
    const utter = new SpeechSynthesisUtterance(textToRead);
    utter.rate = 0.98;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="page-container">
      {/* Cinematic Apple-Inspired Hero Stage */}
      <div
        className="hero-banner"
        onMouseMove={handleHeroMouseMove}
        style={{ '--mx': `${heroGlow.x}%`, '--my': `${heroGlow.y}%` }}
      >
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-top-row">
          <div>
            <div className="pill-badge">
              <Sparkles size={13} />
              <span>EduBuddy Pro · Adaptive Intelligence</span>
            </div>
            <h1 className="hero-title">
              Complex concepts. <span className="hero-gradient-text">Effortlessly clear.</span>
            </h1>
            <p className="hero-subtitle">
              Search any topic across science, history, code, or vocabulary. Glide across 4 precision
              understanding levels with live interactive concept maps, multi-web synthesis, and active recall.
            </p>
          </div>
        </div>

        <form className="search-bar-form" onSubmit={handleSubmit}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder='Try "Fourier Transform", "TCP Handshake", "Mitochondria", or "Bayesian Inference"...'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={isGenerating}
          />
          <button type="submit" className="btn-primary" disabled={isGenerating || !searchInput.trim()}>
            {isGenerating ? (
              <>
                <Loader2 size={16} className="spin" /> Simplifying...
              </>
            ) : (
              <>
                Simplify Topic <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Subject filter & topic pills */}
        <div className="topic-picker-area">
          <div className="subject-tabs">
            {SUBJECTS.map((subj) => (
              <button
                key={subj}
                className={`subject-tab ${subjectFilter === subj ? 'active' : ''}`}
                onClick={() => setSubjectFilter(subj)}
              >
                {subj}
              </button>
            ))}
          </div>
          <div className="topic-chips">
            {filteredTopics.map((topic) => (
              <button
                key={topic.id}
                className={`topic-chip ${activeTopic.id === topic.id ? 'active' : ''}`}
                onClick={() => setActiveTopic(topic)}
              >
                <span>{topic.title}</span>
                {masteredTopicIds.includes(topic.id) && (
                  <CheckCircle2 size={14} className="chip-check" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Understanding Level Switcher */}
      <div className="level-selector-card">
        <div className="level-selector-header">
          <div className="flex-row gap-2">
            <Layers size={18} className="accent-indigo" />
            <span className="section-mini-title">Understanding Level</span>
          </div>
          <span className="muted-sm">Click any level to adapt the depth instantly</span>
        </div>
        <div className="level-grid">
          {LEVELS.map((l) => {
            const active = level === l.id;
            return (
              <button
                key={l.id}
                className={`level-card-btn ${active ? 'active' : ''}`}
                style={{ '--lvl-color': l.color }}
                onClick={() => setLevel(l.id)}
              >
                <div className="level-card-top">
                  <span className="level-badge">{l.badge}</span>
                  <span className="level-dot" />
                </div>
                <div className="level-card-name">{l.label}</div>
                <div className="level-card-tag">{l.tagline}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Topic Workspace */}
      <div className="concept-workspace-grid">
        {/* Left Main Explanation */}
        <div className="card explanation-card">
          <div className="topic-meta-bar">
            <div className="flex-row gap-2 wrap">
              <span className="subject-pill">{activeTopic.subject}</span>
              <span className="meta-pill">
                <Clock size={13} /> ~{activeTopic.estimatedMinutes} min
              </span>
              {activeTopic.isLiveAI && <span className="ai-pill">✨ Live Gemini AI</span>}
              {activeTopic.isLiveKnowledge && <span className="ai-pill">📚 Live Knowledge Engine</span>}
            </div>
            <div className="flex-row gap-2">
              <button className="btn-ghost btn-sm" onClick={handleSpeak} title="Listen to explanation">
                {isSpeaking ? <Square size={14} /> : <Volume2 size={14} />}
                <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
              </button>
              <button
                className={`btn-sm ${isMastered ? 'btn-success' : 'btn-outline'}`}
                onClick={() => onToggleMastered(activeTopic.id)}
              >
                <CheckCircle2 size={14} />
                <span>{isMastered ? 'Understood (+50 XP)' : 'Mark Understood'}</span>
              </button>
            </div>
          </div>

          <h2 className="topic-main-title">{activeTopic.title}</h2>
          <p className="topic-headline" style={{ color: currentLevelObj.color }}>
            {levelData.headline}
          </p>
          <p className="topic-summary">{levelData.summary}</p>

          {/* Step-by-Step Breakdown */}
          <div className="steps-section">
            <h3 className="subsection-title">Step-by-Step Breakdown</h3>
            <div className="steps-list">
              {levelData.steps.map((step, idx) => (
                <div key={idx} className="step-item">
                  <div className="step-accent-bar" style={{ backgroundColor: currentLevelObj.color }} />
                  <div>
                    <div className="step-title">{step.title}</div>
                    <p className="step-detail">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Formula / Mental Model */}
          <div className="formula-box">
            <div className="formula-label">KEY RULE / FORMULA</div>
            <div className="formula-code">{levelData.formulaOrRule}</div>
          </div>

          {/* Action Jump Bar */}
          <div className="quick-next-bar">
            <button className="next-action-btn" onClick={() => onNavigate('resources')}>
              <BookOpen size={16} />
              <span>Level-Matched Resources</span>
            </button>
            <button className="next-action-btn" onClick={() => onNavigate('practice')}>
              <BrainCircuit size={16} />
              <span>Take Adaptive Quiz</span>
            </button>
            <button className="next-action-btn primary" onClick={() => onNavigate('tutor')}>
              <MessageSquareText size={16} />
              <span>Ask AI Socratic Tutor</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual Concept Map + Analogy + Common Mistake */}
        <div className="right-stack">
          <div className="card">
            <div className="card-head">
              <Compass size={18} className="accent-indigo" />
              <h3>Interactive Concept Map</h3>
            </div>
            <p className="muted-sm mb-3">Hover any satellite node for a quick preview, or click to read the full breakdown below.</p>
            <ConceptMapSVG
              conceptMap={activeTopic.conceptMap}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              accentColor={currentLevelObj.color}
            />
          </div>

          <div
            className={`card analogy-card interactive-card ${analogyOpen ? 'expanded' : ''}`}
            onClick={() => setAnalogyOpen((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setAnalogyOpen((v) => !v);
              }
            }}
          >
            <div className="interactive-card-head">
              <div className="card-head mb-0">
                <Lightbulb size={18} className="accent-amber" />
                <h3>Real-World Analogy</h3>
              </div>
              <span className="expand-cue">
                {analogyOpen ? (
                  <>
                    Hide details <ChevronUp size={15} />
                  </>
                ) : (
                  <>
                    Click to explore <ChevronDown size={15} />
                  </>
                )}
              </span>
            </div>
            <p className="callout-text">{alternateAnalogies[analogyMode]}</p>

            {analogyOpen && (
              <div
                className="expanded-detail-drawer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="drawer-sub-label">Try Another Analogy Angle:</div>
                <div className="analogy-angle-tabs">
                  <button
                    className={`angle-pill ${analogyMode === 'primary' ? 'active' : ''}`}
                    onClick={() => setAnalogyMode('primary')}
                  >
                    Classic Analogy
                  </button>
                  <button
                    className={`angle-pill ${analogyMode === 'game' ? 'active' : ''}`}
                    onClick={() => setAnalogyMode('game')}
                  >
                    Game / Strategy
                  </button>
                  <button
                    className={`angle-pill ${analogyMode === 'daily' ? 'active' : ''}`}
                    onClick={() => setAnalogyMode('daily')}
                  >
                    Daily Routine
                  </button>
                </div>

                {mapPillars.length > 0 && (
                  <div className="analogy-mapping-box">
                    <div className="drawer-sub-label">How the Pieces Connect:</div>
                    {mapPillars.map((node) => (
                      <div key={node.label} className="mapping-row">
                        <span className="mapping-key">{node.label}</span>
                        <span className="mapping-arrow">→</span>
                        <span className="mapping-val">
                          {node.detail.length > 105 ? `${node.detail.slice(0, 104)}…` : node.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="btn-outline btn-sm mt-3"
                  onClick={() => onNavigate('tutor')}
                >
                  <Sparkle size={14} /> Ask AI Tutor for a Custom Analogy
                </button>
              </div>
            )}
          </div>

          <div
            className={`card mistake-card interactive-card ${misconceptionOpen ? 'expanded' : ''}`}
            onClick={() => setMisconceptionOpen((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMisconceptionOpen((v) => !v);
              }
            }}
          >
            <div className="interactive-card-head">
              <div className="card-head mb-0">
                <AlertTriangle size={18} className="accent-rose" />
                <h3>Common Misconception to Avoid</h3>
              </div>
              <span className="expand-cue rose">
                {misconceptionOpen ? (
                  <>
                    Hide Myth vs Reality <ChevronUp size={15} />
                  </>
                ) : (
                  <>
                    Myth vs Reality <ChevronDown size={15} />
                  </>
                )}
              </span>
            </div>
            <p className="callout-text">{levelData.commonMistake}</p>

            {misconceptionOpen && (
              <div
                className="expanded-detail-drawer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="myth-reality-grid">
                  <div className="mr-box myth">
                    <div className="mr-head">
                      <XCircle size={14} /> The Common Trap
                    </div>
                    <p>{levelData.commonMistake}</p>
                  </div>
                  <div className="mr-box reality">
                    <div className="mr-head">
                      <CheckCircle2 size={14} /> What Is Actually True
                    </div>
                    <p>{levelData.summary}</p>
                  </div>
                </div>

                <div className="exam-defense-box">
                  <ShieldCheck size={15} className="accent-emerald" />
                  <div>
                    <strong>Exam Sanity Check:</strong> Anchor your answer on{' '}
                    <code>{levelData.formulaOrRule}</code> before choosing an option.
                  </div>
                </div>

                <button
                  className="btn-outline btn-sm mt-3"
                  onClick={() => onNavigate('practice')}
                >
                  <BrainCircuit size={14} /> Test Yourself on the Adaptive Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
