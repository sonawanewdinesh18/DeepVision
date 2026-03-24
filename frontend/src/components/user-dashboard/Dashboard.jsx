import React from 'react';
import { FileVideo, CheckCircle, AlertTriangle, Target, Upload, TrendingUp } from 'lucide-react';
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

const ProgressBar = ({ label, value, displayValue, barClass }) => (
  <div className="ud-progress-group">
    <div className="ud-progress-header">
      <span className="ud-progress-label">{label}</span>
      <span className="ud-progress-value">{displayValue}</span>
    </div>
    <div className="ud-progress-track">
      <div className={`ud-progress-fill ${barClass}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const Dashboard = ({ setActiveView }) => {
  const recentActivity = [
    { id: 1, file: 'video_sample_01.mp4', result: 'authentic', confidence: 98.5, time: '2 mins ago' },
    { id: 2, file: 'image_test_02.jpg',   result: 'deepfake',  confidence: 87.3, time: '15 mins ago' },
    { id: 3, file: 'portrait_03.png',     result: 'authentic', confidence: 95.2, time: '1 hour ago' },
    { id: 4, file: 'video_clip_04.mp4',   result: 'deepfake',  confidence: 92.8, time: '2 hours ago' },
  ];

  return (
    <div className="ud-root">

      {/* ── Header ── */}
      <div className="ud-header">
        <div>
          <h1 className="ud-title">Dashboard</h1>
          <p className="ud-subtitle">Welcome back! Here's your detection overview.</p>
        </div>
        <button className="ud-upload-btn" onClick={() => setActiveView && setActiveView('upload')}>
          <Upload size={16} />
          Upload Media
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="ud-stats-grid">
        <StatCard icon={FileVideo}      title="Total Media Scanned" value="1,247"  change={12.5}  colorClass="icon-blue"   />
        <StatCard icon={CheckCircle}    title="Authentic Media"     value="892"    change={8.3}   colorClass="icon-green"  />
        <StatCard icon={AlertTriangle}  title="Deepfake Detected"   value="355"    change={-5.2}  colorClass="icon-red"    />
        <StatCard icon={Target}         title="Detection Accuracy"  value="96.8%"  change={2.1}   colorClass="icon-purple" />
      </div>

      {/* ── Middle Row ── */}
      <div className="ud-middle-grid">
        {/* Detection Activity */}
        <div className="ud-card ud-activity-card">
          <h2 className="ud-card-title">Detection Activity</h2>
          <div className="ud-chart-placeholder">
            <TrendingUp size={48} className="ud-chart-icon" />
            <p className="ud-chart-label">Activity chart visualization</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="ud-card ud-quickstats-card">
          <h2 className="ud-card-title">Quick Stats</h2>
          <div className="ud-progress-list">
            <ProgressBar label="Success Rate"      value={96.8} displayValue="96.8%"   barClass="bar-green"  />
            <ProgressBar label="Processing Speed"  value={85}   displayValue="2.3s avg" barClass="bar-blue"   />
            <ProgressBar label="User Satisfaction" value={94.2} displayValue="94.2%"   barClass="bar-pink"   />
          </div>
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
              {recentActivity.map((item, idx) => (
                <tr key={item.id} className={idx === recentActivity.length - 1 ? 'last-row' : ''}>
                  <td className="td-filename">{item.file}</td>
                  <td><ResultBadge result={item.result} size="sm" /></td>
                  <td className="td-confidence">{item.confidence}%</td>
                  <td className="td-time">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
