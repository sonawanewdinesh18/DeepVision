import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to error reporting service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorCount={this.state.errorCount}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo, errorCount, onReset }) {
  const handleGoHome = () => {
    onReset();
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'var(--bg-card)',
        borderRadius: '24px',
        padding: '48px 32px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-card)'
      }}>
        {/* Error Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AlertTriangle size={40} color="#ef4444" />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '900',
          color: 'var(--text-primary)',
          marginBottom: '12px',
          letterSpacing: '-0.02em'
        }}>
          Oops! Something went wrong
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          We encountered an unexpected error. Don't worry, your data is safe. 
          Try refreshing the page or go back home.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details style={{
            marginBottom: '32px',
            textAlign: 'left',
            background: 'var(--bg-surface)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <summary style={{
              cursor: 'pointer',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '12px'
            }}>
              Error Details (Dev Mode)
            </summary>
            <pre style={{
              fontSize: '0.75rem',
              color: '#ef4444',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {error.toString()}
              {errorInfo && errorInfo.componentStack}
            </pre>
          </details>
        )}

        {/* Error Count Warning */}
        {errorCount > 2 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            fontSize: '0.875rem',
            color: '#f59e0b'
          }}>
            Multiple errors detected. Consider clearing your browser cache or contacting support.
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleReload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #60a5fa, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(96, 165, 250, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <RefreshCw size={18} />
            Refresh Page
          </button>

          <button
            onClick={handleGoHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <Home size={18} />
            Go Home
          </button>
        </div>

        {/* Support Link */}
        <p style={{
          marginTop: '32px',
          fontSize: '0.875rem',
          color: 'var(--text-muted)'
        }}>
          Need help?{' '}
          <a
            href="mailto:support@deepvision.com"
            style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Contact Support
          </a>
        </p>
      </div>

      <style>{`
        @keyframes livepulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default ErrorBoundary;
