import React from 'react';
import {
  Zap,
  Trophy,
  BookOpen,
  CheckCircle2,
  BookmarkCheck,
  ExternalLink,
  Trash2,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LEVELS } from '../data/knowledgeBase';
import { sanitizeExternalUrl } from '../utils/security';

export default function Dashboard({
  xp,
  streak,
  level,
  topics,
  masteredTopicIds,
  masteredCardIds,
  quizHistory,
  savedResources,
  onRemoveSavedResource,
  activityLog,
  onSelectTopicAndGo,
}) {
  const levelObj = LEVELS.find((l) => l.id === level) || LEVELS[1];
  const learnerRank =
    xp >= 500 ? 'Scholar Sage' : xp >= 250 ? 'Concept Explorer' : xp >= 100 ? 'Active Learner' : 'Curious Starter';

  const avgAccuracy = quizHistory.length
    ? Math.round(
        (quizHistory.reduce((acc, q) => acc + q.score / Math.max(1, q.total), 0) / quizHistory.length) *
          100
      )
    : 0;

  const subjectMap = {};
  topics.forEach((t) => {
    if (!subjectMap[t.subject]) subjectMap[t.subject] = { total: 0, mastered: 0 };
    subjectMap[t.subject].total += 1;
    if (masteredTopicIds.includes(t.id)) subjectMap[t.subject].mastered += 1;
  });

  return (
    <div className="page-container">
      <div className="page-header-card compact">
        <div>
          <div className="pill-badge">
            <TrendingUp size={13} />
            <span>Personal Mastery Analytics</span>
          </div>
          <h1 className="page-title">Your Learning Dashboard</h1>
          <p className="page-subtitle">
            Rank: <strong>{learnerRank}</strong> · Current Difficulty Profile:{' '}
            <strong style={{ color: levelObj.color }}>{levelObj.label}</strong>
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon amber">
            <Zap size={20} />
          </div>
          <div>
            <div className="kpi-value">{xp} XP</div>
            <div className="kpi-label">Total Learning XP</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon emerald">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="kpi-value">
              {masteredTopicIds.length} / {topics.length}
            </div>
            <div className="kpi-label">Topics Understood</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon indigo">
            <Trophy size={20} />
          </div>
          <div>
            <div className="kpi-value">{quizHistory.length ? `${avgAccuracy}%` : '—'}</div>
            <div className="kpi-label">Avg Quiz Accuracy ({quizHistory.length} taken)</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon violet">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="kpi-value">{masteredCardIds.length}</div>
            <div className="kpi-label">Flashcards Mastered · {streak}d Streak</div>
          </div>
        </div>
      </div>

      <div className="dashboard-two-col">
        {/* Subject Readiness */}
        <div className="card">
          <h3 className="card-section-title">Subject Readiness</h3>
          <div className="subject-bars">
            {Object.entries(subjectMap).map(([subj, stats]) => {
              const pct = Math.round((stats.mastered / stats.total) * 100);
              return (
                <div key={subj} className="subject-bar-row">
                  <div className="subject-bar-top">
                    <span>{subj}</span>
                    <span className="muted-xs">
                      {stats.mastered}/{stats.total} topics ({pct}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.max(pct, 6)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <h4 className="mt-5 mb-2">Recommended Next Topics</h4>
          <div className="next-topic-list">
            {topics
              .filter((t) => !masteredTopicIds.includes(t.id))
              .slice(0, 3)
              .map((t) => (
                <button
                  key={t.id}
                  className="next-topic-item"
                  onClick={() => onSelectTopicAndGo(t)}
                >
                  <div>
                    <div className="next-topic-title">{t.title}</div>
                    <div className="muted-xs">
                      {t.subject} · ~{t.estimatedMinutes} min
                    </div>
                  </div>
                  <Sparkles size={15} className="accent-indigo" />
                </button>
              ))}
          </div>
        </div>

        {/* Saved Study Plan + Activity */}
        <div className="right-stack">
          <div className="card">
            <div className="card-head">
              <BookmarkCheck size={18} className="accent-indigo" />
              <h3>Saved Study Plan ({savedResources.length})</h3>
            </div>
            {savedResources.length === 0 ? (
              <p className="muted-sm">
                Bookmark level-matched videos or practice guides in the <strong>Resource Matcher</strong> tab to build your personal study queue.
              </p>
            ) : (
              <div className="saved-plan-list">
                {savedResources.map((r) => {
                  const safeHref = sanitizeExternalUrl(r.url);
                  return (
                    <div key={r.id} className="saved-plan-item">
                      <div>
                        {safeHref ? (
                          <a
                            href={safeHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="saved-link"
                          >
                            {r.title} <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="saved-link">{r.title}</span>
                        )}
                        <div className="muted-xs">
                          {r.platform} · {r.type} · {r.duration}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onRemoveSavedResource(r)}
                        title="Remove from plan"
                        aria-label={`Remove ${r.title} from study plan`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <Clock size={18} className="accent-emerald" />
              <h3>Recent Study Activity</h3>
            </div>
            {activityLog.length === 0 ? (
              <p className="muted-sm">Explore a concept, ask the AI tutor, or take a quiz to log XP!</p>
            ) : (
              <div className="activity-feed">
                {activityLog.slice(0, 6).map((a) => (
                  <div key={a.id} className="activity-row">
                    <span>{a.label}</span>
                    <span className="xp-badge">+{a.xp} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
