import React, { useState } from 'react';
import './UserManagement.css';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Alice Admin',
      email: 'alice@deepguard.ai',
      role: 'Admin',
      status: 'active',
      lastActive: '5/15/2025, 10:30:00 AM'
    },
    {
      id: 2,
      name: 'Bob User',
      email: 'bob@example.com',
      role: 'User',
      status: 'active',
      lastActive: '5/14/2025, 6:45:00 PM'
    },
    {
      id: 3,
      name: 'Charlie Attacker',
      email: 'charlie@suspicious.net',
      role: 'User',
      status: 'disabled',
      lastActive: '5/10/2025, 9:15:00 AM'
    },
    {
      id: 4,
      name: 'Diana Analyst',
      email: 'diana@agency.gov',
      role: 'User',
      status: 'active',
      lastActive: '5/13/2025, 8:00:00 AM'
    },
    {
      id: 5,
      name: 'Evan Tester',
      email: 'evan@test.com',
      role: 'User',
      status: 'active',
      lastActive: '5/12/2025, 2:20:00 PM'
    }
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'User',
    status: 'active'
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const adminUsers = users.filter(user => user.role === 'Admin').length;

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      const user = {
        id: Date.now(),
        ...newUser,
        lastActive: new Date().toLocaleString()
      };
      setUsers([...users, user]);
      setNewUser({ name: '', email: '', role: 'User', status: 'active' });
      setShowAddModal(false);
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
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
        {status}
      </span>
    );
  };

  return (
    <div className="user-management">
      <div className="page-title">
        <h1>User Management</h1>
      </div>

      <div className="page-actions">
        <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
          </svg>
          Add User
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-description">All registered users</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-value">{activeUsers}</div>
          <div className="stat-description">Currently active accounts</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Admin Users</span>
          </div>
          <div className="stat-value">{adminUsers}</div>
          <div className="stat-description">Users with admin access</div>
        </div>
      </div>

      <div className="search-section">
        <div className="search-input">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <div className="users-table">
          <div className="table-header">
            <div className="header-cell status-col">Status</div>
            <div className="header-cell user-col">User</div>
            <div className="header-cell role-col">Role</div>
            <div className="header-cell active-col">Last Active</div>
            <div className="header-cell actions-col">Actions</div>
          </div>

          <div className="table-body">
            {filteredUsers.map((user) => (
              <div key={user.id} className="table-row">
                <div className="table-cell status-col">
                  {getStatusBadge(user.status)}
                </div>
                <div className="table-cell user-col">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                </div>
                <div className="table-cell role-col">
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </div>
                <div className="table-cell active-col">
                  {user.lastActive}
                </div>
                <div className="table-cell actions-col">
                  <div className="action-buttons">
                    <button 
                      className="action-btn toggle"
                      onClick={() => toggleUserStatus(user.id)}
                      title={user.status === 'active' ? 'Disable User' : 'Enable User'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6"/>
                      </svg>
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
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
    </div>
  );
};

export default UserManagement;