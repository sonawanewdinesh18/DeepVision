import React from 'react';
import { FileVideo, CheckCircle, AlertTriangle, Target, Upload, TrendingUp } from 'lucide-react';
import AnalyticsCard from './AnalyticsCard';
import ResultBadge from './ResultBadge';
import './Dashboard.css';

const Dashboard = ({ setActiveView }) => {
  const recentActivity = [
    { id: 1, file: 'video_sample_01.mp4', result: 'authentic', confidence: 98.5, time: '2 mins ago' },
    { id: 2, file: 'image_test_02.jpg', result: 'deepfake', confidence: 87.3, time: '15 mins ago' },
    { id: 3, file: 'portrait_03.png', result: 'authentic', confidence: 95.2, time: '1 hour ago' },
    { id: 4, file: 'video_clip_04.mp4', result: 'deepfake', confidence: 92.8, time: '2 hours ago' },
  ];

  return (
    <div className="user-dashboard-view space-y-24">
      {/* Header */}
      <div className="dashboard-header flex-between">
        <div className="page-title">
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's your deepfake detection summary.</p>
        </div>
        <button onClick={() => setActiveView('upload')} className="btn btn-primary flex-center gap-2">
          <Upload size={18} />
          <span>Upload Media</span>
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid-cols-4">
        <AnalyticsCard
          icon={FileVideo}
          title="Total Scanned"
          value="1,247"
          change={12.5}
          color="blue"
        />
        <AnalyticsCard
          icon={CheckCircle}
          title="Authentic Media"
          value="892"
          change={8.3}
          color="green"
        />
        <AnalyticsCard
          icon={AlertTriangle}
          title="Deepfakes Detected"
          value="355"
          change={-5.2}
          color="red"
        />
        <AnalyticsCard
          icon={Target}
          title="Detection Accuracy"
          value="96.8%"
          change={2.1}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-main-grid">
        <div className="card activity-chart-card">
          <h2 className="card-title">Detection Activity</h2>
          <div className="chart-placeholder flex-center">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto mb-3 chart-icon" />
              <p>Activity chart visualization</p>
            </div>
          </div>
        </div>

        <div className="card text-stats-card">
          <h2 className="card-title mb-4">Quick Stats</h2>
          <div className="stat-bars-container">
            <div className="stat-bar-group">
              <div className="stat-bar-header flex-between">
                <span className="stat-name">Success Rate</span>
                <span className="stat-val text-primary">96.8%</span>
              </div>
              <div className="stat-track">
                <div className="stat-fill bg-success" style={{ width: '96.8%' }}></div>
              </div>
            </div>

            <div className="stat-bar-group mt-16">
              <div className="stat-bar-header flex-between">
                <span className="stat-name">Processing Speed</span>
                <span className="stat-val text-primary">2.3s avg</span>
              </div>
              <div className="stat-track">
                <div className="stat-fill bg-info" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div className="stat-bar-group mt-16">
              <div className="stat-bar-header flex-between">
                <span className="stat-name">User Satisfaction</span>
                <span className="stat-val text-primary">94.2%</span>
              </div>
              <div className="stat-track">
                <div className="stat-fill bg-purple" style={{ width: '94.2%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card table-card">
        <div className="flex-between mb-4">
          <h2 className="card-title m-0">Recent Detection Activity</h2>
          <button onClick={() => setActiveView('history')} className="btn btn-ghost btn-sm">View All</button>
        </div>
        
        <div className="table-wrapper mt-4 border border-card rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface border-b border-color">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">File Name</th>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Result</th>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Confidence</th>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider align-right text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((item) => (
                <tr key={item.id} className="border-b border-color last-no-border hover-bg-surface transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-primary">{item.file}</td>
                  <td className="py-3 px-4">
                    <ResultBadge result={item.result} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-primary">{item.confidence}%</td>
                  <td className="py-3 px-4 text-sm text-secondary text-right">{item.time}</td>
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
