import { useState } from 'react';
import HistoryPanel from './HistoryPanel';

const DetectionHistory = ({ setActiveView }) => {
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      minHeight: 'calc(100vh - 120px)',
      gap: 0,
    }}>
      {/* Left history panel */}
      <HistoryPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        setActiveView={setActiveView}
      />

      {/* Right content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 15,
        flexDirection: 'column',
        gap: 12,
      }}>
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            style={{
              padding: '10px 22px',
              borderRadius: 9999,
              border: 'none',
              background: 'linear-gradient(135deg,#4361ee 0%,#a855f7 100%)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Show Detection History
          </button>
        )}
        {panelOpen && (
          <p style={{ margin: 0 }}>Select a record from the history panel.</p>
        )}
      </div>
    </div>
  );
};

export default DetectionHistory;
