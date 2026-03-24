import { useState } from 'react';
import { CheckCircle, AlertTriangle, ThumbsUp, ThumbsDown, ImageIcon } from 'lucide-react';
import './DetectionResult.css';

const DetectionResult = ({ setActiveView }) => {
  const [selected, setSelected]   = useState(null);
  const [comment, setComment]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const result = {
    file: 'video_sample_01.mp4',
    type: 'video',
    result: 'deepfake',
    confidence: 87.3,
    processingTime: '2.4s',
  };

  const isFake = result.result === 'deepfake';
  const confidenceLabel = result.confidence > 90 ? 'High Confidence' : 'Medium Confidence';

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
            <ImageIcon size={48} className="dr-media-icon" />
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
              <span className={`dr-confidence-tag ${isFake ? 'conf-medium' : 'conf-safe'}`}>
                {confidenceLabel}
              </span>
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
                ? 'Our AI detected signs of manipulation in this media. Review the detailed analysis for more information.'
                : 'No signs of manipulation detected. This media appears to be authentic.'}
            </p>
          </div>
        </div>
      </div>



      {/* Feedback */}
      <div className="dr-card dr-feedback-card">
        <h2 className="dr-card-title">User Feedback</h2>
        <p className="dr-feedback-sub">Help us improve by rating this detection result</p>

        {submitted ? (
          <div className="dr-feedback-success">
            <CheckCircle size={44} className="dr-status-icon-auth" />
            <p>Thank you for your feedback!</p>
          </div>
        ) : (
          <>
            <p className="dr-fb-question">Was the result accurate?</p>
            <div className="dr-feedback-options">
              {feedbackOptions.map(({ id, icon: Icon, title, desc }) => (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className={`dr-feedback-btn ${selected === id ? 'dr-feedback-selected' : ''}`}
                >
                  <div className="dr-fb-icon-box">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="dr-fb-title">{title}</p>
                    <p className="dr-fb-desc">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="dr-fb-question" style={{ marginTop: 20 }}>Comments</p>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your feedback about the AI detection result..."
              className="dr-textarea"
            />

            <button
              onClick={() => { if (selected) setSubmitted(true); }}
              disabled={!selected}
              className="dr-btn dr-btn-submit"
              style={{ marginTop: 16 }}
            >
              Submit Feedback
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default DetectionResult;
