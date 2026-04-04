import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { InlineLoader } from '../common/LoadingSpinner';
import './Feedback.css';

const Feedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFeedback();
  }, [page, filterStatus]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 20 };
      if (filterStatus !== 'all') {
        params.status_filter = filterStatus;
      }
      const response = await adminApi.getFeedback(params);
      setFeedback(response.feedback);
      setTotalPages(response.pages);
    } catch (err) {
      setError(err.message || 'Failed to fetch feedback');
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (feedbackId, newStatus) => {
    try {
      await adminApi.updateFeedback(feedbackId, newStatus, adminResponse || null);
      setAdminResponse('');
      setSelectedFeedback(null);
      fetchFeedback();
    } catch (err) {
      alert('Failed to update feedback: ' + err.message);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await adminApi.deleteFeedback(feedbackId);
        fetchFeedback();
      } catch (err) {
        alert('Failed to delete feedback: ' + err.message);
      }
    }
  };

  const getRatingStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getStatusBadge = (status) => {
    return <span className={`status-badge ${status}`}>{status}</span>;
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="feedback-management">
        <div className="page-header">
          <h1>FEEDBACK MANAGEMENT</h1>
          <p>Review and respond to user feedback</p>
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
          <p>Review and respond to user feedback</p>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchFeedback} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-management">
      <div className="page-header">
        <div className="header-content">
          <h1>FEEDBACK MANAGEMENT</h1>
          <p>Review and respond to user feedback</p>
        </div>
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
      </div>

      <div className="feedback-list">
        {feedback.map((item) => (
          <div key={item.id} className="feedback-card">
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
              <div className="feedback-meta">
                {item.rating && (
                  <div className="rating">{getRatingStars(item.rating)}</div>
                )}
                {getStatusBadge(item.status)}
              </div>
            </div>
            <div className="feedback-body">
              <p className="feedback-comment">{item.comment || 'No comment provided'}</p>
              <div className="feedback-date">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
            <div className="feedback-actions">
              <button
                className="action-btn view"
                onClick={() => setSelectedFeedback(item)}
              >
                View Details
              </button>
              {item.status === 'pending' && (
                <button
                  className="action-btn approve"
                  onClick={() => handleUpdateStatus(item.id, 'reviewed')}
                >
                  Mark Reviewed
                </button>
              )}
              <button
                className="action-btn delete"
                onClick={() => handleDeleteFeedback(item.id)}
              >
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

      {/* Feedback Details Modal */}
      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Feedback Details</h3>
              <button className="close-btn" onClick={() => setSelectedFeedback(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <label>User:</label>
                <p>{selectedFeedback.user_name} ({selectedFeedback.user_email})</p>
              </div>
              {selectedFeedback.rating && (
                <div className="detail-section">
                  <label>Rating:</label>
                  <p>{getRatingStars(selectedFeedback.rating)}</p>
                </div>
              )}
              <div className="detail-section">
                <label>Comment:</label>
                <p>{selectedFeedback.comment || 'No comment provided'}</p>
              </div>
              <div className="detail-section">
                <label>Status:</label>
                <p>{selectedFeedback.status}</p>
              </div>
              <div className="detail-section">
                <label>Admin Response:</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Enter your response..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setSelectedFeedback(null)}>Close</button>
              <button
                className="save-btn"
                onClick={() => handleUpdateStatus(selectedFeedback.id, 'resolved')}
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
