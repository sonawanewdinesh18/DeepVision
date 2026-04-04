import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { InlineLoader } from '@/components/common/LoadingSpinner';
import './ActivityFeed.css';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getActivity(10);
      const formattedActivities = response.data.activities.map(activity => ({
        type: activity.verdict === 'DEEPFAKE' ? 'detection' : 'scan',
        title: activity.verdict === 'DEEPFAKE' ? 'Deepfake Detected' : 'Media Scanned',
        user: activity.user_name,
        file: activity.file_name,
        confidence: (activity.confidence * 100).toFixed(1),
        time: formatTimeAgo(activity.created_at),
        icon: activity.verdict === 'DEEPFAKE' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        ),
        color: activity.verdict === 'DEEPFAKE' ? '#ef4444' : '#10b981'
      }));
      setActivities(formattedActivities);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="activity-card">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        <p>Latest detection events across all users</p>
      </div>
      <div className="activity-list">
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <InlineLoader />
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon" style={{ background: activity.color }}>
                {activity.icon}
              </div>
              <div className="activity-content">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-meta">
                  <span className="activity-user">{activity.user}</span>
                  <span className="activity-time">• {activity.time}</span>
                  <span className="activity-confidence">• {activity.confidence}% confidence</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
