import React from 'react';
import './StatCard.css';

const StatCard = ({ label, value, change, trend }) => {
  const getTrendIcon = () => {
    if (trend === 'up' || trend === 'positive') {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    } else {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
          <polyline points="17 18 23 18 23 12" />
        </svg>
      );
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
      </div>

      <div className="stat-value">{value}</div>

      {change && (
        <div className={`stat-trend ${trend === 'down' || trend === 'negative' ? 'negative' : 'positive'}`}>
          {getTrendIcon()}
          <span>{change}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
