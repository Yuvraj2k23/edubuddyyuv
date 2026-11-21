import React, { useState } from 'react';
import { History, Clock, ChevronDown, ChevronUp, ArrowUpRight, Trash2, X } from 'lucide-react';
import { groupHistoryByDate, formatTimeShort } from '../utils/historyUtils';

const INITIAL_VISIBLE = 5;

export default function SearchHistoryPanel({
  searchHistory,
  onSelectHistoryItem,
  onRemoveHistoryItem,
  onClearHistory,
  compact = false,
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const visibleItems = searchHistory.slice(0, visibleCount);
  const grouped = groupHistoryByDate(visibleItems);
  const remaining = Math.max(0, searchHistory.length - visibleCount);
  const isExpanded = visibleCount > INITIAL_VISIBLE;

  return (
    <div className={`card history-panel ${compact ? 'compact' : ''}`}>
      <div className="history-panel-head">
        <div className="flex-row gap-2">
          <History size={18} className="accent-indigo" />
          <h3>Recent Search History</h3>
          <span className="meta-pill">{searchHistory.length} total</span>
        </div>
        {searchHistory.length > 0 && onClearHistory && (
          <button
            className="btn-ghost btn-sm"
            onClick={onClearHistory}
            title="Clear all search history"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {searchHistory.length === 0 ? (
        <p className="muted-sm">
          Your searched topics will appear here grouped by Today, Yesterday, and exact day & date.
        </p>
      ) : (
        <>
          <div className="history-groups">
            {grouped.map((group) => (
              <div key={group.label} className="history-date-group">
                <div className="history-date-label">{group.label}</div>
                <div className="history-items-list">
                  {group.items.map((item) => (
                    <div key={item.id} className="history-row">
                      <button
                        className="history-row-main"
                        onClick={() => onSelectHistoryItem(item)}
                      >
                        <div className="history-row-title-wrap">
                          <span className="history-query">{item.query}</span>
                          {item.subject && <span className="history-subj-tag">{item.subject}</span>}
                        </div>
                        <div className="history-row-meta">
                          <span className="history-time">
                            <Clock size={11} /> {formatTimeShort(item.timestamp)}
                          </span>
                          <ArrowUpRight size={14} className="history-go-icon" />
                        </div>
                      </button>
                      {onRemoveHistoryItem && (
                        <button
                          className="history-del-btn"
                          onClick={() => onRemoveHistoryItem(item.id)}
                          aria-label={`Remove ${item.query}`}
                          title="Remove from history"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {(remaining > 0 || isExpanded) && (
            <div className="history-footer-actions">
              {remaining > 0 && (
                <button
                  className="btn-outline btn-sm"
                  onClick={() => setVisibleCount((c) => c + 6)}
                >
                  <ChevronDown size={14} />
                  <span>
                    Show more previous searches ({remaining} more)
                  </span>
                </button>
              )}
              {isExpanded && (
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => setVisibleCount(INITIAL_VISIBLE)}
                >
                  <ChevronUp size={14} />
                  <span>Show less</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
