import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Download, RotateCcw, ThumbsUp, ThumbsDown, Camera } from 'lucide-react';
import ResultBadge from './ResultBadge';
import ProgressBar from './ProgressBar';
import './DetectionResult.css';

const DetectionResult = ({ setActiveView }) => {
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
  };

  const feedbackOptions = [
    {
      id: 'correct',
      icon: ThumbsUp,
      title: 'Correct Result',
      desc: 'The AI detection matched my expectation',
      color: 'var(--color-primary)',
    },
    {
      id: 'incorrect',
      icon: ThumbsDown,
      title: 'Incorrect Result',
      desc: 'The AI detection did not match reality',
      color: 'var(--color-error)',
    },
  ];

  const result = {
    file: 'video_sample_01.mp4',
    type: 'video',
    result: 'deepfake',
    confidence: 87.3,
    processingTime: '2.4s',
  };

  const isFake = result.result === 'deepfake';

  return (
    <div className="result-view">
      <div className="page-title">
        <h1>Detection Result</h1>
        <p>AI analysis complete for your uploaded media</p>
      </div>

      <div className="result-main-grid">
        <div className="card h-full flex-col">
          <h2 className="card-title">Media Preview</h2>
          <div className="media-preview-container flex-1">
            <Camera size={48} className="media-placeholder-icon" />
          </div>
          <div className="media-details">
            <p><strong>File:</strong> {result.file}</p>
            <p><strong>Type:</strong> {result.type}</p>
            <p><strong>Processing Time:</strong> {result.processingTime}</p>
          </div>
        </div>

        <div className="card h-full flex-col">
          <h2 className="card-title">Detection Summary</h2>
          <div className="summary-content flex-1">
            
            <div className="summary-section">
              <span className="summary-label">Final Verdict</span>
              <div className="mt-2">
                <ResultBadge result={result.result} size="lg" />
              </div>
            </div>

            <div className="summary-section mt-6">
              <span className="summary-label">Confidence Score</span>
              <div className="confidence-score-wrapper mt-1">
                <span className="confidence-value">{result.confidence}%</span>
                <span className={`confidence-tag ${isFake ? 'tag-high' : 'tag-safe'}`}>
                  {result.confidence > 90 ? 'High' : 'Medium'} Confidence
                </span>
              </div>
            </div>

            <div className="summary-section mt-6">
              <ProgressBar 
                percentage={result.confidence} 
                label="Probability" 
                color={isFake ? 'red' : 'green'} 
              />
            </div>

            <div className="ai-status-box mt-auto pt-6">
              <div className="flex-center-left gap-2 mb-2">
                {isFake ? (
                  <AlertTriangle size={20} className="text-error" />
                ) : (
                  <CheckCircle size={20} className="text-success" />
                )}
                <strong>AI Status Analysis</strong>
              </div>
              <p className="ai-status-text">
                {isFake
                  ? 'Our AI detected signs of manipulation in this media. Review the detailed analysis below.'
                  : 'No signs of manipulation detected. This media appears to be authentic.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="card-title">Detailed Analysis</h2>
        <div className="analysis-grid">
          <div className="analysis-box">
            <h3>Facial Analysis</h3>
            <p>Detected inconsistencies in facial landmarks and micro-expressions.</p>
          </div>
          <div className="analysis-box">
            <h3>Frame Consistency</h3>
            <p>Temporal artifacts discovered between consecutive internal frames.</p>
          </div>
          <div className="analysis-box">
            <h3>Lighting & Artifacts</h3>
            <p>Lighting patterns show minor inconsistencies against global shadows.</p>
          </div>
          <div className="analysis-box">
            <h3>Audio-Visual Sync</h3>
            <p>Audio frequencies and visual mouth movements remain synchronized.</p>
          </div>
        </div>
      </div>

      <div className="action-buttons mt-6 flex-center gap-4">
        <button className="btn btn-primary flex-center gap-2">
          <Download size={18} />
          <span>Download Report</span>
        </button>
        <button onClick={() => setActiveView('upload')} className="btn btn-secondary flex-center gap-2">
          <RotateCcw size={18} />
          <span>Analyze Another</span>
        </button>
      </div>

      <div className="card mt-6">
        <h2 className="card-title mb-1">Feedback</h2>
        <p className="feedback-subtitle">Help us improve DeepVision engine accuracy</p>

        {submitted ? (
          <div className="feedback-success">
            <CheckCircle size={48} className="text-success" />
            <p>Thank you for your feedback!</p>
          </div>
        ) : (
          <div className="feedback-form mt-4">
            <p className="summary-label mb-3">Was the prediction accurate?</p>
            <div className="feedback-options">
              {feedbackOptions.map(({ id, icon: Icon, title, desc, color }) => {
                const isSelected = selected === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelected(id)}
                    className={`feedback-btn ${isSelected ? 'selected' : ''}`}
                    aria-pressed={isSelected}
                  >
                    <div className="feedback-icon" style={{ color: color, background: `${color}15` }}>
                      <Icon size={24} />
                    </div>
                    <div className="feedback-text text-left">
                      <h4>{title}</h4>
                      <p>{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <p className="summary-label mb-2">Comments (Optional)</p>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any specific details about why the AI was correct or incorrect..."
                className="form-textarea w-full"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="btn btn-primary mt-6"
            >
              Submit Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectionResult;
