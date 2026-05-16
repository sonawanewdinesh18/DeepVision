import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, ThumbsUp, ThumbsDown, ImageIcon, Upload } from 'lucide-react';
import { detectionApi, userApi } from '@/services/api';
import toast from '@/utils/toast';
import { InlineLoader } from '@/components/common/LoadingSpinner';
import './DetectionResult.css';

const DetectionResult = ({ setActiveView, detectionId }) => {
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (detectionId) {
      fetchDetectionResult(detectionId);
    } else {
      // Check if there's a recent detection
      fetchLatestDetection();
    }
  }, [detectionId]);

  const fetchDetectionResult = async (id) => {
    try {
      setLoading(true);
      const response = await detectionApi.getResult(id);
      console.log('Detection result:', response.data);
      setResult({
        id: response.data.id,
        file: response.data.file_name,
        type: response.data.media_type,
        result: response.data.verdict.toLowerCase(),
        confidence: (response.data.confidence * 100).toFixed(1),
        processingTime: response.data.processing_time_ms 
          ? `${(response.data.processing_time_ms / 1000).toFixed(1)}s` 
          : '2.4s',
        fileUrl: response.data.file_url
      });
    } catch (error) {
      console.error('Failed to fetch detection result:', error);
      toast.error('Failed to load detection result');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestDetection = async () => {
    try {
      setLoading(true);
      const response = await detectionApi.getHistory({ page: 1, limit: 1 });
      
      if (response.data.items.length > 0) {
        const latest = response.data.items[0];
        // Fetch full details to get file URL
        const detailResponse = await detectionApi.getResult(latest.id);
        setResult({
          id: latest.id,
          file: latest.file_name,
          type: latest.media_type,
          result: latest.verdict.toLowerCase(),
          confidence: (latest.confidence * 100).toFixed(1),
          processingTime: '2.4s',
          fileUrl: detailResponse.data.file_url
        });
      } else {
        setResult(null);
      }
    } catch (error) {
      console.error('Failed to fetch latest detection:', error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selected || !result) return;

    try {
      await userApi.submitFeedback({
        detection_id: result.id,
        subject: selected === 'correct' ? 'Correct Detection' : 'Incorrect Detection',
        message: comment || `User marked detection as ${selected}`
      });
      
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <div className="dr-root" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <InlineLoader size="lg" message="Loading detection result..." />
      </div>
    );
  }

  // Empty state - no detection found
  if (!result) {
    return (
      <div className="dr-root">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <Upload size={36} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '12px' 
          }}>
            No Detection Results Yet
          </h2>
          <p style={{ 
            fontSize: '0.95rem', 
            color: 'var(--text-secondary)', 
            marginBottom: '32px',
            maxWidth: '400px'
          }}>
            Upload an image or video to analyze it for deepfake detection. Your results will appear here.
          </p>
          <button 
            onClick={() => setActiveView?.('upload')}
            style={{
              padding: '14px 36px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.02em'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.35)';
            }}
          >
            <Upload size={20} />
            Upload Media
          </button>
        </div>
      </div>
    );
  }

  const isFake = result.result === 'fake';

  const feedbackOptions = [
    { id: 'correct',   icon: ThumbsUp,   title: 'Correct Result',   desc: 'The AI detection matched my expectation' },
    { id: 'incorrect', icon: ThumbsDown, title: 'Incorrect Result',  desc: 'The AI detection did not match reality'  },
  ];

  return (
    <div className="dr-root">

      {/* Page title */}
      <div className="dr-page-title">
        <h1 className="dr-title">Detection Result</h1>
        <p className="dr-subtitle">AI analysis complete for your uploaded media</p>
      </div>

      {/* Main grid */}
      <div className="dr-grid">

        {/* Left — Media Preview */}
        <div className="dr-card">
          <h2 className="dr-card-title">Media Preview</h2>
          <div className="dr-media-box">
            {result.fileUrl ? (
              result.type === 'image' ? (
                <img src={result.fileUrl} alt="Uploaded media" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <video src={result.fileUrl} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />
              )
            ) : (
              <ImageIcon size={48} className="dr-media-icon" />
            )}
          </div>
          <div className="dr-media-meta">
            <p><span className="dr-meta-label">File:</span> {result.file}</p>
            <p><span className="dr-meta-label">Type:</span> {result.type}</p>
            <p><span className="dr-meta-label">Processing Time:</span> {result.processingTime}</p>
          </div>
        </div>

        {/* Right — Detection Summary */}
        <div className="dr-card">
          <h2 className="dr-card-title">Detection Summary</h2>

          {/* Result */}
          <div className="dr-section">
            <span className="dr-label">Result</span>
            <span className={`dr-verdict-badge ${isFake ? 'verdict-fake' : 'verdict-auth'}`}>
              {isFake
                ? <><AlertTriangle size={14} /> Deepfake</>
                : <><CheckCircle size={14} /> Authentic</>
              }
            </span>
          </div>

          {/* Confidence */}
          <div className="dr-section">
            <span className="dr-label">Confidence Score</span>
            <div className="dr-confidence-row">
              <span className="dr-confidence-value">{result.confidence}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="dr-section">
            <div className="dr-prob-header">
              <span className="dr-label">Probability</span>
              <span className="dr-prob-value">{result.confidence}%</span>
            </div>
            <div className="dr-progress-track">
              <div
                className={`dr-progress-fill ${isFake ? 'fill-red' : 'fill-green'}`}
                style={{ width: `${result.confidence}%` }}
              />
            </div>
          </div>

          {/* AI Status */}
          <div className="dr-status-box">
            <div className="dr-status-header">
              {isFake
                ? <AlertTriangle size={18} className="dr-status-icon-fake" />
                : <CheckCircle  size={18} className="dr-status-icon-auth" />
              }
              <strong className="dr-status-title">AI Status</strong>
            </div>
            <p className="dr-status-text">
              {isFake
                ? 'Our AI detected signs of manipulation in this media.'
                : 'No signs of manipulation detected. This media appears to be authentic.'}
            </p>
          </div>

          {/* User Feedback - Integrated */}
          <div className="dr-feedback-integrated">
            <h3 className="dr-feedback-title">User Feedback</h3>
            <p className="dr-feedback-subtitle">Help us improve by rating this detection result</p>

            {submitted ? (
              <div className="dr-feedback-success-inline">
                <CheckCircle size={24} className="dr-status-icon-auth" />
                <p>Thank you for your feedback!</p>
              </div>
            ) : (
              <>
                <p className="dr-fb-question">Was the result accurate?</p>
                <div className="dr-feedback-options-inline">
                  {feedbackOptions.map(({ id, icon: Icon, title, desc }) => (
                    <button
                      key={id}
                      onClick={() => setSelected(id)}
                      className={`dr-feedback-btn-inline ${selected === id ? 'dr-feedback-selected' : ''}`}
                    >
                      <div className="dr-fb-icon-box-inline">
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="dr-fb-title-inline">{title}</p>
                        <p className="dr-fb-desc-inline">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="dr-fb-question" style={{ marginTop: 16 }}>Comments</p>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your feedback about the AI detection result..."
                  className="dr-textarea-inline"
                />

                <button
                  onClick={handleSubmitFeedback}
                  disabled={!selected}
                  className="dr-btn-submit-inline"
                  style={{ marginTop: 12 }}
                >
                  Submit Feedback
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionResult;
