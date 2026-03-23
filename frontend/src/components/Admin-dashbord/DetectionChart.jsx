import './DetectionChart.css';

const data = [
  { day: 'Mon', scans: 450, detections: 120 },
  { day: 'Tue', scans: 680, detections: 180 },
  { day: 'Wed', scans: 920, detections: 240 },
  { day: 'Thu', scans: 1050, detections: 310 },
  { day: 'Fri', scans: 780, detections: 210 },
  { day: 'Sat', scans: 520, detections: 150 },
  { day: 'Sun', scans: 490, detections: 130 },
];

const MAX_VALUE = Math.max(...data.map(d => d.scans));

const DetectionChart = () => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>Detection Trends</h3>
          <p>Daily volume of scanned content — last 7 days</p>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot scans-dot" />Scans</span>
          <span className="legend-item"><span className="legend-dot detections-dot" />Detections</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bar-chart">
        {data.map((d, i) => (
          <div key={i} className="bar-group">
            <div className="bars">
              <div
                className="bar bar-scans"
                style={{ height: `${(d.scans / MAX_VALUE) * 100}%` }}
                title={`Scans: ${d.scans}`}
              />
              <div
                className="bar bar-detections"
                style={{ height: `${(d.detections / MAX_VALUE) * 100}%` }}
                title={`Detections: ${d.detections}`}
              />
            </div>
            <div className="bar-label">{d.day}</div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-value">{data.reduce((a, d) => a + d.scans, 0).toLocaleString()}</span>
          <span className="summary-label">Total Scans</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">{data.reduce((a, d) => a + d.detections, 0).toLocaleString()}</span>
          <span className="summary-label">Total Detections</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">
            {((data.reduce((a, d) => a + d.detections, 0) / data.reduce((a, d) => a + d.scans, 0)) * 100).toFixed(1)}%
          </span>
          <span className="summary-label">Detection Rate</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">96.2%</span>
          <span className="summary-label">Avg. Accuracy</span>
        </div>
      </div>
    </div>
  );
};

export default DetectionChart;
