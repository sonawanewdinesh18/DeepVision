import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { InlineLoader } from '@/components/common/LoadingSpinner';
import { 
  TrendingUp, TrendingDown, Users, Activity, AlertTriangle, CheckCircle,
  Clock, Zap, Shield, BarChart3, PieChart, FileText, ThumbsUp, ThumbsDown,
  Eye, Download, RefreshCw, ArrowRight
} from 'lucide-react';
import toast from '@/utils/toast';
import './EnhancedDashboard.css';

const EnhancedDashboard = ({ setActiveView }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchChartData(),
        fetchRecentActivity()
      ]);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await adminApi.getChartData(7);
      // Backend returns {chart_data: [...]}
      const data = response.data?.chart_data || response.data || [];
      
      // Generate last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        last7Days.push(dateStr);
      }
      
      // Convert array to object format and fill missing days with zeros
      const chartObj = {};
      last7Days.forEach(date => {
        const existingData = data.find(item => item.date === date);
        chartObj[date] = {
          authentic: existingData?.authentic || 0,
          deepfake: existingData?.deepfake || 0
        };
      });
      
      setChartData(chartObj);
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      // Still show empty 7 days
      const last7Days = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days[dateStr] = { authentic: 0, deepfake: 0 };
      }
      setChartData(last7Days);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await adminApi.getActivity(10);
      setRecentActivity(response.data?.activities || []);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  if (loading) {
    return (
      <div className="enhanced-dashboard">
        <div className="dashboard-loading">
          <InlineLoader size="lg" message="Loading analytics..." />
        </div>
      </div>
    );
  }

  // Calculate additional metrics
  const totalDetections = stats?.total_scans || 0;
  const deepfakes = stats?.deepfakes_detected || 0;
  const authentic = totalDetections - deepfakes;
  const deepfakeRate = totalDetections > 0 ? ((deepfakes / totalDetections) * 100).toFixed(1) : 0;
  const authenticRate = totalDetections > 0 ? ((authentic / totalDetections) * 100).toFixed(1) : 0;

  return (
    <div className="enhanced-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Analytics Dashboard</h1>
          <p className="dashboard-subtitle">Comprehensive platform insights and performance metrics</p>
        </div>
        <button 
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={18} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Primary Stats Grid */}
      <div className="primary-stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <BarChart3 size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Detections</div>
            <div className="stat-value">{totalDetections.toLocaleString()}</div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              <span>+{stats?.scans_change || 0}% this month</span>
            </div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <AlertTriangle size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Deepfakes Detected</div>
            <div className="stat-value">{deepfakes.toLocaleString()}</div>
            <div className="stat-change neutral">
              <span>{deepfakeRate}% of total</span>
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CheckCircle size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Authentic Media</div>
            <div className="stat-value">{authentic.toLocaleString()}</div>
            <div className="stat-change positive">
              <span>{authenticRate}% of total</span>
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <Users size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{stats?.active_users?.toLocaleString() || 0}</div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              <span>+{stats?.users_change || 0}% this week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="secondary-stats-grid">
        <div className="mini-stat-card">
          <div className="mini-stat-icon" style={{ color: '#8B5CF6' }}>
            <Shield size={20} />
          </div>
          <div className="mini-stat-content">
            <div className="mini-stat-value">{stats?.system_accuracy || 0}%</div>
            <div className="mini-stat-label">Accuracy</div>
          </div>
        </div>

        <div className="mini-stat-card">
          <div className="mini-stat-icon" style={{ color: '#10B981' }}>
            <Zap size={20} />
          </div>
          <div className="mini-stat-content">
            <div className="mini-stat-value">{stats?.avg_response_time || 0}ms</div>
            <div className="mini-stat-label">Avg Response</div>
          </div>
        </div>

        <div className="mini-stat-card">
          <div className="mini-stat-icon" style={{ color: '#F59E0B' }}>
            <Clock size={20} />
          </div>
          <div className="mini-stat-content">
            <div className="mini-stat-value">{stats?.total_users || 0}</div>
            <div className="mini-stat-label">Total Users</div>
          </div>
        </div>

        <div className="mini-stat-card">
          <div className="mini-stat-icon" style={{ color: '#EF4444' }}>
            <Activity size={20} />
          </div>
          <div className="mini-stat-content">
            <div className="mini-stat-value">99.9%</div>
            <div className="mini-stat-label">Uptime</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Detection Trends Chart */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Detection Trends</h3>
              <p className="card-subtitle">Last 7 days activity</p>
            </div>
            <select className="time-range-select">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div className="chart-container">
            {chartData && Object.keys(chartData).length > 0 ? (
              <div className="simple-chart">
                {Object.entries(chartData).map(([date, data], index) => {
                  const total = (data.authentic || 0) + (data.deepfake || 0);
                  const allTotals = Object.values(chartData).map(d => (d.authentic || 0) + (d.deepfake || 0));
                  const maxTotal = Math.max(...allTotals, 1); // Avoid division by zero
                  const maxHeight = 200;
                  const height = total > 0 ? (total / maxTotal) * maxHeight : 10; // Minimum 10px height
                  
                  return (
                    <div key={date} className="chart-bar-group">
                      <div className="chart-bar-stack" style={{ height: `${height}px` }}>
                        {total > 0 ? (
                          <>
                            <div 
                              className="chart-bar authentic" 
                              style={{ 
                                height: `${((data.authentic || 0) / total) * 100}%`,
                                background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
                              }}
                              title={`Authentic: ${data.authentic || 0}`}
                            />
                            <div 
                              className="chart-bar deepfake" 
                              style={{ 
                                height: `${((data.deepfake || 0) / total) * 100}%`,
                                background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)'
                              }}
                              title={`Deepfake: ${data.deepfake || 0}`}
                            />
                          </>
                        ) : (
                          <div 
                            className="chart-bar empty" 
                            style={{ 
                              height: '100%',
                              background: 'var(--border-color)'
                            }}
                            title="No data"
                          />
                        )}
                      </div>
                      <div className="chart-label">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="chart-empty">
                <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p>No detection data available for the selected period</p>
              </div>
            )}
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#10B981' }}></div>
                <span>Authentic</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#EF4444' }}></div>
                <span>Deepfake</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict Distribution */}
        <div className="dashboard-card distribution-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Verdict Distribution</h3>
              <p className="card-subtitle">Overall breakdown</p>
            </div>
          </div>
          <div className="distribution-content">
            <div className="donut-chart">
              <svg viewBox="0 0 200 200" className="donut-svg">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="40"
                  strokeDasharray={`${authenticRate * 5.03} 503`}
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="40"
                  strokeDasharray={`${deepfakeRate * 5.03} 503`}
                  strokeDashoffset={`-${authenticRate * 5.03}`}
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="donut-center">
                <div className="donut-value">{totalDetections}</div>
                <div className="donut-label">Total</div>
              </div>
            </div>
            <div className="distribution-stats">
              <div className="distribution-item">
                <div className="distribution-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                  <CheckCircle size={20} />
                </div>
                <div className="distribution-info">
                  <div className="distribution-value">{authentic}</div>
                  <div className="distribution-label">Authentic ({authenticRate}%)</div>
                </div>
              </div>
              <div className="distribution-item">
                <div className="distribution-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                  <AlertTriangle size={20} />
                </div>
                <div className="distribution-info">
                  <div className="distribution-value">{deepfakes}</div>
                  <div className="distribution-label">Deepfake ({deepfakeRate}%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Activity</h3>
              <p className="card-subtitle">Latest detections</p>
            </div>
            <button className="view-all-link" onClick={() => setActiveView('users')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 6).map((activity, index) => (
                <div key={index} className="activity-item-enhanced">
                  <div className={`activity-avatar ${activity.verdict === 'FAKE' ? 'danger' : 'success'}`}>
                    {activity.verdict === 'FAKE' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                  </div>
                  <div className="activity-details">
                    <div className="activity-title-enhanced">{activity.file_name}</div>
                    <div className="activity-meta">
                      <span className="activity-user">{activity.user_name || activity.user_email}</span>
                      <span className="activity-dot">•</span>
                      <span className="activity-time">{new Date(activity.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className={`activity-badge ${activity.verdict === 'FAKE' ? 'badge-danger' : 'badge-success'}`}>
                    {activity.verdict === 'FAKE' ? 'Deepfake' : 'Authentic'}
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-empty-state">
                <Activity size={32} style={{ opacity: 0.3 }} />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card actions-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Common tasks</p>
            </div>
          </div>
          <div className="quick-actions-grid">
            <button className="action-btn" onClick={() => setActiveView('users')}>
              <Users size={20} />
              <span>Manage Users</span>
            </button>
            <button className="action-btn" onClick={() => setActiveView('feedback')}>
              <FileText size={20} />
              <span>View Feedback</span>
            </button>
            <button className="action-btn" onClick={() => setActiveView('models')}>
              <Shield size={20} />
              <span>Model Settings</span>
            </button>
            <button className="action-btn" onClick={handleRefresh}>
              <RefreshCw size={20} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* System Health */}
        <div className="dashboard-card health-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">System Health</h3>
              <p className="card-subtitle">Performance indicators</p>
            </div>
          </div>
          <div className="health-indicators">
            <div className="health-item">
              <div className="health-label">
                <Zap size={16} />
                <span>API Response</span>
              </div>
              <div className="health-bar">
                <div className="health-fill success" style={{ width: '95%' }}></div>
              </div>
              <div className="health-value">95%</div>
            </div>
            <div className="health-item">
              <div className="health-label">
                <Shield size={16} />
                <span>Detection Accuracy</span>
              </div>
              <div className="health-bar">
                <div className="health-fill success" style={{ width: `${stats?.system_accuracy || 0}%` }}></div>
              </div>
              <div className="health-value">{stats?.system_accuracy || 0}%</div>
            </div>
            <div className="health-item">
              <div className="health-label">
                <Activity size={16} />
                <span>System Uptime</span>
              </div>
              <div className="health-bar">
                <div className="health-fill success" style={{ width: '99.9%' }}></div>
              </div>
              <div className="health-value">99.9%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
