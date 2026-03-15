import React from 'react';
import StatCard from './StatCard';
import DetectionChart from './DetectionChart';
import ActivityFeed from './ActivityFeed';
import './Dashboard.css';

const Dashboard = () => {
  const stats = [
    { label: 'Total Scans', value: '12459', change: '+12.5%', trend: 'up' },
    { label: 'Deepfakes Detected', value: '342', change: '-2.1%', trend: 'down' },
    { label: 'Active Users', value: '89', change: '+5.4%', trend: 'up' },
    { label: 'System Accuracy', value: '96.2%', change: '+0.8%', trend: 'up' },
  ];

  return (
    <div className="dashboard">
      <div className="page-title">
        <h1>DASHBOARD OVERVIEW</h1>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid">
        <DetectionChart />
        <ActivityFeed />
      </div>
    </div>
  );
};

export default Dashboard;
