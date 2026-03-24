import React, { useState } from 'react';
import './SubscriptionManagement.css';

const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('plans');

  console.log('SubscriptionManagement rendered, activeTab:', activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'plans':
        return <PlansManagement />;
      case 'subscriptions':
        return <UserSubscriptions />;
      case 'analytics':
        return <RevenueAnalytics />;
      default:
        return <PlansManagement />;
    }
  };

  return (
    <div className="subscription-management">
      <div className="page-header">
        <div className="header-content">
          <h1>Plans &amp; Billing</h1>
          <p>Manage subscription tiers, pricing, and user billing</p>
        </div>
      </div>

      <div className="subscription-tabs">
        <button
          className={`tab ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" ry="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Plans
        </button>
        <button
          className={`tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          User Subscriptions
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
          </svg>
          Analytics
        </button>
      </div>

      <div className="subscription-content">
        {renderContent()}
      </div>
    </div>
  );
};

// Plans Management Component
const PlansManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [plans, setPlans] = useState([
    {
      id: 1,
      name: 'Free',
      price: 0,
      period: 'forever',
      features: ['10 detections/day', 'Basic support', 'Email alerts'],
      detections: 10,
      active: true
    },
    {
      id: 2,
      name: 'Basic',
      price: 299,
      period: 'month',
      features: ['200 detections/month', 'Priority support', 'Advanced analytics'],
      detections: 200,
      active: true
    },
    {
      id: 3,
      name: 'Pro',
      price: 999,
      period: 'month',
      features: ['Unlimited detections', 'Premium support', 'API access', 'Custom integrations'],
      detections: -1,
      active: true
    },
    {
      id: 4,
      name: 'Enterprise',
      price: 0,
      period: 'custom',
      features: ['Custom pricing', 'Dedicated support', 'On-premise deployment', 'SLA guarantee'],
      detections: -1,
      active: true
    }
  ]);

  const totalPlans = plans.length;
  const activePlans = plans.filter(plan => plan.active).length;
  const totalRevenue = plans.reduce((sum, plan) => sum + (plan.active && plan.price > 0 ? plan.price : 0), 0);

  const handleCreatePlan = (planData) => {
    const newPlan = {
      id: Date.now(),
      ...planData,
      active: true
    };
    setPlans([...plans, newPlan]);
    setShowCreateModal(false);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
  };

  const handleUpdatePlan = (updatedData) => {
    setPlans(plans.map(p => p.id === editingPlan.id ? { ...editingPlan, ...updatedData } : p));
    setEditingPlan(null);
  };

  const handleDeletePlan = (planId) => {
    if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      setPlans(plans.filter(p => p.id !== planId));
    }
  };

  return (
    <div className="plans-management">
      {/* Header with Create Button */}
      <div className="plans-header">
        <h2>Subscription Plans</h2>
        <button 
          className="create-plan-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create New Plan
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" ry="2"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalPlans}</div>
            <div className="stat-label">Total Plans</div>
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
            <div className="stat-value">{activePlans}</div>
            <div className="stat-label">Active Plans</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">₹{totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Monthly Revenue</div>
          </div>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className={`plan-card ${!plan.active ? 'inactive' : ''}`}>
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                {plan.price === 0 && plan.period !== 'custom' ? 'Free' : 
                 plan.period === 'custom' ? 'Custom' :
                 `₹${plan.price}/${plan.period}`}
              </div>
            </div>
            
            <div className="plan-features">
              {plan.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <div className="plan-limits">
              <strong>Usage Limits:</strong>
              <p>
                {plan.detections === -1 ? 'Unlimited' : plan.detections} 
                {plan.detections !== -1 ? ` detections per ${plan.period}` : ' detections'}
              </p>
            </div>

            <div className="plan-actions">
              <button className="plan-edit-btn" onClick={() => handleEditPlan(plan)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
              <button className="plan-delete-btn" onClick={() => handleDeletePlan(plan.id)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/>
                  <path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <CreatePlanModal 
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreatePlan}
        />
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={handleUpdatePlan}
        />
      )}
    </div>
  );
};

