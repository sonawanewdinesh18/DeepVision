/**
 * Advanced Error Handling System
 * Production-ready error handling with user-friendly messages
 */

export const ErrorTypes = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  NOT_FOUND: 'not_found',
  PERMISSION: 'permission',
  RATE_LIMIT: 'rate_limit',
  UNKNOWN: 'unknown'
};

export const getErrorMessage = (error) => {
  // Network errors
  if (!navigator.onLine) {
    return {
      type: ErrorTypes.NETWORK,
      title: 'No internet connection',
      message: 'Please check your connection and try again.',
      action: 'Retry',
      icon: '📡'
    };
  }

  // HTTP status codes
  const status = error.response?.status;
  
  switch (status) {
    case 400:
      return {
        type: ErrorTypes.VALIDATION,
        title: 'Invalid request',
        message: error.response?.data?.detail || 'Please check your input and try again.',
        action: 'Fix',
        icon: '⚠️'
      };
    
    case 401:
      return {
        type: ErrorTypes.AUTH,
        title: 'Session expired',
        message: 'Please sign in again to continue.',
        action: 'Sign In',
        icon: '🔒'
      };
    
    case 403:
      return {
        type: ErrorTypes.PERMISSION,
        title: 'Access denied',
        message: "You don't have permission to perform this action.",
        action: 'Go Back',
        icon: '🚫'
      };
    
    case 404:
      return {
        type: ErrorTypes.NOT_FOUND,
        title: 'Not found',
        message: "The resource you're looking for doesn't exist.",
        action: 'Go Home',
        icon: '🔍'
      };
    
    case 429:
      return {
        type: ErrorTypes.RATE_LIMIT,
        title: 'Too many requests',
        message: 'Please slow down and try again in a moment.',
        action: 'Wait',
        icon: '⏱️'
      };
    
    case 500:
    case 502:
    case 503:
      return {
        type: ErrorTypes.SERVER,
        title: 'Server error',
        message: "Something went wrong on our end. We're working on it.",
        action: 'Retry',
        icon: '🔧'
      };
    
    default:
      return {
        type: ErrorTypes.UNKNOWN,
        title: 'Something went wrong',
        message: error.message || 'An unexpected error occurred.',
        action: 'Retry',
        icon: '❌'
      };
  }
};

export const handleError = (error, options = {}) => {
  const errorInfo = getErrorMessage(error);
  
  // Log to error tracking service (Sentry, LogRocket, etc.)
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      tags: { type: errorInfo.type },
      extra: { ...options }
    });
  }
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }
  
  return errorInfo;
};

export default { ErrorTypes, getErrorMessage, handleError };
