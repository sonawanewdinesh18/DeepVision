import { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { InlineLoader } from '@/components/common/LoadingSpinner';
import './DetectionChart.css';

const DetectionChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getChartData(7);
      setChartData(response.data.chart_data);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h3>Detection Trends</h3>
            <p>Daily volume of scanned content — last 7 days</p>
          </div>
        </div>
        <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
          <InlineLoader />
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h3>Detection Trends</h3>
            <p>Daily volume of scanned content — last 7 days</p>
          </div>
        </div>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No detection data available
        </div>
      </div>
    );
  }

  const MAX_VALUE = Math.max(...chartData.map(d => d.authentic + d.deepfake));
  const totalScans = chartData.reduce((a, d) => a + d.authentic + d.deepfake, 0);
  const totalDeepfakes = chartData.reduce((a, d) => a + d.deepfake, 0);
  const detectionRate = totalScans > 0 ? ((totalDeepfakes / totalScans) * 100).toFixed(1) : 0;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>Detection Trends</h3>
          <p>Daily volume of scanned content — last 7 days</p>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot scans-dot" />Authentic</span>
          <span className="legend-item"><span className="legend-dot detections-dot" />Deepfake</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bar-chart">
        {chartData.map((d, i) => {
          const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
          return (
            <div key={i} className="bar-group">
              <div className="bars">
                <div
                  className="bar bar-scans"
                  style={{ height: `${((d.authentic + d.deepfake) / MAX_VALUE) * 100}%` }}
                  title={`Authentic: ${d.authentic}`}
                />
                <div
                  className="bar bar-detections"
                  style={{ height: `${(d.deepfake / MAX_VALUE) * 100}%` }}
                  title={`Deepfake: ${d.deepfake}`}
                />
              </div>
              <div className="bar-label">{dayName}</div>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-value">{totalScans.toLocaleString()}</span>
          <span className="summary-label">Total Scans</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">{totalDeepfakes.toLocaleString()}</span>
          <span className="summary-label">Deepfakes Found</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">{detectionRate}%</span>
          <span className="summary-label">Detection Rate</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">{chartData.length}</span>
          <span className="summary-label">Days Tracked</span>
        </div>
      </div>
    </div>
  );
};

export default DetectionChart;
