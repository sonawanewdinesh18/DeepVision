import React, { useState, useEffect } from 'react';
import { Save, User, Bell, Shield, Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/services/api';
import toast from '@/utils/toast';
import { InlineLoader } from '@/components/common/LoadingSpinner';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    notifications: true,
    weeklyReport: false,
    twoFactorAuth: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [profileRes, settingsRes] = await Promise.allSettled([
        userApi.getProfile(),
        userApi.getSettings()
      ]);

      const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : {};
      const settings = settingsRes.status === 'fulfilled' ? settingsRes.value.data : {};

      setFormData(prev => ({
        name: profile.full_name || user?.user_metadata?.full_name || prev.name || '',
        email: profile.email || user?.email || prev.email || '',
        notifications: settings.email_notifications ?? prev.notifications ?? true,
        weeklyReport: settings.weekly_report ?? prev.weeklyReport ?? false,
        twoFactorAuth: settings.two_factor_enabled ?? prev.twoFactorAuth ?? false
      }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      // Update profile
      await userApi.updateProfile({
        full_name: formData.name
      });

      // Update settings
      await userApi.updateSettings({
        email_notifications: formData.notifications,
        weekly_report: formData.weeklyReport,
        two_factor_enabled: formData.twoFactorAuth
      });

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <InlineLoader size="lg" message="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="settings-view space-y-24">
      <div className="page-title">
        <h1>Account Settings</h1>
        <p>Manage your personal profile and preferences</p>
      </div>

      <div className="grid-layout-2-1">
        
        {/* Main Settings Form */}
        <div className="card">
          <h2 className="card-title border-b border-color pb-4 mb-6">Profile Information</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="form-group">
              <label className="form-label text-sm text-secondary font-medium">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input w-full pl-10"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-sm text-secondary font-medium">Email Address</label>
              <div className="relative">
                <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  title="Email cannot be changed directly"
                  className="form-input w-full pl-10 opacity-70 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-color mt-8">
              <h2 className="card-title mb-6">Preferences</h2>
              
              <div className="toggle-group flex-between mb-4">
                <div>
                  <h4 className="font-semibold text-primary">Email Notifications</h4>
                  <p className="text-sm text-secondary">Receive alerts for completed deepfake detections</p>
                </div>
                <label className="switch">
                  <input type="checkbox" name="notifications" checked={formData.notifications} onChange={handleChange} />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="toggle-group flex-between mb-4">
                <div>
                  <h4 className="font-semibold text-primary">Weekly Report</h4>
                  <p className="text-sm text-secondary">Get a weekly summary of your detection activity</p>
                </div>
                <label className="switch">
                  <input type="checkbox" name="weeklyReport" checked={formData.weeklyReport} onChange={handleChange} />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="toggle-group flex-between">
                <div>
                  <h4 className="font-semibold text-primary">Two-Factor Auth (2FA)</h4>
                  <p className="text-sm text-secondary">Extra layer of security for your account</p>
                </div>
                <label className="switch">
                  <input type="checkbox" name="twoFactorAuth" checked={formData.twoFactorAuth} onChange={handleChange} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="submit" 
                className="btn btn-primary flex-center gap-2 px-8"
                disabled={saving}
              >
                <Save size={18} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
            
          </form>
        </div>

        {/* Side Panel Guides */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="card-title flex items-center gap-2 mb-4">
              <Key size={18} className="text-primary" />
              <span>Password & Authentication</span>
            </h2>
            <p className="text-sm text-secondary mb-4">If you registered via email, you can change your password. OAuth users do not require passwords.</p>
            <button className="btn btn-secondary w-full">Change Password</button>
          </div>

          <div className="card border border-error bg-error-ghost">
            <h2 className="card-title text-error mb-2">Danger Zone</h2>
            <p className="text-sm text-secondary line-height-1.5 mb-4">Permanently delete your account and all associated detection history data. This action cannot be undone.</p>
            <button className="btn btn-outline text-error border-error hover-bg-error hover-text-white w-full">
              Delete Account
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Settings;
