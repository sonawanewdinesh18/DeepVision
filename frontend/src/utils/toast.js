/**
 * Enhanced Toast System
 * Production-ready toast notifications with presets
 */

import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message, options = {}) => {
    sonnerToast.success(message, {
      duration: 3000,
      ...options,
    });
  },

  error: (message, options = {}) => {
    sonnerToast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  loading: (message, options = {}) => {
    return sonnerToast.loading(message, {
      ...options,
    });
  },

  promise: (promise, messages) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    });
  },

  custom: (component, options = {}) => {
    sonnerToast.custom(component, options);
  },

  // Action toast (like GitHub)
  action: (message, actionLabel, onAction) => {
    sonnerToast(message, {
      action: {
        label: actionLabel,
        onClick: onAction,
      },
      duration: 5000,
    });
  },

  // Undo toast (like Gmail)
  undo: (message, onUndo) => {
    sonnerToast(message, {
      action: {
        label: 'Undo',
        onClick: onUndo,
      },
      duration: 5000,
    });
  },

  // Dismiss specific toast
  dismiss: (toastId) => {
    sonnerToast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    sonnerToast.dismiss();
  },
};

export default toast;
