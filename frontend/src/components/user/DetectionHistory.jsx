import { useState, useEffect } from 'react';
import HistoryPanel from './HistoryPanel';
import DetectionResult from './DetectionResult';
import { detectionApi } from '@/services/api';

const DetectionHistory = ({ setActiveView, detectionId, refreshTrigger }) => {
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedId, setSelectedId] = useState(detectionId || null);

  // If initial selectedId isn't provided, fetch latest to auto-select
  useEffect(() => {
    if (!selectedId) {
      detectionApi.getHistory({ page: 1, limit: 1 })
        .then((res) => {
          if (res.data?.items?.length > 0) {
            setSelectedId(res.data.items[0].id);
          }
        })
        .catch(() => {});
    }
  }, [selectedId, refreshTrigger]);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      minHeight: 'calc(100vh - 120px)',
      gap: '20px',
    }}>
      {/* Left history list panel */}
      <HistoryPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        setActiveView={setActiveView}
        selectedDetectionId={selectedId}
        onSelectDetection={(id) => setSelectedId(id)}
      />

      {/* Right content area — Live Detection Result & Media Preview */}
      <div style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
      }}>
        {selectedId ? (
          <DetectionResult
            key={selectedId}
            detectionId={selectedId}
            setActiveView={setActiveView}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 15,
            flexDirection: 'column',
            gap: 12,
            minHeight: '400px',
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
            <p style={{ margin: 0 }}>Select a record from the history list to view analysis & media preview.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectionHistory;
