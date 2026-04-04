import { useState } from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import logo from '@/assets/LOGO.png';
import './TopHeader.css';

const TopHeader = ({ toggleSidebar, setActiveView }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { isDark, toggle } = useTheme();
  const { user } = useAuth();

  const displayName = user?.user_metadata?.full_name || 'Admin';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        
        <div className="logo-container-header">
          <img src={logo} alt="DeepVision Logo" className="logo-image-header" />
          <div className="logo-text-header">
            <span style={{
              background: 'linear-gradient(160deg, #63B3ED 0%, #2B6CB0 55%, #3B48CC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Deep</span>
            <span style={{
              background: 'linear-gradient(90deg, #63B3ED 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Vision</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-badge">Admin</div>

        <div className="profile-container">
          <div
            className="user-avatar-initials"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            aria-label="Profile menu"
          >
            {initials}
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