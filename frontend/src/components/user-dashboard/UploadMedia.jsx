import React, { useState } from 'react';
import { Upload, FileVideo, Image as ImageIcon, CheckCircle, Loader } from 'lucide-react';
import './UploadMedia.css';

const UploadMedia = ({ setActiveView }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    setUploading(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setActiveView('result');
        }, 500);
      }
    }, 200);
  };

  return (
    <div className="upload-view space-y-24">
      <div className="page-title">
        <h1>Upload Media</h1>
        <p>Upload an image or video to detect deepfake manipulation</p>
      </div>

      <div className="card text-center">
        <div
          className={`upload-dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="empty-state-upload">
              <Upload size={64} strokeWidth={1.5} className="upload-icon-large mx-auto mb-4" />
              <h3>Drop your file here</h3>
              <p>or click to browse</p>
              
              <input
                type="file"
                id="file-upload"
                className="hidden-file-input"
                accept="image/*,video/*"
                onChange={handleChange}
              />
              <label htmlFor="file-upload" className="btn btn-primary mt-4 cursor-pointer inline-flex">
                Select File
              </label>
              
              <p className="supported-formats mt-6">Supported formats: JPG, PNG, MP4 (Max 100MB)</p>
            </div>
          ) : (
            <div className="file-info-state">
              <div className="file-info-card">
                {file.type.startsWith('video') ? (
                  <FileVideo size={48} className="file-type-icon text-primary" />
                ) : (
                  <ImageIcon size={48} className="file-type-icon text-primary" />
                )}
                <div className="file-details text-left">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <CheckCircle size={28} className="text-success ml-auto" />
              </div>
              <button onClick={() => setFile(null)} className="btn btn-ghost mt-6 text-error">
                Remove File
              </button>
            </div>
          )}
        </div>

        {file && !uploading && (
          <div className="start-detection-wrapper mt-8">
            <button onClick={handleUpload} className="btn btn-primary btn-lg">
              Start Detection
            </button>
          </div>
        )}

        {uploading && (
          <div className="uploading-state mt-8">
            <div className="flex-center gap-3 mb-4">
              <Loader size={24} className="text-primary spinner" />
              <span className="upload-progress-text">Processing... {progress}%</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="uploading-help-text mt-4">
              AI is analyzing your media for deepfake detection
            </p>
          </div>
        )}
      </div>

      <div className="features-grid">
        <div className="card feature-card text-center">
          <div className="feature-icon-wrapper bg-info-ghost">
            <Upload size={24} className="text-info" />
          </div>
          <h3>Fast Upload</h3>
          <p>Quick and secure file upload process</p>
        </div>
        
        <div className="card feature-card text-center">
          <div className="feature-icon-wrapper bg-purple-ghost">
            <CheckCircle size={24} className="text-primary-light" />
          </div>
          <h3>AI Powered</h3>
          <p>Advanced deep learning algorithms</p>
        </div>
        
        <div className="card feature-card text-center">
          <div className="feature-icon-wrapper bg-success-ghost">
            <FileVideo size={24} className="text-success" />
          </div>
          <h3>Multi-Format</h3>
          <p>Support for images and videos</p>
        </div>
      </div>
    </div>
  );
};

export default UploadMedia;
