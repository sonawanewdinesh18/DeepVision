import { useState } from 'react';
import { X, Clock } from 'lucide-react';
import ResultBadge from './ResultBadge';
import './HistoryPanel.css';

const historyItems = [
  { id: 1, file: 'video_sample_01.mp4', type: 'Video', result: 'authentic', confidence: 98.5, date: '2026-03-10 14:30' },
  { id: 2, file: 'image_test_02.jpg',   type: 'Image', result: 'deepfake',  confidence: 87.3, date: '2026-03-10 13:15' },
  { id: 3, file: 'portrait_03.png',     type: 'Image', result: 'authentic', confidence: 95.2, date: '2026-03-10 11:45' },
  { id: 4, file: 'video_clip_04.mp4',   type: 'Video', result: 'deepfake',  confidence: 92.8, date: '2026-03-09 16:20' },
  { id: 5, file: 'selfie_05.jpg',       type: 'Image', result: 'authentic', confidence: 97.1, date: '2026-03-09 10:30' },
  { id: 6, file: 'interview_06.mp4',    type: 'Video', result: 'deepfake',  confidence: 89.4, date: '2026-03-08 15:10' },
  { id: 7, file: 'presentation_07.mp4', type: 'Video', result: 'authentic', confidence: 96.3, date: '2026-03-08 09:45' },
  { id: 8, file: 'photo_08.png',        type: 'Image', result: 'deepfake',  confidence: 91.7, date: '2026-03-07 18:20' },
];

const HistoryPanel = ({ isOpen, onClose, setActiveView }) => {
  const [selectedId, setSelectedId] = useState(null);

  if (!isOpen) return null;

  const handleItemClick = (item) => {
    setSelectedId(item.id);
    setActiveView?.('result');
    onClose();
  };

  return (
    <div className="hp-panel" role="dialog" aria-label="Detection History">

      {/* Drag handle */}
      <div className="hp-drag-wrap">
        <div className="hp-drag-handle" />
      </div>

      {/* Header */}
      <div className="hp-header">
        <div className="hp-header-left">
          <Clock size={17} className="hp-header-icon" />
          <span className="hp-header-title">Detection History</span>
        </div>
        <button className="hp-close-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {/* Scrollable list */}
      <div className="hp-list">
        {historyItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`hp-item${selectedId === item.id ? ' hp-item-active' : ''}`}
          >
            <p className="hp-item-name">{item.file}</p>
            <p className="hp-item-type">{item.type}</p>
            <div className="hp-item-row">
              <ResultBadge result={item.result} size="sm" />
              <span className="hp-item-conf">{item.confidence}%</span>
            </div>
            <p className="hp-item-date">{item.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;
