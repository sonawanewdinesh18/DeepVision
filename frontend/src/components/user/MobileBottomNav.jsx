import React from 'react';
import { LayoutDashboard, Sparkles, CheckCircle2, History, Settings } from 'lucide-react';
import './MobileBottomNav.css';

export default function MobileBottomNav({ activeView, setActiveView }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
    },
    {
      id: 'upload',
      label: 'Scan AI',
      icon: Sparkles,
      isPrimary: true,
    },
    {
      id: 'result',
      label: 'Result',
      icon: CheckCircle2,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                type="button"
                className={`mobile-nav-primary-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
                aria-label={item.label}
              >
                <div className="primary-btn-glow" />
                <div className="primary-btn-inner">
                  <Icon size={22} strokeWidth={2.5} />
                </div>
                <span className="primary-btn-label">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              aria-label={item.label}
            >
              <div className="nav-icon-box">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && <span className="active-dot" />}
              </div>
              <span className="nav-text">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
