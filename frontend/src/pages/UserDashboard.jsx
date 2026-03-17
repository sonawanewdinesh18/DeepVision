import { useState } from 'react';
import Navbar from '../components/user-dashboard/Navbar';
import Sidebar from '../components/user-dashboard/Sidebar';
import Dashboard from '../components/user-dashboard/Dashboard';
import UploadMedia from '../components/user-dashboard/UploadMedia';
import DetectionResult from '../components/user-dashboard/DetectionResult';
import DetectionHistory from '../components/user-dashboard/DetectionHistory';
import Settings from '../components/user-dashboard/Settings';

const VIEW_MAP = {
  dashboard: Dashboard,
  upload: UploadMedia,
  result: DetectionResult,
  history: DetectionHistory,
  settings: Settings,
};

export default function UserDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const ActiveComponent = VIEW_MAP[activeView] || Dashboard;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Top Navbar */}
      <Navbar toggleSidebar={toggleSidebar} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />

        {/* Main content area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg-surface)',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <ActiveComponent setActiveView={setActiveView} />
          </div>
        </main>
      </div>
    </div>
  );
}
