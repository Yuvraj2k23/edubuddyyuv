import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Upload,
  Copy,
  Check,
  BookMarked,
  HelpCircle,
  Lightbulb,
  Loader2,
  Trash2,
} from 'lucide-react';
import { LEVELS } from '../data/knowledgeBase';
import { simplifyStudentNotes } from '../utils/aiEngine';
import { validateUploadedFile, sanitizeUserText } from '../utils/security';

const SAMPLE_NOTES = [
  {
    label: 'CS: Gradient Descent & Backprop',
    text: `Backpropagation computes the gradient of a differentiable loss function with respect to each parameter in a multilayer neural network by recursively applying the chain rule from the output layer backward. Stochastic gradient descent then updates parameters iteratively opposite the gradient direction. When networks become very deep, repeated multiplication of small derivatives causes vanishing gradients, while heuristic techniques like residual skip connections and normalization stabilize convergence and improve asymptotic generalization.`,
  },
  {
    label: 'Biology: CRISPR & Gene Repair',
    text: `In the CRISPR-Cas9 system, an engineered single-guide RNA directs the Cas9 endonuclease to a complementary genomic DNA target immediately upstream of a protospacer adjacent motif (PAM). Upon target recognition, Cas9 induces a site-specific double-strand break. The host cell subsequently initiates endogenous repair either through non-homologous end joining, which frequently creates disruptive insertions or deletions, or through homology-directed repair when a donor template is provided for precise sequence editing.`,
  },
  {
    label: 'Physics: Thermodynamics & Entropy',
    text: `According to the Second Law of Thermodynamics, the total entropy of an isolated macroscopic system cannot decrease over time. In statistical mechanics, entropy quantifies the logarithm of the number of accessible microscopic configurations corresponding to a macroscopic state. While a heat pump or living organism can locally maintain homeostasis and lower internal entropy, it must expend energy and export a greater quantity of heat and entropy into its surroundings to preserve global thermodynamic equilibrium.`,
  },
];

export default function NoteSimplifier({ level, setLevel, apiKey, onEarnXP }) {
  const [noteText, setNoteText] = useState(SAMPLE_NOTES[0].text);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const levelObj = LEVELS.find((l) => l.id === level) || LEVELS[0];

  const handleSimplify = async () => {
    if (!noteText.trim() || loading) return;
    setLoading(true);
    try {
      const output = await simplifyStudentNotes(noteText, level, apiKey);
      setResult(output);
      onEarnXP(25, 'Simplified study notes into a visual guide');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateUploadedFile(file, {
      maxBytes: 2 * 1024 * 1024,
      allowImages: false,
      allowPdf: false,
      allowText: true,
    });
    if (!check.valid) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setNoteText(sanitizeUserText(ev.target.result, 6000));
      }
    };
    reader.readAsText(file);
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    const md = `# Simplified Study Guide (${levelObj.label})\n\n## TL;DR\n${result.tldr}\n\n## Plain Explanation\n${result.simplifiedExplanation}\n\n## Key Takeaways\n${result.keyTakeaways.map((t) => `- ${t}`).join('\n')}\n\n## Analogy\n${result.analogy}\n\n## Self-Test Questions\n${result.studyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <div className="page-header-card compact">
        <div>
          <div className="pill-badge">
            <FileText size={13} />
            <span>AI Textbook & Lecture Note Decoder</span>
          </div>
          <h1 className="page-title">Simplify Dense Notes Instantly</h1>
          <p className="page-subtitle">
            Paste any confusing textbook paragraph or upload a <code>.txt</code> / <code>.md</code> lecture note. EduBuddy extracts the TL;DR, decodes academic jargon, creates an analogy, and builds self-test questions.
          </p>
        </div>
      </div>

      <div className="notes-grid">
        {/* Input Pane */}
        <div className="card">
          <div className="notes-input-header">
            <h3>1. Paste Notes or Pick a Sample</h3>
            <div className="flex-row gap-2">
              <label className="btn-outline btn-sm upload-label">
                <Upload size={14} /> Upload .txt/.md
                <input type="file" accept=".txt,.md" onChange={handleFileUpload} hidden />
              </label>
              <button className="btn-ghost btn-sm" onClick={() => { setNoteText(''); setResult(null); }}>
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>

          <div className="sample-pills">
            <span className="muted-xs">Quick demos:</span>
            {SAMPLE_NOTES.map((s) => (
              <button
                key={s.label}
                className="sample-pill-btn"
                onClick={() => setNoteText(s.text)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <textarea
            className="notes-textarea"
            rows={10}
            placeholder="Paste a dense paragraph from your textbook, lecture slides, or research paper..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />

          <div className="notes-controls-footer">
            <div className="flex-row gap-2 wrap">
              <span className="muted-xs">Target Reading Level:</span>
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  className={`mini-lvl-tag ${level === l.id ? 'active' : ''}`}
                  style={{ '--lvl-color': l.color }}
                  onClick={() => setLevel(l.id)}
                >
                  {l.shortLabel}
                </button>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={handleSimplify}
              disabled={loading || !noteText.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Decoding...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Simplify Notes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Pane */}
        <div className="card notes-output-card">
          {!result ? (
            <div className="empty-output-state">
              <Sparkles size={34} className="accent-indigo" />
              <h3>Ready to Decode Your Notes</h3>
              <p className="muted-sm">
                Click <strong>Simplify Notes</strong> to generate a level-matched summary, jargon glossary, analogy, and active-recall questions.
              </p>
            </div>
          ) : (
            <div className="simplified-output">
              <div className="output-top-bar">
                <div className="flex-row gap-2">
                  <span className="subject-pill">{levelObj.label}</span>
                  <span className="meta-pill">{result.source}</span>
                </div>
                <button className="btn-outline btn-sm" onClick={handleCopyMarkdown}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied Markdown!' : 'Copy Study Guide'}</span>
                </button>
              </div>

              <div className="tldr-box">
                <div className="tldr-label">TL;DR IN ONE BREATH</div>
                <p>{result.tldr}</p>
              </div>

              <div className="output-block">
                <h4>Simplified Explanation</h4>
                <p>{result.simplifiedExplanation}</p>
              </div>

              <div className="output-block">
                <h4>Key Takeaways</h4>
                <ul className="takeaways-list">
                  {result.keyTakeaways.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="output-block analogy-inline">
                <div className="flex-row gap-2 mb-1">
                  <Lightbulb size={16} className="accent-amber" />
                  <h4>Everyday Analogy</h4>
                </div>
                <p>{result.analogy}</p>
              </div>

              {result.jargonGlossary?.length > 0 && (
                <div className="output-block">
                  <div className="flex-row gap-2 mb-2">
                    <BookMarked size={16} className="accent-indigo" />
                    <h4>Jargon Decoder Glossary</h4>
                  </div>
                  <div className="glossary-grid">
                    {result.jargonGlossary.map((g, i) => (
                      <div key={i} className="glossary-item">
                        <div className="glossary-term">{g.term}</div>
                        <div className="glossary-def">{g.plainMeaning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="output-block">
                <div className="flex-row gap-2 mb-2">
                  <HelpCircle size={16} className="accent-emerald" />
                  <h4>Auto-Generated Self-Test Questions</h4>
                </div>
                <ol className="questions-list">
                  {result.studyQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
