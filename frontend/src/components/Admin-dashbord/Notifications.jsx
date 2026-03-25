import React, { useState } from 'react';
import './Notifications.css';

const Notifications = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance will occur on March 20th from 2:00 AM to 4:00 AM UTC.',
      time: '2 hours ago',
      type: 'system',
      read: false
    },
    {
      id: 2,
      title: 'New Login Detected',
      message: 'A new login was detected from Chrome on Windows.',
      time: '4 hours ago',
      type: 'security',
      read: false
    },
    {
      id: 3,
      title: 'Model Training Completed',
      message: 'Your fraud detection model has completed training with 94.2% accuracy.',
      time: '6 hours ago',
      type: 'model',
      read: true
    },
    {
      id: 4,
      title: 'New User Registration',
      message: 'John Smith has registered and is pending approval.',
      time: '8 hours ago',
      type: 'user',
      read: true
    },
    {
      id: 5,
      title: 'Dataset Upload Failed',
      message: 'The dataset upload failed due to format validation errors.',
      time: '1 day ago',
      type: 'dataset',
      read: true
    }
  ]);

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.read;
    return notification.type === activeFilter;
  });

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications">
      <div className="notifications-header">
        <div className="header-content">
          <h1>NOTIFICATIONS</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={markAllAsRead}>
            Mark All Read
          </button>
        )}
      </div>

      <div className="notifications-container">
        <div className="notifications-filters">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            Unread
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'system' ? 'active' : ''}`}
            onClick={() => setActiveFilter('system')}
          >
            System
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'security' ? 'active' : ''}`}
            onClick={() => setActiveFilter('security')}
          >
            Security
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <p>No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="notification-content">
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-type">
                    <span className={`type-badge ${notification.type}`}>
                      {notification.type}
                    </span>
                  </div>
                </div>
                {!notification.read && <div className="unread-indicator"></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;