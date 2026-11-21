import React, { useState, useEffect } from 'react';
import {
  Menu,
  GraduationCap,
  Sparkles,
  Home,
  BookOpen,
  MessageSquareText,
  BrainCircuit,
  FileText,
  History,
  BarChart3,
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import HomeHub from './components/HomeHub';
import ConceptSimplifier from './components/ConceptSimplifier';
import ResourceMatcher from './components/ResourceMatcher';
import SocraticTutor from './components/SocraticTutor';
import QuizAndFlashcards from './components/QuizAndFlashcards';
import NoteSimplifier from './components/NoteSimplifier';
import Dashboard from './components/Dashboard';
import SearchHistoryPanel from './components/SearchHistoryPanel';
import SettingsModal from './components/SettingsModal';
import { TOPICS } from './data/knowledgeBase';
import { cleanAcademicQuery, resolveAnyTopic } from './utils/aiEngine';
import { createInitialSearchHistory } from './utils/historyUtils';
import { stripSecretsForStorage } from './utils/security';

const STORAGE_KEY = 'edubuddy_state_v2';

function loadSavedState() {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) return JSON.parse(rawV2);
    const rawV1 = localStorage.getItem('edubuddy_state_v1');
    if (rawV1) {
      const parsed = JSON.parse(rawV1);
      // Upgrade existing sessions to the new Apple Pro Dark studio aesthetic by default
      return { ...parsed, theme: 'dark' };
    }
    return {};
  } catch {
    return {};
  }
}

