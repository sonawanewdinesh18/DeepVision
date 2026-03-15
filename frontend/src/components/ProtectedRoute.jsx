import { Navigate, Outlet } from 'react-router-dom';
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
    if (loading) return <div>Loading...</div>;
    if (user) {
        return <Navigate to={isAdmin ? "/admin-dashboard" : "/user-dashboard"} replace />;
    }
    return <Outlet />;
}
