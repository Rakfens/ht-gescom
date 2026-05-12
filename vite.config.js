// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true,
    force: true,  // ← AJOUTÉ : force le re-build des dépendances
    watch: {
      usePolling: true  // ← AJOUTÉ : utile pour certains systèmes de fichiers
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  preview: {
    port: 4173,
    host: true
  },
  optimizeDeps: {
    force: true  // ← AJOUTÉ : force l'optimisation des dépendances
  }
});