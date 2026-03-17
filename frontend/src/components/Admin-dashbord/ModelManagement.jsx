import React, { useState } from 'react';
import './ModelManagement.css';

const ModelManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [models, setModels] = useState([
    {
      id: 1,
      name: 'DeepFake Detector v3.2',
      type: 'Detection',
      accuracy: '94.8%',
      status: 'Active',
      version: '3.2.1',
      lastTrained: '2026-03-10',
      size: '2.1 GB'
    },
    {
      id: 2,
      name: 'Face Recognition Model',
      type: 'Recognition',
      accuracy: '97.2%',
      status: 'Active',
      version: '2.1.0',
      lastTrained: '2026-02-28',
      size: '1.8 GB'
    },
    {
      id: 3,
      name: 'Video Analysis Engine',
      type: 'Analysis',
      accuracy: '91.5%',
      status: 'Training',
      version: '1.5.2',
      lastTrained: '2026-03-15',
      size: '3.4 GB'
    },
    {
      id: 4,
      name: 'Audio Deepfake Detector',
      type: 'Detection',
      accuracy: '89.3%',
      status: 'Inactive',
      version: '1.2.0',
      lastTrained: '2026-01-20',
      size: '1.2 GB'
    }
  ]);

  const [newModel, setNewModel] = useState({
    name: '',
    type: 'Detection',
    accuracy: '',
    version: '',
    size: ''
  });

  // Calculate statistics
  const totalModels = models.length;
  const activeModels = models.filter(model => model.status === 'Active').length;
  const avgAccuracy = (models.reduce((sum, model) => sum + parseFloat(model.accuracy), 0) / models.length).toFixed(1);

  const handleAddModel = () => {
    if (newModel.name && newModel.accuracy && newModel.version && newModel.size) {
      const model = {
        id: Date.now(),
        ...newModel,
        status: 'Active',
        lastTrained: new Date().toISOString().split('T')[0]
      };
      setModels([...models, model]);
      setNewModel({ name: '', type: 'Detection', accuracy: '', version: '', size: '' });
      setShowAddModal(false);
    }
  };

  const handleDeleteModel = (modelId) => {
    if (window.confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      setModels(models.filter(model => model.id !== modelId));
    }
  };

  const toggleModelStatus = (modelId) => {
    setModels(models.map(model =>
      model.id === modelId
        ? { ...model, status: model.status === 'Active' ? 'Inactive' : 'Active' }
        : model
    ));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Active': 'active',
      'Inactive': 'inactive',
      'Training': 'training'
    };
    return (
      <span className={`status-badge ${statusColors[status]}`}>
        {status}
      </span>
    );
  };

  const getTypeColor = (type) => {
    const colors = {
      'Detection': 'detection',
      'Recognition': 'recognition',
      'Analysis': 'analysis'
    };
    return colors[type] || 'default';
  };

  return (
    <div className="model-management">
      <div className="page-title">
        <h1>Model Management</h1>
      </div>

      {/* Statistics Cards */}
      <div className="model-stats">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Models</span>
          </div>
          <div className="stat-value">{totalModels}</div>
          <div className="stat-description">All AI models in system</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Models</span>
          </div>
          <div className="stat-value">{activeModels}</div>
          <div className="stat-description">Currently deployed models</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Average Accuracy</span>
          </div>
          <div className="stat-value">{avgAccuracy}%</div>
          <div className="stat-description">Overall model performance</div>
        </div>
      </div>
    </div>
  );
};

export default ModelManagement;