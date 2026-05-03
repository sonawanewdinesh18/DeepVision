import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { SkeletonLoader } from '@/components/common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import toast from '@/utils/toast';
import StatCard from './StatCard';
import DetectionChart from './DetectionChart';
import ActivityFeed from './ActivityFeed';
import './Dashboard.css';

const Dashboard = ({ setActiveView }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await adminApi.getActivity({ limit: 5 });
      setRecentActivity(response.data?.activities || []);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    }
  };



  if (loading) {
    return (
      <div className="dashboard">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--error)', margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Failed to Load Dashboard</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={fetchStats}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statsData = [
    { 
      label: 'Total Scans', 
      value: stats?.total_scans?.toLocaleString() || '0', 
      change: `${stats?.scans_change >= 0 ? '+' : ''}${stats?.scans_change || 0}%`, 
      trend: stats?.scans_change >= 0 ? 'up' : 'down' 
    },
    { 
      label: 'Deepfakes Detected', 
      value: stats?.deepfakes_detected?.toLocaleString() || '0', 
      change: `${stats?.deepfakes_change >= 0 ? '+' : ''}${stats?.deepfakes_change || 0}%`, 
      trend: stats?.deepfakes_change >= 0 ? 'up' : 'down' 
    },
    { 
      label: 'Active Users', 
      value: stats?.active_users?.toLocaleString() || '0', 
      change: `${stats?.users_change >= 0 ? '+' : ''}${stats?.users_change || 0}%`, 
      trend: stats?.users_change >= 0 ? 'up' : 'down' 
    },
    { 
      label: 'System Accuracy', 
      value: `${stats?.system_accuracy || 0}%`, 
      change: `${stats?.accuracy_change >= 0 ? '+' : ''}${stats?.accuracy_change || 0}%`, 
      trend: stats?.accuracy_change >= 0 ? 'up' : 'down' 
    },
    { 
      label: 'Total Users', 
      value: stats?.total_users?.toLocaleString() || '0', 
      change: `${stats?.total_users_change >= 0 ? '+' : ''}${stats?.total_users_change || 0}%`, 
      trend: stats?.total_users_change >= 0 ? 'up' : 'down' 
    },
    { 
      label: 'Avg Response Time', 
      value: `${stats?.avg_response_time || '0'}ms`, 
      change: `${stats?.response_time_change >= 0 ? '+' : ''}${stats?.response_time_change || 0}%`, 
      trend: stats?.response_time_change <= 0 ? 'up' : 'down' 
    },
  ];

  return (
    <div className="dashboard">
      <div className="page-title">
        <h1>Analytics Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Comprehensive platform insights and performance metrics
        </p>
      </div>

      {/* Enhanced Stats Grid - 8 cards */}
      <div className="stats-grid-extended">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Grid - Full Width */}
      <div className="analytics-charts-grid">
        <DetectionChart />
        <ActivityFeed />
      </div>

      {/* Recent Activity Timeline */}
      <div className="recent-activity-panel">
        <div className="activity-header">
          <h3>Recent Activity</h3>
          <button className="view-all-btn" onClick={() => setActiveView('users')}>
            View All
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <div className="activity-timeline">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <div className="activity-title">{activity.action || 'User Activity'}</div>
                  <div className="activity-desc">{activity.description || activity.user_email}</div>
                  <div className="activity-time">{new Date(activity.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="activity-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
