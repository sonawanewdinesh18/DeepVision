/**
 * Route Guards
 * Centralized auth-aware route protection for DeepVision.
 *
 *  PublicRoute  — redirects authenticated users away from auth pages
 *  ProtectedRoute — requires a logged-in user
 *  AdminRoute   — requires both a logged-in user AND admin privileges
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/* ─── Full-screen loader shown while auth state is resolving ─── */
function AuthLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Animated ring spinner */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid var(--border-card)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Loading…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

/* ─── Public Route ─────────────────────────────────────────────
   Accessible only when NOT authenticated.
   If user is already logged in → redirect to their dashboard.
──────────────────────────────────────────────────────────────── */
export function PublicRoute() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoader />;

  if (user) {
    // Email sign-in can carry a redirectTo in location.state
    const redirectTo = location.state?.redirectTo;
    if (redirectTo) return <Navigate to={redirectTo} replace />;

    // Google OAuth carries redirect in sessionStorage (state lost after external redirect)
    const pending = sessionStorage.getItem('pendingRedirect');
    if (pending) {
      sessionStorage.removeItem('pendingRedirect');
      return <Navigate to={pending} replace />;
    }

    return <Navigate to={isAdmin ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return <Outlet />;
}

/* ─── Protected Route ──────────────────────────────────────────
   Requires the user to be authenticated.
   Unauthenticated users are redirected to /signin with the
   current path stored so they return here after login.
──────────────────────────────────────────────────────────────── */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoader />;

  return user
    ? <Outlet />
    : <Navigate to="/signin" state={{ redirectTo: location.pathname }} replace />;
}

/* ─── Admin Route ──────────────────────────────────────────────
   Requires the user to be authenticated AND have admin privileges.
   Non-admins are redirected to their user dashboard.
──────────────────────────────────────────────────────────────── */
export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoader />;
  if (!user) return <Navigate to="/signin" state={{ redirectTo: location.pathname }} replace />;
  if (!isAdmin) return <Navigate to="/user-dashboard" replace />;

  return <Outlet />;
}
