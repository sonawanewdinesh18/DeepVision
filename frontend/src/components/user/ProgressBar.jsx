import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ percentage, label, color = 'blue' }) => {
  return (
    <div className="progress-bar-wrapper">
      {label && (
        <div className="progress-label-row flex-between">
          <span className="progress-label">{label}</span>
          <span className="progress-value">{percentage}%</span>
        </div>
      )}
      <div className="progress-track">
        <div
          className={`progress-fill color-${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
