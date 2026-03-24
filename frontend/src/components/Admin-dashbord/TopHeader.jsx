import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ProfileDropdown from './ProfileDropdown';
import logo from '../../assets/LOGO.png';
import './TopHeader.css';

const TopHeader = ({ setActiveView }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { isDark, toggle } = useTheme();

  return (
    <header className="top-header">
      <div className="header-left">
        {/* Logo and Badge moved to Sidebar for correct left positioning */}
      </div>

      <div className="header-right">
        <div className="header-badge">Admin</div>

        <div className="profile-container">
          <div
            className="user-avatar"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            aria-label="Profile menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          {showProfileDropdown && (
            <ProfileDropdown
              onClose={() => setShowProfileDropdown(false)}
              setActiveView={setActiveView}
            />
          )}
        </div>

        <button
          className="theme-toggle"
          onClick={toggle}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default TopHeader;