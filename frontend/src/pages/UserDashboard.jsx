/**
 * UserDashboard
 * Main user interface with Responsive Desktop & Native Mobile layouts.
 */

import { useState, useEffect } from 'react';
import {
  Navbar,
  Sidebar,
  Dashboard,
  UploadMedia,
  DetectionResult,
  DetectionHistory,
  Settings,
  MobileBottomNav,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Set default sidebar state based on screen size on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const ActiveComponent = VIEW_MAP[activeView] ?? Dashboard;

  return (
    <div className="ud-shell-container">
      {/* Top nav */}
      <Navbar toggleSidebar={() => setIsSidebarOpen(o => !o)} />

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          className="mobile-drawer-backdrop" 
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div className="ud-body-layout">
        {/* Left sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeView={activeView}
          setActiveView={handleNavigate}
          refreshTrigger={refreshTrigger}
        />

        {/* Main content area */}
        <main className="ud-main-content">
          <div className="ud-content-wrapper">
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

      {/* Modern Touch-Friendly Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeView={activeView} setActiveView={handleNavigate} />

      <style>{`
        .ud-shell-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          height: 100dvh;
          overflow: hidden;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: 'Inter', system-ui, sans-serif;
        }

        .ud-body-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
          height: calc(100vh - 64px);
          height: calc(100dvh - 64px);
          position: relative;
        }

        .ud-main-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          background: var(--bg-surface);
          height: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .ud-content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .mobile-drawer-backdrop {
          display: none;
        }

        /* ── Mobile Layout Adjustments (max-width: 768px) ── */
        @media (max-width: 768px) {
          .ud-main-content {
            padding: 16px 12px 90px 12px !important;
          }

          .mobile-drawer-backdrop {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            z-index: 1050;
            animation: fadeInBackdrop 0.25s ease forwards;
          }

          @keyframes fadeInBackdrop {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
