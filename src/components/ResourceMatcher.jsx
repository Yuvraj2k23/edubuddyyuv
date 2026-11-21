import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Video,
  Laptop,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Clock,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  StickyNote,
  X,
  Upload,
  Link2,
  Copy,
  Check,
  Trash2,
  Eye,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { LEVELS, SUBJECTS } from '../data/knowledgeBase';
import {
  sanitizeExternalUrl,
  sanitizeUserText,
  validateUploadedFile,
  isSafeMediaDataUrl,
} from '../utils/security';

const TYPE_ICONS = {
  Video: Video,
  Interactive: Laptop,
  'Reading Guide': BookOpen,
  Practice: FileSpreadsheet,
  'Cheat Sheet': FileText,
};

const STATUS_OPTIONS = [
  { id: 'to-study', label: 'To Study', icon: Circle, cls: 'status-todo' },
  { id: 'in-progress', label: 'In Progress', icon: PlayCircle, cls: 'status-prog' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, cls: 'status-done' },
];

const TOPIC_LEARNING_PATH = {
  'neural-networks': {
    prereqs: ['Calculus: Derivatives & Gradients', 'Linear Algebra & Matrices', 'Chain Rule Basics'],
    nextSteps: ['Convolutional Neural Networks (CNNs)', 'Transformers & Attention', 'Regularization & Dropout'],
  },
  'dynamic-programming': {
    prereqs: ['Recursion & Call Stack', 'Big-O Time Complexity', 'Hash Maps & Arrays'],
    nextSteps: ['Graph Shortest Paths (Dijkstra)', 'Bitmask DP & Tree DP', 'Greedy vs DP Proofs'],
  },
  'quantum-entanglement': {
    prereqs: ['Wave-Particle Duality', 'Linear Algebra & Vectors', 'Probability Amplitudes'],
    nextSteps: ['Quantum Teleportation Protocol', 'Quantum Key Distribution (BB84)', 'Quantum Error Correction'],
  },
  'crispr-cas9': {
    prereqs: ['DNA Double Helix & Base Pairing', 'Transcription & RNA', 'Cellular DNA Repair'],
    nextSteps: ['Base Editing & Prime Editing', 'Gene Therapy Delivery (AAV)', 'Epigenetic CRISPRa / CRISPRi'],
  },
  'calculus-derivatives': {
    prereqs: ['Functions & Graphs', 'Limits & Continuity', 'Algebraic Slope Formula'],
    nextSteps: ['Integrals & Fundamental Theorem', 'Multivariable Gradients & Jacobians', 'Neural Networks & Backpropagation'],
  },
  'os-deadlocks': {
    prereqs: ['Processes vs Threads', 'Mutex Locks & Semaphores', 'CPU Scheduling Basics'],
    nextSteps: ['Lock-Free Concurrency (CAS)', 'Database Transaction Isolation', 'Distributed Consensus (Raft)'],
  },
  'thermodynamics-entropy': {
    prereqs: ['Conservation of Energy', 'Ideal Gas Law (PV = nRT)', 'Kinetic Molecular Theory'],
    nextSteps: ['Statistical Mechanics & Microstates', 'Gibbs Free Energy in Chemistry', 'Shannon Information Entropy'],
  },
  'supply-demand-elasticity': {
    prereqs: ['Supply & Demand Curves', 'Market Equilibrium', 'Percentage Change Math'],
    nextSteps: ['Consumer & Producer Surplus', 'Monopoly & Market Power', 'Optimal Taxation & Deadweight Loss'],
  },
  mitochondria: {
    prereqs: ['Eukaryotic Cell Structure', 'ATP & Cellular Energy', 'Glycolysis Overview'],
    nextSteps: ['Photosynthesis & Chloroplasts', 'Oxidative Phosphorylation', 'Endosymbiotic Evolution'],
  },
};

function getTopicPath(topic) {
  if (TOPIC_LEARNING_PATH[topic.id]) return TOPIC_LEARNING_PATH[topic.id];
  const subj = topic.subject || 'General';
  if (subj === 'History') {
    return {
      prereqs: ['Colonial Administration Basics', 'Key Timeline & Causes', 'Primary vs Secondary Sources'],
      nextSteps: ['Long-Term Historical Impact', 'Comparative Revolutions', 'Exam Essay Synthesis'],
    };
  }
  if (subj === 'Biology') {
    return {
      prereqs: ['Cell Structure & Organelles', 'Biomolecules Basics', 'Energy Flow in Living Systems'],
      nextSteps: ['Regulatory Pathways', 'Experimental Case Studies', 'Applied Biotechnology'],
    };
  }
  if (subj === 'Mathematics') {
    return {
      prereqs: ['Core Definitions & Notation', 'Algebraic Manipulation', 'Worked Base Examples'],
      nextSteps: ['Proof Techniques & Edge Cases', 'Applied Word Problems', 'Advanced Generalizations'],
    };
  }
  return {
    prereqs: [`Foundations of ${subj}`, 'Core Terminology & Intuition', 'Introductory Worked Examples'],
    nextSteps: [`Advanced ${topic.title} Applications`, 'Exam-Level Problem Sets', `Cross-Topic ${subj} Synthesis`],
  };
}

function getTailoredWhyMatch(resource, selectedLevelObj, distance) {
  const baseWhy = resource.whyItFits || '';
  if (distance === 0) {
    return `Exact fit for ${selectedLevelObj.label} — ${baseWhy.charAt(0).toLowerCase() + baseWhy.slice(1)}`;
  }
  if (distance === 1) {
    return `Great ${selectedLevelObj.shortLabel} bridge — ${baseWhy.charAt(0).toLowerCase() + baseWhy.slice(1)}`;
  }
  return `Reference for ${selectedLevelObj.shortLabel} learners — ${baseWhy.charAt(0).toLowerCase() + baseWhy.slice(1)}`;
}

