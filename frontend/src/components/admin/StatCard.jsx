import React from 'react';
import './StatCard.css';

const StatCard = ({ label, value, change, trend, sparklineData }) => {
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

  // Generate sparkline path
  const generateSparkline = () => {
    if (!sparklineData || sparklineData.length === 0) {
      // Default sparkline data
      const defaultData = [30, 45, 35, 50, 40, 60, 55];
      return generatePath(defaultData);
    }
    return generatePath(sparklineData);
  };

  const generatePath = (data) => {
    const width = 100;
    const height = 30;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
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

      {/* Sparkline */}
      <div className="stat-sparkline">
        <svg width="100" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path
            d={generateSparkline()}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
};

export default StatCard;
