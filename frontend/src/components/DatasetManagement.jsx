import React, { useState } from 'react';
import './DatasetManagement.css';

const DatasetManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [datasets, setDatasets] = useState([
    {
      id: 1,
      name: 'FaceForensics++',
      type: 'Training',
      size: '28.5 GB',
      samples: '150,000',
      status: 'Ready',
      lastModified: '2024-12-10'
    },
    {
      id: 2,
      name: 'Celeb-DF-v2',
      type: 'Testing',
      size: '12.2 GB',
      samples: '85,000',
      status: 'Ready',
      lastModified: '2024-11-25'
    },
    {
      id: 3,
      name: 'DeepFake Detection Challenge',
      type: 'Training',
      size: '450 GB',
      samples: '1,200,000',
      status: 'Indexing...',
      lastModified: '2025-05-15'
    },
    {
      id: 4,
      name: 'Custom User Uploads 2025',
      type: 'Validation',
      size: '5.4 GB',
      samples: '12,400',
      status: 'Ready',
      lastModified: '2025-05-14'
    }
  ]);

  const [newDataset, setNewDataset] = useState({
    name: '',
    type: 'Training',
    size: '',
    samples: '',
    status: 'Ready'
  });

  const stats = {
    totalStorage: '1.8 TB',
    totalSamples: '1.4M+',
    activeDatasets: datasets.length.toString()
  };

  const handleAddDataset = () => {
    if (newDataset.name && newDataset.size && newDataset.samples) {
      const dataset = {
        id: Date.now(),
        ...newDataset,
        lastModified: new Date().toISOString().split('T')[0]
      };
      setDatasets([...datasets, dataset]);
      setNewDataset({ name: '', type: 'Training', size: '', samples: '', status: 'Ready' });
      setShowAddModal(false);
    }
  };

  const handleDeleteDataset = (datasetId) => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      setDatasets(datasets.filter(dataset => dataset.id !== datasetId));
    }
  };

  const handleRefreshDataset = (datasetId) => {
    setDatasets(datasets.map(dataset =>
      dataset.id === datasetId
        ? { ...dataset, status: 'Indexing...', lastModified: new Date().toISOString().split('T')[0] }
        : dataset
    ));
    
    // Simulate refresh completion after 3 seconds
    setTimeout(() => {
      setDatasets(prev => prev.map(dataset =>
        dataset.id === datasetId
          ? { ...dataset, status: 'Ready' }
          : dataset
      ));
    }, 3000);
  };

  const getStatusBadge = (status) => {
    const isProcessing = status.includes('...');
    return (
      <span className={`status-badge ${isProcessing ? 'processing' : 'ready'}`}>
        {status}
      </span>
    );
  };

  const getTypeColor = (type) => {
    const colors = {
      'Training': 'training',
      'Testing': 'testing',
      'Validation': 'validation'
    };
    return colors[type] || 'default';
  };

  return (
    <div className="dataset-management">
      <div className="page-title">
        <h1>Dataset Management</h1>
      </div>

      <div className="page-actions">
        <button className="add-dataset-btn" onClick={() => setShowAddModal(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Dataset
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Storage Used</span>
          </div>
          <div className="stat-value">{stats.totalStorage}</div>
          <div className="stat-description">Total disk space used</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Training Samples</span>
          </div>
          <div className="stat-value">{stats.totalSamples}</div>
          <div className="stat-description">Combined training samples</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Datasets</span>
          </div>
          <div className="stat-value">{stats.activeDatasets}</div>
          <div className="stat-description">Available datasets</div>
        </div>
      </div>

      <div className="datasets-section">
        <h2>Available Datasets</h2>
        
        <div className="table-wrapper">
          <div className="datasets-table">
            <div className="table-header">
              <div className="header-cell name-col">Dataset Name</div>
              <div className="header-cell type-col">Type</div>
              <div className="header-cell size-col">Size</div>
              <div className="header-cell samples-col">Samples</div>
              <div className="header-cell status-col">Status</div>
              <div className="header-cell modified-col">Last Modified</div>
              <div className="header-cell actions-col">Actions</div>
            </div>

            <div className="table-body">
              {datasets.map((dataset) => (
                <div key={dataset.id} className="table-row">
                  <div className="table-cell name-col">
                    <div className="dataset-info">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dataset-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                      <span className="dataset-name">{dataset.name}</span>
                    </div>
                  </div>
                  <div className="table-cell type-col">
                    <span className={`type-badge ${getTypeColor(dataset.type)}`}>
                      {dataset.type}
                    </span>
                  </div>
                  <div className="table-cell size-col">{dataset.size}</div>
                  <div className="table-cell samples-col">{dataset.samples}</div>
                  <div className="table-cell status-col">
                    {getStatusBadge(dataset.status)}
                  </div>
                  <div className="table-cell modified-col">{dataset.lastModified}</div>
                  <div className="table-cell actions-col">
                    <div className="action-buttons">
                      <button 
                        className="action-btn refresh" 
                        title="Refresh Dataset"
                        onClick={() => handleRefreshDataset(dataset.id)}
                        disabled={dataset.status.includes('...')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10"/>
                          <polyline points="1 20 1 14 7 14"/>
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn delete" 
                        title="Delete Dataset"
                        onClick={() => handleDeleteDataset(dataset.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Dataset Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Dataset</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Dataset Name</label>
                <input
                  type="text"
                  value={newDataset.name}
                  onChange={(e) => setNewDataset({...newDataset, name: e.target.value})}
                  placeholder="Enter dataset name"
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newDataset.type}
                  onChange={(e) => setNewDataset({...newDataset, type: e.target.value})}
                >
                  <option value="Training">Training</option>
                  <option value="Testing">Testing</option>
                  <option value="Validation">Validation</option>
                </select>
              </div>
              <div className="form-group">
                <label>Size</label>
                <input
                  type="text"
                  value={newDataset.size}
                  onChange={(e) => setNewDataset({...newDataset, size: e.target.value})}
                  placeholder="e.g., 10.5 GB"
                />
              </div>
              <div className="form-group">
                <label>Number of Samples</label>
                <input
                  type="text"
                  value={newDataset.samples}
                  onChange={(e) => setNewDataset({...newDataset, samples: e.target.value})}
                  placeholder="e.g., 50,000"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newDataset.status}
                  onChange={(e) => setNewDataset({...newDataset, status: e.target.value})}
                >
                  <option value="Ready">Ready</option>
                  <option value="Processing...">Processing</option>
                  <option value="Indexing...">Indexing</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddDataset}>
                Add Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetManagement;