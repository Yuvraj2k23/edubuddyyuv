/**
 * Smart date-group formatter for EduBuddy Search History:
 * - Same calendar day -> "Today"
 * - Previous calendar day -> "Yesterday"
 * - Older dates -> "Thursday, 19 Nov 2026" (Weekday + Date)
 */
export function formatDateGroupLabel(timestamp, now = new Date()) {
  const date = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfItem = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfItem) / (1000 * 60 * 60 * 24));

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const shortDate = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (diffDays === 0) return `Today · ${weekday}`;
  if (diffDays === 1) return `Yesterday · ${weekday}`;
  return `${weekday}, ${shortDate}`;
}

export function formatTimeShort(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function groupHistoryByDate(items) {
  const groups = [];
  const map = new Map();

  items.forEach((item) => {
    const label = formatDateGroupLabel(item.timestamp);
    if (!map.has(label)) {
      const group = { label, items: [] };
      map.set(label, group);
      groups.push(group);
    }
    map.get(label).items.push(item);
  });

  return groups;
}

/**
 * Seeds initial realistic multi-day search history (Today, Yesterday, and earlier weekdays)
 * on first visit so students/judges can immediately see date/day grouping and "Show more".
 */
export function createInitialSearchHistory() {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const HOUR = 60 * 60 * 1000;

  return [
    {
      id: 'hist-seed-1',
      query: 'Neural Networks & Backpropagation',
      topicId: 'neural-networks',
      subject: 'Computer Science',
      timestamp: now - 15 * 60 * 1000,
    },
    {
      id: 'hist-seed-2',
      query: 'Mitochondria (Cell Powerhouse)',
      topicId: 'mitochondria',
      subject: 'Biology',
      timestamp: now - 2 * HOUR,
    },
    {
      id: 'hist-seed-3',
      query: 'Dynamic Programming (DP)',
      topicId: 'dynamic-programming',
      subject: 'Computer Science',
      timestamp: now - 1 * DAY - 1 * HOUR,
    },
    {
      id: 'hist-seed-4',
      query: 'CRISPR-Cas9 Gene Editing',
      topicId: 'crispr-cas9',
      subject: 'Biology',
      timestamp: now - 1 * DAY - 4 * HOUR,
    },
    {
      id: 'hist-seed-5',
      query: 'Quantum Entanglement',
      topicId: 'quantum-entanglement',
      subject: 'Physics',
      timestamp: now - 2 * DAY - 2 * HOUR,
    },
    {
      id: 'hist-seed-6',
      query: 'Operating System Deadlocks',
      topicId: 'os-deadlocks',
      subject: 'Computer Science',
      timestamp: now - 4 * DAY - 3 * HOUR,
    },
    {
      id: 'hist-seed-7',
      query: 'Thermodynamics & Entropy',
      topicId: 'thermodynamics-entropy',
      subject: 'Physics',
      timestamp: now - 6 * DAY - 1 * HOUR,
    },
    {
      id: 'hist-seed-8',
      query: 'Calculus: Derivatives & Gradients',
      topicId: 'calculus-derivatives',
      subject: 'Mathematics',
      timestamp: now - 9 * DAY - 5 * HOUR,
    },
  ];
}
