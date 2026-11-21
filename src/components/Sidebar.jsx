import React from 'react';
import {
  Sparkles,
  BookOpen,
  MessageSquareText,
  BrainCircuit,
  FileText,
  BarChart3,
  Settings,
  Sun,
  Moon,
  GraduationCap,
  Zap,
  X,
  History,
  ChevronRight,
  Home,
} from 'lucide-react';
import { LEVELS } from '../data/knowledgeBase';
import { groupHistoryByDate } from '../utils/historyUtils';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, desc: 'Quick search & workspace hub' },
  { id: 'simplifier', label: 'Concept Simplifier', icon: Sparkles, desc: '4-level adaptive breakdowns' },
  { id: 'resources', label: 'Resource Matcher', icon: BookOpen, desc: 'Level-matched study links' },
  { id: 'tutor', label: 'AI Socratic Tutor', icon: MessageSquareText, desc: 'Interactive guided chat' },
  { id: 'practice', label: 'Quiz & Flashcards', icon: BrainCircuit, desc: 'Active recall & mastery' },
  { id: 'notes', label: 'Note Simplifier', icon: FileText, desc: 'Decode dense paragraphs' },
  { id: 'history', label: 'Search History', icon: History, desc: 'Today, Yesterday & past dates' },
  { id: 'dashboard', label: 'My Progress', icon: BarChart3, desc: 'XP, streaks & study plan' },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  level,
  setLevel,
  theme,
  toggleTheme,
  xp,
  streak,
  connectedAICount,
  openSettings,
  mobileOpen,
  closeMobile,
  searchHistory = [],
  onSelectHistoryItem,
}) {
  const currentLevelObj = LEVELS.find((l) => l.id === level) || LEVELS[1];
  const recentFive = searchHistory.slice(0, 5);
  const groupedRecent = groupHistoryByDate(recentFive);
  const moreCount = Math.max(0, searchHistory.length - 5);

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button
            className="brand brand-btn"
            onClick={() => {
              setActiveTab('home');
              closeMobile();
            }}
            title="Go to Home"
          >
            <div className="brand-icon">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="brand-title">EduBuddy</div>
              <div className="brand-sub">AI Learning Assistant</div>
            </div>
          </button>
          <button className="icon-btn mobile-close" onClick={closeMobile} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-stats">
          <div className="mini-stat">
            <Zap size={14} className="accent-amber" />
            <span>{xp} XP</span>
          </div>
          <div className="mini-stat">
            <span className="streak-dot" />
            <span>{streak}d streak</span>
          </div>
        </div>

        <div className="sidebar-section-label">LEARNING WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Primary workspace navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setActiveTab(item.id);
                  closeMobile();
                }}
              >
                <Icon size={18} className="nav-icon" aria-hidden="true" />
                <div className="nav-text">
                  <div className="nav-label">{item.label}</div>
                  <div className="nav-desc">{item.desc}</div>
                </div>
                {item.id === 'history' && searchHistory.length > 0 && (
                  <span className="nav-count-badge" aria-label={`${searchHistory.length} searches`}>
                    {searchHistory.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dedicated Sidebar Recent Search History */}
        <div className="sidebar-history-box">
          <div className="sidebar-history-head">
            <span className="sidebar-section-label mb-0">RECENT SEARCHES</span>
            {searchHistory.length > 0 && (
              <button
                className="sidebar-see-all"
                onClick={() => {
                  setActiveTab('history');
                  closeMobile();
                }}
              >
                All <ChevronRight size={12} />
              </button>
            )}
          </div>

          {recentFive.length === 0 ? (
            <div className="sidebar-history-empty">No recent searches yet</div>
          ) : (
            <div className="sidebar-history-groups">
              {groupedRecent.map((grp) => (
                <div key={grp.label} className="sidebar-hist-group">
                  <div className="sidebar-hist-date">{grp.label}</div>
                  {grp.items.map((item) => (
                    <button
                      key={item.id}
                      className="sidebar-hist-item"
                      onClick={() => {
                        onSelectHistoryItem?.(item);
                        closeMobile();
                      }}
                      title={`${item.query} (${grp.label})`}
                    >
                      <span className="sidebar-hist-text">{item.query}</span>
                    </button>
                  ))}
                </div>
              ))}
              {moreCount > 0 && (
                <button
                  className="sidebar-more-btn"
                  onClick={() => {
                    setActiveTab('history');
                    closeMobile();
                  }}
                >
                  Show more previous ({moreCount} more) →
                </button>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-level-box">
          <div className="sidebar-section-label">MY UNDERSTANDING LEVEL</div>
          <div className="level-pills-compact">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                className={`level-mini-pill ${level === l.id ? 'active' : ''}`}
                style={{ '--lvl-color': l.color }}
                onClick={() => setLevel(l.id)}
                title={l.tagline}
              >
                {l.shortLabel}
              </button>
            ))}
          </div>
          <div className="level-hint-text">{currentLevelObj.tagline}</div>
        </div>

        <div className="sidebar-footer">
          <button className="ai-status-btn" onClick={openSettings}>
            <span className={`status-dot ${connectedAICount > 0 ? 'live' : 'smart'}`} />
            <span>
              {connectedAICount > 0
                ? `Live Web + ${connectedAICount} AI`
                : 'Multi-Web + AI Keys'}
            </span>
            <Settings size={14} />
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="Switch theme" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </aside>
    </>
  );
}
