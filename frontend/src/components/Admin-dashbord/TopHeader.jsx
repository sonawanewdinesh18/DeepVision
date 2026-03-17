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
        <div className="logo-container">
          <img src={logo} alt="DeepVision Logo" className="logo-image" />
          <div className="logo-text">
            <span style={{
              background: 'linear-gradient(160deg, #63B3ED 0%, #2B6CB0 55%, #3B48CC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Deep</span>
            <span style={{
              background: 'linear-gradient(160deg, #553ECC 0%, #7B2FF7 55%, #5B21B6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Vision</span>
          </div>
        </div>
        <div className="header-badge">Admin Panel</div>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
          {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
        </button>

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
      </div>
    </header>
  );
};

export default TopHeader;