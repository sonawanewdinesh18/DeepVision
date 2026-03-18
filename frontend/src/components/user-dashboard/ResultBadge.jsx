import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import './ResultBadge.css';

const ResultBadge = ({ result, size = 'md' }) => {
  const isAuthentic = result === 'authentic';
  
  return (
    <span className={`result-badge size-${size} ${isAuthentic ? 'badge-authentic' : 'badge-deepfake'}`}>
      {isAuthentic ? (
        <CheckCircle size={14} className="badge-icon" />
      ) : (
        <AlertTriangle size={14} className="badge-icon" />
      )}
      <span>{isAuthentic ? 'Authentic' : 'Deepfake'}</span>
    </span>
  );
};

export default ResultBadge;
