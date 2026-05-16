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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDetectionId, setSelectedDetectionId] = useState(null);

  const ActiveComponent = VIEW_MAP[activeView] ?? Dashboard;

  // Handler to switch views with optional detection ID
  const handleViewChange = (view, detectionId = null) => {
    setActiveView(view);
    setSelectedDetectionId(detectionId);
  };

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
          setActiveView={handleViewChange}
          selectedDetectionId={selectedDetectionId}
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
              setActiveView={handleViewChange} 
              detectionId={selectedDetectionId}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
