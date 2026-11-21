import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Brain,
  RotateCcw,
  Loader2,
  Globe,
  ExternalLink,
  Layers,
  Settings,
  Swords,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Key,
} from 'lucide-react';
import { LEVELS } from '../data/knowledgeBase';
import { getTutorReply } from '../utils/aiEngine';

const QUICK_PROMPTS = [
  { label: 'Explain like I\'m 10', prompt: 'Explain this much simpler like I am 10 years old' },
  { label: 'Give a real-world analogy', prompt: 'Give me a memorable real-world analogy for this concept' },
  { label: 'Memory trick / mnemonic', prompt: 'Create a mnemonic or memory trick so I never forget this' },
  { label: 'Quiz me with 1 question', prompt: 'Test me with a quick practice question' },
  { label: 'Common exam trap?', prompt: 'What is the biggest mistake or exam trap students make here?' },
  { label: 'Explain the formula', prompt: 'Break down the key formula or rule step-by-step' },
];

const COUNCIL_MODELS = [
  { id: 'Gemini', color: '#4285f4' },
  { id: 'ChatGPT', color: '#10a37f' },
  { id: 'Claude', color: '#d97757' },
];

function renderFormattedText(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g);
    return (
      <p key={i} className="chat-line">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={j} className="inline-code">
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
            return <em key={j}>{part.slice(1, -1)}</em>;
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

function MultiModelTabs({ modelResponses }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  if (!modelResponses || modelResponses.length <= 1) return null;
  const active = modelResponses[selectedIdx] || modelResponses[0];

  return (
    <div className="multi-model-box">
      <div className="multi-model-header">
        <span className="multi-model-label">
          <Layers size={13} /> Compare Live AI Answers ({modelResponses.length} Models)
        </span>
        <div className="model-tabs">
          {modelResponses.map((m, idx) => (
            <button
              key={m.provider}
              className={`model-tab-btn ${selectedIdx === idx ? 'active' : ''}`}
              style={{ '--m-color': m.color }}
              onClick={() => setSelectedIdx(idx)}
            >
              {m.provider}
            </button>
          ))}
        </div>
      </div>
      <div className="multi-model-meta">{active.model}</div>
      <div className="bubble-content">{renderFormattedText(active.text)}</div>
    </div>
  );
}

function AICouncilDebateCard({ debate, openSettings }) {
  const [showTranscript, setShowTranscript] = useState(true);
  if (!debate) return null;

  return (
    <div className="council-debate-card">
      <div className="council-verdict-box">
        <div className="council-verdict-label">
          <Swords size={13} /> EduBuddy Council Final Consensus
        </div>
        <div className="bubble-content">{renderFormattedText(debate.finalVerdict)}</div>
        {debate.agreement && (
          <div className="council-agreement-strip">
            <CheckCircle2 size={13} className="accent-emerald" />
            <span>{debate.agreement}</span>
          </div>
        )}
      </div>

      <button
        className="council-toggle-transcript"
        onClick={() => setShowTranscript((v) => !v)}
      >
        <span>
          {showTranscript ? 'Hide' : 'View'} AI Panelist Debate ({debate.panelists?.length || 0} Perspectives)
        </span>
        {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showTranscript && debate.panelists?.length > 0 && (
        <div className="council-panelists-grid">
          {debate.panelists.map((p, idx) => (
            <div key={idx} className="panelist-card" style={{ '--p-color': p.color || '#6366f1' }}>
              <div className="panelist-head">
                <span className="panelist-name">{p.name}</span>
                <span className="panelist-role">{p.role}</span>
              </div>
              <p className="panelist-arg">{p.argument}</p>
              {p.critique && (
                <div className="panelist-critique">
                  <strong>Debate point:</strong> {p.critique}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="council-mode-foot">
        <span>{debate.mode}</span>
        {!debate.panelists?.some((p) => p.live) && (
          <button className="council-connect-inline" onClick={openSettings}>
            <Key size={11} /> Connect Live AI Keys
          </button>
        )}
      </div>
    </div>
  );
}

export default function SocraticTutor({
  activeTopic,
  level,
  apiKeys,
  onEarnXP,
  openSettings,
  pendingPrompt,
  onConsumePendingPrompt,
}) {
  const levelObj = LEVELS.find((l) => l.id === level) || LEVELS[1];
  const [socraticMode, setSocraticMode] = useState(true);
  const [councilMode, setCouncilMode] = useState(false);
  const [selectedModels, setSelectedModels] = useState(['Gemini', 'ChatGPT', 'Claude']);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatContext, setChatContext] = useState(null);
  const [attachment, setAttachment] = useState(null); // { kind: 'image'|'text', name, mimeType, dataUrl, base64, textContent, sizeLabel }
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const connectedProviders = [
    apiKeys?.gemini?.trim() && 'Gemini',
    apiKeys?.openai?.trim() && 'ChatGPT',
    apiKeys?.claude?.trim() && 'Claude',
    apiKeys?.openrouter?.trim() && 'OpenRouter (All 3)',
  ].filter(Boolean);

  useEffect(() => {
    setChatContext(null);
    setMessages([
      {
        id: `welcome-${activeTopic.id}`,
        role: 'assistant',
        source: connectedProviders.length
          ? `Multi-AI (${connectedProviders.join(', ')}) + Live Web`
          : 'Multi-Web & AI Council Engine',
        text: `Hi! I'm **EduBuddy**, your Multi-Web, Vision & AI Council Study Tutor (tuned to **${levelObj.label}**).\n\n• Ask **ANY question** across any subject, OR toggle **⚔️ AI Council Debate** to make selected AI perspectives debate and synthesize the best answer!\n• Click the **📎 Upload Picture / File** button (or paste a screenshot with \`Ctrl+V\`) to upload a question photo or note and ask **sub-questions** directly about it!`,
      },
    ]);
  }, [activeTopic.id, level, connectedProviders.join(',')]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (pendingPrompt && pendingPrompt.trim()) {
      const promptText = pendingPrompt.trim();
      onConsumePendingPrompt?.();
      sendMessage(promptText);
    }
  }, [pendingPrompt]);

  const toggleModelSelection = (modelName) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelName)) {
        return prev.length > 1 ? prev.filter((m) => m !== modelName) : prev;
      }
      return [...prev, modelName];
    });
  };

  const processUploadedFile = (file) => {
    if (!file) return;
    const sizeKB = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const base64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : '';
        setAttachment({
          kind: 'image',
          name: file.name || 'pasted-question.png',
          mimeType: file.type,
          dataUrl,
          base64,
          sizeLabel,
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const textContent = typeof reader.result === 'string' ? reader.result : '';
        setAttachment({
          kind: 'text',
          name: file.name,
          mimeType: file.type || 'text/plain',
          textContent: textContent.slice(0, 12000),
          sizeLabel,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
    e.target.value = '';
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          processUploadedFile(file);
          return;
        }
      }
    }
  };

  const sendMessage = async (textToSend) => {
    const trimmed = textToSend.trim();
    const effectiveQuestion =
      trimmed || (attachment ? `Explain and solve what is shown in ${attachment.name}` : '');
    if (!effectiveQuestion || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: effectiveQuestion,
      attachmentPreview: attachment
        ? { kind: attachment.kind, name: attachment.name, dataUrl: attachment.dataUrl }
        : null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await getTutorReply({
        userMessage: effectiveQuestion,
        topic: activeTopic,
        chatContext,
        levelId: level,
        socraticMode,
        councilMode,
        selectedModels,
        apiKeys,
        attachment,
      });
      if (reply.resolvedContext) {
        setChatContext(reply.resolvedContext);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: reply.text,
          source: reply.source,
          debate: reply.debate,
          modelResponses: reply.modelResponses,
          webSources: reply.webSources,
          compareLinks: reply.compareLinks,
          needsVisionKey: reply.needsVisionKey,
        },
      ]);
      onEarnXP(
        councilMode ? 15 : 10,
        councilMode
          ? `Ran AI Council Debate: ${effectiveQuestion.slice(0, 34)}`
          : `Asked Multi-AI Tutor: ${effectiveQuestion.slice(0, 36)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const currentFocusLabel = chatContext?.title || activeTopic.title;

  return (
    <div className="page-container tutor-layout">
      <div className="page-header-card compact">
        <div>
          <div className="pill-badge">
            <Sparkles size={13} />
            <span>Multi-Web · Vision · AI Council Study Tutor</span>
          </div>
          <h1 className="page-title">Ask Anything, Upload Pictures, or Debate Across AIs</h1>
          <p className="page-subtitle">
            Chat Focus: <strong>{currentFocusLabel}</strong> · Level:{' '}
            <strong style={{ color: levelObj.color }}>{levelObj.label}</strong> ·{' '}
            {connectedProviders.length > 0
              ? `Live AI Connected: ${connectedProviders.join(', ')}`
              : 'Live Web Council Active (Connect Gemini / ChatGPT / Claude in Settings)'}
          </p>
        </div>

        <div className="tutor-controls wrap">
          <button
            className={`council-toggle-btn ${councilMode ? 'active' : ''}`}
            onClick={() => setCouncilMode((v) => !v)}
            title="Selected AIs & web perspectives debate your question and synthesize one consensus answer"
          >
            <Swords size={15} />
            <span>AI Council Debate: {councilMode ? 'ON' : 'OFF'}</span>
          </button>
          <button
            className={`mode-toggle-btn ${socraticMode ? 'active' : ''}`}
            onClick={() => setSocraticMode((v) => !v)}
            title="Socratic mode asks guiding questions instead of just lecturing"
          >
            <Brain size={15} />
            <span>Socratic: {socraticMode ? 'ON' : 'OFF'}</span>
          </button>
          <button className="btn-outline btn-sm" onClick={openSettings}>
            <Settings size={14} />
            <span>{connectedProviders.length ? `AI Keys (${connectedProviders.length})` : 'Connect AI Models'}</span>
          </button>
          <button
            className="btn-ghost btn-sm"
            onClick={() => {
              setChatContext(null);
              setAttachment(null);
              setMessages([
                {
                  id: `reset-${Date.now()}`,
                  role: 'assistant',
                  source: 'EduBuddy Multi-Web & Council Engine',
                  text: `Fresh start! Ask any question, toggle **⚔️ AI Council Debate**, or upload a picture/file to ask sub-questions about it.`,
                },
              ]);
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Selectable AI Council Models Strip (shown whenever Council Mode is ON or always handy!) */}
      {councilMode && (
        <div className="council-selector-strip">
          <div className="flex-row gap-2 wrap">
            <span className="council-strip-label">
              <Swords size={14} className="accent-indigo" /> Debate Panel Models:
            </span>
            {COUNCIL_MODELS.map((m) => {
              const active = selectedModels.includes(m.id);
              return (
                <button
                  key={m.id}
                  className={`council-model-chip ${active ? 'active' : ''}`}
                  style={{ '--cm-color': m.color }}
                  onClick={() => toggleModelSelection(m.id)}
                >
                  <span className="cm-dot" />
                  <span>{m.id}</span>
                </button>
              );
            })}
          </div>
          <span className="muted-xs">
            EduBuddy queries selected models + web sources, cross-critiques them, and gives one Consensus Verdict.
          </span>
        </div>
      )}

      <div className="card chat-shell">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble-row ${msg.role}`}>
              <div className={`chat-avatar ${msg.role}`}>
                {msg.role === 'assistant' ? <Bot size={17} /> : <User size={17} />}
              </div>
              <div className={`chat-bubble ${msg.role}`}>
                {msg.source && <div className="bubble-source">{msg.source}</div>}

                {msg.attachmentPreview && (
                  <div className="bubble-attachment-preview">
                    {msg.attachmentPreview.kind === 'image' && msg.attachmentPreview.dataUrl ? (
                      <img
                        src={msg.attachmentPreview.dataUrl}
                        alt={msg.attachmentPreview.name}
                        className="bubble-uploaded-img"
                      />
                    ) : (
                      <div className="bubble-file-tag">
                        <FileText size={14} /> {msg.attachmentPreview.name}
                      </div>
                    )}
                  </div>
                )}

                {msg.debate ? (
                  <AICouncilDebateCard debate={msg.debate} openSettings={openSettings} />
                ) : msg.modelResponses && msg.modelResponses.length > 1 ? (
                  <MultiModelTabs modelResponses={msg.modelResponses} />
                ) : (
                  <div className="bubble-content">{renderFormattedText(msg.text)}</div>
                )}

                {msg.needsVisionKey && (
                  <button className="btn-primary btn-sm mt-3" onClick={openSettings}>
                    <Key size={13} /> Connect Free Gemini Vision Key
                  </button>
                )}

                {msg.webSources && msg.webSources.length > 0 && (
                  <div className="web-sources-box">
                    <div className="web-sources-label">
                      <Globe size={12} /> Verified Web & Research Sources
                    </div>
                    <div className="web-sources-list">
                      {msg.webSources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="web-source-pill"
                          title={src.snippet}
                        >
                          <span className="src-site">{src.site}</span>
                          <span className="src-title">{src.title}</span>
                          <ExternalLink size={11} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {msg.compareLinks && msg.compareLinks.length > 0 && (
                  <div className="compare-ai-bar">
                    <span className="compare-label">Compare on:</span>
                    {msg.compareLinks.map((lnk) => (
                      <a
                        key={lnk.name}
                        href={lnk.url}
                        target="_blank"
                        rel="noreferrer"
                        className="compare-pill"
                        style={{ '--cmp-color': lnk.color }}
                      >
                        {lnk.name} <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble-row assistant">
              <div className="chat-avatar assistant">
                <Bot size={17} />
              </div>
              <div className="chat-bubble assistant typing-bubble">
                <Loader2 size={15} className="spin" />
                {councilMode
                  ? `Running AI Council Debate across ${selectedModels.join(', ')} & web sources...`
                  : attachment
                  ? `Analyzing ${attachment.name} & answering your question...`
                  : 'Searching multiple web sources & AI models...'}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Active Pinned Attachment Bar (stays pinned so student can ask multiple sub-questions!) */}
        {attachment && (
          <div className="active-attachment-bar">
            <div className="flex-row gap-2">
              {attachment.kind === 'image' && attachment.dataUrl ? (
                <img src={attachment.dataUrl} alt={attachment.name} className="attach-thumb" />
              ) : (
                <div className="attach-file-icon">
                  <FileText size={16} />
                </div>
              )}
              <div>
                <div className="attach-name">{attachment.name}</div>
                <div className="muted-xs">
                  {attachment.sizeLabel} · Pinned — ask any sub-questions about this {attachment.kind === 'image' ? 'picture' : 'file'}!
                </div>
              </div>
            </div>
            <button
              className="btn-ghost btn-sm"
              onClick={() => setAttachment(null)}
              title="Remove attachment"
            >
              <X size={14} /> Clear
            </button>
          </div>
        )}

        <div className="quick-prompts-bar">
          {attachment ? (
            <>
              <button
                className="quick-prompt-chip"
                onClick={() => sendMessage('Solve the main question shown in this uploaded file/picture step by step')}
                disabled={loading}
              >
                Solve step-by-step
              </button>
              <button
                className="quick-prompt-chip"
                onClick={() => sendMessage('Explain the key concept in this uploaded file/picture simply')}
                disabled={loading}
              >
                Explain simpler
              </button>
              <button
                className="quick-prompt-chip"
                onClick={() => sendMessage('Give me a hint without spoiling the full final answer')}
                disabled={loading}
              >
                Give me a hint
              </button>
              <button
                className="quick-prompt-chip"
                onClick={() => sendMessage('Create 2 practice sub-questions based on this upload')}
                disabled={loading}
              >
                Ask me sub-questions
              </button>
            </>
          ) : (
            QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                className="quick-prompt-chip"
                onClick={() => sendMessage(qp.prompt)}
                disabled={loading}
              >
                {qp.label}
              </button>
            ))
          )}
        </div>

        <form
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.txt,.md,.csv,.json,.js,.py,.html,.css"
            onChange={handleFileChange}
            hidden
          />
          <button
            type="button"
            className="attach-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload picture of a question or study file (.png, .jpg, .txt, .md, .csv, code)"
            aria-label="Upload picture or file"
          >
            <Paperclip size={17} />
            <ImageIcon size={15} className="attach-img-mini" />
          </button>

          <input
            type="text"
            className="chat-input"
            placeholder={
              attachment
                ? `Ask a sub-question about "${attachment.name}"...`
                : councilMode
                ? `Ask a question for ${selectedModels.join(' vs ')} to debate...`
                : 'Ask ANY question, upload a picture/file, or paste a screenshot (Ctrl+V)...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (!input.trim() && !attachment)}
          >
            {councilMode ? <Swords size={16} /> : <Send size={16} />}
            <span>{councilMode ? 'Debate' : 'Ask'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
