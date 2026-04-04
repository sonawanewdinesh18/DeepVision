import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

// Full page loading spinner with circular rings
export function FullPageLoader({ message = 'Loading...' }) {
  return (
    <div className="full-page-loader">
      <div className="loader-content">
        <div className="full-circular-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loader-message">{message}</p>
      </div>
    </div>
  );
}

// Inline loading spinner with circular rings
export function InlineLoader({ size = 'md', message }) {
  const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80
  };

  const spinnerSize = sizeMap[size];

  return (
    <div className={`inline-loader inline-loader-${size}`}>
      <div className="inline-circular-spinner" style={{ width: spinnerSize, height: spinnerSize }}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <span className="loader-message">{message}</span>}
    </div>
  );
}

// Button loading spinner
export function ButtonLoader({ size = 18 }) {
  return (
    <Loader2 className="button-spinner" size={size} />
  );
}

// Skeleton loader for content
export function SkeletonLoader({ type = 'text', count = 1 }) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (type === 'text') {
    return (
      <div className="skeleton-container">
        {skeletons.map((i) => (
          <div key={i} className="skeleton skeleton-text" />
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="skeleton-container">
        {skeletons.map((i) => (
          <div key={i} className="skeleton skeleton-card">
            <div className="skeleton skeleton-image" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'avatar') {
    return <div className="skeleton skeleton-avatar" />;
  }

  if (type === 'dashboard') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="inline-circular-spinner" style={{ width: 60, height: 60 }}>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '14px',
          fontWeight: 500
        }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  return <div className="skeleton skeleton-text" />;
}

// Progress bar loader
export function ProgressLoader({ progress = 0, message }) {
  return (
    <div className="progress-loader">
      {message && <p className="progress-message">{message}</p>}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="progress-percent">{Math.round(progress)}%</p>
    </div>
  );
}

// Dots loader
export function DotsLoader() {
  return (
    <div className="dots-loader">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>
  );
}

export default FullPageLoader;
