import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { InlineLoader } from '../common/LoadingSpinner';
import './PricingPlans.css';

const PricingPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(true);
  
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchPlans();
  }, [includeInactive]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getPricingPlans(includeInactive);
      setPlans(response.plans || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch pricing plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
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
      setFormData({
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
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setNewFeature('');
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingPlan) {
        await adminApi.updatePricingPlan(editingPlan.id, formData);
      } else {
        await adminApi.createPricingPlan({
          ...formData,
          name: formData.display_name.toLowerCase().replace(/\s+/g, '_')
        });
      }
      handleCloseModal();
      fetchPlans();
    } catch (err) {
      alert('Failed to save pricing plan: ' + err.message);
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to deactivate this pricing plan?')) {
      try {
        await adminApi.deletePricingPlan(planId);
        fetchPlans();
      } catch (err) {
        alert('Failed to delete pricing plan: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="pricing-plans-management">
        <div className="page-header">
          <h1>PRICING PLANS</h1>
          <p>Manage subscription plans and pricing</p>
        </div>
        <InlineLoader message="Loading pricing plans..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pricing-plans-management">
        <div className="page-header">
          <h1>PRICING PLANS</h1>
          <p>Manage subscription plans and pricing</p>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchPlans} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-plans-management">
      <div className="page-header">
        <div className="header-content">
          <h1>PRICING PLANS</h1>
          <p>Manage subscription plans and pricing</p>
        </div>
        <div className="header-actions">
          <label className="toggle-inactive">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show Inactive
          </label>
          <button className="add-plan-btn" onClick={() => handleOpenModal()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Plan
          </button>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${!plan.is_active ? 'inactive' : ''}`}>
            <div className="plan-header">
              <h3>{plan.display_name}</h3>
              {!plan.is_active && <span className="inactive-badge">Inactive</span>}
            </div>
            <div className="plan-price">
              <span className="currency">$</span>
              <span className="amount">{plan.price}</span>
              <span className="period">/{plan.billing_period}</span>
            </div>
            <p className="plan-description">{plan.description}</p>
            
            <div className="plan-features">
              <h4>Features:</h4>
              <ul>
                {(Array.isArray(plan.features) ? plan.features : []).map((feature, idx) => (
                  <li key={idx}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="plan-limits">
              <div className="limit-item">
                <span className="limit-label">Detections:</span>
                <span className="limit-value">
                  {plan.max_detections === -1 ? 'Unlimited' : plan.max_detections}
                </span>
              </div>
              <div className="limit-item">
                <span className="limit-label">Storage:</span>
                <span className="limit-value">
                  {plan.max_storage_gb === -1 ? 'Unlimited' : `${plan.max_storage_gb} GB`}
                </span>
              </div>
            </div>

            <div className="plan-actions">
              <button className="action-btn edit" onClick={() => handleOpenModal(plan)}>
                Edit
              </button>
              <button className="action-btn delete" onClick={() => handleDelete(plan.id)}>
                Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="empty-state">
          <h3>No pricing plans found</h3>
          <p>Create your first pricing plan to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPlan ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Plan Name</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="e.g., Premium"
                  />
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the plan"
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Billing Period</label>
                  <select
                    value={formData.billing_period}
                    onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Features</label>
                <div className="features-input">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                    placeholder="Add a feature..."
                  />
                  <button type="button" onClick={handleAddFeature} className="add-feature-btn">
                    Add
                  </button>
                </div>
                <ul className="features-list">
                  {formData.features.map((feature, idx) => (
                    <li key={idx}>
                      {feature}
                      <button onClick={() => handleRemoveFeature(idx)}>×</button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Detections (-1 for unlimited)</label>
                  <input
                    type="number"
                    value={formData.max_detections}
                    onChange={(e) => setFormData({ ...formData, max_detections: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Max Storage GB (-1 for unlimited)</label>
                  <input
                    type="number"
                    value={formData.max_storage_gb}
                    onChange={(e) => setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.priority_support}
                    onChange={(e) => setFormData({ ...formData, priority_support: e.target.checked })}
                  />
                  Priority Support
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.api_access}
                    onChange={(e) => setFormData({ ...formData, api_access: e.target.checked })}
                  />
                  API Access
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.custom_models}
                    onChange={(e) => setFormData({ ...formData, custom_models: e.target.checked })}
                  />
                  Custom Models
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
              <button className="save-btn" onClick={handleSubmit}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPlans;
