import React, { useState } from 'react';
import './UserManagement.css';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Alice Admin',
      email: 'alice@deepguard.ai',
      role: 'Admin',
      status: 'active',
      lastActive: '2026-03-15T10:30:00Z',
      joinedDate: '2025-01-15T08:00:00Z',
      avatar: null,
      detections: 1250,
      subscription: 'Enterprise'
    },
    {
      id: 2,
      name: 'Bob User',
      email: 'bob@example.com',
      role: 'User',
      status: 'active',
      lastActive: '2026-03-14T18:45:00Z',
      joinedDate: '2025-02-20T10:15:00Z',
      avatar: null,
      detections: 450,
      subscription: 'Pro'
    },
    {
      id: 3,
      name: 'Charlie Attacker',
      email: 'charlie@suspicious.net',
      role: 'User',
      status: 'disabled',
      lastActive: '2026-03-10T09:15:00Z',
      joinedDate: '2025-03-01T14:30:00Z',
      avatar: null,
      detections: 89,
      subscription: 'Basic'
    },
    {
      id: 4,
      name: 'Diana Analyst',
      email: 'diana@agency.gov',
      role: 'User',
      status: 'active',
      lastActive: '2026-03-13T08:00:00Z',
      joinedDate: '2025-01-10T09:00:00Z',
      avatar: null,
      detections: 2340,
      subscription: 'Enterprise'
    },
    {
      id: 5,
      name: 'Evan Tester',
      email: 'evan@test.com',
      role: 'User',
      status: 'active',
      lastActive: '2026-03-12T14:20:00Z',
      joinedDate: '2025-02-15T11:45:00Z',
      avatar: null,
      detections: 678,
      subscription: 'Pro'
    },
    {
      id: 6,
      name: 'Fiona Developer',
      email: 'fiona@dev.io',
      role: 'Admin',
      status: 'active',
      lastActive: '2026-03-15T16:00:00Z',
      joinedDate: '2024-12-01T08:00:00Z',
      avatar: null,
      detections: 3450,
      subscription: 'Enterprise'
    }
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'User',
    status: 'active',
    subscription: 'Basic'
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const adminUsers = users.filter(user => user.role === 'Admin').length;
  const newUsersThisMonth = users.filter(user => {
    const joinDate = new Date(user.joinedDate);
    const now = new Date();
    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
  }).length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      const user = {
        id: Date.now(),
        ...newUser,
        lastActive: new Date().toISOString(),
        joinedDate: new Date().toISOString(),
        avatar: null,
        detections: 0
      };
      setUsers([...users, user]);
      setNewUser({ name: '', email: '', role: 'User', status: 'active', subscription: 'Basic' });
      setShowAddModal(false);
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(users.filter(user => user.id !== userId));
      setSelectedUser(null);
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'disabled' : 'active' }
        : user
    ));
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status}`}>
        <span className="status-dot"></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    return (
      <span className={`role-badge ${role.toLowerCase()}`}>
        {role}
      </span>
    );
  };

  const getSubscriptionBadge = (subscription) => {
    return (
      <span className={`subscription-badge ${subscription.toLowerCase()}`}>
        {subscription}
      </span>
    );
  };

  return (
    <div className="user-management">
      {/* Professional Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>USER MANAGEMENT</h1>
          <p>Manage user accounts, roles, and permissions across your platform</p>
        </div>
        <div className="header-actions">
          <button className="export-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Users
          </button>
          <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="22" y1="11" x2="16" y2="11" />
              <line x1="19" y1="8" x2="19" y2="14" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-change positive">+{newUsersThisMonth} this month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{activeUsers}</div>
            <div className="stat-label">Active Users</div>
            <div className="stat-change positive">+8% from last week</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{adminUsers}</div>
            <div className="stat-label">Admin Users</div>
            <div className="stat-change neutral">No change</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{users.reduce((sum, u) => sum + u.detections, 0).toLocaleString()}</div>
            <div className="stat-label">Total Detections</div>
            <div className="stat-change positive">+15% this month</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className="filters-wrapper">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>

          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <span className="results-count">
          Showing {filteredUsers.length} of {totalUsers} users
        </span>
        {(searchTerm || filterRole !== 'all' || filterStatus !== 'all') && (
          <button 
            className="clear-all-filters"
            onClick={() => {
              setSearchTerm('');
              setFilterRole('all');
              setFilterStatus('all');
            }}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Users Display */}
      {viewMode === 'grid' ? (
        <div className="users-grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="um-user-avatar">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="user-status-indicator">
                  {getStatusBadge(user.status)}
                </div>
              </div>
              
              <div className="user-card-body">
                <h3 className="user-name">{user.name}</h3>
                <p className="user-email">{user.email}</p>
                
                <div className="user-badges">
                  {getRoleBadge(user.role)}
                  {getSubscriptionBadge(user.subscription)}
                </div>

                <div className="user-stats">
                  <div className="user-stat-item">
                    <span className="stat-value">{user.detections}</span>
                    <span className="stat-label">Detections</span>
                  </div>
                  <div className="user-stat-item">
                    <span className="stat-value">{formatDate(user.lastActive)}</span>
                    <span className="stat-label">Last Active</span>
                  </div>
                </div>
              </div>

              <div className="user-card-footer">
                <button 
                  className="card-action-btn view"
                  onClick={() => setSelectedUser(user)}
                  title="View details"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button 
                  className="card-action-btn edit"
                  title="Edit user"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button 
                  className={`card-action-btn ${user.status === 'active' ? 'disable' : 'enable'}`}
                  onClick={() => toggleUserStatus(user.id)}
                  title={user.status === 'active' ? 'Disable user' : 'Enable user'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                  </svg>
                </button>
                <button 
                  className="card-action-btn delete"
                  onClick={() => handleDeleteUser(user.id)}
                  title="Delete user"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Subscription</th>
                <th>Detections</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="table-user-info">
                      <div className="table-user-avatar">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="table-user-details">
                        <div className="table-user-name">{user.name}</div>
                        <div className="table-user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>{getSubscriptionBadge(user.subscription)}</td>
                  <td className="table-detections">{user.detections.toLocaleString()}</td>
                  <td className="table-last-active">{formatDate(user.lastActive)}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="table-action-btn view"
                        onClick={() => setSelectedUser(user)}
                        title="View details"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button 
                        className={`table-action-btn ${user.status === 'active' ? 'disable' : 'enable'}`}
                        onClick={() => toggleUserStatus(user.id)}
                        title={user.status === 'active' ? 'Disable' : 'Enable'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 1v6m0 6v6"/>
                        </svg>
                      </button>
                      <button 
                        className="table-action-btn delete"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <h3>No users found</h3>
          <p>Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      )}


      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Subscription Plan</label>
                <select
                  value={newUser.subscription}
                  onChange={(e) => setNewUser({ ...newUser, subscription: e.target.value })}
                >
                  <option value="Basic">Basic</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddUser}>
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="user-details-header">
                <div className="user-details-avatar">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="user-details-info">
                  <h2>{selectedUser.name}</h2>
                  <p>{selectedUser.email}</p>
                  <div className="user-details-badges">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                    {getSubscriptionBadge(selectedUser.subscription)}
                  </div>
                </div>
              </div>

              <div className="user-details-grid">
                <div className="detail-item">
                  <span className="detail-label">User ID</span>
                  <span className="detail-value">#{selectedUser.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Joined Date</span>
                  <span className="detail-value">{new Date(selectedUser.joinedDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Active</span>
                  <span className="detail-value">{formatDate(selectedUser.lastActive)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Detections</span>
                  <span className="detail-value">{selectedUser.detections.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Subscription</span>
                  <span className="detail-value">{selectedUser.subscription}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Account Status</span>
                  <span className="detail-value">{selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}</span>
                </div>
              </div>

              <div className="user-activity-section">
                <h4>Recent Activity</h4>
                <div className="activity-timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-title">Processed detection request</div>
                      <div className="timeline-time">2 hours ago</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-title">Logged in from Chrome</div>
                      <div className="timeline-time">5 hours ago</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-title">Updated profile settings</div>
                      <div className="timeline-time">1 day ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setSelectedUser(null)}>
                Close
              </button>
              <button className="save-btn">
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;