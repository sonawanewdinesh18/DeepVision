/**
 * Route Definitions
 * Single source of truth for all application routes.
 *
 * Import this into App.jsx to keep the root component clean.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute, ProtectedRoute, AdminRoute } from './guards';
import { PageLoader } from '@/components/common';

// Pages — lazy-loaded for better performance
const LandingPage     = lazy(() => import('@/pages/LandingPage'));
const SignIn          = lazy(() => import('@/pages/SignIn'));
const SignUp          = lazy(() => import('@/pages/SignUp'));
const ForgotPassword  = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword   = lazy(() => import('@/pages/ResetPassword'));
const UserDashboard   = lazy(() => import('@/pages/UserDashboard'));
const AdminDashboard  = lazy(() => import('@/pages/AdminDashboard'));

/* ─── App Routes ────────────────────────────────────────────── */
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Public / unauthenticated ──────────────────────── */}
        <Route path="/"         element={<LandingPage />} />

        {/* Reset password — accessible to all (session established via email link) */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Auth routes — redirect away if already logged in ── */}
        <Route element={<PublicRoute />}>
          <Route path="/signin"          element={<SignIn />} />
          <Route path="/signup"          element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* ── User authenticated routes ─────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/user-dashboard" element={<UserDashboard />} />
        </Route>

        {/* ── Admin only routes ─────────────────────────────── */}
        <Route element={<AdminRoute />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        {/* ── 404 catch-all ─────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}

/* ─── 404 Page ──────────────────────────────────────────────── */
function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      gap: 16,
      textAlign: 'center',
      padding: '0 24px',
    }}>
      <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Page not found</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: 380 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <a href="/" style={{
        marginTop: 8,
        padding: '12px 28px',
        borderRadius: 9999,
        background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)',
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.95rem',
        textDecoration: 'none',
      }}>
        Go Home
      </a>
    </div>
  );
}
