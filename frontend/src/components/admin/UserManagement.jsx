import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { InlineLoader } from '../common/LoadingSpinner';
import toast from '@/utils/toast';
import './UserManagement.css';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [pinnedUsers, setPinnedUsers] = useState(() => {
    // Load pinned users from localStorage
    const saved = localStorage.getItem('pinnedUsers');
    return saved ? JSON.parse(saved) : [];
  });
  const [newUserData, setNewUserData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'user'
  });
  
  // Bulk Actions State
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Sorting State
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  
  // Audit Log State
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Fetch users from backend
  useEffect(() => {
    console.log('UserManagement mounted, fetching users...');
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getUsers({ page, limit: 20 });
      console.log('API Response:', response); // Debug log
      
      // Handle axios response structure
      const data = response.data || response;
      setUsers(data.users || []);
      setTotalPages(data.pages || 1);
      
      console.log('Users loaded:', data.users?.length || 0); // Debug log
    } catch (err) {
      console.error('Error fetching users:', err); // Debug log
      setError(err.message || 'Failed to fetch users');
      toast.error('Failed to load users: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'disabled' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort users: pinned users first, then by sort field
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aIsPinned = pinnedUsers.includes(a.id);
    const bIsPinned = pinnedUsers.includes(b.id);
    
    // Pinned users always first
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    
    // Then sort by selected field
    if (sortField) {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle different field types
      if (sortField === 'full_name' || sortField === 'email') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      } else if (sortField === 'created_at' || sortField === 'last_active') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else if (sortField === 'detection_count') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    }
    
    return 0;
  });

  const handleTogglePin = (userId) => {
    setPinnedUsers(prev => {
      const newPinned = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      // Save to localStorage
      localStorage.setItem('pinnedUsers', JSON.stringify(newPinned));
      
      // Show toast
      const isPinning = !prev.includes(userId);
      toast.success(isPinning ? 'User pinned to top' : 'User unpinned');
      
      return newPinned;
    });
  };

  const isPinned = (userId) => pinnedUsers.includes(userId);

  // ========== BULK ACTIONS ==========
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(sortedUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const isSelected = (userId) => selectedUsers.includes(userId);

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    const count = selectedUsers.length;
    const confirmMessage = {
      activate: `Activate ${count} user(s)?`,
      deactivate: `Deactivate ${count} user(s)?`,
      delete: `Delete ${count} user(s)? This cannot be undone!`,
      makeAdmin: `Make ${count} user(s) admin?`,
      makeUser: `Make ${count} user(s) regular user?`,
    }[action];

    if (!window.confirm(confirmMessage)) return;

    try {
      const promises = selectedUsers.map(userId => {
        switch (action) {
          case 'activate':
          case 'deactivate':
            return adminApi.updateUser(userId, { is_active: action === 'activate' });
          case 'delete':
            return adminApi.deleteUser(userId);
          case 'makeAdmin':
            return adminApi.updateUser(userId, { role: 'admin' });
          case 'makeUser':
            return adminApi.updateUser(userId, { role: 'user' });
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      
      // Log audit
      logAudit(`Bulk ${action}`, `${count} users affected`);
      
      toast.success(`Successfully ${action}d ${count} user(s)`);
      setSelectedUsers([]);
      setShowBulkActions(false);
      fetchUsers();
    } catch (err) {
      toast.error(`Failed to ${action} users`);
    }
  };

  // ========== SORTING ==========
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    ) : (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
    );
  };

  // ========== AUDIT LOG ==========
  const logAudit = (action, details) => {
    const log = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      admin: 'Current Admin', // Replace with actual admin name
      action,
      details
    };
    
    setAuditLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 logs
    
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    localStorage.setItem('auditLogs', JSON.stringify([log, ...saved].slice(0, 100)));
  };

  // Load audit logs on mount
  useEffect(() => {
    const saved = localStorage.getItem('auditLogs');
    if (saved) {
      setAuditLogs(JSON.parse(saved));
    }
  }, []);

  // Close bulk actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showBulkActions && !e.target.closest('.um-bulk-dropdown')) {
        setShowBulkActions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showBulkActions]);

  // Calculate statistics from ALL users (not just filtered)
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(user => user.role === 'admin').length;
  const totalDetections = users.reduce((sum, u) => sum + (u.detection_count || 0), 0);

  // Calculate changes (based on recent activity)
  const recentUsers = users.filter(u => {
    const createdDate = new Date(u.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  }).length;

  const statsChange = {
    users: recentUsers > 0 ? `+${recentUsers} this month` : 'No change',
    active: activeUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}% active` : 'No active users',
    admins: adminUsers > 1 ? `${adminUsers} admins` : 'No change',
    detections: totalDetections > 0 ? `${totalDetections.toLocaleString()} total` : 'No detections'
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const diffTime = Math.abs(now - date);
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Just now (less than 1 minute)
      if (diffMinutes < 1) return 'Just now';
      
      // Minutes ago (less than 1 hour)
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      
      // Hours ago (less than 24 hours)
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      
      // Days ago (less than 7 days)
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      // Weeks ago (less than 30 days)
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      }
      
      // Months ago (less than 365 days)
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      }
      
      // Years ago
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const formatFullDateTime = (dateString) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Format: "March 30, 2026 at 2:45 PM"
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      return date.toLocaleString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminApi.toggleUserStatus(userId);
      const user = users.find(u => u.id === userId);
      logAudit(
        currentStatus ? 'Deactivated User' : 'Activated User',
        `${user?.email || 'Unknown user'}`
      );
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const user = users.find(u => u.id === userId);
        await adminApi.deleteUser(userId);
        logAudit('Deleted User', `${user?.email || 'Unknown user'}`);
        toast.success('User deleted successfully');
        fetchUsers();
        setSelectedUser(null);
      } catch (err) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await adminApi.updateUser(userId, updates);
      const user = users.find(u => u.id === userId);
      logAudit('Updated User', `${user?.email || 'Unknown user'} - ${JSON.stringify(updates)}`);
      toast.success('User updated successfully');
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        await adminApi.updateUser(userId, { role: newRole });
        const user = users.find(u => u.id === userId);
        logAudit('Changed Role', `${user?.email || 'Unknown user'} → ${newRole}`);
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      } catch (err) {
        toast.error('Failed to update user role');
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUserData.email || !newUserData.password) {
      toast.error('Email and password are required');
      return;
    }

    if (newUserData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      // Call backend API to create user
      await adminApi.createUser({
        email: newUserData.email.toLowerCase().trim(),
        password: newUserData.password,
        full_name: newUserData.full_name || 'New User',
        role: newUserData.role
      });

      toast.success('User created successfully!');
      setShowAddModal(false);
      setNewUserData({
        email: '',
        full_name: '',
        password: '',
        role: 'user'
      });
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error('Failed to create user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleExportUsers = () => {
    try {
      // Convert users to CSV
      const headers = ['Email', 'Full Name', 'Role', 'Status', 'Detections', 'Created At'];
      const csvData = filteredUsers.map(user => [
        user.email,
        user.full_name || 'N/A',
        user.role,
        user.is_active ? 'Active' : 'Disabled',
        user.detection_count || 0,
        new Date(user.created_at).toLocaleDateString()
      ]);

      const csv = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Users exported successfully');
    } catch (err) {
      toast.error('Failed to export users');
    }
  };

  const getInitials = (name, email) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return (email || 'U').substring(0, 2).toUpperCase();
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-management">
        <div className="um-header">
          <div className="um-header-content">
            <h1 className="um-title">USER MANAGEMENT</h1>
            <p className="um-subtitle">Manage user accounts, roles, and permissions across your platform</p>
          </div>
        </div>
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <InlineLoader message="Loading users..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management">
        <div className="um-header">
          <div className="um-header-content">
            <h1 className="um-title">USER MANAGEMENT</h1>
            <p className="um-subtitle">Manage user accounts, roles, and permissions across your platform</p>
          </div>
        </div>
        <div className="um-error-state">
          <div className="um-error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3>Failed to Load Users</h3>
          <p>{error}</p>
          <button className="um-btn um-btn-primary" onClick={fetchUsers}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div className="um-header">
        <div className="um-header-content">
          <h1 className="um-title">USER MANAGEMENT</h1>
          <p className="um-subtitle">Manage user accounts, roles, and permissions across your platform</p>
        </div>
        <div className="um-header-actions">
          <button className="um-btn um-btn-secondary" onClick={() => setShowAuditLog(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Audit Log
          </button>
          <button className="um-btn um-btn-secondary" onClick={handleExportUsers}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Users
          </button>
          <button className="um-btn um-btn-primary" onClick={() => setShowAddModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="um-stats-grid">
        <div className="um-stat-card">
          <div className="um-stat-icon" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.1))', color: '#8B5CF6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="um-stat-content">
            <div className="um-stat-value">{totalUsers}</div>
            <div className="um-stat-label">TOTAL USERS</div>
            <div className="um-stat-change positive">{statsChange.users}</div>
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-icon" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))', color: '#10b981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
          </div>
          <div className="um-stat-content">
            <div className="um-stat-value">{activeUsers}</div>
            <div className="um-stat-label">ACTIVE USERS</div>
            <div className="um-stat-change positive">{statsChange.active}</div>
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-icon" style={{ background: 'linear-gradient(135deg, rgba(99, 179, 237, 0.1), rgba(59, 130, 246, 0.1))', color: '#63B3ED' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="um-stat-content">
            <div className="um-stat-value">{adminUsers}</div>
            <div className="um-stat-label">ADMIN USERS</div>
            <div className="um-stat-change neutral">{statsChange.admins}</div>
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-icon" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))', color: '#F59E0B' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          </div>
          <div className="um-stat-content">
            <div className="um-stat-value">{totalDetections.toLocaleString()}</div>
            <div className="um-stat-label">TOTAL DETECTIONS</div>
            <div className="um-stat-change positive">{statsChange.detections}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="um-controls">
        <div className="um-search-wrapper">
          <svg className="um-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="um-search-input"
          />
        </div>

        <div className="um-filters">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="um-filter-select">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="um-filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>

          <button className={`um-view-toggle ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>

          <button className={`um-view-toggle ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="um-results-info">
        Showing {sortedUsers.length} of {totalUsers} users
        {pinnedUsers.length > 0 && (
          <span className="um-pinned-count"> • {pinnedUsers.length} pinned</span>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="um-bulk-actions-bar">
          <div className="um-bulk-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="um-bulk-count">{selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected</span>
          </div>
          
          <div className="um-bulk-actions">
            <div className="um-bulk-dropdown">
              <button 
                className="um-bulk-btn"
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                Actions
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              
              {showBulkActions && (
                <div className="um-bulk-menu">
                  <button onClick={() => { handleBulkAction('activate'); setShowBulkActions(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Activate Selected
                  </button>
                  <button onClick={() => { handleBulkAction('deactivate'); setShowBulkActions(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    Deactivate Selected
                  </button>
                  <div className="um-bulk-divider"></div>
                  <button onClick={() => { handleBulkAction('makeAdmin'); setShowBulkActions(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Make Admin
                  </button>
                  <button onClick={() => { handleBulkAction('makeUser'); setShowBulkActions(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Make User
                  </button>
                  <div className="um-bulk-divider"></div>
                  <button className="um-bulk-danger" onClick={() => { handleBulkAction('delete'); setShowBulkActions(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
            
            <button className="um-bulk-clear" onClick={() => setSelectedUsers([])}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* List View - Table */}
      {viewMode === 'list' && (
        <div className="um-table-wrapper">
          <table className="um-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                    onChange={handleSelectAll}
                    title="Select all users"
                  />
                </th>
                <th onClick={() => handleSort('full_name')} className="um-sortable">
                  USER {getSortIcon('full_name')}
                </th>
                <th onClick={() => handleSort('role')} className="um-sortable">
                  ROLE {getSortIcon('role')}
                </th>
                <th onClick={() => handleSort('is_active')} className="um-sortable">
                  STATUS {getSortIcon('is_active')}
                </th>
                <th onClick={() => handleSort('detection_count')} className="um-sortable">
                  DETECTIONS {getSortIcon('detection_count')}
                </th>
                <th onClick={() => handleSort('last_active')} className="um-sortable">
                  LAST ACTIVE {getSortIcon('last_active')}
                </th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id} className={isPinned(user.id) ? 'um-pinned-row' : ''}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={isSelected(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td>
                    <div className="um-user-cell">
                      <div className="um-user-avatar" style={{
                        background: user.role === 'admin' 
                          ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' 
                          : 'linear-gradient(135deg, #63B3ED, #3B82F6)'
                      }}>
                        {getInitials(user.full_name, user.email)}
                      </div>
                      <div className="um-user-info">
                        <div className="um-user-name">
                          {isPinned(user.id) && (
                            <svg className="um-pin-indicator" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
                            </svg>
                          )}
                          {user.full_name || 'No Name'}
                        </div>
                        <div className="um-user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="um-inline-select"
                      style={{
                        background: user.role === 'admin' 
                          ? 'rgba(139, 92, 246, 0.12)' 
                          : 'rgba(99, 179, 237, 0.12)',
                        color: user.role === 'admin' ? '#8B5CF6' : '#63B3ED',
                        border: user.role === 'admin' 
                          ? '1px solid rgba(139, 92, 246, 0.2)' 
                          : '1px solid rgba(99, 179, 237, 0.2)'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`um-status ${user.is_active ? 'active' : 'disabled'}`}>
                      <span className="um-status-dot"></span>
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="um-detections">{(user.detection_count || 0).toLocaleString()}</td>
                  <td className="um-last-active" title={formatFullDateTime(user.last_active)}>
                    {formatDate(user.last_active)}
                  </td>
                  <td>
                    <div className="um-actions">
                      <button
                        className={`um-action-btn um-action-pin ${isPinned(user.id) ? 'pinned' : ''}`}
                        onClick={() => handleTogglePin(user.id)}
                        title={isPinned(user.id) ? 'Unpin user' : 'Pin user to top'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={isPinned(user.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M16 12V4H17V2H7V2H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
                        </svg>
                      </button>
                      <button
                        className="um-action-btn um-action-view"
                        onClick={() => setSelectedUser(user)}
                        title="View details"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        className="um-action-btn um-action-toggle"
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
                          <circle cx={user.is_active ? "16" : "8"} cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        className="um-action-btn um-action-delete"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete user"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View - Cards */}
      {viewMode === 'grid' && (
        <div className="um-grid-view">
          {sortedUsers.map((user) => (
            <div key={user.id} className={`um-user-card ${isPinned(user.id) ? 'um-pinned-card' : ''}`}>
              {isPinned(user.id) && (
                <div className="um-pin-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
                  </svg>
                  Pinned
                </div>
              )}
              <div className="um-card-header">
                <div className="um-card-avatar" style={{
                  background: user.role === 'admin' 
                    ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' 
                    : 'linear-gradient(135deg, #63B3ED, #3B82F6)'
                }}>
                  {getInitials(user.full_name, user.email)}
                </div>
                <div className="um-card-actions">
                  <button
                    className={`um-card-action-btn ${isPinned(user.id) ? 'um-card-pinned' : ''}`}
                    onClick={() => handleTogglePin(user.id)}
                    title={isPinned(user.id) ? 'Unpin' : 'Pin to top'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isPinned(user.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
                    </svg>
                  </button>
                  <button
                    className="um-card-action-btn"
                    onClick={() => setSelectedUser(user)}
                    title="View details"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    className="um-card-action-btn"
                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                    title={user.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
                      <circle cx={user.is_active ? "16" : "8"} cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    className="um-card-action-btn um-card-delete"
                    onClick={() => handleDeleteUser(user.id)}
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="um-card-body">
                <h3 className="um-card-name">{user.full_name || 'No Name'}</h3>
                <p className="um-card-email">{user.email}</p>
                
                <div className="um-card-badges">
                  <span className={`um-badge um-badge-${user.role}`}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                  <span className={`um-status ${user.is_active ? 'active' : 'disabled'}`}>
                    <span className="um-status-dot"></span>
                    {user.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="um-card-info">
                  <div className="um-card-info-item">
                    <span className="um-card-label">Detections</span>
                    <span className="um-card-value">{(user.detection_count || 0).toLocaleString()}</span>
                  </div>
                  <div className="um-card-info-item">
                    <span className="um-card-label">Last Active</span>
                    <span className="um-card-value" title={formatFullDateTime(user.last_active)}>
                      {formatDate(user.last_active)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="um-empty-state">
          <div className="um-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h3>No users found</h3>
          <p>Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="um-pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="um-pagination-btn"
          >
            Previous
          </button>
          <span className="um-pagination-info">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="um-pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="um-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>User Details</h3>
              <button className="um-modal-close" onClick={() => setSelectedUser(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="um-modal-body">
              <div className="um-modal-user-header">
                <div className="um-modal-avatar" style={{
                  background: selectedUser.role === 'admin' 
                    ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' 
                    : 'linear-gradient(135deg, #63B3ED, #3B82F6)'
                }}>
                  {getInitials(selectedUser.full_name, selectedUser.email)}
                </div>
                <div className="um-modal-user-info">
                  <h2>{selectedUser.full_name || 'No Name'}</h2>
                  <p>{selectedUser.email}</p>
                  <div className="um-modal-badges">
                    <span className={`um-badge um-badge-${selectedUser.role}`}>
                      {selectedUser.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    <span className={`um-status ${selectedUser.is_active ? 'active' : 'disabled'}`}>
                      <span className="um-status-dot"></span>
                      {selectedUser.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="um-modal-details">
                <div className="um-detail-item">
                  <span className="um-detail-label">User ID</span>
                  <span className="um-detail-value">{selectedUser.id.substring(0, 8)}...</span>
                </div>
                <div className="um-detail-item">
                  <span className="um-detail-label">Joined Date</span>
                  <span className="um-detail-value">{formatFullDateTime(selectedUser.created_at)}</span>
                </div>
                <div className="um-detail-item">
                  <span className="um-detail-label">Last Active</span>
                  <span className="um-detail-value">{formatFullDateTime(selectedUser.last_active)}</span>
                </div>
                <div className="um-detail-item">
                  <span className="um-detail-label">Total Detections</span>
                  <span className="um-detail-value">{(selectedUser.detection_count || 0).toLocaleString()}</span>
                </div>
                <div className="um-detail-item">
                  <span className="um-detail-label">Role</span>
                  <span className="um-detail-value">{selectedUser.role}</span>
                </div>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn um-btn-secondary" onClick={() => setSelectedUser(null)}>
                Close
              </button>
              <button 
                className="um-btn um-btn-warning" 
                onClick={() => {
                  handleToggleStatus(selectedUser.id, selectedUser.is_active);
                  setSelectedUser(null);
                }}
              >
                {selectedUser.is_active ? 'Deactivate' : 'Activate'} User
              </button>
              <button className="um-btn um-btn-danger" onClick={() => handleDeleteUser(selectedUser.id)}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="um-modal-overlay" onClick={() => setShowAuditLog(false)}>
          <div className="um-modal um-audit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Audit Log</h3>
              <button className="um-modal-close" onClick={() => setShowAuditLog(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="um-modal-body">
              {auditLogs.length === 0 ? (
                <div className="um-empty-state" style={{ padding: '40px 20px' }}>
                  <div className="um-empty-icon" style={{ width: '60px', height: '60px', margin: '0 auto 16px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>No audit logs yet</h3>
                  <p style={{ fontSize: '0.85rem' }}>Admin actions will be recorded here</p>
                </div>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="um-audit-entry">
                    <div className="um-audit-time">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatFullDateTime(log.timestamp)}
                    </div>
                    <div className="um-audit-admin">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Admin: {log.admin}
                    </div>
                    <div className="um-audit-action">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Action: {log.action}
                    </div>
                    <div className="um-audit-details">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      Details: {log.details}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="um-modal-footer">
              <button className="um-btn um-btn-secondary" onClick={() => setShowAuditLog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="um-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Add New User</h3>
              <button className="um-modal-close" onClick={() => setShowAddModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="um-modal-body">
                <div className="um-form-group">
                  <label className="um-form-label">Email Address *</label>
                  <input
                    type="email"
                    className="um-form-input"
                    placeholder="user@example.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="um-form-group">
                  <label className="um-form-label">Full Name</label>
                  <input
                    type="text"
                    className="um-form-input"
                    placeholder="John Doe"
                    value={newUserData.full_name}
                    onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  />
                </div>

                <div className="um-form-group">
                  <label className="um-form-label">Password *</label>
                  <input
                    type="password"
                    className="um-form-input"
                    placeholder="Minimum 8 characters"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>

                <div className="um-form-row">
                  <div className="um-form-group">
                    <label className="um-form-label">Role</label>
                    <select
                      className="um-form-input"
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="um-form-note">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>The user will be created with email confirmation enabled. They can log in immediately with the provided password.</span>
                </div>
              </div>
              <div className="um-modal-footer">
                <button type="button" className="um-btn um-btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="um-btn um-btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
