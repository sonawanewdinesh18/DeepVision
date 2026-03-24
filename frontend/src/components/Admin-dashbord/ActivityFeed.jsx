import React from 'react';
import './ActivityFeed.css';

const ActivityFeed = () => {
  const activities = [
    {
      type: 'login',
      title: 'User Login',
      user: 'Alice Admin',
      time: 'Just now',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      color: '#3b82f6'
    },
    {
      type: 'detection',
      title: 'Deepfake Detected',
      user: 'Bob User',
      time: '2 mins ago',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      color: '#ef4444'
    },
    {
      type: 'training',
      title: 'Model Retraining Started',
      user: 'System',
      time: '15 mins ago',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      ),
      color: '#f59e0b'
    },
    {
      type: 'scan',
      title: 'Batch Scan Completed',
      user: 'Charlie Analyst',
      time: '1 hour ago',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      ),
      color: '#10b981'
    },
  ];

  return (
    <div className="activity-card">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        <p>Latest system events and alerts</p>
      </div>
      <div className="activity-list">
        {activities.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-icon" style={{ background: activity.color }}>
              {activity.icon}
            </div>
            <div className="activity-content">
              <div className="activity-title">{activity.title}</div>
              <div className="activity-meta">
                <span className="activity-user">{activity.user}</span>
                <span className="activity-time">• {activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
