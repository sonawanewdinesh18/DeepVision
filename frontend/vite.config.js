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
  optimizeDeps: {
    // framer-motion and lucide-react use dynamic imports internally; excluding
    // them avoids Vite pre-bundler mishandling that causes extra dev-server
    // round-trips on first load.
    exclude: ['framer-motion', 'lucide-react'],
  },
  build: {
    // Raise warning threshold — our vendor chunks are intentionally larger
    chunkSizeWarningLimit: 600,
    // Target modern browsers — avoids unnecessary syntax transforms that
    // increase parse cost (e.g. class field polyfills, optional chaining rewrites)
    target: 'es2020',
    // esbuild minifier is faster and produces comparable output to terser
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — loaded first, cached aggressively
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase auth — needed early but separate from UI
          'vendor-supabase': ['@supabase/supabase-js'],
          // Animation library — deferred, not needed for LCP
          'vendor-framer': ['framer-motion'],
          // Icon library — large tree, separate chunk for better cache granularity
          'vendor-icons': ['lucide-react'],
          // Toast notifications
          'vendor-sonner': ['sonner'],
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
