import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { InlineLoader } from '../common/LoadingSpinner';
import { Download, CheckCircle, XCircle, AlertTriangle, Eye, Check, X, FileText, ThumbsUp, ThumbsDown } from 'lucide-react';
import toast from '../../utils/toast';
import './Feedback.css';

const FeedbackEnhanced = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerified, setFilterVerified] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  // Calculate statistics
  const totalFeedback = feedback.length;
  const pendingFeedback = feedback.filter(f => f.status === 'pending').length;
  const verifiedFeedback = feedback.filter(f => f.admin_verified).length;
  const incorrectResults = feedback.filter(f => f.feedback_type === 'incorrect_result').length;
  const correctResults = feedback.filter(f => f.feedback_type === 'correct_result').length;

  useEffect(() => {
    fetchFeedback();
  }, [page, filterStatus, filterVerified]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 20 };
      
      if (filterStatus !== 'all') {
        params.status_filter = filterStatus;
      }
      
      if (filterVerified !== 'all') {
        params.verified_filter = filterVerified === 'verified';
      }
      
      const response = await adminApi.getFeedback(params);
      setFeedback(response.data.feedback);
      setTotalPages(response.data.pages);
    } catch (err) {
      setError(err.message || 'Failed to fetch feedback');
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFeedback = async (feedbackId, isCorrect) => {
    try {
      await adminApi.verifyFeedback(feedbackId, isCorrect, adminNotes || null);
      toast.success('Feedback verified successfully');
      setAdminNotes('');
      setSelectedFeedback(null);
      setViewMode('list');
      fetchFeedback();
    } catch (err) {
      toast.error('Failed to verify feedback: ' + err.message);
    }
  };

  const handleUpdateStatus = async (feedbackId, newStatus) => {
    try {
      await adminApi.updateFeedback(feedbackId, newStatus, null);
      toast.success('Status updated successfully');
      fetchFeedback();
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await adminApi.deleteFeedback(feedbackId);
        toast.success('Feedback deleted successfully');
        fetchFeedback();
      } catch (err) {
        toast.error('Failed to delete feedback: ' + err.message);
      }
    }
  };

  const handleDownloadMedia = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#f59e0b', label: 'Pending' },
      reviewed: { color: '#3b82f6', label: 'Reviewed' },
      resolved: { color: '#10b981', label: 'Resolved' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className="status-badge" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
        {config.label}
      </span>
    );
  };

  const getFeedbackTypeBadge = (type, isCorrect) => {
    if (type === 'correct_result') {
      return <span className="feedback-type-badge correct"><ThumbsUp size={14} /> Correct Result</span>;
    } else if (type === 'incorrect_result') {
      return <span className="feedback-type-badge incorrect"><ThumbsDown size={14} /> Incorrect Result</span>;
    }
    return <span className="feedback-type-badge general"><FileText size={14} /> General</span>;
  };

  const getVerdictBadge = (verdict) => {
    if (verdict === 'FAKE') {
      return <span className="verdict-badge fake"><AlertTriangle size={14} /> Deepfake</span>;
    }
    return <span className="verdict-badge real"><CheckCircle size={14} /> Authentic</span>;
  };

  const renderDetailView = () => {
    if (!selectedFeedback) return null;

    const detection = selectedFeedback.detection;

    return (
      <div className="feedback-detail-view">
        <div className="detail-header">
          <button className="back-btn" onClick={() => { setViewMode('list'); setSelectedFeedback(null); }}>
            ← Back to List
          </button>
          <h2>Feedback Details</h2>
        </div>

        <div className="detail-grid">
          {/* Left Column - Media & Detection */}
          <div className="detail-section">
            <div className="section-card">
              <h3>Detection Result</h3>
              
              {detection ? (
                <>
                  {/* Media Preview */}
                  <div className="media-preview">
                    {detection.file_url ? (
                      detection.file_type === 'image' ? (
                        <img src={detection.file_url} alt="Detection media" />
                      ) : (
                        <video src={detection.file_url} controls />
                      )
                    ) : (
                      <div className="no-media">No media available</div>
                    )}
                  </div>

                  {/* Detection Info */}
                  <div className="detection-info">
                    <div className="info-row">
                      <span className="label">File Name:</span>
                      <span className="value">{detection.file_name}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Type:</span>
                      <span className="value">{detection.file_type}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Verdict:</span>
                      {getVerdictBadge(detection.verdict)}
                    </div>
                    <div className="info-row">
                      <span className="label">Confidence:</span>
                      <span className="value confidence">{(detection.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Detected At:</span>
                      <span className="value">{new Date(detection.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Download Button */}
                  {detection.file_url && (
                    <button
                      className="download-btn"
                      onClick={() => handleDownloadMedia(detection.file_url, detection.file_name)}
                    >
                      <Download size={16} />
                      Download Media
                    </button>
                  )}
                </>
              ) : (
                <p className="no-detection">No detection data available</p>
              )}
            </div>
          </div>

          {/* Right Column - Feedback & Verification */}
          <div className="detail-section">
            {/* User Feedback */}
            <div className="section-card">
              <h3>User Feedback</h3>
              
              <div className="feedback-meta">
                <div className="user-info-detail">
                  <div className="user-avatar-large">
                    {(selectedFeedback.user_name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name-large">{selectedFeedback.user_name}</div>
                    <div className="user-email-small">{selectedFeedback.user_email}</div>
                  </div>
                </div>
                
                <div className="feedback-badges">
                  {getFeedbackTypeBadge(selectedFeedback.feedback_type, selectedFeedback.is_correct)}
                  {getStatusBadge(selectedFeedback.status)}
                </div>
              </div>

              <div className="feedback-comment-box">
                <p className="comment-label">Comment:</p>
                <p className="comment-text">{selectedFeedback.comment || 'No comment provided'}</p>
              </div>

              <div className="feedback-date">
                Submitted: {new Date(selectedFeedback.created_at).toLocaleString()}
              </div>
            </div>

            {/* Admin Verification */}
            <div className="section-card">
              <h3>Admin Verification</h3>
              
              {selectedFeedback.admin_verified ? (
                <div className="verified-info">
                  <div className="verified-badge">
                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                    <span>Verified</span>
                  </div>
                  <div className="verified-details">
                    <p><strong>Result:</strong> User feedback was {selectedFeedback.is_correct ? 'CORRECT' : 'INCORRECT'}</p>
                    {selectedFeedback.admin_notes && (
                      <p><strong>Admin Notes:</strong> {selectedFeedback.admin_notes}</p>
                    )}
                    <p className="verified-date">
                      Verified on {new Date(selectedFeedback.admin_verified_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="verification-form">
                  <p className="verification-question">
                    Is the user's feedback accurate?
                  </p>
                  
                  <textarea
                    className="admin-notes-input"
                    placeholder="Add notes about your verification (optional)..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows="4"
                  />

                  <div className="verification-actions">
                    <button
                      className="verify-btn correct"
                      onClick={() => handleVerifyFeedback(selectedFeedback.id, true)}
                    >
                      <Check size={18} />
                      User is Correct
                    </button>
                    <button
                      className="verify-btn incorrect"
                      onClick={() => handleVerifyFeedback(selectedFeedback.id, false)}
                    >
                      <X size={18} />
                      User is Incorrect
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="section-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                {!selectedFeedback.admin_verified && selectedFeedback.status === 'pending' && (
                  <button
                    className="action-btn-detail reviewed"
                    onClick={() => handleUpdateStatus(selectedFeedback.id, 'reviewed')}
                  >
                    Mark as Reviewed
                  </button>
                )}
                <button
                  className="action-btn-detail delete"
                  onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                >
                  Delete Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="feedback-management">
        <div className="page-header">
          <h1>FEEDBACK MANAGEMENT</h1>
          <p>Review and verify user feedback</p>
        </div>
        <InlineLoader message="Loading feedback..." />
      </div>
    );
  }

  if (error && feedback.length === 0) {
    return (
      <div className="feedback-management">
        <div className="page-header">
          <h1>FEEDBACK MANAGEMENT</h1>
          <p>Review and verify user feedback</p>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchFeedback} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  if (viewMode === 'detail') {
    return (
      <div className="feedback-management">
        {renderDetailView()}
      </div>
    );
  }

  return (
    <div className="feedback-management">
      <div className="page-header">
        <div className="header-content">
          <h1>FEEDBACK MANAGEMENT</h1>
          <p>Review and verify user feedback with detection results</p>
        </div>
        <div className="filters">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
          
          <select
            value={filterVerified}
            onChange={(e) => {
              setFilterVerified(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="feedback-stats-grid">
        <div className="feedback-stat-card">
          <div className="feedback-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
            <FileText size={24} />
          </div>
          <div className="feedback-stat-content">
            <div className="feedback-stat-value">{totalFeedback}</div>
            <div className="feedback-stat-label">TOTAL FEEDBACK</div>
            <div className="feedback-stat-change">All submissions</div>
          </div>
        </div>

        <div className="feedback-stat-card">
          <div className="feedback-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="feedback-stat-content">
            <div className="feedback-stat-value">{pendingFeedback}</div>
            <div className="feedback-stat-label">PENDING REVIEW</div>
            <div className="feedback-stat-change">{totalFeedback > 0 ? `${Math.round((pendingFeedback / totalFeedback) * 100)}%` : '0%'} of total</div>
          </div>
        </div>

        <div className="feedback-stat-card">
          <div className="feedback-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="feedback-stat-content">
            <div className="feedback-stat-value">{verifiedFeedback}</div>
            <div className="feedback-stat-label">VERIFIED</div>
            <div className="feedback-stat-change">{totalFeedback > 0 ? `${Math.round((verifiedFeedback / totalFeedback) * 100)}%` : '0%'} verified</div>
          </div>
        </div>

        <div className="feedback-stat-card">
          <div className="feedback-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
            <ThumbsDown size={24} />
          </div>
          <div className="feedback-stat-content">
            <div className="feedback-stat-value">{incorrectResults}</div>
            <div className="feedback-stat-label">INCORRECT RESULTS</div>
            <div className="feedback-stat-change">{correctResults} correct</div>
          </div>
        </div>
      </div>

      <div className="feedback-list">
        {feedback.map((item) => (
          <div key={item.id} className="feedback-card-enhanced">
            <div className="feedback-header">
              <div className="user-info">
                <div className="user-avatar">
                  {(item.user_name || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <div className="user-name">{item.user_name}</div>
                  <div className="user-email">{item.user_email}</div>
                </div>
              </div>
              <div className="feedback-meta-badges">
                {getFeedbackTypeBadge(item.feedback_type, item.is_correct)}
                {getStatusBadge(item.status)}
                {item.admin_verified && (
                  <span className="verified-badge-small">
                    <CheckCircle size={14} /> Verified
                  </span>
                )}
              </div>
            </div>

            {/* Detection Preview */}
            {item.detection && (
              <div className="detection-preview">
                <div className="detection-thumbnail">
                  {item.detection.file_url ? (
                    item.detection.file_type === 'image' ? (
                      <img src={item.detection.file_url} alt="Detection" />
                    ) : (
                      <video src={item.detection.file_url} />
                    )
                  ) : (
                    <div className="no-thumbnail">No media</div>
                  )}
                </div>
                <div className="detection-summary">
                  <p className="detection-filename">{item.detection.file_name}</p>
                  <div className="detection-result">
                    {getVerdictBadge(item.detection.verdict)}
                    <span className="confidence-small">
                      {(item.detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="feedback-body">
              <p className="feedback-comment">{item.comment || 'No comment provided'}</p>
              <div className="feedback-date">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>

            <div className="feedback-actions">
              <button
                className="action-btn view"
                onClick={() => {
                  setSelectedFeedback(item);
                  setViewMode('detail');
                }}
              >
                <Eye size={16} />
                View Details
              </button>
              {!item.admin_verified && (
                <button
                  className="action-btn verify"
                  onClick={() => {
                    setSelectedFeedback(item);
                    setViewMode('detail');
                  }}
                >
                  <Check size={16} />
                  Verify
                </button>
              )}
              <button
                className="action-btn delete"
                onClick={() => handleDeleteFeedback(item.id)}
              >
                <X size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {feedback.length === 0 && (
        <div className="empty-state">
          <h3>No feedback found</h3>
          <p>No feedback matches your current filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackEnhanced;
