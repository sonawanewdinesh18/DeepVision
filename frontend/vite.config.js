import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Raise warning threshold — our vendor chunks are intentionally larger
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — loaded first, cached aggressively
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase auth — needed early but separate from UI
          'vendor-supabase': ['@supabase/supabase-js'],
          // UI / animation libs — deferred, not needed for LCP
          'vendor-ui': ['framer-motion', 'lucide-react', 'sonner'],
          // HTTP client
          'vendor-axios': ['axios'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
