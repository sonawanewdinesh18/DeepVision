/**
 * AdminDashboard
 * Main admin interface. Hosts the sidebar + content switcher pattern.
 * All sections are rendered within a single SPA shell (no sub-routes).
 */

import { useState } from 'react';
import {
  Sidebar,
  TopHeader,
  EnhancedDashboard,
  UserManagement,
  ModelManagement,
  Feedback,
} from '@/components/admin';

const VIEW_MAP = {
  dashboard:     EnhancedDashboard,
  users:         UserManagement,
  models:        ModelManagement,
  feedback:      Feedback,
};

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const ActiveComponent = VIEW_MAP[activeView] ?? EnhancedDashboard;

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
      <TopHeader toggleSidebar={() => setIsSidebarOpen(o => !o)} setActiveView={setActiveView} />

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
          setActiveView={setActiveView}
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
            <ActiveComponent setActiveView={setActiveView} />
          </div>
        </main>
      </div>
    </div>
  );
}
