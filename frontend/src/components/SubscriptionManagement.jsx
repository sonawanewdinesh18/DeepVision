import React, { useState } from 'react';
import './SubscriptionManagement.css';

const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('plans');

  const renderContent = () => {
    switch (activeTab) {
      case 'plans':
        return <PlansManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'subscriptions':
        return <UserSubscriptions />;
      case 'analytics':
        return <RevenueAnalytics />;
      case 'invoices':
        return <InvoiceManagement />;
      default:
        return <PlansManagement />;
    }
  };

  return (
    <div className="subscription-management">
      <div className="page-title">
        <h1>Subscription Management</h1>
        <p>Manage subscription plans, payments, and billing operations.</p>
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
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6"/>
          </svg>
          Payments
        </button>
        <button
          className={`tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          Users
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
        <button
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          Invoices
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
  const [plans, setPlans] = useState([
    {
      id: 1,
      name: 'Free',
      price: 0,
      currency: '₹',
      period: 'forever',
      features: ['10 detections/day', 'Basic support', 'Email alerts'],
      limits: { detections: 10, period: 'day' },
      active: true
    },
    {
      id: 2,
      name: 'Basic',
      price: 299,
      currency: '₹',
      period: 'month',
      features: ['200 detections/month', 'Priority support', 'Advanced analytics'],
      limits: { detections: 200, period: 'month' },
      active: true
    },
    {
      id: 3,
      name: 'Pro',
      price: 999,
      currency: '₹',
      period: 'month',
      features: ['Unlimited detections', 'Premium support', 'API access', 'Custom integrations'],
      limits: { detections: -1, period: 'month' },
      active: true
    },
    {
      id: 4,
      name: 'Enterprise',
      price: 0,
      currency: '₹',
      period: 'custom',
      features: ['Custom pricing', 'Dedicated support', 'On-premise deployment', 'SLA guarantee'],
      limits: { detections: -1, period: 'unlimited' },
      active: true
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Calculate statistics
  const totalPlans = plans.length;
  const activePlans = plans.filter(plan => plan.active).length;
  const totalRevenue = plans.reduce((sum, plan) => sum + (plan.active ? plan.price : 0), 0);

  return (
    <div className="plans-management">
      <div className="plans-header">
        <h2>Subscription Plans</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create New Plan
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Plans</span>
          </div>
          <div className="stat-value">{totalPlans}</div>
          <div className="stat-description">Available subscription plans</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Plans</span>
          </div>
          <div className="stat-value">{activePlans}</div>
          <div className="stat-description">Currently enabled plans</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Monthly Revenue</span>
          </div>
          <div className="stat-value">₹{totalRevenue.toLocaleString()}</div>
          <div className="stat-description">Revenue from subscriptions</div>
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
                 `${plan.currency}${plan.price}/${plan.period}`}
              </div>
            </div>
            
            <div className="plan-features">
              {plan.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-check">✓</span>
                  {feature}
                </div>
              ))}
            </div>

            <div className="plan-limits">
              <strong>Usage Limits:</strong>
              <p>
                {plan.limits.detections === -1 ? 'Unlimited' : plan.limits.detections} 
                {plan.limits.detections !== -1 ? ` detections per ${plan.limits.period}` : ' detections'}
              </p>
            </div>

            <div className="plan-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setEditingPlan(plan)}
              >
                Edit
              </button>
              <button 
                className={`btn ${plan.active ? 'btn-danger' : 'btn-success'}`}
                onClick={() => {
                  setPlans(plans.map(p => 
                    p.id === plan.id ? {...p, active: !p.active} : p
                  ));
                }}
              >
                {plan.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {(showCreateForm || editingPlan) && (
        <PlanForm 
          plan={editingPlan}
          onSave={(planData) => {
            if (editingPlan) {
              setPlans(plans.map(p => p.id === editingPlan.id ? {...planData, id: editingPlan.id} : p));
            } else {
              setPlans([...plans, {...planData, id: Date.now()}]);
            }
            setShowCreateForm(false);
            setEditingPlan(null);
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingPlan(null);
          }}
        />
      )}
    </div>
  );
};

// Plan Form Component
const PlanForm = ({ plan, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || 0,
    currency: plan?.currency || '₹',
    period: plan?.period || 'month',
    features: plan?.features?.join('\n') || '',
    detections: plan?.limits?.detections || 0,
    active: plan?.active ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      features: formData.features.split('\n').filter(f => f.trim()),
      limits: {
        detections: parseInt(formData.detections),
        period: formData.period
      }
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{plan ? 'Edit Plan' : 'Create New Plan'}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="plan-form">
          <div className="form-group">
            <label>Plan Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
              >
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({...formData, period: e.target.value})}
              >
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Detection Limit</label>
            <input
              type="number"
              value={formData.detections}
              onChange={(e) => setFormData({...formData, detections: e.target.value})}
              placeholder="Enter -1 for unlimited"
            />
          </div>

          <div className="form-group">
            <label>Features (one per line)</label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData({...formData, features: e.target.value})}
              rows="4"
              placeholder="Enter features, one per line"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payment Management Component
const PaymentManagement = () => {
  const [payments] = useState([
    {
      id: 'PAY1023',
      user: 'user1@gmail.com',
      plan: 'Pro',
      amount: 999,
      currency: '₹',
      status: 'Success',
      date: '2026-03-10',
      method: 'UPI',
      transactionId: 'TXN123456789'
    },
    {
      id: 'PAY1024',
      user: 'user2@gmail.com',
      plan: 'Basic',
      amount: 299,
      currency: '₹',
      status: 'Failed',
      date: '2026-03-11',
      method: 'Credit Card',
      transactionId: 'TXN123456790'
    },
    {
      id: 'PAY1025',
      user: 'user3@gmail.com',
      plan: 'Pro',
      amount: 999,
      currency: '₹',
      status: 'Pending',
      date: '2026-03-12',
      method: 'Net Banking',
      transactionId: 'TXN123456791'
    },
    {
      id: 'PAY1026',
      user: 'user4@gmail.com',
      plan: 'Basic',
      amount: 299,
      currency: '₹',
      status: 'Success',
      date: '2026-03-13',
      method: 'UPI',
      transactionId: 'TXN123456792'
    }
  ]);

  const [selectedPayment, setSelectedPayment] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Success': return '#10b981';
      case 'Failed': return '#ef4444';
      case 'Pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="payment-management">
      <div className="payment-header">
        <h2>Payment Management</h2>
        <div className="payment-stats">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Total Revenue</span>
            </div>
            <div className="stat-value">₹2,596</div>
            <div className="stat-description">Total payment revenue</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Successful</span>
            </div>
            <div className="stat-value">3</div>
            <div className="stat-description">Successful transactions</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Failed</span>
            </div>
            <div className="stat-value">1</div>
            <div className="stat-description">Failed transactions</div>
          </div>
        </div>
      </div>

      <div className="payment-table-container">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>User</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td className="payment-id">{payment.id}</td>
                <td>{payment.user}</td>
                <td>
                  <span className="plan-badge">{payment.plan}</span>
                </td>
                <td>{payment.currency}{payment.amount}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(payment.status) }}
                  >
                    {payment.status}
                  </span>
                </td>
                <td>{new Date(payment.date).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      View
                    </button>
                    {payment.status === 'Success' && (
                      <button className="btn btn-sm btn-danger">
                        Refund
                      </button>
                    )}
                    <button className="btn btn-sm btn-primary">
                      Invoice
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPayment && (
        <PaymentDetailsModal 
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

// Payment Details Modal
const PaymentDetailsModal = ({ payment, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Payment Details - {payment.id}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="payment-details">
          <div className="detail-row">
            <span className="detail-label">Payment ID:</span>
            <span className="detail-value">{payment.id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Transaction ID:</span>
            <span className="detail-value">{payment.transactionId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">User:</span>
            <span className="detail-value">{payment.user}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Plan:</span>
            <span className="detail-value">{payment.plan}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">{payment.currency}{payment.amount}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Payment Method:</span>
            <span className="detail-value">{payment.method}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value">
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(payment.status) }}
              >
                {payment.status}
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{new Date(payment.date).toLocaleString()}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary">
            Download Invoice
          </button>
          {payment.status === 'Success' && (
            <button className="btn btn-danger">
              Process Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Success': return '#10b981';
    case 'Failed': return '#ef4444';
    case 'Pending': return '#f59e0b';
    case 'Active': return '#10b981';
    case 'Expired': return '#ef4444';
    case 'Cancelled': return '#6b7280';
    default: return '#6b7280';
  }
};
// User Subscriptions Component
const UserSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([
    {
      id: 1,
      user: 'user1@gmail.com',
      plan: 'Pro',
      status: 'Active',
      startDate: '2026-02-10',
      expiryDate: '2026-04-10',
      autoRenew: true,
      usage: { detections: 450, limit: -1 }
    },
    {
      id: 2,
      user: 'user2@gmail.com',
      plan: 'Basic',
      status: 'Expired',
      startDate: '2026-01-15',
      expiryDate: '2026-02-15',
      autoRenew: false,
      usage: { detections: 200, limit: 200 }
    },
    {
      id: 3,
      user: 'user3@gmail.com',
      plan: 'Pro',
      status: 'Active',
      startDate: '2026-03-01',
      expiryDate: '2026-05-01',
      autoRenew: true,
      usage: { detections: 120, limit: -1 }
    },
    {
      id: 4,
      user: 'user4@gmail.com',
      plan: 'Basic',
      status: 'Cancelled',
      startDate: '2026-02-20',
      expiryDate: '2026-03-20',
      autoRenew: false,
      usage: { detections: 89, limit: 200 }
    }
  ]);

  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const handleSubscriptionAction = (id, action) => {
    setSubscriptions(subscriptions.map(sub => {
      if (sub.id === id) {
        switch (action) {
          case 'cancel':
            return { ...sub, status: 'Cancelled', autoRenew: false };
          case 'activate':
            return { ...sub, status: 'Active' };
          case 'extend':
            const newExpiry = new Date(sub.expiryDate);
            newExpiry.setMonth(newExpiry.getMonth() + 1);
            return { ...sub, expiryDate: newExpiry.toISOString().split('T')[0] };
          default:
            return sub;
        }
      }
      return sub;
    }));
  };

  return (
    <div className="user-subscriptions">
      <div className="subscriptions-header">
        <h2>User Subscription Management</h2>
        <div className="subscription-summary">
          <div className="summary-card">
            <div className="stat-header">
              <span className="stat-label">Active Subscriptions</span>
            </div>
            <div className="summary-value">{subscriptions.filter(s => s.status === 'Active').length}</div>
            <div className="stat-description">Currently active subscriptions</div>
          </div>
          
          <div className="summary-card">
            <div className="stat-header">
              <span className="stat-label">Expired</span>
            </div>
            <div className="summary-value">{subscriptions.filter(s => s.status === 'Expired').length}</div>
            <div className="stat-description">Expired subscriptions</div>
          </div>
          
          <div className="summary-card">
            <div className="stat-header">
              <span className="stat-label">Cancelled</span>
            </div>
            <div className="summary-value">{subscriptions.filter(s => s.status === 'Cancelled').length}</div>
            <div className="stat-description">Cancelled subscriptions</div>
          </div>
        </div>
      </div>

      <div className="subscriptions-table-container">
        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Usage</th>
              <th>Auto Renew</th>
              <th>Actions</th>
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
                    style={{ backgroundColor: getStatusColor(subscription.status) }}
                  >
                    {subscription.status}
                  </span>
                </td>
                <td>
                  {subscription.status === 'Expired' ? (
                    <span className="expired-date">
                      {new Date(subscription.expiryDate).toLocaleDateString()}
                    </span>
                  ) : (
                    new Date(subscription.expiryDate).toLocaleDateString()
                  )}
                </td>
                <td>
                  <div className="usage-info">
                    {subscription.usage.limit === -1 ? 
                      `${subscription.usage.detections} (Unlimited)` :
                      `${subscription.usage.detections}/${subscription.usage.limit}`
                    }
                  </div>
                </td>
                <td>
                  <span className={`auto-renew ${subscription.autoRenew ? 'enabled' : 'disabled'}`}>
                    {subscription.autoRenew ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => setSelectedSubscription(subscription)}
                    >
                      Manage
                    </button>
                    {subscription.status === 'Active' && (
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleSubscriptionAction(subscription.id, 'cancel')}
                      >
                        Cancel
                      </button>
                    )}
                    {subscription.status === 'Expired' && (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleSubscriptionAction(subscription.id, 'activate')}
                      >
                        Renew
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSubscription && (
        <SubscriptionManageModal 
          subscription={selectedSubscription}
          onClose={() => setSelectedSubscription(null)}
          onAction={handleSubscriptionAction}
        />
      )}
    </div>
  );
};

// Subscription Management Modal
const SubscriptionManageModal = ({ subscription, onClose, onAction }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Manage Subscription - {subscription.user}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="subscription-manage-content">
          <div className="subscription-info">
            <div className="info-section">
              <h4>Subscription Details</h4>
              <div className="detail-row">
                <span className="detail-label">User:</span>
                <span className="detail-value">{subscription.user}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Plan:</span>
                <span className="detail-value">{subscription.plan}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(subscription.status) }}
                  >
                    {subscription.status}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">{new Date(subscription.startDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry Date:</span>
                <span className="detail-value">{new Date(subscription.expiryDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Auto Renew:</span>
                <span className="detail-value">{subscription.autoRenew ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <div className="info-section">
              <h4>Usage Statistics</h4>
              <div className="usage-stats">
                <div className="usage-item">
                  <span className="usage-label">Detections Used:</span>
                  <span className="usage-value">{subscription.usage.detections}</span>
                </div>
                <div className="usage-item">
                  <span className="usage-label">Detection Limit:</span>
                  <span className="usage-value">
                    {subscription.usage.limit === -1 ? 'Unlimited' : subscription.usage.limit}
                  </span>
                </div>
                {subscription.usage.limit !== -1 && (
                  <div className="usage-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${(subscription.usage.detections / subscription.usage.limit) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {Math.round((subscription.usage.detections / subscription.usage.limit) * 100)}% used
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="manage-actions">
            <h4>Available Actions</h4>
            <div className="action-grid">
              {subscription.status === 'Active' && (
                <>
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => {
                      onAction(subscription.id, 'cancel');
                      onClose();
                    }}
                  >
                    Cancel Subscription
                  </button>
                  <button 
                    className="action-btn extend-btn"
                    onClick={() => {
                      onAction(subscription.id, 'extend');
                      onClose();
                    }}
                  >
                    Extend Expiry (+1 Month)
                  </button>
                </>
              )}
              
              {subscription.status === 'Expired' && (
                <button 
                  className="action-btn activate-btn"
                  onClick={() => {
                    onAction(subscription.id, 'activate');
                    onClose();
                  }}
                >
                  Reactivate Subscription
                </button>
              )}

              <button className="action-btn upgrade-btn">
                Upgrade/Downgrade Plan
              </button>
              
              <button className="action-btn reset-btn">
                Reset Usage Counter
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
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
      <div className="analytics-header">
        <h2>Revenue Analytics</h2>
        <div className="date-filter">
          <select className="filter-select">
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      <div className="revenue-cards">
        <div className="revenue-card">
          <div className="card-icon">₹</div>
          <div className="card-content">
            <div className="card-value">₹1,20,000</div>
            <div className="card-label">Total Revenue</div>
            <div className="card-change positive">+12.5%</div>
          </div>
        </div>
        
        <div className="revenue-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">₹22,000</div>
            <div className="card-label">Monthly Revenue</div>
            <div className="card-change negative">-8.2%</div>
          </div>
        </div>
        
        <div className="revenue-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <div className="card-value">340</div>
            <div className="card-label">Active Subscribers</div>
            <div className="card-change positive">+15.3%</div>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-container">
          <h3>Monthly Revenue Trend</h3>
          <div className="simple-chart">
            {revenueData.map((data, index) => (
              <div key={index} className="chart-bar">
                <div className="bar-label">{data.month}</div>
                <div 
                  className="bar-fill"
                  style={{ height: `${(data.revenue / 25000) * 100}%` }}
                ></div>
                <div className="bar-value">₹{data.revenue.toLocaleString()}</div>
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

// Invoice Management Component
const InvoiceManagement = () => {
  const [invoices] = useState([
    {
      id: 'INV-001',
      user: 'user1@gmail.com',
      amount: 999,
      currency: '₹',
      status: 'Paid',
      date: '2026-03-10',
      dueDate: '2026-03-25'
    },
    {
      id: 'INV-002',
      user: 'user2@gmail.com',
      amount: 299,
      currency: '₹',
      status: 'Pending',
      date: '2026-03-12',
      dueDate: '2026-03-27'
    }
  ]);

  return (
    <div className="invoice-management">
      <div className="invoice-header">
        <h2>Invoice Management</h2>
        <button className="btn btn-primary">Generate Invoice</button>
      </div>

      <div className="invoice-table-container">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.id}</td>
                <td>{invoice.user}</td>
                <td>{invoice.currency}{invoice.amount}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(invoice.status) }}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td>{new Date(invoice.date).toLocaleDateString()}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-sm btn-secondary">View</button>
                    <button className="btn btn-sm btn-primary">Download</button>
                    <button className="btn btn-sm btn-success">Send</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionManagement;