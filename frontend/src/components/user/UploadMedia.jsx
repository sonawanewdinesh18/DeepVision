import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileVideo, Image as ImageIcon, CheckCircle, X, Sparkles, Shield, Zap } from 'lucide-react';
import { detectionApi } from '@/services/api';
import toast from '@/utils/toast';
import './UploadMedia.css';

const UploadMedia = ({ setActiveView }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 50MB limit. Your file is ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
      toast.error('File too large! Maximum size is 50MB');
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload JPG, PNG, WebP, MP4, WebM, or MOV files');
      toast.error('Invalid file type!');
      return;
    }
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setFile(selectedFile);
    setError(null);
    toast.success('File selected successfully!');
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      setError(null);
      setProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Make actual API call
      const response = await detectionApi.detect(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      toast.success('Analysis complete!');
      
      // Navigate to result view with the detection ID
      setTimeout(() => {
        setActiveView('result', response.data.id);
      }, 500);
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
      toast.error('Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = () => {
    // Revoke the preview URL to free memory
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-view-modern">
      {/* Header */}
      <div className="upload-header">
        <div className="upload-header-content">
          <div className="upload-icon-badge">
            <Sparkles size={24} />
          </div>
          <h1 className="upload-title">Upload Media for Analysis</h1>
          <p className="upload-subtitle">
            Upload an image or video to detect deepfake manipulation using advanced AI
          </p>
        </div>
      </div>

      {/* Main Upload Area */}
      <div className="upload-main-card">
        {error && (
          <div className="upload-error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-close">
              <X size={16} />
            </button>
          </div>
        )}
        
        <div
          className={`upload-dropzone-modern ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="upload-empty-state">
              <div className="upload-icon-circle">
                <Upload size={48} strokeWidth={1.5} />
              </div>
              
              <h3 className="upload-empty-title">
                {dragActive ? 'Drop your file here' : 'Drag & drop your file here'}
              </h3>
              
              <p className="upload-empty-text">or</p>
              
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload-input"
                className="upload-file-input"
                accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                onChange={handleChange}
              />
              
              <label htmlFor="file-upload-input" className="upload-browse-btn">
                <Upload size={18} />
                Browse Files
              </label>
              
              <div className="upload-info-grid">
                <div className="upload-info-item">
                  <ImageIcon size={16} />
                  <span>Images: JPG, PNG, WebP</span>
                </div>
                <div className="upload-info-item">
                  <FileVideo size={16} />
                  <span>Videos: MP4, WebM, MOV</span>
                </div>
                <div className="upload-info-item">
                  <Shield size={16} />
                  <span>Max size: 50MB</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="upload-file-preview">
              {/* Media Preview */}
              <div className="media-preview-container">
                {file.type.startsWith('video') ? (
                  <video 
                    src={previewUrl} 
                    controls 
                    className="media-preview-video"
                    preload="metadata"
                  >
                    Your browser does not support video preview.
                  </video>
                ) : (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="media-preview-image"
                  />
                )}
              </div>

              {/* File Info Card */}
              <div className="file-preview-card">
                <div className="file-preview-icon">
                  {file.type.startsWith('video') ? (
                    <FileVideo size={24} />
                  ) : (
                    <ImageIcon size={24} />
                  )}
                </div>
                
                <div className="file-preview-details">
                  <h4 className="file-preview-name">{file.name}</h4>
                  <div className="file-preview-meta">
                    <span className="file-preview-size">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span className="file-preview-type">
                      {file.type.split('/')[1].toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="file-preview-status">
                  <CheckCircle size={24} />
                </div>
              </div>
              
              {!uploading && (
                <button onClick={removeFile} className="upload-remove-btn">
                  <X size={16} />
                  Remove File
                </button>
              )}
            </div>
          )}
        </div>

        {file && !uploading && (
          <button onClick={handleUpload} className="upload-analyze-btn">
            <Sparkles size={20} />
            Start AI Analysis
            <div className="btn-shine"></div>
          </button>
        )}

        {uploading && (
          <div className="upload-progress-section">
            <div className="upload-spinner-wrapper">
              <div className="upload-circular-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <p className="upload-progress-percentage">{progress}%</p>
            </div>
            <p className="upload-progress-text">
              {progress < 50 && '🚀 Uploading to secure servers...'}
              {progress >= 50 && progress < 90 && '🤖 AI models processing...'}
              {progress >= 90 && '✨ Finalizing results...'}
            </p>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="upload-features-grid">
        <div className="upload-feature-card">
          <div className="feature-icon-wrapper feature-icon-blue">
            <Zap size={24} />
          </div>
          <h3 className="feature-title">Lightning Fast</h3>
          <p className="feature-description">
            Quick and secure file upload with real-time progress tracking
          </p>
        </div>
        
        <div className="upload-feature-card">
          <div className="feature-icon-wrapper feature-icon-purple">
            <Sparkles size={24} />
          </div>
          <h3 className="feature-title">Advanced AI</h3>
          <p className="feature-description">
            State-of-the-art deep learning models for accurate detection
          </p>
        </div>
        
        <div className="upload-feature-card">
          <div className="feature-icon-wrapper feature-icon-green">
            <Shield size={24} />
          </div>
          <h3 className="feature-title">Secure & Private</h3>
          <p className="feature-description">
            Your files are encrypted and processed securely
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadMedia;
