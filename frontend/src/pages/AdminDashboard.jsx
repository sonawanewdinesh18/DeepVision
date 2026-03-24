import { useState } from 'react';
import Sidebar from '../components/Admin-dashbord/Sidebar';
import TopHeader from '../components/Admin-dashbord/TopHeader';
import Dashboard from '../components/Admin-dashbord/Dashboard';
import UserManagement from '../components/Admin-dashbord/UserManagement';
import ModelManagement from '../components/Admin-dashbord/ModelManagement';
import SubscriptionManagement from '../components/Admin-dashbord/SubscriptionManagement';
import Feedback from '../components/Admin-dashbord/Feedback';
import Notifications from '../components/Admin-dashbord/Notifications';
import ProfileSettings from '../components/Admin-dashbord/ProfileSettings';

const VIEW_MAP = {
  dashboard: Dashboard,
  users: UserManagement,
  models: ModelManagement,
  subscriptions: SubscriptionManagement,
  feedback: Feedback,
  notifications: Notifications,
  'profile-settings': ProfileSettings,
};

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('dashboard');

  const ActiveComponent = VIEW_MAP[activeView] || Dashboard;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Sidebar */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        overflow: 'hidden',
      }}>
        {/* Top Header */}
        <TopHeader setActiveView={setActiveView} />

        {/* Page Content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg-surface)',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
}
