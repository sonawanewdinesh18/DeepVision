import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import ResultBadge from './ResultBadge';
import './HistoryPanel.css';

const HistoryPanel = ({ isOpen, onClose, setActiveView }) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setAnimating(false);
    } else if (visible) {
      setAnimating(true);
      const t = setTimeout(() => {
        setVisible(false);
        setAnimating(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, visible]);

  const historyData = [
    { id: 1, file: 'video_sample_01.mp4', type: 'Video', result: 'authentic', confidence: 98.5, date: '2026-03-10 14:30' },
    { id: 2, file: 'image_test_02.jpg', type: 'Image', result: 'deepfake', confidence: 87.3, date: '2026-03-10 13:15' },
    { id: 3, file: 'portrait_03.png', type: 'Image', result: 'authentic', confidence: 95.2, date: '2026-03-10 11:45' },
    { id: 4, file: 'video_clip_04.mp4', type: 'Video', result: 'deepfake', confidence: 92.8, date: '2026-03-09 16:20' },
    { id: 5, file: 'selfie_05.jpg', type: 'Image', result: 'authentic', confidence: 97.1, date: '2026-03-09 10:30' },
    { id: 6, file: 'interview_06.mp4', type: 'Video', result: 'deepfake', confidence: 89.4, date: '2026-03-08 15:10' },
  ];

  const handleItemClick = (item) => {
    setActiveView('result');
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      <div className="history-backdrop" onClick={onClose} />
      
      <div className={`history-panel ${animating ? 'slide-out' : 'slide-in'}`}>
        
        <div className="history-panel-header">
          <div className="history-title">
            <Clock size={18} className="text-primary" />
            <h2>Detection History</h2>
          </div>
          <button onClick={onClose} className="btn btn-icon btn-ghost p-1" aria-label="Close history">
            <X size={18} />
          </button>
        </div>

        <div className="history-list">
          {historyData.map((item) => (
            <div key={item.id} onClick={() => handleItemClick(item)} className="history-item">
              <p className="history-item-name">{item.file}</p>
              <p className="history-item-type">{item.type}</p>
              
              <div className="history-item-stats">
                <ResultBadge result={item.result} size="sm" />
                <span className="history-item-confidence">{item.confidence}%</span>
              </div>
              
              <p className="history-item-date">{item.date}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HistoryPanel;
