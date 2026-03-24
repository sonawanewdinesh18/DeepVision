import { useState } from 'react';
import './Feedback.css';

const MOCK_FEEDBACKS = [
  {
    id: 1,
    name: 'Alex Turner',
    email: 'alex@example.com',
    type: 'Bug Report',
    subject: 'Detection fails on dark images',
    message: 'The deepfake detection model consistently fails when the input image has low brightness or dark backgrounds. This needs to be addressed urgently.',
    rating: 2,
    status: 'open',
    date: '2026-03-20',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya@example.com',
    type: 'Feature Request',
    subject: 'Add bulk upload support',
    message: 'It would be very helpful to upload multiple files at once instead of one by one. This would save a lot of time for power users.',
    rating: 5,
    status: 'in-review',
    date: '2026-03-21',
  },
  {
    id: 3,
    name: 'James Wilson',
    email: 'james@example.com',
    type: 'General',
    subject: 'Great product overall',
    message: 'Really impressed with the accuracy of the detection. The UI is clean and easy to navigate. Keep up the good work!',
    rating: 5,
    status: 'resolved',
    date: '2026-03-19',
  },
  {
    id: 4,
    name: 'Maria Garcia',
    email: 'maria@example.com',
    type: 'Bug Report',
    subject: 'Video upload stuck at 90%',
    message: 'When uploading videos larger than 100MB, the progress bar gets stuck at 90% and never completes. Have to refresh the page.',
    rating: 1,
    status: 'open',
    date: '2026-03-22',
  },
  {
    id: 5,
    name: 'Chen Wei',
    email: 'chen@example.com',
    type: 'Feature Request',
    subject: 'API access for developers',
    message: 'Please provide a REST API so we can integrate deepfake detection into our own applications programmatically.',
    rating: 4,
    status: 'in-review',
    date: '2026-03-18',
  },
];

const STATUS_CONFIG = {
  open:        { label: 'Open',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'in-review': { label: 'In Review', color: '#63B3ED', bg: 'rgba(99,179,237,0.12)' },
  resolved:    { label: 'Resolved',  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
};

const TYPE_CONFIG = {
  'Bug Report':      { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  'Feature Request': { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  'General':         { color: '#63B3ED', bg: 'rgba(99,179,237,0.1)' },
};

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width="14" height="14" viewBox="0 0 24 24"
          fill={s <= rating ? '#F59E0B' : 'none'}
          stroke={s <= rating ? '#F59E0B' : '#4B5563'}
          strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState(MOCK_FEEDBACKS);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const counts = {
    all: feedbacks.length,
    open: feedbacks.filter(f => f.status === 'open').length,
    'in-review': feedbacks.filter(f => f.status === 'in-review').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  };

  const visible = filter === 'all' ? feedbacks : feedbacks.filter(f => f.status === filter);

  const updateStatus = (id, status) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
  };

  const sendReply = () => {
    if (!replyText.trim()) return;
    updateStatus(selected.id, 'resolved');
    setReplyText('');
    setShowReply(false);
  };

  return (
    <div className="fb-root">
      <div className="fb-page-title">
        <h1>FEEDBACK MANAGEMENT</h1>
      </div>

      <div className="fb-stats">
        {[
          { key: 'all',       label: 'Total',     color: '#63B3ED' },
          { key: 'open',      label: 'Open',      color: '#F59E0B' },
          { key: 'in-review', label: 'In Review', color: '#63B3ED' },
          { key: 'resolved',  label: 'Resolved',  color: '#10B981' },
        ].map(s => (
          <button
            key={s.key}
            className={`fb-stat-pill ${filter === s.key ? 'active' : ''}`}
            style={{ '--pill-color': s.color }}
            onClick={() => { setFilter(s.key); setSelected(null); }}
          >
            <span className="fb-stat-num">{counts[s.key]}</span>
            <span className="fb-stat-lbl">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="fb-panels">
        <div className="fb-list">
          {visible.length === 0 && (
            <div className="fb-empty">No feedback in this category</div>
          )}
          {visible.map(f => {
            const sc = STATUS_CONFIG[f.status];
            const tc = TYPE_CONFIG[f.type] || TYPE_CONFIG['General'];
            return (
              <div
                key={f.id}
                className={`fb-item ${selected?.id === f.id ? 'fb-item-active' : ''}`}
                onClick={() => { setSelected(f); setShowReply(false); setReplyText(''); }}
              >
                <div className="fb-item-top">
                  <div className="fb-avatar">{f.name.charAt(0)}</div>
                  <div className="fb-item-info">
                    <span className="fb-item-name">{f.name}</span>
                    <span className="fb-item-date">{f.date}</span>
                  </div>
                  <span className="fb-badge" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                </div>
                <div className="fb-item-subject">{f.subject}</div>
                <div className="fb-item-bottom">
                  <span className="fb-type-badge" style={{ color: tc.color, background: tc.bg }}>{f.type}</span>
                  <StarRating rating={f.rating} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="fb-detail">
          {!selected ? (
            <div className="fb-detail-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                style={{ color: 'var(--text-tertiary)', marginBottom: 12 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>Select a feedback to view details</p>
            </div>
          ) : (
            <>
              <div className="fb-detail-header">
                <div className="fb-detail-user">
                  <div className="fb-avatar fb-avatar-lg">{selected.name.charAt(0)}</div>
                  <div>
                    <div className="fb-detail-name">{selected.name}</div>
                    <div className="fb-detail-email">{selected.email}</div>
                  </div>
                </div>
                <div className="fb-detail-badges">
                  <span className="fb-badge"
                    style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                  <span className="fb-type-badge"
                    style={{ color: TYPE_CONFIG[selected.type]?.color || '#63B3ED', background: TYPE_CONFIG[selected.type]?.bg || 'rgba(99,179,237,0.1)' }}>
                    {selected.type}
                  </span>
                </div>
              </div>

              <div className="fb-detail-body">
                <div className="fb-detail-subject">{selected.subject}</div>
                <div className="fb-detail-meta">
                  <StarRating rating={selected.rating} />
                  <span className="fb-detail-date">{selected.date}</span>
                </div>
                <div className="fb-detail-msg">{selected.message}</div>
              </div>

              <div className="fb-detail-actions">
                {selected.status === 'open' && (
                  <button className="fb-btn fb-btn-review" onClick={() => updateStatus(selected.id, 'in-review')}>
                    Mark In Review
                  </button>
                )}
                {selected.status !== 'resolved' && (
                  <button className="fb-btn fb-btn-reply" onClick={() => setShowReply(!showReply)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Reply & Resolve
                  </button>
                )}
                {selected.status === 'resolved' && (
                  <span className="fb-resolved-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Resolved
                  </span>
                )}
              </div>

              {showReply && (
                <div className="fb-reply-box">
                  <textarea
                    className="fb-reply-input"
                    placeholder={`Reply to ${selected.name}...`}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={4}
                  />
                  <div className="fb-reply-footer">
                    <button className="fb-btn fb-btn-cancel"
                      onClick={() => { setShowReply(false); setReplyText(''); }}>
                      Cancel
                    </button>
                    <button className="fb-btn fb-btn-send" onClick={sendReply} disabled={!replyText.trim()}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Send Reply
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
