import React, { useState, useEffect, useTransition } from 'react';
import { FileVideo, CheckCircle, AlertTriangle, Target, Upload, TrendingUp, BarChart2 } from 'lucide-react';
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

const Dashboard = ({ setActiveView, refreshTrigger }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, startTransition] = useTransition();

  // Get user's full name
  const userName = user?.user_metadata?.full_name ||
                   user?.email?.split('@')[0] ||
                   'User';

  useEffect(() => {
    // Defer data fetching so the LCP element (userName heading) paints first
    startTransition(() => {
      fetchDashboardData();
    });
  }, [refreshTrigger]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user statistics
      try {
        const statsResponse = await userApi.getStats();
        setStats(statsResponse.data);
      } catch (statsErr) {
        console.warn('Failed to fetch stats, using defaults:', statsErr);
        setStats({
          total_detections: 0,
          authentic_count: 0,
          deepfake_count: 0,
          last_detection_at: null
        });
      }

      // Fetch analytics chart data (last 7 days)
      try {
        const chartResponse = await userApi.getAnalyticsChart(7);
        setChartData(chartResponse.data);
      } catch (chartErr) {
        console.warn('Failed to fetch analytics chart data:', chartErr);
      }
      
    } catch (error) {
      console.error('Dashboard data fallback:', error);
      setStats({
        total_detections: 0,
        authentic_count: 0,
        deepfake_count: 0,
        last_detection_at: null
      });
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

  // Compute chart parameters
  const maxDetectionInPeriod = chartData?.detections?.length 
    ? Math.max(...chartData.detections, 1) 
    : 1;

  const totalInPeriod = chartData?.detections?.reduce((a, b) => a + b, 0) || 0;
  const authInPeriod = chartData?.authentic?.reduce((a, b) => a + b, 0) || 0;
  const fakeInPeriod = chartData?.deepfake?.reduce((a, b) => a + b, 0) || 0;

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

      {/* ── Middle Row: Detection Activity Chart ── */}
      <div className="ud-middle-grid">
        <div className="ud-card ud-activity-card ud-activity-full-width">
          <div className="ud-chart-container">
            <div className="ud-chart-top">
              <div>
                <h2 className="ud-card-title" style={{ margin: 0 }}>Detection Activity</h2>
                <p className="ud-chart-sub">Daily volume of scanned media over the last 7 days</p>
              </div>
              <div className="ud-chart-legend">
                <span className="ud-legend-item">
                  <span className="ud-legend-dot dot-authentic" />
                  Authentic
                </span>
                <span className="ud-legend-item">
                  <span className="ud-legend-dot dot-deepfake" />
                  Deepfake
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            {chartData && chartData.labels && chartData.labels.length > 0 ? (
              <div className="ud-chart-graph">
                {chartData.labels.map((label, idx) => {
                  const authVal = chartData.authentic?.[idx] || 0;
                  const fakeVal = chartData.deepfake?.[idx] || 0;
                  const totalVal = chartData.detections?.[idx] || 0;
                  
                  const authHeight = totalVal > 0 ? (authVal / maxDetectionInPeriod) * 100 : 4;
                  const fakeHeight = totalVal > 0 ? (fakeVal / maxDetectionInPeriod) * 100 : 4;

                  return (
                    <div key={label} className="ud-chart-col">
                      <div 
                        className="ud-bars-wrap"
                        title={`${label}: ${totalVal} Scans (${authVal} Authentic, ${fakeVal} Deepfake)`}
                      >
                        <div 
                          className="ud-bar ud-bar-auth"
                          style={{ height: `${Math.max(authHeight, 4)}%` }}
                          title={`Authentic: ${authVal}`}
                        />
                        <div 
                          className="ud-bar ud-bar-fake"
                          style={{ height: `${Math.max(fakeHeight, 4)}%` }}
                          title={`Deepfake: ${fakeVal}`}
                        />
                      </div>
                      <span className="ud-col-date">{label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ud-chart-graph" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No activity data for this period.</p>
              </div>
            )}

            {/* Summary Footer */}
            <div className="ud-chart-footer">
              <div className="ud-cf-stat">
                <span className="ud-cf-val">{totalInPeriod}</span>
                <span className="ud-cf-lbl">Total Scans (7 Days)</span>
              </div>
              <div className="ud-cf-stat">
                <span className="ud-cf-val" style={{ color: '#10b981' }}>{authInPeriod}</span>
                <span className="ud-cf-lbl">Authentic Media</span>
              </div>
              <div className="ud-cf-stat">
                <span className="ud-cf-val" style={{ color: '#ef4444' }}>{fakeInPeriod}</span>
                <span className="ud-cf-lbl">Deepfakes Flagged</span>
              </div>
              <div className="ud-cf-stat">
                <span className="ud-cf-val">
                  {totalInPeriod > 0 ? ((authInPeriod / totalInPeriod) * 100).toFixed(1) : 100}%
                </span>
                <span className="ud-cf-lbl">Authenticity Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
