/**
 * PageLoader Component
 * Full-screen loading spinner shown during page transitions
 */

import './PageLoader.css';

export function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-content">
        <div className="page-loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="page-loader-text">Loading...</p>
      </div>
    </div>
  );
}

export default PageLoader;
