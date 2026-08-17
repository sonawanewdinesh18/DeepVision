import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { InlineLoader } from '@/components/common/LoadingSpinner';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  ThumbsDown, 
  ThumbsUp, 
  Eye, 
  Check, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  FileVideo, 
  Image as ImageIcon,
  Send,
  RefreshCw
} from 'lucide-react';
import toast from '@/utils/toast';
import './Feedback.css';

export default function Feedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeedback(true);

    // Real-time live polling every 8 seconds
    const interval = setInterval(() => {
      fetchFeedback(false);
    }, 8000);

    // Refresh when admin switches back to this tab/window
    const onFocus = () => fetchFeedback(false);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [statusFilter]);

  const fetchFeedback = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = { page: 1, limit: 100 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await adminApi.getFeedback(params);
      const data = response.data || response;
      setFeedbackList(data.feedback || []);
    } catch (err) {
      console.error('Failed to fetch real-time feedback:', err);
      if (showLoading) toast.error('Failed to load feedback records');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleVerify = async (feedbackId) => {
    try {
      setSubmitting(true);
      await adminApi.updateFeedback(feedbackId, 'resolved', 'Verified by Administrator.');
      toast.success('Feedback successfully verified!');
      await fetchFeedback();
      if (selectedItem?.id === feedbackId) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Failed to verify feedback:', err);
      toast.error('Failed to verify feedback: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback ticket?')) return;

    try {
      await adminApi.deleteFeedback(feedbackId);
      toast.success('Feedback deleted');
      await fetchFeedback();
      if (selectedItem?.id === feedbackId) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Failed to delete feedback:', err);
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await adminApi.updateFeedback(selectedItem.id, 'resolved', adminResponseText || 'Verified by Admin');
      toast.success('Resolution message sent to user!');
      setSelectedItem(null);
      setAdminResponseText('');
      await fetchFeedback();
    } catch (err) {
      console.error('Failed to resolve feedback:', err);
      toast.error('Failed to resolve: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics Calculation
  const totalSubmissions = feedbackList.length;
  const pendingCount = feedbackList.filter(f => f.status === 'pending').length;
  const verifiedCount = feedbackList.filter(f => f.status === 'resolved' || f.status === 'reviewed').length;
  const incorrectCount = feedbackList.filter(f => 
    (f.subject || '').toLowerCase().includes('incorrect') || 
    (f.comment || '').toLowerCase().includes('incorrect')
  ).length;
  const correctCount = totalSubmissions - incorrectCount;

  const pendingPct = totalSubmissions > 0 ? Math.round((pendingCount / totalSubmissions) * 100) : 0;
  const verifiedPct = totalSubmissions > 0 ? Math.round((verifiedCount / totalSubmissions) * 100) : 0;

  // Filter items
  const filteredList = feedbackList.filter(item => {
    if (verificationFilter === 'correct') {
      const isCorrect = !(item.subject || '').toLowerCase().includes('incorrect');
      if (!isCorrect) return false;
    } else if (verificationFilter === 'incorrect') {
      const isIncorrect = (item.subject || '').toLowerCase().includes('incorrect');
      if (!isIncorrect) return false;
    }
    return true;
  });

  return (
    <div className="fb-root">
      {/* Top Header Row with Filters */}
      <div className="fb-header-row">
        <div className="fb-title-group">
          <h1>FEEDBACK MANAGEMENT</h1>
          <p>Review and verify user feedback with detection results</p>
        </div>

        <div className="fb-filters-group">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="fb-select-dropdown"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>

          <select 
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="fb-select-dropdown"
          >
            <option value="all">All Verification</option>
            <option value="correct">Correct Result</option>
            <option value="incorrect">Incorrect Result</option>
          </select>

          <button 
            onClick={fetchFeedback}
            disabled={loading}
            title="Refresh Feedback"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Row */}
      <div className="fb-metrics-grid">
        {/* Metric 1: Total Feedback */}
        <div className="fb-metric-card">
          <div className="fb-metric-icon-box fb-metric-icon-purple">
            <FileText size={22} />
          </div>
          <div className="fb-metric-info">
            <span className="fb-metric-val">{totalSubmissions}</span>
            <span className="fb-metric-lbl">TOTAL FEEDBACK</span>
            <span className="fb-metric-sub">All submissions</span>
          </div>
        </div>

        {/* Metric 2: Pending Review */}
        <div className="fb-metric-card">
          <div className="fb-metric-icon-box fb-metric-icon-amber">
            <AlertTriangle size={22} />
          </div>
          <div className="fb-metric-info">
            <span className="fb-metric-val">{pendingCount}</span>
            <span className="fb-metric-lbl">PENDING REVIEW</span>
            <span className="fb-metric-sub">{pendingPct}% of total</span>
          </div>
        </div>

        {/* Metric 3: Verified */}
        <div className="fb-metric-card">
          <div className="fb-metric-icon-box fb-metric-icon-green">
            <CheckCircle size={22} />
          </div>
          <div className="fb-metric-info">
            <span className="fb-metric-val">{verifiedCount}</span>
            <span className="fb-metric-lbl">VERIFIED</span>
            <span className="fb-metric-sub">{verifiedPct}% verified</span>
          </div>
        </div>

        {/* Metric 4: Incorrect Results */}
        <div className="fb-metric-card">
          <div className="fb-metric-icon-box fb-metric-icon-red">
            <ThumbsDown size={22} />
          </div>
          <div className="fb-metric-info">
            <span className="fb-metric-val">{incorrectCount}</span>
            <span className="fb-metric-lbl">INCORRECT RESULTS</span>
            <span className="fb-metric-sub">{correctCount} correct</span>
          </div>
        </div>
      </div>

      {/* Feedback Items Stack */}
      <div className="fb-cards-stack">
        {loading && feedbackList.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <InlineLoader size="lg" message="Loading feedback submissions..." />
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 14,
            padding: '50px 20px',
            textAlign: 'center',
            color: 'var(--text-tertiary)'
          }}>
            No feedback entries found matching your filter criteria.
          </div>
        ) : (
          filteredList.map((item) => {
            const isIncorrect = (item.subject || '').toLowerCase().includes('incorrect');
            const isResolved = item.status === 'resolved';
            const isPending = item.status === 'pending';
            const isAuthentic = (item.detection_verdict || '').toLowerCase() === 'real';

            return (
              <div key={item.id} className="fb-card-item">
                {/* 1. User Header Row */}
                <div className="fb-user-header">
                  <div className="fb-user-meta">
                    <div className="fb-user-avatar">
                      {(item.user_name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="fb-user-names">
                      <span className="fb-user-fullname">{item.user_name || 'Dinesh Sonawane'}</span>
                      <span className="fb-user-mail">{item.user_email || 'user@example.com'}</span>
                    </div>
                  </div>

                  <div className="fb-badges-row">
                    {/* User Verdict Tag */}
                    <span className={`fb-verdict-tag ${isIncorrect ? 'fb-tag-incorrect' : 'fb-tag-correct'}`}>
                      {isIncorrect ? <ThumbsDown size={13} /> : <ThumbsUp size={13} />}
                      {isIncorrect ? 'Incorrect Result' : 'Correct Result'}
                    </span>

                    {/* Status Pill */}
                    <span className={`fb-status-pill fb-status-${item.status || 'pending'}`}>
                      {item.status || 'PENDING'}
                    </span>

                    {/* Verified Badge */}
                    {isResolved && (
                      <span className="fb-verified-badge">
                        <Check size={12} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Embedded Detection Box */}
                <div className="fb-detection-box">
                  {item.detection_file_url ? (
                    item.detection_file_type === 'video' ? (
                      <video 
                        src={item.detection_file_url} 
                        className="fb-media-thumb" 
                        muted 
                      />
                    ) : (
                      <img 
                        src={item.detection_file_url} 
                        alt="Detection preview" 
                        className="fb-media-thumb" 
                      />
                    )
                  ) : (
                    <div className="fb-media-placeholder">
                      {item.detection_file_type === 'video' ? <FileVideo size={24} /> : <ImageIcon size={24} />}
                    </div>
                  )}

                  <div className="fb-detection-info">
                    <span className="fb-detection-filename">
                      {item.detection_file_name || (item.detection_id ? `Detection #${item.detection_id.slice(0, 8)}` : 'Media Scan')}
                    </span>
                    <div>
                      <span className={`fb-result-pill ${isAuthentic ? 'fb-result-authentic' : 'fb-result-deepfake'}`}>
                        {isAuthentic ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                        {isAuthentic ? 'Authentic' : 'Deepfake'} {item.detection_confidence ? `${(item.detection_confidence * 100).toFixed(1)}%` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Feedback Subject / Comment */}
                <div>
                  <div className="fb-subject-label">
                    {item.subject || (isIncorrect ? 'INCORRECT DETECTION' : 'RIGHT DETECTION')}
                  </div>
                  {item.comment && (
                    <div className="fb-comment-text">
                      {item.comment}
                    </div>
                  )}
                </div>

                {/* 4. Footer Row: Date + Action Buttons */}
                <div className="fb-card-footer">
                  <span className="fb-date-stamp">
                    {new Date(item.created_at).toLocaleString()}
                  </span>

                  <div className="fb-btn-group">
                    <button 
                      className="fb-btn-details"
                      onClick={() => {
                        setSelectedItem(item);
                        setAdminResponseText(item.admin_response || '');
                      }}
                    >
                      <Eye size={14} /> View Details
                    </button>

                    {isPending && (
                      <button 
                        className="fb-btn-verify"
                        onClick={() => handleVerify(item.id)}
                        disabled={submitting}
                      >
                        <Check size={14} /> Verify
                      </button>
                    )}

                    <button 
                      className="fb-btn-delete"
                      onClick={() => handleDelete(item.id)}
                      disabled={submitting}
                    >
                      <X size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details & Resolution Modal */}
      {selectedItem && (
        <div className="fb-modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="fb-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-header">
              <h3>Feedback & Detection Review</h3>
              <button className="fb-modal-close" onClick={() => setSelectedItem(null)}>×</button>
            </div>

            <div className="fb-modal-body">
              {/* User Info */}
              <div className="fb-modal-section">
                <label>Submitted By</label>
                <div style={{ fontWeight: 600 }}>
                  {selectedItem.user_name} ({selectedItem.user_email})
                </div>
              </div>

              {/* Media Preview */}
              {selectedItem.detection_file_url && (
                <div className="fb-modal-section">
                  <label>Media Asset</label>
                  <div style={{ maxHeight: 240, overflow: 'hidden', borderRadius: 8, background: '#000', display: 'flex', justifyContent: 'center' }}>
                    {selectedItem.detection_file_type === 'video' ? (
                      <video src={selectedItem.detection_file_url} controls style={{ width: '100%', maxHeight: 240 }} />
                    ) : (
                      <img src={selectedItem.detection_file_url} alt="Detection result" style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
                    )}
                  </div>
                </div>
              )}

              {/* AI vs User Feedback */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="fb-modal-section">
                  <label>AI Prediction</label>
                  <div style={{ fontWeight: 700, color: (selectedItem.detection_verdict || '').toLowerCase() === 'real' ? '#10B981' : '#EF4444' }}>
                    {(selectedItem.detection_verdict || 'REAL').toUpperCase()} {selectedItem.detection_confidence ? `(${Math.round(selectedItem.detection_confidence * 100)}%)` : ''}
                  </div>
                </div>

                <div className="fb-modal-section">
                  <label>User Claim</label>
                  <div style={{ fontWeight: 700, color: (selectedItem.subject || '').toLowerCase().includes('incorrect') ? '#EF4444' : '#10B981' }}>
                    {selectedItem.subject || 'Right Detection'}
                  </div>
                </div>
              </div>

              {/* Comment */}
              <div className="fb-modal-section">
                <label>User Comment</label>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  {selectedItem.comment || 'No additional comment provided.'}
                </div>
              </div>

              {/* Admin Resolution Input */}
              <div className="fb-modal-section">
                <label>Administrator Response</label>
                <textarea 
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  placeholder="Enter resolution notes to notify the user..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div className="fb-modal-footer">
              <button 
                onClick={() => setSelectedItem(null)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Close
              </button>
              <button 
                onClick={handleModalSubmit}
                disabled={submitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                <Send size={14} />
                {submitting ? 'Saving...' : 'Verify & Send Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
