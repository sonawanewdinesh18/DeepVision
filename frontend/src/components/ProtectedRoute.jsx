import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user ? <Outlet /> : <Navigate to="/signin" replace />;
}

export function AdminRoute() {
    const { user, isAdmin, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/signin" replace />;
    if (!isAdmin) return <Navigate to="/user-dashboard" replace />;
    return <Outlet />;
}

export function PublicRoute() {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();
    if (loading) return <div>Loading...</div>;
    if (user) {
        // Check location state first (email sign-in path)
        const redirectTo = location.state?.redirectTo;
        if (redirectTo) {
            return <Navigate to={redirectTo} replace />;
        }
        // Check sessionStorage (Google OAuth path — state is lost after redirect)
        const pending = sessionStorage.getItem('pendingRedirect');
        if (pending) {
            sessionStorage.removeItem('pendingRedirect');
            return <Navigate to={pending} replace />;
        }
        return <Navigate to={isAdmin ? '/admin-dashboard' : '/user-dashboard'} replace />;
    }
    return <Outlet />;
}
