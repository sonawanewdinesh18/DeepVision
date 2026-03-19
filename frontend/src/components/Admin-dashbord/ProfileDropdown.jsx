import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ProfileDropdown.css';

const ProfileDropdown = ({ onClose, setActiveView }) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || 'Admin';
  const displayEmail = user?.email || 'admin@deepvision.com';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNavigation = (view) => {
    setActiveView(view);
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    navigate('/signin', { replace: true });
  };

  const menuItems = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      label: 'Profile Settings',
      action: () => handleNavigation('profile-settings'),
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      label: 'Notifications',
      action: () => handleNavigation('notifications'),
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16,17 21,12 16,7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      ),
      label: 'Log Out',
      action: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <div className="dropdown-header">
        <div className="user-info">
          <div className="user-avatar-large">
            {initials}
          </div>
          <div className="user-details">
            <div className="user-name">{displayName}</div>
            <div className="user-email">{displayEmail}</div>
            <span className="admin-badge">Admin</span>
          </div>
        </div>
      </div>

      <div className="dropdown-divider" />

      <div className="dropdown-menu">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`dropdown-item ${item.danger ? 'danger' : ''}`}
            onClick={item.action}
          >
            <span className="item-icon">{item.icon}</span>
            <span className="item-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileDropdown;