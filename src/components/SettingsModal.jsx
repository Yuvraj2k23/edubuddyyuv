import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle2, AlertCircle, Loader2, Sparkles, RotateCcw, Globe, ShieldCheck } from 'lucide-react';
import { testProviderKey } from '../utils/aiEngine';

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini (Gemini 2.5 Flash)',
    placeholder: 'AIzaSy...',
    linkText: 'Free key at Google AI Studio',
    linkUrl: 'https://aistudio.google.com/apikey',
    badge: 'Free Tier',
  },
  {
    id: 'openai',
    name: 'OpenAI ChatGPT (GPT-4o Mini)',
    placeholder: 'sk-...',
    linkText: 'OpenAI Platform Keys',
    linkUrl: 'https://platform.openai.com/api-keys',
    badge: 'ChatGPT',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude (Claude 3.5 Haiku)',
    placeholder: 'sk-ant-...',
    linkText: 'Anthropic Console Keys',
    linkUrl: 'https://console.anthropic.com/settings/keys',
    badge: 'Claude',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (1 Key → Gemini + ChatGPT + Claude!)',
    placeholder: 'sk-or-v1-...',
    linkText: 'Get OpenRouter Key',
    linkUrl: 'https://openrouter.ai/keys',
    badge: 'All-in-1',
  },
];

export default function SettingsModal({
  isOpen,
  onClose,
  apiKeys,
  onSaveApiKeys,
  onResetProgress,
}) {
  const [draft, setDraft] = useState({
    gemini: apiKeys?.gemini || '',
    openai: apiKeys?.openai || '',
    claude: apiKeys?.claude || '',
    openrouter: apiKeys?.openrouter || '',
  });
  const [testingId, setTestingId] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (id, val) => {
    setDraft((prev) => ({ ...prev, [id]: val }));
  };

  const handleTestOne = async (id) => {
    const key = draft[id]?.trim();
    if (!key) {
      setStatus({ ok: false, msg: `Enter a ${id.toUpperCase()} API key first to test it.` });
      return;
    }
    setTestingId(id);
    setStatus(null);
    try {
      const reply = await testProviderKey(id, key);
      const next = { ...draft, [id]: key };
      onSaveApiKeys(next);
      setStatus({ ok: true, msg: `${id.toUpperCase()} connected! ("${reply.slice(0, 40)}")` });
    } catch (err) {
      setStatus({ ok: false, msg: err.message || `Failed to verify ${id} key.` });
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveAll = () => {
    onSaveApiKeys({
      gemini: draft.gemini.trim(),
      openai: draft.openai.trim(),
      claude: draft.claude.trim(),
      openrouter: draft.openrouter.trim(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="flex-row gap-2">
            <Sparkles size={18} className="accent-indigo" aria-hidden="true" />
            <h2 id="settings-modal-title" className="modal-title-h2">
              Multi-AI & Live Web Engine Settings
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          <div className="info-banner">
            <div className="flex-row gap-2 mb-1">
              <Globe size={15} className="accent-indigo" aria-hidden="true" />
              <strong>Multi-Web Live Search is ALWAYS ON (Zero Key Needed!)</strong>
            </div>
            EduBuddy automatically searches <strong>Simple Wikipedia</strong>, <strong>Wikipedia</strong>, and{' '}
            <strong>OpenAlex Academic Papers</strong> in parallel. Optionally add AI API keys below for
            live multi-model debate and image vision.
            <div className="flex-row gap-1 mt-2 security-note-inline">
              <ShieldCheck size={14} className="accent-emerald" aria-hidden="true" />
              <span>
                <strong>Privacy & Security:</strong> Keys stay strictly in browser memory for this session only — never written to <code>localStorage</code> or stored on any backend server.
              </span>
            </div>
          </div>

          <div className="providers-list">
            {PROVIDERS.map((p) => {
              const inputId = `api-key-input-${p.id}`;
              return (
                <div key={p.id} className="provider-row">
                  <div className="provider-top">
                    <label htmlFor={inputId} className="field-label">
                      <Key size={13} aria-hidden="true" /> {p.name}
                    </label>
                    <span className="provider-badge">{p.badge}</span>
                  </div>
                  <div className="provider-input-row">
                    <input
                      id={inputId}
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      className="text-input"
                      placeholder={p.placeholder}
                      value={draft[p.id]}
                      onChange={(e) => handleChange(p.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => handleTestOne(p.id)}
                      disabled={testingId === p.id || !draft[p.id].trim()}
                    >
                      {testingId === p.id ? <Loader2 size={14} className="spin" aria-hidden="true" /> : 'Test'}
                    </button>
                  </div>
                  <a
                    href={p.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="provider-link"
                  >
                    {p.linkText} ↗
                  </a>
                </div>
              );
            })}
          </div>

          {status && (
            <div className={`status-msg ${status.ok ? 'ok' : 'err'}`} role="status" aria-live="polite">
              {status.ok ? (
                <CheckCircle2 size={16} aria-hidden="true" />
              ) : (
                <AlertCircle size={16} aria-hidden="true" />
              )}
              <span>{status.msg}</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-primary" onClick={handleSaveAll}>
              Save Session Keys
            </button>
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>

          <hr className="divider" />

          <div className="danger-row">
            <div>
              <div className="field-label">Reset Demo Progress</div>
              <div className="muted-xs">Clears XP, mastered topics, saved study plan, and quiz history.</div>
            </div>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                onResetProgress();
                setStatus({ ok: true, msg: 'Progress reset for a fresh demo!' });
              }}
            >
              <RotateCcw size={14} aria-hidden="true" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
