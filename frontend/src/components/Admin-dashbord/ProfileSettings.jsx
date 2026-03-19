import React, { useState } from 'react';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState({
    firstName: 'Alice',
    lastName: 'Admin',
    email: 'alice@deepvision.com',
    phone: '+1 (555) 123-4567',
    company: 'DeepVision AI',
    position: 'System Administrator'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    console.log('Saving profile:', formData);
  };

  return (
    <div className="profile-settings">
      <div className="settings-header">
        <h1>Account Settings</h1>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <div className="settings-nav">
            <button 
              className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account Information
            </button>
            <button 
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button 
              className={`nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'account' && (
            <div className="content-section">
              <div className="section-title">
                <h2>Account Information</h2>
                <p>Manage your personal details and contact information</p>
              </div>

              <div className="profile-card">
                <div className="profile-header">
                  <div className="avatar">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="profile-info">
                    <h3>{formData.firstName} {formData.lastName}</h3>
                    <p>{formData.email}</p>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-row">
                    <div className="form-field">
                      <label>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-field">
                      <label>Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-field">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Company</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-field">
                      <label>Position</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="save-button" onClick={handleSave}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="content-section">
              <div className="section-title">
                <h2>Security Settings</h2>
                <p>Manage your password and account security</p>
              </div>

              <div className="security-card">
                <div className="security-item">
                  <div className="security-info">
                    <h3>Password</h3>
                    <p>Last changed 3 months ago</p>
                  </div>
                  <button className="action-button">Change Password</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security</p>
                  </div>
                  <button className="action-button">Enable 2FA</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h3>Active Sessions</h3>
                    <p>Manage your active login sessions</p>
                  </div>
                  <button className="action-button">View Sessions</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="content-section">
              <div className="section-title">
                <h2>Preferences</h2>
                <p>Customize your application experience</p>
              </div>

              <div className="preferences-card">
                <div className="preference-item">
                  <div className="preference-info">
                    <h3>Email Notifications</h3>
                    <p>Receive updates about your account</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="preference-item">
                  <div className="preference-info">
                    <h3>System Alerts</h3>
                    <p>Get notified about system maintenance</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="preference-item">
                  <div className="preference-info">
                    <h3>Marketing Communications</h3>
                    <p>Receive product updates and news</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;