import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PublicRoute, ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth routes (only accessible if NOT logged in) */}
            <Route element={<PublicRoute />}>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Reset Password must be accessible even if a session is just established via email link */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* User authenticated routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/user-dashboard" element={<UserDashboard />} />
            </Route>

            {/* Admin only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Route>

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
