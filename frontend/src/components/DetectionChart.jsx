import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './DetectionChart.css';

const DetectionChart = () => {
  const data = [
    { day: 'Mon', scans: 450, detections: 120 },
    { day: 'Tue', scans: 680, detections: 180 },
    { day: 'Wed', scans: 920, detections: 240 },
    { day: 'Thu', scans: 1050, detections: 310 },
    { day: 'Fri', scans: 780, detections: 210 },
    { day: 'Sat', scans: 520, detections: 150 },
    { day: 'Sun', scans: 490, detections: 130 },
  ];

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>Detection Trends</h3>
          <p>Daily volume of scanned content over the last 7 days</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
          <XAxis dataKey="day" stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" />
          <Tooltip 
            contentStyle={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-secondary)',
              borderRadius: '8px',
              color: 'var(--text-primary)'
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="scans" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorScans)" 
          />
          <Area 
            type="monotone" 
            dataKey="detections" 
            stroke="#ef4444" 
            fillOpacity={1} 
            fill="url(#colorDetections)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DetectionChart;
