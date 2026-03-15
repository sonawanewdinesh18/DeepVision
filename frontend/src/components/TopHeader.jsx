import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import ProfileDropdown from './ProfileDropdown';
import './TopHeader.css';

const TopHeader = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="logo-container">
          <img src="/src/assets/logo.png" alt="Logo" className="logo-image" />
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
      </div>
      
      <div className="header-center">
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search users, logs, or detections..." />
        </div>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        <div className="profile-container">
          <div 
            className="user-avatar" 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          {showProfileDropdown && (
            <ProfileDropdown onClose={() => setShowProfileDropdown(false)} />
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;