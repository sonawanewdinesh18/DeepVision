import React from 'react';
import { LayoutDashboard, Upload, FileCheck, History, Settings } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, activeView, setActiveView }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Upload, label: 'Upload Media', id: 'upload' },
    { icon: FileCheck, label: 'Detection Results', id: 'result' },
    { icon: History, label: 'Detection History', id: 'history' },
    { icon: Settings, label: 'Settings', id: 'settings' },
  ];

  return (
    <aside className={`user-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-header">
              <span className="status-label">Engine Status</span>
              <span className="status-indicator"></span>
            </div>
            <div className="status-details">
              <div className="status-item">
                <span className="status-text">DeepFake v3.2 Online</span>
              </div>
              <span className="status-metric">Latency: 12ms</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
