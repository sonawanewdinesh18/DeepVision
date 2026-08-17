import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { InlineLoader } from '../common/LoadingSpinner';
import './ModelManagement.css';

const ModelManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newModel, setNewModel] = useState({
    name: '',
    version: '',
    accuracy: 0,
    status: 'inactive'
  });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getModels();
      const data = response.data || response;
      setModels(data.models || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch models');
      console.error('Error fetching models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModel = async () => {
    if (newModel.name && newModel.version) {
      try {
        await adminApi.createModel(newModel);
        setNewModel({ name: '', version: '', accuracy: 0, status: 'inactive' });
        setShowAddModal(false);
        fetchModels();
      } catch (err) {
        alert('Failed to create model: ' + err.message);
      }
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        await adminApi.deleteModel(modelId);
        fetchModels();
      } catch (err) {
        alert('Failed to delete model: ' + err.message);
      }
    }
  };

  const handleUpdateStatus = async (modelId, newStatus) => {
    try {
      await adminApi.updateModel(modelId, { status: newStatus });
      fetchModels();
    } catch (err) {
      alert('Failed to update model: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="model-management">
        <div className="page-header">
          <h1>MODEL MANAGEMENT</h1>
          <p>Manage AI models and their configurations</p>
        </div>
        <InlineLoader message="Loading models..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="model-management">
        <div className="page-header">
          <h1>MODEL MANAGEMENT</h1>
          <p>Manage AI models and their configurations</p>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchModels} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="model-management">
      <div className="page-header">
        <div className="header-content">
          <h1>MODEL MANAGEMENT</h1>
          <p>Manage AI models and their configurations</p>
        </div>
        <button className="add-model-btn" onClick={() => setShowAddModal(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Model
        </button>
      </div>

      <div className="models-grid">
        {models.map((model) => (
          <div key={model.id} className="model-card">
            <div className="model-header">
              <h3>{model.name}</h3>
              <span className={`model-status ${model.status}`}>{model.status}</span>
            </div>
            <div className="model-body">
              <div className="model-info">
                <span className="info-label">Version:</span>
                <span className="info-value">{model.version}</span>
              </div>
              <div className="model-info">
                <span className="info-label">Accuracy:</span>
                <span className="info-value">{model.accuracy}%</span>
              </div>
              <div className="model-info">
                <span className="info-label">Detections:</span>
                <span className="info-value">{model.detection_count || 0}</span>
              </div>
            </div>
            <div className="model-actions">
              <button
                className="action-btn"
                onClick={() => handleUpdateStatus(model.id, model.status === 'active' ? 'inactive' : 'active')}
              >
                {model.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="action-btn delete"
                onClick={() => handleDeleteModel(model.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {models.length === 0 && (
        <div className="empty-state">
          <h3>No models found</h3>
          <p>Add your first AI model to get started.</p>
        </div>
      )}

      {/* Add Model Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Model</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Model Name</label>
                <input
                  type="text"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  placeholder="Enter model name"
                />
              </div>
              <div className="form-group">
                <label>Version</label>
                <input
                  type="text"
                  value={newModel.version}
                  onChange={(e) => setNewModel({ ...newModel, version: e.target.value })}
                  placeholder="e.g., 1.0.0"
                />
              </div>
              <div className="form-group">
                <label>Accuracy (%)</label>
                <input
                  type="number"
                  value={newModel.accuracy}
                  onChange={(e) => setNewModel({ ...newModel, accuracy: parseFloat(e.target.value) })}
                  placeholder="0-100"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newModel.status}
                  onChange={(e) => setNewModel({ ...newModel, status: e.target.value })}
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleAddModel}>Add Model</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelManagement;
