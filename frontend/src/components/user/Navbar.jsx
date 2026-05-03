import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, LogOut, Menu } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/LOGO.png';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const { isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    // Use window.location to force a full page reload and avoid route guard issues
    window.location.href = '/';
  };

  return (
    <header className="user-navbar">
      {/* SVG gradient definition for icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>

      <div className="navbar-left">
        <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
        <div className="logo-container" onClick={() => navigate('/')}>
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
      </div>

      {/* Center — Home button */}
      <div className="navbar-center">
        <div className="nav-pill-track">
          <button
            className="nav-pill-btn nav-pill-active"
            onClick={() => { setActiveTab('home'); navigate('/'); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </button>
        </div>
      </div>

      <div className="navbar-right">
        <div className="profile-container" ref={dropdownRef}>
          <button
            className="user-avatar"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="User profile"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <p className="user-label">Logged in as</p>
                <p className="user-name">{displayName}</p>
                <p className="user-email">{displayEmail}</p>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
          {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
