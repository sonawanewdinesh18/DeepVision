import React, { useState } from 'react';
import './Feedback.css';

const Feedback = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState('');

  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      type: 'bug',
      title: 'Detection accuracy issue with video files',
      description: 'The model seems to have lower accuracy when processing certain video formats. I tested with MP4 and AVI files, and the accuracy drops significantly compared to image processing.',
      priority: 'high',
      status: 'pending',
      submittedBy: 'user@example.com',
      submittedAt: '2026-03-10',
      response: null,
      verified: false
    },
    {
      id: 2,
      type: 'feature',
      title: 'Add batch processing for multiple files',
      description: 'It would be great to have the ability to process multiple files at once. Currently, I have to upload files one by one which is time-consuming.',
      priority: 'medium',
      status: 'verified',
      submittedBy: 'developer@company.com',
      submittedAt: '2026-03-08',
      response: 'Thank you for the suggestion. We will consider this for the next release.',
      verified: true
    },
    {
      id: 3,
      type: 'improvement',
      title: 'Improve dashboard loading speed',
      description: 'The dashboard takes too long to load when there are many datasets. It sometimes takes up to 30 seconds to fully load.',
      priority: 'medium',
      status: 'in-progress',
      submittedBy: 'analyst@org.com',
      submittedAt: '2026-03-12',
      response: 'We are working on optimizing the dashboard performance.',
      verified: true
    },
    {
      id: 4,
      type: 'bug',
      title: 'Login session expires too quickly',
      description: 'The login session expires after just 30 minutes of inactivity. This is inconvenient for long analysis sessions.',
      priority: 'low',
      status: 'pending',
      submittedBy: 'researcher@university.edu',
      submittedAt: '2026-03-14',
      response: null,
      verified: false
    },
    {
      id: 5,
      type: 'feature',
      title: 'Export results to PDF',
      description: 'Please add functionality to export detection results and analysis reports to PDF format for sharing with stakeholders.',
      priority: 'high',
      status: 'pending',
      submittedBy: 'manager@enterprise.com',
      submittedAt: '2026-03-15',
      response: null,
      verified: false
    }
  ]);

  const handleVerifyFeedback = (feedbackId) => {
    setFeedbacks(feedbacks.map(feedback =>
      feedback.id === feedbackId
        ? { ...feedback, verified: true, status: 'verified' }
        : feedback
    ));
  };

  const handleUpdateStatus = (feedbackId, newStatus) => {
    setFeedbacks(feedbacks.map(feedback =>
      feedback.id === feedbackId
        ? { ...feedback, status: newStatus }
        : feedback
    ));
  };

  const handleAddResponse = (feedbackId) => {
    if (responseText.trim()) {
      setFeedbacks(feedbacks.map(feedback =>
        feedback.id === feedbackId
          ? { ...feedback, response: responseText, status: 'responded' }
          : feedback
      ));
      setResponseText('');
      setSelectedFeedback(null);
    }
  };

  const getFilteredFeedbacks = () => {
    switch (activeTab) {
      case 'pending':
        return feedbacks.filter(f => f.status === 'pending');
      case 'verified':
        return feedbacks.filter(f => f.verified);
      case 'in-progress':
        return feedbacks.filter(f => f.status === 'in-progress');
      case 'responded':
        return feedbacks.filter(f => f.status === 'responded');
      default:
        return feedbacks;
    }
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (feedbackForm.title && feedbackForm.description) {
      // In a real app, this would send to backend
      alert('Feedback submitted successfully!');
      setFeedbackForm({
        type: 'bug',
        title: '',
        description: '',
        priority: 'medium',
        email: ''
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'pending',
      'verified': 'verified',
      'in-progress': 'progress',
      'responded': 'completed',
      'rejected': 'rejected'
    };
    return (
      <span className={`status-badge ${statusColors[status]}`}>
        {status.replace('-', ' ')}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      'bug': 'bug',
      'feature': 'feature',
      'improvement': 'improvement'
    };
    return (
      <span className={`type-badge ${typeColors[type]}`}>
        {type}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high'
    };
    return (
      <span className={`priority-badge ${priorityColors[priority]}`}>
        {priority}
      </span>
    );
  };

  const renderFeedbackManagement = () => {
    const filteredFeedbacks = getFilteredFeedbacks();
    
    return (
      <div className="feedback-management-content">
        <div className="management-header">
          <h2>User Feedback Management</h2>
          <div className="feedback-stats">
            <div className="stat-item">
              <span className="stat-value">{feedbacks.filter(f => f.status === 'pending').length}</span>
              <span className="stat-label">Pending Review</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{feedbacks.filter(f => f.verified).length}</span>
              <span className="stat-label">Verified</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{feedbacks.filter(f => f.status === 'in-progress').length}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{feedbacks.filter(f => f.status === 'responded').length}</span>
              <span className="stat-label">Responded</span>
            </div>
          </div>
        </div>

        <div className="feedback-items">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.id} className="feedback-item">
              <div className="feedback-header">
                <div className="feedback-title">
                  <h3>{feedback.title}</h3>
                  <div className="feedback-badges">
                    {getTypeBadge(feedback.type)}
                    {getPriorityBadge(feedback.priority)}
                    {getStatusBadge(feedback.status)}
                    {feedback.verified && (
                      <span className="verified-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <div className="feedback-meta">
                  <span className="submitted-by">From: {feedback.submittedBy}</span>
                  <span className="submitted-date">{feedback.submittedAt}</span>
                </div>
              </div>
              
              <div className="feedback-content">
                <p className="feedback-description">{feedback.description}</p>
                
                {feedback.response && (
                  <div className="feedback-response">
                    <div className="response-header">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span>Admin Response</span>
                    </div>
                    <p className="response-text">{feedback.response}</p>
                  </div>
                )}

                <div className="admin-actions">
                  {!feedback.verified && (
                    <button 
                      className="action-btn verify-btn"
                      onClick={() => handleVerifyFeedback(feedback.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22,4 12,14.01 9,11.01"/>
                      </svg>
                      Verify
                    </button>
                  )}
                  
                  <div className="status-controls">
                    <select 
                      value={feedback.status}
                      onChange={(e) => handleUpdateStatus(feedback.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="in-progress">In Progress</option>
                      <option value="responded">Responded</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <button 
                    className="action-btn respond-btn"
                    onClick={() => setSelectedFeedback(feedback)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {feedback.response ? 'Update Response' : 'Add Response'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFeedbacks.length === 0 && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h3>No feedback found</h3>
            <p>There are no feedback items in this category.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="feedback-management">
      <div className="page-title">
        <h1>User Feedback Management</h1>
        <p>Review, verify, and respond to user feedback submissions</p>
      </div>

      <div className="feedback-tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Pending Review ({feedbacks.filter(f => f.status === 'pending').length})
        </button>
        <button
          className={`tab ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
          Verified ({feedbacks.filter(f => f.verified).length})
        </button>
        <button
          className={`tab ${activeTab === 'in-progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in-progress')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6"/>
          </svg>
          In Progress ({feedbacks.filter(f => f.status === 'in-progress').length})
        </button>
        <button
          className={`tab ${activeTab === 'responded' ? 'active' : ''}`}
          onClick={() => setActiveTab('responded')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Responded ({feedbacks.filter(f => f.status === 'responded').length})
        </button>
      </div>

      <div className="feedback-content">
        {renderFeedbackManagement()}
      </div>

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Respond to Feedback</h3>
              <button className="close-btn" onClick={() => setSelectedFeedback(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="feedback-summary">
                <h4>{selectedFeedback.title}</h4>
                <p>{selectedFeedback.description}</p>
                <div className="feedback-meta">
                  <span>From: {selectedFeedback.submittedBy}</span>
                  <span>Date: {selectedFeedback.submittedAt}</span>
                </div>
              </div>
              <div className="response-form">
                <label>Admin Response</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response to the user..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setSelectedFeedback(null)}>
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={() => handleAddResponse(selectedFeedback.id)}
                disabled={!responseText.trim()}
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;