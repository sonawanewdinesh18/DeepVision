/**
 * UserDashboard
 * Main user interface. Hosts the sidebar + content switcher pattern.
 * All sections are rendered within a single SPA shell (no sub-routes).
 */

import { useState } from 'react';
import {
  Navbar,
  Sidebar,
  Dashboard,
  UploadMedia,
  DetectionResult,
  DetectionHistory,
  Settings,
} from '@/components/user';

const VIEW_MAP = {
  dashboard: Dashboard,
  upload:    UploadMedia,
  result:    DetectionResult,
  history:   DetectionHistory,
  settings:  Settings,
};

export default function UserDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [detectionId, setDetectionId] = useState(null);
  const [initialResult, setInitialResult] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNavigate = (view, detId = null, resultData = null) => {
    setActiveView(view);
    setDetectionId(detId);
    setInitialResult(resultData);
    if (resultData) {
      triggerRefresh();
    }
  };

  const ActiveComponent = VIEW_MAP[activeView] ?? Dashboard;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Top nav - Fixed */}
      <Navbar toggleSidebar={() => setIsSidebarOpen(o => !o)} />

      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        height: 'calc(100vh - 64px)'
      }}>
        {/* Left sidebar - Fixed */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeView={activeView}
          setActiveView={handleNavigate}
          refreshTrigger={refreshTrigger}
        />

        {/* Main content - Scrollable */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px',
          background: 'var(--bg-surface)',
          height: '100%',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <ActiveComponent 
              setActiveView={handleNavigate} 
              detectionId={detectionId}
              initialResult={initialResult}
              refreshTrigger={refreshTrigger}
              triggerRefresh={triggerRefresh}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
