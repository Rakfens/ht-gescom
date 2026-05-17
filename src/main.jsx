// main.jsx — v2 : watchdog ciblé (ne vide pas tout le localStorage)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// ─── Watchdog : si React ne monte pas en 15s, reload propre ──────────
const bootWatchdog = setTimeout(() => {
  console.error('[HT-GesCom] Timeout démarrage React. Rechargement...');
  try {
    // CORRIGÉ : on supprime uniquement la clé problématique,
    // pas tout le localStorage (évite de perdre les données utilisateur)
    localStorage.removeItem('ht_gescom_company');
    localStorage.removeItem('supabase.auth.token');
  } catch (_) {}
  try { sessionStorage.clear(); } catch (_) {}
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
  window.location.reload(true);
}, 15000);

// Annulé dès que App est monté avec succès (dans useEffect de App.jsx)
window.__cancelBootWatchdog = () => clearTimeout(bootWatchdog);

// ─── Rendu React ──────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);