export default function ResourceMatcher({
  topics,
  activeTopic,
  level,
  setLevel,
  savedResources,
  onToggleSaveResource,
  resourceMeta = {},
  onUpdateResourceMeta,
  customResources = [],
  onAddCustomResource,
  onDeleteCustomResource,
  onExploreTopicQuery,
}) {
  const [scope, setScope] = useState('active'); // 'active' | 'all' | 'custom'
  const [typeFilter, setTypeFilter] = useState('All');
  const [onlyMatchedLevel, setOnlyMatchedLevel] = useState(false);

  // Prerequisite & Quick Revision Strip state
  const [stripExpanded, setStripExpanded] = useState(true);
  const [stripTab, setStripTab] = useState('prereqs'); // 'prereqs' | 'cheatsheet'
  const [cheatCopied, setCheatCopied] = useState(false);

  // Add Resource Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState('url'); // 'url' | 'notes'
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formFormat, setFormFormat] = useState('Video');
  const [formSubject, setFormSubject] = useState(activeTopic.subject || 'Computer Science');
  const [formLevel, setFormLevel] = useState(level || 'highschool');
  const [formDuration, setFormDuration] = useState('15 min');
  const [formWhy, setFormWhy] = useState('');
  const [formNotesText, setFormNotesText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [previewResource, setPreviewResource] = useState(null);

  useEffect(() => {
    if (!addModalOpen && !previewResource) return;
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setAddModalOpen(false);
        setPreviewResource(null);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [addModalOpen, previewResource]);

  const currentLevelIdx = LEVELS.findIndex((l) => l.id === level);
  const currentLevelObj = LEVELS[currentLevelIdx] || LEVELS[1];
  const levelData = activeTopic.levels?.[level] || activeTopic.levels?.highschool || activeTopic.levels?.eli5;
  const topicPath = getTopicPath(activeTopic);

  const allResources = useMemo(() => {
    const list = [];

    if (scope !== 'custom') {
      const sourceTopics = scope === 'active' ? [activeTopic] : topics;
      sourceTopics.forEach((t) => {
        (t.resources || []).forEach((r, idx) => {
          const resLevelIdx = LEVELS.findIndex((l) => l.id === r.level);
          const distance = Math.abs((resLevelIdx === -1 ? 1 : resLevelIdx) - currentLevelIdx);
          const matchScore = distance === 0 ? 98 : distance === 1 ? 82 : distance === 2 ? 64 : 48;
          list.push({
            ...r,
            id: `${t.id}-res-${idx}`,
            topicTitle: t.title,
            subject: t.subject,
            matchScore,
            distance,
            levelObj: LEVELS[resLevelIdx] || LEVELS[1],
          });
        });
      });
    }

    // Include student-contributed resources!
    customResources.forEach((cr) => {
      const matchesScope =
        scope === 'custom' ||
        scope === 'all' ||
        cr.topicId === activeTopic.id ||
        cr.subject === activeTopic.subject;
      if (!matchesScope) return;
      const resLevelIdx = LEVELS.findIndex((l) => l.id === cr.level);
      const distance = Math.abs((resLevelIdx === -1 ? 1 : resLevelIdx) - currentLevelIdx);
      const matchScore = distance === 0 ? 99 : distance === 1 ? 85 : distance === 2 ? 68 : 52;
      list.push({
        ...cr,
        matchScore,
        distance,
        levelObj: LEVELS[resLevelIdx] || LEVELS[1],
        isStudentUpload: true,
      });
    });

    return list
      .filter((r) => (typeFilter === 'All' ? true : r.type === typeFilter))
      .filter((r) => (onlyMatchedLevel ? r.level === level : true))
      .sort((a, b) => {
        if (a.isStudentUpload && !b.isStudentUpload && scope === 'custom') return -1;
        return b.matchScore - a.matchScore;
      });
  }, [scope, activeTopic, topics, customResources, currentLevelIdx, typeFilter, onlyMatchedLevel, level]);

  const totalSavedMinutes = useMemo(() => {
    return savedResources.reduce((acc, r) => {
      const m = parseInt(r.duration, 10);
      return acc + (Number.isNaN(m) ? 15 : m);
    }, 0);
  }, [savedResources]);

  const handleCopyCheatSheet = () => {
    const md = `# ${activeTopic.title} — Quick Cheat Sheet (${currentLevelObj.label})\n\n**Core Summary:** ${levelData?.summary || ''}\n\n**Key Rule / Formula:** ${levelData?.formulaOrRule || ''}\n\n**Key Takeaways:**\n${(levelData?.steps || [])
      .slice(0, 3)
      .map((s) => `- ${s.title}: ${s.detail}`)
      .join('\n')}\n\n**Watch Out:** ${levelData?.commonMistake || ''}`;
    navigator.clipboard?.writeText(md);
    setCheatCopied(true);
    setTimeout(() => setCheatCopied(false), 2000);
  };

  const handleFileUploadInModal = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    const check = validateUploadedFile(file, {
      maxBytes: 5 * 1024 * 1024,
      allowImages: true,
      allowPdf: true,
      allowText: true,
    });
    if (!check.valid) {
      setFormError(check.error);
      e.target.value = '';
      return;
    }

    setUploadedFileName(file.name);
    if (!formTitle.trim()) {
      setFormTitle(sanitizeUserText(file.name.replace(/\.[^.]+$/, ''), 120));
    }

    if (check.kind === 'pdf' || check.kind === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        const resStr = typeof reader.result === 'string' ? reader.result : '';
        if (isSafeMediaDataUrl(resStr)) {
          setUploadedFileDataUrl(resStr);
        } else {
          setFormError('Invalid media format.');
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormNotesText(sanitizeUserText(reader.result, 12000));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCreateCustomResource = (e) => {
    e.preventDefault();
    setFormError('');
    const safeTitle = sanitizeUserText(formTitle, 140);
    if (!safeTitle) {
      setFormError('Please enter a resource title.');
      return;
    }

    let cleanUrl = '';
    if (addMode === 'url') {
      cleanUrl = sanitizeExternalUrl(formUrl);
      if (!cleanUrl) {
        setFormError('Please enter a valid http:// or https:// URL.');
        return;
      }
    } else if (!formNotesText.trim() && !uploadedFileDataUrl) {
      setFormError('Please upload a study file or paste your class notes.');
      return;
    }

    const newItem = {
      id: `user-res-${Date.now()}`,
      title: safeTitle,
      url: cleanUrl,
      type: formFormat,
      platform: addMode === 'url' ? 'Student Link' : uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'My Class Notes',
      duration: sanitizeUserText(formDuration, 24) || '15 min',
      level: formLevel,
      subject: formSubject,
      topicId: activeTopic.id,
      topicTitle: activeTopic.title,
      whyItFits:
        sanitizeUserText(formWhy, 220) ||
        (addMode === 'url'
          ? 'Custom link added by you to support this study module.'
          : 'Personal class notes / study file uploaded for quick review.'),
      notesContent: addMode === 'notes' ? sanitizeUserText(formNotesText, 12000) : '',
      fileDataUrl: addMode === 'notes' && isSafeMediaDataUrl(uploadedFileDataUrl) ? uploadedFileDataUrl : '',
      fileName: uploadedFileName,
      isStudentUpload: true,
    };

    onAddCustomResource(newItem);
    // Reset modal
    setFormTitle('');
    setFormUrl('');
    setFormWhy('');
    setFormNotesText('');
    setUploadedFileName('');
    setUploadedFileDataUrl('');
    setAddModalOpen(false);
  };

  return (
    <div className="page-container res-hub-page">
      {/* Compact Streamlined Header Row */}
      <div className="page-header-card res-header-compact">
        <div className="res-header-left">
          <div className="pill-badge mb-1">
            <Sparkles size={13} />
            <span>Personalized Learning Study Hub</span>
          </div>
          <h1 className="page-title">Resources Matched to Your Understanding Level</h1>
          <p className="page-subtitle">
            Ranked by fit for your{' '}
            <strong style={{ color: currentLevelObj.color }}>{currentLevelObj.label}</strong> profile ·{' '}
            Track study progress, add personal timestamps/notes, or upload your own materials.
          </p>
        </div>

        <div className="res-header-actions">
          <div className="study-plan-badge-compact" title="Your bookmarked study queue">
            <BookmarkCheck size={16} className="accent-indigo" />
            <div className="spb-text">
              <strong>{savedResources.length} Saved</strong>
              <span>· {totalSavedMinutes} min</span>
            </div>
          </div>

          <button
            className="btn-primary btn-sm"
            onClick={() => {
              setFormSubject(activeTopic.subject || 'Computer Science');
              setFormLevel(level || 'highschool');
              setAddModalOpen(true);
            }}
          >
            <Plus size={15} />
            <span>Add Resource / Notes</span>
          </button>
        </div>
      </div>

      {/* Unified Compact Filter + Level Switcher Card */}
      <div className="card filter-toolbar res-unified-filter">
        <div className="filter-group">
          <span className="filter-label">
            <Filter size={13} /> Scope:
          </span>
          <button
            className={`chip-btn ${scope === 'active' ? 'active' : ''}`}
            onClick={() => setScope('active')}
          >
            Current Topic ({activeTopic.title.slice(0, 22)}
            {activeTopic.title.length > 22 ? '…' : ''})
          </button>
          <button
            className={`chip-btn ${scope === 'all' ? 'active' : ''}`}
            onClick={() => setScope('all')}
          >
            All Subjects ({topics.length} Topics)
          </button>
          <button
            className={`chip-btn ${scope === 'custom' ? 'active' : ''}`}
            onClick={() => setScope('custom')}
          >
            My Uploads ({customResources.length})
          </button>
        </div>

        <div className="filter-group">
          <span className="filter-label">Format:</span>
          {['All', 'Video', 'Interactive', 'Reading Guide', 'Practice', 'Cheat Sheet'].map((type) => (
            <button
              key={type}
              className={`chip-btn ${typeFilter === type ? 'active' : ''}`}
              onClick={() => setTypeFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="filter-level-row">
          <div className="filter-group">
            <span className="filter-label">Re-rank by level:</span>
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

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={onlyMatchedLevel}
              onChange={(e) => setOnlyMatchedLevel(e.target.checked)}
            />
            <span className="muted-xs">Exact Level Match Only ({currentLevelObj.shortLabel})</span>
          </label>
        </div>
      </div>

      {/* Collapsible Prerequisite & Quick Revision Strip */}
      <div className="card prereq-strip-card">
        <div className="prereq-strip-head">
          <div className="prereq-tabs">
            <button
              className={`prereq-tab-btn ${stripTab === 'prereqs' ? 'active' : ''}`}
              onClick={() => {
                setStripTab('prereqs');
                setStripExpanded(true);
              }}
            >
              <Compass size={14} /> Prerequisites & Next Steps
            </button>
            <button
              className={`prereq-tab-btn ${stripTab === 'cheatsheet' ? 'active' : ''}`}
              onClick={() => {
                setStripTab('cheatsheet');
                setStripExpanded(true);
              }}
            >
              <FileText size={14} /> Quick Cheat Sheet ({activeTopic.title.slice(0, 24)}
              {activeTopic.title.length > 24 ? '…' : ''})
            </button>
          </div>

          <button
            className="btn-ghost btn-sm"
            onClick={() => setStripExpanded((v) => !v)}
            aria-label={stripExpanded ? 'Collapse strip' : 'Expand strip'}
          >
            {stripExpanded ? (
              <>
                Collapse <ChevronUp size={14} />
              </>
            ) : (
              <>
                Expand <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>

        {stripExpanded && (
          <div className="prereq-strip-body">
            {stripTab === 'prereqs' ? (
              <div className="prereq-two-col">
                <div className="prereq-col">
                  <div className="prereq-col-label">BEFORE THIS TOPIC (QUICK REFRESHERS)</div>
                  <div className="prereq-chip-list">
                    {topicPath.prereqs.map((item) => (
                      <button
                        key={item}
                        className="prereq-jump-chip"
                        onClick={() => onExploreTopicQuery?.(item)}
                        title={`Explore "${item}" in Concept Simplifier`}
                      >
                        <span>{item}</span>
                        <ArrowRight size={12} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="prereq-col">
                  <div className="prereq-col-label">RECOMMENDED NEXT STEPS</div>
                  <div className="prereq-chip-list">
                    {topicPath.nextSteps.map((item) => (
                      <button
                        key={item}
                        className="prereq-jump-chip next"
                        onClick={() => onExploreTopicQuery?.(item)}
                        title={`Study next: "${item}"`}
                      >
                        <span>{item}</span>
                        <ArrowRight size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="cheatsheet-compact-box">
                <div className="cheatsheet-top">
                  <div>
                    <div className="cheatsheet-def">{levelData?.summary}</div>
                    {levelData?.formulaOrRule && (
                      <div className="cheatsheet-formula">
                        <span>KEY RULE:</span> <code>{levelData.formulaOrRule}</code>
                      </div>
                    )}
                  </div>
                  <button className="btn-outline btn-sm" onClick={handleCopyCheatSheet}>
                    {cheatCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{cheatCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {levelData?.steps?.length > 0 && (
                  <div className="cheatsheet-points">
                    {levelData.steps.slice(0, 3).map((st, i) => (
                      <div key={i} className="cs-point">
                        <strong>{st.title}:</strong> {st.detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resource Grid */}
      {allResources.length === 0 ? (
        <div className="card empty-state">
          <p>
            {scope === 'custom'
              ? 'You have not added any personal resources or notes yet. Click "+ Add Resource / Notes" above to upload your first one!'
              : 'No resources match those exact filters. Turn off "Exact Level Match Only" or switch Format to "All".'}
          </p>
        </div>
      ) : (
        <div className="resource-grid">
          {allResources.map((res) => {
            const Icon = TYPE_ICONS[res.type] || BookOpen;
            const isSaved = savedResources.some((s) => s.id === res.id);
            const isPerfectMatch = res.matchScore >= 95;
            const meta = resourceMeta[res.id] || { status: 'to-study', note: '' };
            const currentStatusObj =
              STATUS_OPTIONS.find((s) => s.id === meta.status) || STATUS_OPTIONS[0];
            const StatusIcon = currentStatusObj.icon;

            const cycleStatus = () => {
              const idx = STATUS_OPTIONS.findIndex((s) => s.id === meta.status);
              const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
              onUpdateResourceMeta?.(res.id, { ...meta, status: next.id });
            };

            return (
              <div
                key={res.id}
                className={`card resource-card ${isPerfectMatch ? 'perfect-fit' : ''} ${
                  meta.status === 'completed' ? 'is-completed-res' : ''
                }`}
              >
                <div className="resource-top">
                  <div className="flex-row gap-2 wrap">
                    <div className="resource-type-pill">
                      <Icon size={13} />
                      <span>{res.type}</span>
                    </div>
                    <span className="res-time-tag">
                      <Clock size={12} /> {res.duration}
                    </span>
                    {res.isStudentUpload && <span className="student-upload-tag">My Upload</span>}
                  </div>
                  <div
                    className={`match-badge ${
                      res.matchScore >= 95 ? 'high' : res.matchScore >= 80 ? 'med' : 'low'
                    }`}
                  >
                    {res.matchScore}% Level Fit
                  </div>
                </div>

                <div className="resource-topic-tag">
                  {res.subject} · {res.topicTitle}
                </div>
                <h3 className="resource-title">{res.title}</h3>

                {/* Tailored 1-line "Why this matches" */}
                <p className="resource-why">
                  {getTailoredWhyMatch(res, currentLevelObj, res.distance)}
                </p>

                <div className="resource-meta-row">
                  <span
                    className="lvl-chip"
                    style={{
                      backgroundColor: `${res.levelObj.color}20`,
                      color: res.levelObj.color,
                    }}
                  >
                    {res.levelObj.label}
                  </span>
                  <span className="muted-xs">{res.platform}</span>

                  {/* Status Selector Pill */}
                  <button
                    type="button"
                    className={`res-status-pill ${currentStatusObj.cls}`}
                    onClick={cycleStatus}
                    title="Click to switch status: To Study → In Progress → Completed"
                  >
                    <StatusIcon size={12} />
                    <span>{currentStatusObj.label}</span>
                  </button>
                </div>

                {/* Personal 1-Line Study Note Field */}
                <div className="res-note-input-wrap">
                  <StickyNote size={13} className="res-note-icon" />
                  <input
                    type="text"
                    className="res-note-input"
                    placeholder='Add personal note (e.g. "Watch from 4:20 for derivation")'
                    value={meta.note || ''}
                    onChange={(e) =>
                      onUpdateResourceMeta?.(res.id, { ...meta, note: e.target.value })
                    }
                  />
                </div>

                <div className="resource-actions">
                  {sanitizeExternalUrl(res.url) ? (
                    <a
                      href={sanitizeExternalUrl(res.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary btn-sm flex-1"
                    >
                      <span>Open Resource</span>
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary btn-sm flex-1"
                      onClick={() => setPreviewResource(res)}
                    >
                      <Eye size={14} aria-hidden="true" />
                      <span>Open My Notes / File</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={`btn-sm ${isSaved ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => onToggleSaveResource(res)}
                    title={isSaved ? 'Remove from Study Plan' : 'Save to Study Plan'}
                  >
                    {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  {res.isStudentUpload && (
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onDeleteCustomResource?.(res.id)}
                      title="Delete uploaded resource"
                      aria-label="Delete uploaded resource"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: + Add Resource / Notes */}
      {addModalOpen && (
        <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div
            className="modal-card modal-wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div className="flex-row gap-2">
                <Plus size={18} className="accent-indigo" />
                <h3>Add Your Own Resource or Class Notes</h3>
              </div>
              <button
                className="icon-btn"
                onClick={() => setAddModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="add-mode-tabs mb-3">
              <button
                type="button"
                className={`add-mode-btn ${addMode === 'url' ? 'active' : ''}`}
                onClick={() => setAddMode('url')}
              >
                <Link2 size={14} /> Paste Custom URL (YouTube / Article / Drive)
              </button>
              <button
                type="button"
                className={`add-mode-btn ${addMode === 'notes' ? 'active' : ''}`}
                onClick={() => setAddMode('notes')}
              >
                <Upload size={14} /> Upload File / Paste Class Notes
              </button>
            </div>

            <form className="add-res-form" onSubmit={handleCreateCustomResource}>
              <div>
                <label className="field-label">Resource Title *</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder={
                    addMode === 'url'
                      ? 'e.g., 3Blue1Brown Backprop Calculus Lecture'
                      : 'e.g., Lecture 5 Matrix Derivation Notes'
                  }
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {addMode === 'url' ? (
                <div>
                  <label className="field-label">Resource URL *</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="https://youtube.com/watch?v=... or Google Drive / Article URL"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="upload-notes-block">
                  <div className="flex-row justify-between wrap gap-2 mb-2">
                    <label className="field-label mb-0">Upload File (PDF / TXT / MD / Image) or Paste Notes *</label>
                    <label className="btn-outline btn-sm upload-label">
                      <Upload size={13} /> Choose File
                      <input
                        type="file"
                        accept=".pdf,.txt,.md,.csv,image/*"
                        onChange={handleFileUploadInModal}
                        hidden
                      />
                    </label>
                  </div>
                  {uploadedFileName && (
                    <div className="uploaded-pill-confirm mb-2">
                      <CheckCircle2 size={14} className="accent-emerald" /> Attached: <strong>{uploadedFileName}</strong>
                    </div>
                  )}
                  <textarea
                    className="notes-textarea mb-0"
                    rows={5}
                    placeholder="Paste your class notes, syllabus checkpoints, or formula summary here..."
                    value={formNotesText}
                    onChange={(e) => setFormNotesText(e.target.value)}
                  />
                </div>
              )}

              <div className="add-res-grid-2">
                <div>
                  <label className="field-label">Format Tag</label>
                  <select
                    className="text-input"
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value)}
                  >
                    <option value="Video">Video</option>
                    <option value="Reading Guide">Reading Guide</option>
                    <option value="Practice">Practice</option>
                    <option value="Interactive">Interactive</option>
                    <option value="Cheat Sheet">Cheat Sheet</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Difficulty Level</label>
                  <select
                    className="text-input"
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">Subject</label>
                  <select
                    className="text-input"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                  >
                    {SUBJECTS.filter((s) => s !== 'All').map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Est. Study Time</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="e.g., 15 min"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">1-Line Why This Helps (Optional)</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g., Best visual derivation before midterm exam"
                  value={formWhy}
                  onChange={(e) => setFormWhy(e.target.value)}
                />
              </div>

              {formError && (
                <div className="status-msg err" role="alert">
                  <AlertCircle size={15} aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  <Plus size={15} aria-hidden="true" /> Add to My Resources
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Uploaded Student Notes / File */}
      {previewResource && (
        <div className="modal-overlay" onClick={() => setPreviewResource(null)}>
          <div
            className="modal-card modal-wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="student-upload-tag mb-1">{previewResource.type} · {previewResource.subject}</div>
                <h3>{previewResource.title}</h3>
              </div>
              <button
                className="icon-btn"
                onClick={() => setPreviewResource(null)}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="preview-notes-body">
              {previewResource.fileDataUrl && previewResource.fileDataUrl.startsWith('data:image/') && (
                <img
                  src={previewResource.fileDataUrl}
                  alt={previewResource.title}
                  className="preview-uploaded-img"
                />
              )}
              {previewResource.fileDataUrl && previewResource.fileDataUrl.startsWith('data:application/pdf') && (
                <a
                  href={previewResource.fileDataUrl}
                  download={previewResource.fileName || 'study-material.pdf'}
                  className="btn-primary btn-sm mb-3"
                >
                  Download / Open PDF ({previewResource.fileName})
                </a>
              )}
              {previewResource.notesContent && (
                <pre className="preview-notes-pre">{previewResource.notesContent}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
