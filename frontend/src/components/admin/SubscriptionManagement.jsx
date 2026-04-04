import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { InlineLoader } from '../common/LoadingSpinner';
import toast from '@/utils/toast';
import './SubscriptionManagement.css';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'users', 'analytics', 'plans'
  const [dateRange, setDateRange] = useState('30'); // days
  
  // Pricing Plans State
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    display_name: '',
    description: '',
    price: 0,
    billing_period: 'monthly',
    features: [],
    max_detections: 0,
    max_storage_gb: 0,
    priority_support: false,
    api_access: false,
    custom_models: false,
    is_active: true,
    display_order: 0
  });
  const [newFeature, setNewFeature] = useState('');
  
  const [upgradeData, setUpgradeData] = useState({
    newPlan: '',
    billingPeriod: 'monthly',
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSubscriptions();
    if (viewMode === 'plans') {
      fetchPlans();
    }
  }, [viewMode]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getSubscriptions();
      setSubscriptions(response);
    } catch (err) {
      setError(err.message || 'Failed to fetch subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await adminApi.getPricingPlans(true);
      setPlans(response.plans || []);
    } catch (err) {
      toast.error('Failed to load pricing plans');
      console.error('Error fetching plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchPaymentHistory = async (userId) => {
    try {
      // Mock payment history - replace with actual API call
      const mockHistory = [
        {
          id: 1,
          date: '2026-03-01',
          amount: 29.99,
          plan: 'Premium',
          status: 'completed',
          method: 'Credit Card'
        },
        {
          id: 2,
          date: '2026-02-01',
          amount: 29.99,
          plan: 'Premium',
          status: 'completed',
          method: 'Credit Card'
        }
      ];
      setPaymentHistory(mockHistory);
      setShowPaymentHistory(true);
    } catch (err) {
      toast.error('Failed to load payment history');
    }
  };

  const handleUpgradeSubscription = async () => {
    if (!upgradeData.newPlan) {
      toast.error('Please select a plan');
      return;
    }

    try {
      await adminApi.updateSubscription(selectedUser.id, upgradeData.newPlan);
      toast.success(`Subscription updated to ${upgradeData.newPlan}`);
      setShowUpgradeModal(false);
      setSelectedUser(null);
      fetchSubscriptions();
    } catch (err) {
      toast.error('Failed to update subscription');
    }
  };

  const handleCancelSubscription = async (userId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      await adminApi.updateSubscription(userId, 'free');
      toast.success('Subscription cancelled');
      fetchSubscriptions();
    } catch (err) {
      toast.error('Failed to cancel subscription');
    }
  };

  // ========== PRICING PLANS MANAGEMENT ==========
  const handleOpenPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanFormData({
        display_name: plan.display_name,
        description: plan.description || '',
        price: plan.price,
        billing_period: plan.billing_period,
        features: Array.isArray(plan.features) ? plan.features : [],
        max_detections: plan.max_detections,
        max_storage_gb: plan.max_storage_gb,
        priority_support: plan.priority_support,
        api_access: plan.api_access,
        custom_models: plan.custom_models,
        is_active: plan.is_active,
        display_order: plan.display_order
      });
    } else {
      setEditingPlan(null);
      setPlanFormData({
        display_name: '',
        description: '',
        price: 0,
        billing_period: 'monthly',
        features: [],
        max_detections: 0,
        max_storage_gb: 0,
        priority_support: false,
        api_access: false,
        custom_models: false,
        is_active: true,
        display_order: plans.length
      });
    }
    setShowPlanModal(true);
  };

  const handleClosePlanModal = () => {
    setShowPlanModal(false);
    setEditingPlan(null);
    setNewFeature('');
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setPlanFormData({
        ...planFormData,
        features: [...planFormData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setPlanFormData({
      ...planFormData,
      features: planFormData.features.filter((_, i) => i !== index)
    });
  };

  const handleSavePlan = async () => {
    if (!planFormData.display_name) {
      toast.error('Plan name is required');
      return;
    }

    try {
      if (editingPlan) {
        await adminApi.updatePricingPlan(editingPlan.id, planFormData);
        toast.success('Plan updated successfully');
      } else {
        await adminApi.createPricingPlan({
          ...planFormData,
          name: planFormData.display_name.toLowerCase().replace(/\s+/g, '_')
        });
        toast.success('Plan created successfully');
      }
      handleClosePlanModal();
      fetchPlans();
    } catch (err) {
      toast.error('Failed to save plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to deactivate this plan?')) return;

    try {
      await adminApi.deletePricingPlan(planId);
      toast.success('Plan deactivated');
      fetchPlans();
    } catch (err) {
      toast.error('Failed to deactivate plan');
    }
  };

  const getPlanColor = (plan) => {
    const colors = {
      free: '#6b7280',
      basic: '#3b82f6',
      pro: '#8b5cf6',
      premium: '#8b5cf6',
      enterprise: '#f59e0b'
    };
    return colors[plan?.toLowerCase()] || colors.free;
  };

  const calculateMRR = () => {
    if (!subscriptions?.plan_counts) return 0;
    const prices = { free: 0, basic: 9.99, pro: 29.99, premium: 29.99, enterprise: 99.99 };
    return Object.entries(subscriptions.plan_counts).reduce((total, [plan, count]) => {
      return total + (prices[plan] || 0) * count;
    }, 0);
  };

  const calculateARR = () => calculateMRR() * 12;

  const calculateChurnRate = () => {
    // Mock calculation - replace with actual data
    return 2.5;
  };

  const getFilteredUsers = () => {
    if (!subscriptions?.users_by_plan) return [];
    
    let users = selectedPlan === 'all'
      ? Object.values(subscriptions.users_by_plan).flat()
      : subscriptions.users_by_plan[selectedPlan] || [];

    if (searchTerm) {
      users = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return users;
  };

  const filteredUsers = getFilteredUsers();

  if (loading) {
    return (
      <div className="subscription-management">
        <div className="sm-header">
          <h1 className="sm-title">SUBSCRIPTION MANAGEMENT</h1>
          <p className="sm-subtitle">Manage user subscriptions, billing, and revenue</p>
        </div>
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <InlineLoader message="Loading subscriptions..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-management">
        <div className="sm-header">
          <h1 className="sm-title">SUBSCRIPTION MANAGEMENT</h1>
          <p className="sm-subtitle">Manage user subscriptions, billing, and revenue</p>
        </div>
        <div className="sm-error-state">
          <div className="sm-error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3>Failed to Load Subscriptions</h3>
          <p>{error}</p>
          <button className="sm-btn sm-btn-primary" onClick={fetchSubscriptions}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-management">
      {/* Header */}
      <div className="sm-header">
        <div className="sm-header-content">
          <h1 className="sm-title">SUBSCRIPTION MANAGEMENT</h1>
          <p className="sm-subtitle">Manage user subscriptions, billing, and revenue</p>
        </div>
        <div className="sm-header-actions">
          <button 
            className={`sm-view-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Overview
          </button>
          <button 
            className={`sm-view-btn ${viewMode === 'plans' ? 'active' : ''}`}
            onClick={() => setViewMode('plans')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Plans
          </button>
          <button 
            className={`sm-view-btn ${viewMode === 'users' ? 'active' : ''}`}
            onClick={() => setViewMode('users')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Users
          </button>
          <button 
            className={`sm-view-btn ${viewMode === 'analytics' ? 'active' : ''}`}
            onClick={() => setViewMode('analytics')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
            Analytics
          </button>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <>
          {/* Revenue Statistics */}
          <div className="sm-stats-grid">
            <div className="sm-stat-card revenue">
              <div className="sm-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="sm-stat-content">
                <div className="sm-stat-label">Monthly Recurring Revenue</div>
                <div className="sm-stat-value">${calculateMRR().toFixed(2)}</div>
                <div className="sm-stat-change positive">+12.5% from last month</div>
              </div>
            </div>

            <div className="sm-stat-card arr">
              <div className="sm-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div className="sm-stat-content">
                <div className="sm-stat-label">Annual Recurring Revenue</div>
                <div className="sm-stat-value">${calculateARR().toFixed(2)}</div>
                <div className="sm-stat-change positive">+15.3% YoY</div>
              </div>
            </div>

            <div className="sm-stat-card churn">
              <div className="sm-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="sm-stat-content">
                <div className="sm-stat-label">Churn Rate</div>
                <div className="sm-stat-value">{calculateChurnRate()}%</div>
                <div className="sm-stat-change negative">+0.5% from last month</div>
              </div>
            </div>

            <div className="sm-stat-card ltv">
              <div className="sm-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="sm-stat-content">
                <div className="sm-stat-label">Avg. Customer LTV</div>
                <div className="sm-stat-value">$1,247</div>
                <div className="sm-stat-change positive">+8.2% from last month</div>
              </div>
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="sm-plans-grid">
            <div className="sm-plan-card" style={{ borderColor: getPlanColor('free') }}>
              <div className="sm-plan-header">
                <div className="sm-plan-icon" style={{ background: getPlanColor('free') }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3>Free</h3>
              </div>
              <div className="sm-plan-count">{subscriptions?.plan_counts?.free || 0}</div>
              <div className="sm-plan-revenue">$0.00/mo</div>
              <div className="sm-plan-percentage">
                {((subscriptions?.plan_counts?.free || 0) / Object.values(subscriptions?.plan_counts || {}).reduce((a, b) => a + b, 0) * 100).toFixed(1)}% of users
              </div>
            </div>

            <div className="sm-plan-card" style={{ borderColor: getPlanColor('basic') }}>
              <div className="sm-plan-header">
                <div className="sm-plan-icon" style={{ background: getPlanColor('basic') }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3>Basic</h3>
              </div>
              <div className="sm-plan-count">{subscriptions?.plan_counts?.basic || 0}</div>
              <div className="sm-plan-revenue">${((subscriptions?.plan_counts?.basic || 0) * 9.99).toFixed(2)}/mo</div>
              <div className="sm-plan-percentage">
                {((subscriptions?.plan_counts?.basic || 0) / Object.values(subscriptions?.plan_counts || {}).reduce((a, b) => a + b, 0) * 100).toFixed(1)}% of users
              </div>
            </div>

            <div className="sm-plan-card" style={{ borderColor: getPlanColor('premium') }}>
              <div className="sm-plan-header">
                <div className="sm-plan-icon" style={{ background: getPlanColor('premium') }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h3>Premium</h3>
              </div>
              <div className="sm-plan-count">{subscriptions?.plan_counts?.premium || 0}</div>
              <div className="sm-plan-revenue">${((subscriptions?.plan_counts?.premium || 0) * 29.99).toFixed(2)}/mo</div>
              <div className="sm-plan-percentage">
                {((subscriptions?.plan_counts?.premium || 0) / Object.values(subscriptions?.plan_counts || {}).reduce((a, b) => a + b, 0) * 100).toFixed(1)}% of users
              </div>
            </div>

            <div className="sm-plan-card" style={{ borderColor: getPlanColor('enterprise') }}>
              <div className="sm-plan-header">
                <div className="sm-plan-icon" style={{ background: getPlanColor('enterprise') }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9,22 9,12 15,12 15,22" />
                  </svg>
                </div>
                <h3>Enterprise</h3>
              </div>
              <div className="sm-plan-count">{subscriptions?.plan_counts?.enterprise || 0}</div>
              <div className="sm-plan-revenue">${((subscriptions?.plan_counts?.enterprise || 0) * 99.99).toFixed(2)}/mo</div>
              <div className="sm-plan-percentage">
                {((subscriptions?.plan_counts?.enterprise || 0) / Object.values(subscriptions?.plan_counts || {}).reduce((a, b) => a + b, 0) * 100).toFixed(1)}% of users
              </div>
            </div>
          </div>
        </>
      )}

      {/* Users Mode */}
      {viewMode === 'users' && (
        <>
          {/* Filters */}
          <div className="sm-controls">
            <div className="sm-search-wrapper">
              <svg className="sm-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sm-search-input"
              />
            </div>

            <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} className="sm-filter-select">
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Results Info */}
          <div className="sm-results-info">
            Showing {filteredUsers.length} subscription{filteredUsers.length !== 1 ? 's' : ''}
          </div>

          {/* Users Table */}
          <div className="sm-table-wrapper">
            <table className="sm-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>PLAN</th>
                  <th>STATUS</th>
                  <th>JOINED</th>
                  <th>REVENUE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="sm-user-cell">
                        <div className="sm-user-avatar" style={{ background: getPlanColor(user.subscription_plan) }}>
                          {(user.full_name || user.email || 'U')[0].toUpperCase()}
                        </div>
                        <div className="sm-user-info">
                          <div className="sm-user-name">{user.full_name || 'No Name'}</div>
                          <div className="sm-user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sm-badge" style={{ 
                        background: `${getPlanColor(user.subscription_plan)}15`,
                        color: getPlanColor(user.subscription_plan),
                        border: `1px solid ${getPlanColor(user.subscription_plan)}30`
                      }}>
                        {user.subscription_plan?.charAt(0).toUpperCase() + user.subscription_plan?.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className="sm-status active">
                        <span className="sm-status-dot"></span>
                        Active
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="sm-revenue">
                      ${user.subscription_plan === 'free' ? '0.00' : 
                        user.subscription_plan === 'basic' ? '9.99' :
                        user.subscription_plan === 'premium' ? '29.99' : '99.99'}/mo
                    </td>
                    <td>
                      <div className="sm-actions">
                        <button
                          className="sm-action-btn sm-action-upgrade"
                          onClick={() => {
                            setSelectedUser(user);
                            setUpgradeData({ ...upgradeData, newPlan: user.subscription_plan });
                            setShowUpgradeModal(true);
                          }}
                          title="Change plan"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </button>
                        <button
                          className="sm-action-btn sm-action-history"
                          onClick={() => fetchPaymentHistory(user.id)}
                          title="Payment history"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </button>
                        <button
                          className="sm-action-btn sm-action-cancel"
                          onClick={() => handleCancelSubscription(user.id)}
                          title="Cancel subscription"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="sm-empty-state">
              <div className="sm-empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <h3>No subscriptions found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </>
      )}

      {/* Analytics Mode */}
      {viewMode === 'analytics' && (
        <>
          <div className="sm-analytics-grid">
            {/* Conversion Funnel */}
            <div className="sm-analytics-card">
              <h3>Conversion Funnel</h3>
              <div className="sm-funnel">
                <div className="sm-funnel-stage">
                  <div className="sm-funnel-bar" style={{ width: '100%', background: '#6b7280' }}>
                    <span>Free Users</span>
                    <strong>{subscriptions?.plan_counts?.free || 0}</strong>
                  </div>
                </div>
                <div className="sm-funnel-stage">
                  <div className="sm-funnel-bar" style={{ width: '60%', background: '#3b82f6' }}>
                    <span>Basic</span>
                    <strong>{subscriptions?.plan_counts?.basic || 0}</strong>
                  </div>
                </div>
                <div className="sm-funnel-stage">
                  <div className="sm-funnel-bar" style={{ width: '30%', background: '#8b5cf6' }}>
                    <span>Premium</span>
                    <strong>{subscriptions?.plan_counts?.premium || 0}</strong>
                  </div>
                </div>
                <div className="sm-funnel-stage">
                  <div className="sm-funnel-bar" style={{ width: '15%', background: '#f59e0b' }}>
                    <span>Enterprise</span>
                    <strong>{subscriptions?.plan_counts?.enterprise || 0}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="sm-analytics-card">
              <h3>Revenue by Plan</h3>
              <div className="sm-revenue-list">
                <div className="sm-revenue-item">
                  <div className="sm-revenue-label">
                    <span className="sm-revenue-dot" style={{ background: '#6b7280' }}></span>
                    Free
                  </div>
                  <div className="sm-revenue-amount">$0.00</div>
                  <div className="sm-revenue-percent">0%</div>
                </div>
                <div className="sm-revenue-item">
                  <div className="sm-revenue-label">
                    <span className="sm-revenue-dot" style={{ background: '#3b82f6' }}></span>
                    Basic
                  </div>
                  <div className="sm-revenue-amount">${((subscriptions?.plan_counts?.basic || 0) * 9.99).toFixed(2)}</div>
                  <div className="sm-revenue-percent">
                    {(((subscriptions?.plan_counts?.basic || 0) * 9.99) / calculateMRR() * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="sm-revenue-item">
                  <div className="sm-revenue-label">
                    <span className="sm-revenue-dot" style={{ background: '#8b5cf6' }}></span>
                    Premium
                  </div>
                  <div className="sm-revenue-amount">${((subscriptions?.plan_counts?.premium || 0) * 29.99).toFixed(2)}</div>
                  <div className="sm-revenue-percent">
                    {(((subscriptions?.plan_counts?.premium || 0) * 29.99) / calculateMRR() * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="sm-revenue-item">
                  <div className="sm-revenue-label">
                    <span className="sm-revenue-dot" style={{ background: '#f59e0b' }}></span>
                    Enterprise
                  </div>
                  <div className="sm-revenue-amount">${((subscriptions?.plan_counts?.enterprise || 0) * 99.99).toFixed(2)}</div>
                  <div className="sm-revenue-percent">
                    {(((subscriptions?.plan_counts?.enterprise || 0) * 99.99) / calculateMRR() * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Metrics */}
            <div className="sm-analytics-card full-width">
              <h3>Growth Metrics</h3>
              <div className="sm-metrics-grid">
                <div className="sm-metric">
                  <div className="sm-metric-label">Conversion Rate</div>
                  <div className="sm-metric-value">18.5%</div>
                  <div className="sm-metric-change positive">+2.3%</div>
                </div>
                <div className="sm-metric">
                  <div className="sm-metric-label">Avg. Revenue Per User</div>
                  <div className="sm-metric-value">$24.50</div>
                  <div className="sm-metric-change positive">+5.1%</div>
                </div>
                <div className="sm-metric">
                  <div className="sm-metric-label">Customer Retention</div>
                  <div className="sm-metric-value">94.2%</div>
                  <div className="sm-metric-change positive">+1.8%</div>
                </div>
                <div className="sm-metric">
                  <div className="sm-metric-label">Upgrade Rate</div>
                  <div className="sm-metric-value">12.8%</div>
                  <div className="sm-metric-change positive">+3.2%</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Plans Mode */}
      {viewMode === 'plans' && (
        <>
          {/* Plans Header */}
          <div className="sm-plans-header">
            <div className="sm-plans-stats">
              <div className="sm-plans-stat">
                <div className="sm-plans-stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  </svg>
                </div>
                <div className="sm-plans-stat-content">
                  <div className="sm-plans-stat-value">{plans.length}</div>
                  <div className="sm-plans-stat-label">Total Plans</div>
                </div>
              </div>
              <div className="sm-plans-stat">
                <div className="sm-plans-stat-icon active">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="sm-plans-stat-content">
                  <div className="sm-plans-stat-value">{plans.filter(p => p.is_active).length}</div>
                  <div className="sm-plans-stat-label">Active Plans</div>
                </div>
              </div>
              <div className="sm-plans-stat">
                <div className="sm-plans-stat-icon revenue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="sm-plans-stat-content">
                  <div className="sm-plans-stat-value">₹{plans.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}</div>
                  <div className="sm-plans-stat-label">Monthly Revenue</div>
                </div>
              </div>
            </div>
            <button className="sm-btn sm-btn-primary" onClick={() => handleOpenPlanModal()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create New Plan
            </button>
          </div>

          {/* Plans Grid */}
          {plansLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <InlineLoader message="Loading plans..." />
            </div>
          ) : (
            <div className="sm-pricing-grid">
              {plans.map((plan) => (
                <div key={plan.id} className={`sm-pricing-card ${!plan.is_active ? 'inactive' : ''}`}>
                  {!plan.is_active && <div className="sm-pricing-inactive-badge">Inactive</div>}
                  
                  <div className="sm-pricing-header">
                    <h3 className="sm-pricing-name">{plan.display_name}</h3>
                    <div className="sm-pricing-price">
                      <span className="sm-pricing-currency">₹</span>
                      <span className="sm-pricing-amount">{plan.price}</span>
                      <span className="sm-pricing-period">/{plan.billing_period === 'monthly' ? 'month' : 'year'}</span>
                    </div>
                    <p className="sm-pricing-description">{plan.description}</p>
                  </div>

                  <div className="sm-pricing-features">
                    <div className="sm-pricing-features-label">Features:</div>
                    <ul className="sm-pricing-features-list">
                      {(Array.isArray(plan.features) ? plan.features : []).map((feature, idx) => (
                        <li key={idx}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="sm-pricing-limits">
                    <div className="sm-pricing-limits-label">Usage Limits:</div>
                    <div className="sm-pricing-limit-item">
                      <span className="sm-pricing-limit-label">Detections:</span>
                      <span className="sm-pricing-limit-value">
                        {plan.max_detections === -1 ? 'Unlimited' : `${plan.max_detections} per ${plan.billing_period === 'monthly' ? 'month' : 'year'}`}
                      </span>
                    </div>
                    <div className="sm-pricing-limit-item">
                      <span className="sm-pricing-limit-label">Storage:</span>
                      <span className="sm-pricing-limit-value">
                        {plan.max_storage_gb === -1 ? 'Unlimited' : `${plan.max_storage_gb} GB`}
                      </span>
                    </div>
                  </div>

                  <div className="sm-pricing-actions">
                    <button className="sm-pricing-btn edit" onClick={() => handleOpenPlanModal(plan)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button className="sm-pricing-btn delete" onClick={() => handleDeletePlan(plan.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {plans.length === 0 && !plansLoading && (
            <div className="sm-empty-state">
              <div className="sm-empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>No pricing plans yet</h3>
              <p>Create your first pricing plan to get started.</p>
              <button className="sm-btn sm-btn-primary" onClick={() => handleOpenPlanModal()}>
                Create Plan
              </button>
            </div>
          )}
        </>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedUser && (
        <div className="sm-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h3>Change Subscription Plan</h3>
              <button className="sm-modal-close" onClick={() => setShowUpgradeModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="sm-modal-body">
              <div className="sm-user-info-section">
                <div className="sm-modal-avatar" style={{ background: getPlanColor(selectedUser.subscription_plan) }}>
                  {(selectedUser.full_name || selectedUser.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="sm-modal-user-name">{selectedUser.full_name || 'No Name'}</p>
                  <p className="sm-modal-user-email">{selectedUser.email}</p>
                  <p className="sm-modal-current-plan">
                    Current Plan: <strong>{selectedUser.subscription_plan?.charAt(0).toUpperCase() + selectedUser.subscription_plan?.slice(1)}</strong>
                  </p>
                </div>
              </div>

              <div className="sm-form-group">
                <label className="sm-form-label">New Plan</label>
                <select
                  value={upgradeData.newPlan}
                  onChange={(e) => setUpgradeData({ ...upgradeData, newPlan: e.target.value })}
                  className="sm-form-input"
                >
                  <option value="">Select a plan...</option>
                  <option value="free">Free - $0/month</option>
                  <option value="basic">Basic - $9.99/month</option>
                  <option value="premium">Premium - $29.99/month</option>
                  <option value="enterprise">Enterprise - $99.99/month</option>
                </select>
              </div>

              <div className="sm-form-group">
                <label className="sm-form-label">Billing Period</label>
                <select
                  value={upgradeData.billingPeriod}
                  onChange={(e) => setUpgradeData({ ...upgradeData, billingPeriod: e.target.value })}
                  className="sm-form-input"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly (Save 20%)</option>
                </select>
              </div>

              <div className="sm-form-group">
                <label className="sm-form-label">Effective Date</label>
                <input
                  type="date"
                  value={upgradeData.startDate}
                  onChange={(e) => setUpgradeData({ ...upgradeData, startDate: e.target.value })}
                  className="sm-form-input"
                />
              </div>

              <div className="sm-form-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>The subscription will be updated immediately. The user will be notified via email.</span>
              </div>
            </div>
            <div className="sm-modal-footer">
              <button className="sm-btn sm-btn-secondary" onClick={() => setShowUpgradeModal(false)}>
                Cancel
              </button>
              <button className="sm-btn sm-btn-primary" onClick={handleUpgradeSubscription}>
                Update Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && (
        <div className="sm-modal-overlay" onClick={() => setShowPaymentHistory(false)}>
          <div className="sm-modal sm-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h3>Payment History</h3>
              <button className="sm-modal-close" onClick={() => setShowPaymentHistory(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="sm-modal-body">
              <div className="sm-payment-history">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="sm-payment-item">
                    <div className="sm-payment-date">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {new Date(payment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="sm-payment-details">
                      <div className="sm-payment-plan">{payment.plan} Plan</div>
                      <div className="sm-payment-method">{payment.method}</div>
                    </div>
                    <div className="sm-payment-amount">${payment.amount.toFixed(2)}</div>
                    <div className="sm-payment-status completed">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {payment.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sm-modal-footer">
              <button className="sm-btn sm-btn-secondary" onClick={() => setShowPaymentHistory(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Edit/Create Modal */}
      {showPlanModal && (
        <div className="sm-modal-overlay" onClick={handleClosePlanModal}>
          <div className="sm-modal sm-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h3>{editingPlan ? 'Edit Pricing Plan' : 'Create New Pricing Plan'}</h3>
              <button className="sm-modal-close" onClick={handleClosePlanModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="sm-modal-body">
              <div className="sm-form-row">
                <div className="sm-form-group">
                  <label className="sm-form-label">Plan Name *</label>
                  <input
                    type="text"
                    className="sm-form-input"
                    value={planFormData.display_name}
                    onChange={(e) => setPlanFormData({ ...planFormData, display_name: e.target.value })}
                    placeholder="e.g., Premium, Enterprise"
                  />
                </div>
                <div className="sm-form-group">
                  <label className="sm-form-label">Price (₹) *</label>
                  <input
                    type="number"
                    className="sm-form-input"
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="sm-form-group">
                <label className="sm-form-label">Description</label>
                <textarea
                  className="sm-form-input"
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  placeholder="Brief description of the plan"
                  rows="2"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="sm-form-row">
                <div className="sm-form-group">
                  <label className="sm-form-label">Billing Period</label>
                  <select
                    className="sm-form-input"
                    value={planFormData.billing_period}
                    onChange={(e) => setPlanFormData({ ...planFormData, billing_period: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="sm-form-group">
                  <label className="sm-form-label">Display Order</label>
                  <input
                    type="number"
                    className="sm-form-input"
                    value={planFormData.display_order}
                    onChange={(e) => setPlanFormData({ ...planFormData, display_order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              <div className="sm-form-group">
                <label className="sm-form-label">Features</label>
                <div className="sm-features-input">
                  <input
                    type="text"
                    className="sm-form-input"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                    placeholder="Add a feature and press Enter..."
                  />
                  <button type="button" className="sm-btn sm-btn-secondary" onClick={handleAddFeature}>
                    Add
                  </button>
                </div>
                {planFormData.features.length > 0 && (
                  <ul className="sm-features-list">
                    {planFormData.features.map((feature, idx) => (
                      <li key={idx}>
                        <span>{feature}</span>
                        <button type="button" onClick={() => handleRemoveFeature(idx)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="sm-form-row">
                <div className="sm-form-group">
                  <label className="sm-form-label">Max Detections (-1 for unlimited)</label>
                  <input
                    type="number"
                    className="sm-form-input"
                    value={planFormData.max_detections}
                    onChange={(e) => setPlanFormData({ ...planFormData, max_detections: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="sm-form-group">
                  <label className="sm-form-label">Max Storage GB (-1 for unlimited)</label>
                  <input
                    type="number"
                    className="sm-form-input"
                    value={planFormData.max_storage_gb}
                    onChange={(e) => setPlanFormData({ ...planFormData, max_storage_gb: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="sm-form-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={planFormData.priority_support}
                    onChange={(e) => setPlanFormData({ ...planFormData, priority_support: e.target.checked })}
                  />
                  <span>Priority Support</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={planFormData.api_access}
                    onChange={(e) => setPlanFormData({ ...planFormData, api_access: e.target.checked })}
                  />
                  <span>API Access</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={planFormData.custom_models}
                    onChange={(e) => setPlanFormData({ ...planFormData, custom_models: e.target.checked })}
                  />
                  <span>Custom Models</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={planFormData.is_active}
                    onChange={(e) => setPlanFormData({ ...planFormData, is_active: e.target.checked })}
                  />
                  <span>Active (visible to users)</span>
                </label>
              </div>
            </div>
            <div className="sm-modal-footer">
              <button className="sm-btn sm-btn-secondary" onClick={handleClosePlanModal}>
                Cancel
              </button>
              <button className="sm-btn sm-btn-primary" onClick={handleSavePlan}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
