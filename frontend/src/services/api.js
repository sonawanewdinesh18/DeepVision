/**
 * API Service Layer
 * Axios instance pre-configured to talk to the DeepVision FastAPI backend.
 *
 * Features:
 *  - Base URL from VITE_API_URL env var (proxied via vite.config.js in dev)
 *  - Automatic Authorization header injection from Supabase session
 *  - Global error handling (clears session on 401)
 *  - Automatic retry logic with exponential backoff
 */

import axios from 'axios';
import { supabase } from '@/lib/supabase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ─── Request interceptor — attach JWT ──────────────────────── */
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => Promise.reject(error));

/* ─── Response interceptor — handle global errors ───────────── */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;

    // 401 Unauthorized — token expired or invalid; sign out
    if (status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/';
      return Promise.reject(error);
    }

    // Retry logic for specific status codes
    if (
      RETRY_STATUS_CODES.includes(status) &&
      config &&
      !config.__retryCount
    ) {
      config.__retryCount = 0;
    }

    if (
      config &&
      config.__retryCount !== undefined &&
      config.__retryCount < MAX_RETRIES
    ) {
      config.__retryCount += 1;

      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, config.__retryCount - 1);

      console.log(`Retrying request (${config.__retryCount}/${MAX_RETRIES}) after ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    // Normalize error shape to match backend format
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';

    return Promise.reject(new Error(message));
  },
);

export default api;

/* ─── User API helpers ────────────────────────────────────────── */
export const userApi = {
  /**
   * Get current user's profile.
   * @returns {Promise<UserProfile>}
   */
  getProfile: () =>
    api.get('/api/v1/user/me'),

  /**
   * Update current user's profile.
   * @param {Object} data — profile update data
   */
  updateProfile: (data) =>
    api.put('/api/v1/user/me', data),

  /**
   * Get current user's detection statistics.
   * @returns {Promise<UserStatistics>}
   */
  getStats: () =>
    api.get('/api/v1/user/me/stats'),

  /**
   * Delete current user's account.
   */
  deleteAccount: () =>
    api.delete('/api/v1/user/me'),

  // ═══ Settings ═══
  /**
   * Get user settings/preferences.
   * @returns {Promise<UserSettings>}
   */
  getSettings: () =>
    api.get('/api/v1/user/settings'),

  /**
   * Update user settings/preferences.
   * @param {Object} settings - Settings to update
   */
  updateSettings: (settings) =>
    api.put('/api/v1/user/settings', settings),

  // ═══ Analytics ═══
  /**
   * Get user analytics overview.
   * @returns {Promise<AnalyticsOverview>}
   */
  getAnalyticsOverview: () =>
    api.get('/api/v1/user/analytics/overview'),

  /**
   * Get chart data for analytics.
   * @param {number} days - Number of days (default: 7)
   * @returns {Promise<ChartData>}
   */
  getAnalyticsChart: (days = 7) =>
    api.get('/api/v1/user/analytics/chart', { params: { days } }),

  // ═══ Subscription ═══
  /**
   * Get current subscription details.
   * @returns {Promise<Subscription>}
   */
  getSubscription: () =>
    api.get('/api/v1/user/subscription'),

  /**
   * Get available subscription plans.
   * @returns {Promise<SubscriptionPlan[]>}
   */
  getSubscriptionPlans: () =>
    api.get('/api/v1/user/subscription/plans'),

  /**
   * Upgrade subscription.
   * @param {string} planId - Plan ID to upgrade to
   * @param {string} paymentMethod - Payment method (default: 'card')
   */
  upgradeSubscription: (planId, paymentMethod = 'card') =>
    api.post('/api/v1/user/subscription/upgrade', { plan_id: planId, payment_method: paymentMethod }),

  /**
   * Cancel subscription (at period end).
   */
  cancelSubscription: () =>
    api.post('/api/v1/user/subscription/cancel'),

  // ═══ Payments ═══
  /**
   * Get payment history.
   * @param {{ page?: number, limit?: number }} params
   * @returns {Promise<PaymentHistory>}
   */
  getPayments: (params = {}) =>
    api.get('/api/v1/user/payments', { params }),

  /**
   * Get payment details by ID.
   * @param {string} paymentId
   * @returns {Promise<PaymentDetails>}
   */
  getPaymentDetails: (paymentId) =>
    api.get(`/api/v1/user/payments/${paymentId}`),

  // ═══ Feedback ═══
  /**
   * Submit feedback.
   * @param {Object} feedback - { subject, message, detection_id? }
   * @returns {Promise<Feedback>}
   */
  submitFeedback: (feedback) =>
    api.post('/api/v1/user/feedback', feedback),

  /**
   * Get user's feedback history.
   * @returns {Promise<Feedback[]>}
   */
  getFeedback: () =>
    api.get('/api/v1/user/feedback'),

  /**
   * Get feedback details by ID.
   * @param {string} feedbackId
   * @returns {Promise<Feedback>}
   */
  getFeedbackDetails: (feedbackId) =>
    api.get(`/api/v1/user/feedback/${feedbackId}`),

  // ═══ Notifications ═══
  /**
   * Get notifications.
   * @param {boolean} unreadOnly - Get only unread notifications
   * @returns {Promise<NotificationResponse>}
   */
  getNotifications: (unreadOnly = false) =>
    api.get('/api/v1/user/notifications', { params: { unread_only: unreadOnly } }),

  /**
   * Mark notification as read.
   * @param {string} notificationId
   */
  markNotificationRead: (notificationId) =>
    api.put(`/api/v1/user/notifications/${notificationId}/read`),

  /**
   * Delete notification.
   * @param {string} notificationId
   */
  deleteNotification: (notificationId) =>
    api.delete(`/api/v1/user/notifications/${notificationId}`),
};

/* ─── Detection API helpers ──────────────────────────────────── */
export const detectionApi = {
  /**
   * Upload media for deepfake detection.
   * @param {File} file — image or video file
   * @returns {Promise<DetectionResult>}
   */
  detect: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/api/v1/detection/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Fetch the detection history for the current user.
   * @param {{ page?: number, limit?: number }} params
   */
  getHistory: (params = {}) =>
    api.get('/api/v1/detection/history', { params }),

  /**
   * Fetch a single detection result by ID.
   * @param {string} id
   */
  getResult: (id) =>
    api.get(`/api/v1/detection/${id}`),

  /**
   * Delete a detection by ID.
   * @param {string} id
   */
  deleteDetection: (id) =>
    api.delete(`/api/v1/detection/${id}`),
};


/* ─── Admin API helpers ──────────────────────────────────────── */
export const adminApi = {
  /**
   * Get admin dashboard statistics.
   * @returns {Promise<AdminStats>}
   */
  getStats: () =>
    api.get('/api/v1/admin/stats'),

  /**
   * Get recent activity across all users.
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<ActivityList>}
   */
  getActivity: (limit = 10) =>
    api.get('/api/v1/admin/activity', { params: { limit } }),

  /**
   * Get chart data for detections.
   * @param {number} days - Number of days to fetch
   * @returns {Promise<ChartData>}
   */
  getChartData: (days = 7) =>
    api.get('/api/v1/admin/chart-data', { params: { days } }),

  /**
   * Get all users with pagination.
   * @param {{ page?: number, limit?: number }} params
   * @returns {Promise<UsersList>}
   */
  getUsers: (params = {}) =>
    api.get('/api/v1/admin/users', { params }),

  // User Management CRUD
  createUser: (data) =>
    api.post('/api/v1/admin/users', null, { params: data }),

  updateUser: (userId, data) =>
    api.put(`/api/v1/admin/users/${userId}`, null, { params: data }),

  toggleUserStatus: (userId) =>
    api.put(`/api/v1/admin/users/${userId}/toggle-status`),

  deleteUser: (userId) =>
    api.delete(`/api/v1/admin/users/${userId}`),

  // Model Management CRUD
  getModels: () =>
    api.get('/api/v1/admin/models'),

  createModel: (data) =>
    api.post('/api/v1/admin/models', null, { params: data }),

  updateModel: (modelId, data) =>
    api.put(`/api/v1/admin/models/${modelId}`, null, { params: data }),

  deleteModel: (modelId) =>
    api.delete(`/api/v1/admin/models/${modelId}`),

  // Feedback Management CRUD
  getFeedback: (params = {}) =>
    api.get('/api/v1/admin/feedback', { params }),

  updateFeedback: (feedbackId, status, adminResponse = null) =>
    api.put(`/api/v1/admin/feedback/${feedbackId}`, null, {
      params: { status, admin_response: adminResponse }
    }),

  deleteFeedback: (feedbackId) =>
    api.delete(`/api/v1/admin/feedback/${feedbackId}`),

  // Subscription Management
  getSubscriptions: () =>
    api.get('/api/v1/admin/subscriptions'),

  updateSubscription: (userId, subscriptionPlan) =>
    api.put(`/api/v1/admin/subscriptions/${userId}`, null, {
      params: { subscription_plan: subscriptionPlan }
    }),

  // Pricing Plans Management
  getPricingPlans: (includeInactive = false) =>
    api.get('/api/v1/admin/pricing-plans', {
      params: { include_inactive: includeInactive }
    }),

  createPricingPlan: (data) =>
    api.post('/api/v1/admin/pricing-plans', null, { params: data }),

  updatePricingPlan: (planId, data) =>
    api.put(`/api/v1/admin/pricing-plans/${planId}`, null, { params: data }),

  deletePricingPlan: (planId) =>
    api.delete(`/api/v1/admin/pricing-plans/${planId}`),
};