export default function App() {
  const initial = loadSavedState();

  const [theme, setTheme] = useState(initial.theme || 'dark');
  const [activeTab, setActiveTab] = useState('home');
  const [pendingTutorPrompt, setPendingTutorPrompt] = useState('');
  const [level, setLevel] = useState(initial.level || 'highschool');
  const [topics, setTopics] = useState(TOPICS);
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);
  // Security best practice: keep user-provided API keys strictly in volatile in-memory state (never persisted to localStorage)
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    openai: '',
    claude: '',
    openrouter: '',
  });
  const [xp, setXp] = useState(initial.xp ?? 60);
  const [streak] = useState(initial.streak ?? 3);
  const [masteredTopicIds, setMasteredTopicIds] = useState(initial.masteredTopicIds || []);
  const [masteredCardIds, setMasteredCardIds] = useState(initial.masteredCardIds || []);
  const [savedResources, setSavedResources] = useState(initial.savedResources || []);
  const [resourceMeta, setResourceMeta] = useState(initial.resourceMeta || {});
  const [customResources, setCustomResources] = useState(initial.customResources || []);
  const [quizHistory, setQuizHistory] = useState(initial.quizHistory || []);
  const [activityLog, setActivityLog] = useState(
    initial.activityLog || [
      { id: 'init-1', label: 'Started EduBuddy learning session', xp: 60 },
    ]
  );
  const [searchHistory, setSearchHistory] = useState(
    Array.isArray(initial.searchHistory) ? initial.searchHistory : createInitialSearchHistory()
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  useEffect(() => {
    try {
      const safePayload = stripSecretsForStorage({
        theme,
        level,
        xp,
        streak,
        masteredTopicIds,
        masteredCardIds,
        savedResources,
        resourceMeta,
        customResources: customResources.slice(0, 25),
        quizHistory,
        activityLog: activityLog.slice(0, 15),
        searchHistory: searchHistory.slice(0, 40),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safePayload));
    } catch {
      // Ignore storage quota errors
    }
  }, [theme, level, xp, streak, masteredTopicIds, masteredCardIds, savedResources, resourceMeta, customResources, quizHistory, activityLog, searchHistory]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3000);
  };

  const earnXP = (amount, label) => {
    setXp((prev) => prev + amount);
    setActivityLog((prev) => [{ id: `act-${Date.now()}`, label, xp: amount }, ...prev].slice(0, 15));
  };

  const recordSearchHistory = (queryLabel, topicObj) => {
    const cleanLabel = queryLabel.trim();
    if (!cleanLabel) return;
    setSearchHistory((prev) => {
      // Avoid duplicate back-to-back entry of same topic on the same day by bumping it to top
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== cleanLabel.toLowerCase()
      );
      return [
        {
          id: `hist-${Date.now()}`,
          query: topicObj?.title || cleanLabel,
          topicId: topicObj?.id || null,
          subject: topicObj?.subject || 'General',
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, 40);
    });
  };

  const handleSelectTopic = (topicObj) => {
    setActiveTopic(topicObj);
    recordSearchHistory(topicObj.title, topicObj);
  };

  const handleSelectHistoryItem = async (item) => {
    setActiveTab('simplifier');
    const match = topics.find(
      (t) =>
        (item.topicId && t.id === item.topicId) ||
        t.title.toLowerCase() === item.query.toLowerCase()
    );
    if (match) {
      setActiveTopic(match);
      recordSearchHistory(match.title, match);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await handleSearchCustomTopic(item.query);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchCustomTopic = async (query) => {
    const cleaned = cleanAcademicQuery(query) || query.trim();
    const lower = cleaned.toLowerCase();

    // Only reuse an already-loaded topic on an EXACT title / base-title / tag match
    // (never match "Luxury apartment" when the user specifically asked for "luxury"!)
    const existing = topics.find((t) => {
      const fullTitle = t.title.toLowerCase();
      const baseTitle = fullTitle.split(' (')[0].trim();
      return (
        fullTitle === lower ||
        baseTitle === lower ||
        t.tags?.some((tag) => tag.toLowerCase() === lower)
      );
    });
    if (existing) {
      setActiveTopic(existing);
      recordSearchHistory(existing.title, existing);
      showToast(`Loaded curated topic: ${existing.title}`);
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await resolveAnyTopic(cleaned, apiKeys);
      if (generated.isLiveAI) {
        showToast(`✨ Generated live Gemini AI guide for "${generated.title}"`);
      } else if (generated.isLiveKnowledge) {
        showToast(`📚 Loaded multi-web knowledge for "${generated.title}"!`);
      } else {
        showToast(`Simplified "${generated.title}" across 4 understanding levels!`);
      }

      setTopics((prev) => {
        const deduped = prev.filter(
          (t) => t.title.toLowerCase() !== generated.title.toLowerCase()
        );
        return [generated, ...deduped];
      });
      setActiveTopic(generated);
      recordSearchHistory(generated.title, generated);
      earnXP(20, `Explored concept: ${generated.title}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleMastered = (topicId) => {
    if (masteredTopicIds.includes(topicId)) {
      setMasteredTopicIds((prev) => prev.filter((id) => id !== topicId));
    } else {
      setMasteredTopicIds((prev) => [...prev, topicId]);
      earnXP(50, `Mastered topic: ${activeTopic.title}`);
      showToast('🎉 +50 XP! Topic marked as understood.');
    }
  };

  const handleToggleCardMastered = (cardId) => {
    if (masteredCardIds.includes(cardId)) {
      setMasteredCardIds((prev) => prev.filter((id) => id !== cardId));
    } else {
      setMasteredCardIds((prev) => [...prev, cardId]);
      earnXP(20, `Mastered flashcard on ${activeTopic.title}`);
      showToast('⚡ +20 XP! Flashcard mastered.');
    }
  };

  const handleQuizComplete = ({ topicId, topicTitle, score, total }) => {
    const earned = Math.max(15, score * 25);
    setQuizHistory((prev) => [{ topicId, topicTitle, score, total, ts: Date.now() }, ...prev]);
    earnXP(earned, `Scored ${score}/${total} on ${topicTitle} quiz`);
    showToast(`🏆 Quiz finished! Earned +${earned} XP.`);
  };

  const handleToggleSaveResource = (res) => {
    const exists = savedResources.some((r) => r.id === res.id);
    if (exists) {
      setSavedResources((prev) => prev.filter((r) => r.id !== res.id));
      showToast('Removed from Study Plan.');
    } else {
      setSavedResources((prev) => [res, ...prev]);
      earnXP(10, `Saved resource: ${res.title}`);
      showToast('📌 Saved to your Study Plan (+10 XP)');
    }
  };

  const handleUpdateResourceMeta = (resId, nextMeta) => {
    setResourceMeta((prev) => ({ ...prev, [resId]: nextMeta }));
  };

  const handleAddCustomResource = (newItem) => {
    setCustomResources((prev) => [newItem, ...prev]);
    earnXP(20, `Added personal study resource: ${newItem.title}`);
    showToast(`📚 Added "${newItem.title}" to your Resources (+20 XP)`);
  };

  const handleDeleteCustomResource = (resId) => {
    setCustomResources((prev) => prev.filter((r) => r.id !== resId));
    setSavedResources((prev) => prev.filter((r) => r.id !== resId));
    showToast('Removed uploaded resource.');
  };

  const handleResetProgress = () => {
    setXp(0);
    setMasteredTopicIds([]);
    setMasteredCardIds([]);
    setSavedResources([]);
    setResourceMeta({});
    setCustomResources([]);
    setQuizHistory([]);
    setActivityLog([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const connectedAICount = [
    apiKeys?.gemini?.trim(),
    apiKeys?.openai?.trim(),
    apiKeys?.claude?.trim(),
    apiKeys?.openrouter?.trim(),
  ].filter(Boolean).length;

  const handleOmniSearchFromHome = async (query, mode) => {
    if (mode === 'tutor') {
      setPendingTutorPrompt(query);
      setActiveTab('tutor');
      return;
    }
    setActiveTab('simplifier');
    await handleSearchCustomTopic(query);
  };

  const QUICK_DOCK_ITEMS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'simplifier', label: 'Simplify', icon: Sparkles },
    { id: 'tutor', label: 'AI Tutor', icon: MessageSquareText },
    { id: 'practice', label: 'Quiz & Cards', icon: BrainCircuit },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'history', label: 'History', icon: History },
    { id: 'dashboard', label: 'Progress', icon: BarChart3 },
  ];

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        level={level}
        setLevel={setLevel}
        theme={theme}
        toggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        xp={xp}
        streak={streak}
        connectedAICount={connectedAICount}
        openSettings={() => setSettingsOpen(true)}
        mobileOpen={mobileMenuOpen}
        closeMobile={() => setMobileMenuOpen(false)}
        searchHistory={searchHistory}
        onSelectHistoryItem={handleSelectHistoryItem}
      />

      <div className="main-area">
        {/* Mobile Header */}
        <header className="mobile-header">
          <button className="icon-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <button className="flex-row gap-2 brand-btn" onClick={() => setActiveTab('home')}>
            <GraduationCap size={20} className="accent-indigo" />
            <strong>EduBuddy</strong>
          </button>
          <button className="btn-ghost btn-sm" onClick={() => setSettingsOpen(true)}>
            <Sparkles size={15} /> AI
          </button>
        </header>

        {/* Handy Apple-Style Floating Quick-Switch Pill Dock (Always 1 click away!) */}
        <div className="quick-dock-wrap">
          <nav className="quick-dock-bar" aria-label="Quick tool switcher">
            {QUICK_DOCK_ITEMS.map((item) => {
              const Icon = item.icon;
              const isCurrent = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dock-pill ${isCurrent ? 'active' : ''}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <main id="main-content" tabIndex={-1} className="main-scroll">
          {activeTab === 'home' && (
            <HomeHub
              level={level}
              setLevel={setLevel}
              xp={xp}
              streak={streak}
              topicsCount={topics.length}
              historyCount={searchHistory.length}
              connectedAICount={connectedAICount}
              isGenerating={isGenerating}
              onOmniSearch={handleOmniSearchFromHome}
              onNavigate={setActiveTab}
              recentSearches={searchHistory}
              onSelectHistoryItem={handleSelectHistoryItem}
            />
          )}

          {activeTab === 'simplifier' && (
            <ConceptSimplifier
              topics={topics}
              activeTopic={activeTopic}
              setActiveTopic={handleSelectTopic}
              level={level}
              setLevel={setLevel}
              onSearchCustomTopic={handleSearchCustomTopic}
              isGenerating={isGenerating}
              masteredTopicIds={masteredTopicIds}
              onToggleMastered={handleToggleMastered}
              onNavigate={setActiveTab}
              searchHistory={searchHistory}
              onSelectHistoryItem={handleSelectHistoryItem}
              onRemoveHistoryItem={(id) =>
                setSearchHistory((prev) => prev.filter((item) => item.id !== id))
              }
              onClearHistory={() => {
                setSearchHistory([]);
                showToast('Search history cleared.');
              }}
            />
          )}

          {activeTab === 'resources' && (
            <ResourceMatcher
              topics={topics}
              activeTopic={activeTopic}
              level={level}
              setLevel={setLevel}
              savedResources={savedResources}
              onToggleSaveResource={handleToggleSaveResource}
              resourceMeta={resourceMeta}
              onUpdateResourceMeta={handleUpdateResourceMeta}
              customResources={customResources}
              onAddCustomResource={handleAddCustomResource}
              onDeleteCustomResource={handleDeleteCustomResource}
              onExploreTopicQuery={async (q) => {
                setActiveTab('simplifier');
                await handleSearchCustomTopic(q);
              }}
            />
          )}

          {activeTab === 'tutor' && (
            <SocraticTutor
              activeTopic={activeTopic}
              level={level}
              apiKeys={apiKeys}
              onEarnXP={earnXP}
              openSettings={() => setSettingsOpen(true)}
              pendingPrompt={pendingTutorPrompt}
              onConsumePendingPrompt={() => setPendingTutorPrompt('')}
            />
          )}

          {activeTab === 'practice' && (
            <QuizAndFlashcards
              activeTopic={activeTopic}
              level={level}
              setLevel={setLevel}
              apiKeys={apiKeys}
              onQuizComplete={handleQuizComplete}
              masteredCardIds={masteredCardIds}
              onToggleCardMastered={handleToggleCardMastered}
            />
          )}

          {activeTab === 'notes' && (
            <NoteSimplifier
              level={level}
              setLevel={setLevel}
              apiKey={apiKeys}
              onEarnXP={earnXP}
            />
          )}

          {activeTab === 'history' && (
            <div className="page-container">
              <div className="page-header-card compact">
                <div>
                  <div className="pill-badge">
                    <Sparkles size={13} />
                    <span>Dedicated Search & Study Timeline</span>
                  </div>
                  <h1 className="page-title">Search History</h1>
                  <p className="page-subtitle">
                    Revisit any concept you searched — automatically organized by Today, Yesterday, and exact day & date.
                  </p>
                </div>
              </div>
              <SearchHistoryPanel
                searchHistory={searchHistory}
                onSelectHistoryItem={handleSelectHistoryItem}
                onRemoveHistoryItem={(id) =>
                  setSearchHistory((prev) => prev.filter((item) => item.id !== id))
                }
                onClearHistory={() => {
                  setSearchHistory([]);
                  showToast('Search history cleared.');
                }}
              />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              xp={xp}
              streak={streak}
              level={level}
              topics={topics}
              masteredTopicIds={masteredTopicIds}
              masteredCardIds={masteredCardIds}
              quizHistory={quizHistory}
              savedResources={savedResources}
              onRemoveSavedResource={handleToggleSaveResource}
              activityLog={activityLog}
              onSelectTopicAndGo={(t) => {
                handleSelectTopic(t);
                setActiveTab('simplifier');
              }}
              searchHistory={searchHistory}
              onSelectHistoryItem={handleSelectHistoryItem}
              onRemoveHistoryItem={(id) =>
                setSearchHistory((prev) => prev.filter((item) => item.id !== id))
              }
              onClearHistory={() => {
                setSearchHistory([]);
                showToast('Search history cleared.');
              }}
            />
          )}
        </main>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKeys={apiKeys}
        onSaveApiKeys={setApiKeys}
        onResetProgress={handleResetProgress}
      />

      {toast && (
        <div className="toast-banner" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
