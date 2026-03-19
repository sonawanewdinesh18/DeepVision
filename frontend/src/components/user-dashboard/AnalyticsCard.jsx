import React from 'react';
import './AnalyticsCard.css';

const AnalyticsCard = ({ icon: Icon, title, value, change, color = 'blue' }) => {
  return (
    <div className="card analytics-card group">
      <div className="analytics-content flex-between">
        <div className="analytics-info">
          <p className="analytics-title">{title}</p>
          <h3 className="analytics-value">{value}</h3>
          {change && (
            <p className={`analytics-change ${change > 0 ? 'positive' : 'negative'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`analytics-icon-wrapper color-${color}`}>
          <Icon size={28} className="analytics-icon" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCard;
