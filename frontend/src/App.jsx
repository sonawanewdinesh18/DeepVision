/**
 * App.jsx
 * Root application component.
 * Provides global context providers and hands routing to AppRoutes.
 */

import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary, OfflineDetector } from '@/components/common';
import AppRoutes from '@/router/routes';
import useLastActive from '@/hooks/useLastActive';
import { healthApi } from '@/services/api';

function AppContent() {
  // Track user activity and update last active time
  useLastActive();

  // Pre-warm backend and keep Render container awake while browsing
  useEffect(() => {
    healthApi.checkHealth().catch(() => {});
    const interval = setInterval(() => {
      healthApi.checkHealth().catch(() => {});
    }, 4 * 60 * 1000); // every 4 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}


export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {/* Toast notifications — rendered outside AuthProvider so always visible */}
        <Toaster
          position="top-right"
          richColors
          expand={false}
          duration={4000}
          toastOptions={{
            style: {
              fontFamily: "'Inter', system-ui, sans-serif",
              borderRadius: '12px',
            },
          }}
        />
        
        {/* Offline detector banner */}
        <OfflineDetector />
        
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
