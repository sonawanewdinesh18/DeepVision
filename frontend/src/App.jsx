/**
 * App.jsx
 * Root application component.
 * Provides global context providers and hands routing to AppRoutes.
 */

import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary, OfflineDetector } from '@/components/common';
import AppRoutes from '@/router/routes';

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
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