// Create Plan Modal Component
const CreatePlanModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    period: 'month',
    features: '',
    detections: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      alert('Please enter a plan name');
      return;
    }

    // Convert features string to array
    const featuresArray = formData.features
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    if (featuresArray.length === 0) {
      alert('Please add at least one feature');
      return;
    }

    onSave({
      name: formData.name.trim(),
      price: parseInt(formData.price),
      period: formData.period,
      features: featuresArray,
      detections: parseInt(formData.detections)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Subscription Plan</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Plan Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Premium, Business, Starter"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Billing Period *</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({...formData, period: e.target.value})}
                required
              >
                <option value="day">Per Day</option>
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
                <option value="forever">Forever (Free)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Detection Limit *</label>
            <input
              type="number"
              value={formData.detections}
              onChange={(e) => setFormData({...formData, detections: e.target.value})}
              placeholder="Enter -1 for unlimited"
              required
            />
            <span className="form-hint">Use -1 for unlimited detections</span>
          </div>

          <div className="form-group">
            <label>Features (one per line) *</label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData({...formData, features: e.target.value})}
              placeholder="Enter features, one per line&#10;e.g.,&#10;Unlimited detections&#10;Priority support&#10;API access"
              rows="6"
              required
            />
            <span className="form-hint">Add each feature on a new line</span>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Create Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Plan Modal Component
const EditPlanModal = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: plan.name,
    price: plan.price,
    period: plan.period,
    features: plan.features.join('\n'),
    detections: plan.detections
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a plan name');
      return;
    }
    const featuresArray = formData.features
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);
    if (featuresArray.length === 0) {
      alert('Please add at least one feature');
      return;
    }
    onSave({
      name: formData.name.trim(),
      price: parseInt(formData.price),
      period: formData.period,
      features: featuresArray,
      detections: parseInt(formData.detections)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Plan — {plan.name}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Plan Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Premium, Business, Starter"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Billing Period *</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({...formData, period: e.target.value})}
                required
              >
                <option value="day">Per Day</option>
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
                <option value="forever">Forever (Free)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Detection Limit *</label>
            <input
              type="number"
              value={formData.detections}
              onChange={(e) => setFormData({...formData, detections: e.target.value})}
              placeholder="Enter -1 for unlimited"
              required
            />
            <span className="form-hint">Use -1 for unlimited detections</span>
          </div>

          <div className="form-group">
            <label>Features (one per line) *</label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData({...formData, features: e.target.value})}
              placeholder="Enter features, one per line"
              rows="6"
              required
            />
            <span className="form-hint">Add each feature on a new line</span>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// User Subscriptions Component
const UserSubscriptions = () => {
  const [subscriptions] = useState([
    {
      id: 1,
      user: 'user1@gmail.com',
      plan: 'Pro',
      status: 'Active',
      startDate: '2026-02-10',
      expiryDate: '2026-04-10',
      autoRenew: true,
      detections: 450
    },
    {
      id: 2,
      user: 'user2@gmail.com',
      plan: 'Basic',
      status: 'Expired',
      startDate: '2026-01-15',
      expiryDate: '2026-02-15',
      autoRenew: false,
      detections: 200
    },
    {
      id: 3,
      user: 'user3@gmail.com',
      plan: 'Pro',
      status: 'Active',
      startDate: '2026-03-01',
      expiryDate: '2026-05-01',
      autoRenew: true,
      detections: 120
    },
    {
      id: 4,
      user: 'user4@gmail.com',
      plan: 'Basic',
      status: 'Cancelled',
      startDate: '2026-02-20',
      expiryDate: '2026-03-20',
      autoRenew: false,
      detections: 89
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'var(--color-success)';
      case 'Expired': return 'var(--color-error)';
      case 'Cancelled': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="user-subscriptions">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{subscriptions.filter(s => s.status === 'Active').length}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{subscriptions.filter(s => s.status === 'Expired').length}</div>
            <div className="stat-label">Expired</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{subscriptions.filter(s => s.status === 'Cancelled').length}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>
      </div>

      <div className="subscriptions-table-wrapper">
        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
              <th>Detections</th>
              <th>Auto Renew</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(subscription => (
              <tr key={subscription.id}>
                <td>{subscription.user}</td>
                <td>
                  <span className="plan-badge">{subscription.plan}</span>
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ color: getStatusColor(subscription.status) }}
                  >
                    {subscription.status}
                  </span>
                </td>
                <td>{new Date(subscription.startDate).toLocaleDateString()}</td>
                <td>{new Date(subscription.expiryDate).toLocaleDateString()}</td>
                <td className="detections-count">{subscription.detections.toLocaleString()}</td>
                <td>
                  <span className={`auto-renew ${subscription.autoRenew ? 'enabled' : 'disabled'}`}>
                    {subscription.autoRenew ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Revenue Analytics Component
const RevenueAnalytics = () => {
  const revenueData = [
    { month: 'Jan', revenue: 15000, subscriptions: 45 },
    { month: 'Feb', revenue: 22000, subscriptions: 67 },
    { month: 'Mar', revenue: 18000, subscriptions: 52 }
  ];

  const planDistribution = [
    { name: 'Free', value: 150, color: '#94a3b8' },
    { name: 'Basic', value: 89, color: '#3b82f6' },
    { name: 'Pro', value: 67, color: '#10b981' },
    { name: 'Enterprise', value: 12, color: '#f59e0b' }
  ];

  return (
    <div className="revenue-analytics">
      {/* Revenue Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">₹1,20,000</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-change positive">+12.5%</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">₹22,000</div>
            <div className="stat-label">Monthly Revenue</div>
            <div className="stat-change negative">-8.2%</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">340</div>
            <div className="stat-label">Active Subscribers</div>
            <div className="stat-change positive">+15.3%</div>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-container">
          <h3>Monthly Revenue Trend</h3>
          <div className="simple-chart">
            {revenueData.map((data, index) => (
              <div key={index} className="chart-bar">
                <div 
                  className="bar-fill"
                  style={{ height: `${(data.revenue / 25000) * 100}%` }}
                ></div>
                <div className="bar-label">{data.month}</div>
                <div className="bar-value">₹{(data.revenue / 1000).toFixed(0)}k</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h3>Plan Distribution</h3>
          <div className="plan-distribution">
            {planDistribution.map((plan, index) => (
              <div key={index} className="plan-item">
                <div 
                  className="plan-color"
                  style={{ backgroundColor: plan.color }}
                ></div>
                <span className="plan-name">{plan.name}</span>
                <span className="plan-count">{plan.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
