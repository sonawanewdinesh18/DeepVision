import React, { useState, useEffect } from 'react';
import { FileVideo, CheckCircle, AlertTriangle, Target, Upload, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userApi, detectionApi } from '@/services/api';
import { SkeletonLoader } from '@/components/common/LoadingSpinner';
import ResultBadge from './ResultBadge';
import './Dashboard.css';

const StatCard = ({ icon: Icon, title, value, change, colorClass }) => (
  <div className="ud-stat-card">
    <div className="ud-stat-info">
      <p className="ud-stat-title">{title}</p>
      <h3 className="ud-stat-value">{value}</h3>
      <p className={`ud-stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
        {change >= 0 ? '+' : ''}{change}% from last month
      </p>
    </div>
    <div className={`ud-stat-icon ${colorClass}`}>
      <Icon size={26} />
    </div>
  </div>
);

const Dashboard = ({ setActiveView }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get user's full name
  const userName = user?.user_metadata?.full_name || 
                   user?.email?.split('@')[0] || 
                   'User';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user statistics
      const statsResponse = await userApi.getStats();
      setStats(statsResponse.data);
      
      // Fetch recent detections
      const historyResponse = await detectionApi.getHistory({ page: 1, limit: 5 });
      const detections = historyResponse.data.items.map(item => ({
        id: item.id,
        file: item.file_name,
        result: item.verdict.toLowerCase() === 'real' ? 'authentic' : 'deepfake',
        confidence: (item.confidence * 100).toFixed(1),
        time: formatTimeAgo(item.created_at)
      }));
      setRecentActivity(detections);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
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

  const totalDetections = stats?.total_detections || 0;
  const authenticCount = stats?.authentic_count || 0;
  const deepfakeCount = stats?.deepfake_count || 0;
  const accuracy = totalDetections > 0 
    ? ((authenticCount / totalDetections) * 100).toFixed(1) 
    : 0;

  if (loading) {
    return (
      <div className="ud-root">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ud-root">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--error)', margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Failed to Load Dashboard</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
          <button className="ud-upload-btn" onClick={fetchDashboardData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ud-root">

      {/* ── Header ── */}
      <div className="ud-header">
        <div>
          <h1 className="ud-title ud-username-title">{userName}</h1>
          <p className="ud-subtitle">Welcome back! Here's your detection overview.</p>
        </div>
        <button className="ud-upload-btn" onClick={() => setActiveView && setActiveView('upload')}>
          <Upload size={16} />
          Upload Media
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="ud-stats-grid">
        <StatCard 
          icon={FileVideo} 
          title="Total Media Scanned" 
          value={totalDetections.toLocaleString()} 
          change={0} 
          colorClass="icon-blue" 
        />
        <StatCard 
          icon={CheckCircle} 
          title="Authentic Media" 
          value={authenticCount.toLocaleString()} 
          change={0} 
          colorClass="icon-green" 
        />
        <StatCard 
          icon={AlertTriangle} 
          title="Deepfake Detected" 
          value={deepfakeCount.toLocaleString()} 
          change={0} 
          colorClass="icon-red" 
        />
        <StatCard 
          icon={Target} 
          title="Detection Accuracy" 
          value={`${accuracy}%`} 
          change={0} 
          colorClass="icon-purple" 
        />
      </div>

      {/* ── Middle Row ── */}
      <div className="ud-middle-grid">
        {/* Detection Activity */}
        <div className="ud-card ud-activity-card ud-activity-full-width">
          <h2 className="ud-card-title">Detection Activity (Last 7 Days)</h2>
          <DetectionChart userId={user?.id} />
        </div>
      </div>

      {/* ── Recent Activity Table ── */}
      <div className="ud-card ud-table-card">
        <h2 className="ud-card-title">Recent Detection Activity</h2>
        <div className="ud-table-wrapper">
          <table className="ud-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Result</th>
                <th>Confidence</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length > 0 ? (
                recentActivity.map((item, idx) => (
                  <tr key={item.id} className={idx === recentActivity.length - 1 ? 'last-row' : ''}>
                    <td className="td-filename">{item.file}</td>
                    <td><ResultBadge result={item.result} size="sm" /></td>
                    <td className="td-confidence">{item.confidence}%</td>
                    <td className="td-time">{item.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No detections yet. Upload your first media file to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

// Detection Chart Component
const DetectionChart = ({ userId }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [userId]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await userApi.getChartData(7);
      
      // Generate last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        last7Days.push(dateStr);
      }
      
      // Map response data to chart format
      const labels = response.data?.labels || last7Days;
      const authentic = response.data?.authentic || [];
      const deepfake = response.data?.deepfake || [];
      
      // Create chart data object
      const chartObj = {};
      labels.forEach((label, index) => {
        chartObj[label] = {
          authentic: authentic[index] || 0,
          deepfake: deepfake[index] || 0
        };
      });
      
      setChartData(chartObj);
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      // Show empty chart on error
      const last7Days = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        last7Days[dateStr] = { authentic: 0, deepfake: 0 };
      }
      setChartData(last7Days);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ud-chart-placeholder">
        <TrendingUp size={48} className="ud-chart-icon" />
        <p className="ud-chart-label">Loading chart...</p>
      </div>
    );
  }

  if (!chartData || Object.keys(chartData).length === 0) {
    return (
      <div className="ud-chart-placeholder">
        <BarChart3 size={48} className="ud-chart-icon" />
        <p className="ud-chart-label">No detection data available</p>
      </div>
    );
  }

  return (
    <div className="ud-chart-container">
      <div className="ud-simple-chart">
        {Object.entries(chartData).map(([date, data], index) => {
          const total = (data.authentic || 0) + (data.deepfake || 0);
          const allTotals = Object.values(chartData).map(d => (d.authentic || 0) + (d.deepfake || 0));
          const maxTotal = Math.max(...allTotals, 1);
          const maxHeight = 180;
          const height = total > 0 ? (total / maxTotal) * maxHeight : 10;
          
          return (
            <div key={date} className="ud-chart-bar-group">
              <div className="ud-chart-bar-stack" style={{ height: `${height}px` }}>
                {total > 0 ? (
                  <>
                    <div 
                      className="ud-chart-bar ud-authentic" 
                      style={{ 
                        height: `${((data.authentic || 0) / total) * 100}%`,
                        background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
                      }}
                      title={`Authentic: ${data.authentic || 0}`}
                    />
                    <div 
                      className="ud-chart-bar ud-deepfake" 
                      style={{ 
                        height: `${((data.deepfake || 0) / total) * 100}%`,
                        background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)'
                      }}
                      title={`Deepfake: ${data.deepfake || 0}`}
                    />
                  </>
                ) : (
                  <div 
                    className="ud-chart-bar ud-empty" 
                    style={{ 
                      height: '100%',
                      background: 'var(--border-color)'
                    }}
                    title="No data"
                  />
                )}
              </div>
              <div className="ud-chart-label">{date}</div>
            </div>
          );
        })}
      </div>
      <div className="ud-chart-legend">
        <div className="ud-legend-item">
          <div className="ud-legend-color" style={{ background: '#10B981' }}></div>
          <span>Authentic</span>
        </div>
        <div className="ud-legend-item">
          <div className="ud-legend-color" style={{ background: '#EF4444' }}></div>
          <span>Deepfake</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
