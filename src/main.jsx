// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css';

// Watchdog : si React ne monte pas en 15s, on force un reload propre
const bootWatchdog = setTimeout(() => {
  console.error('[HT-GesCom] Timeout démarrage React. Rechargement...');
  try { localStorage.clear(); } catch(e) {}
  try { sessionStorage.clear(); } catch(e) {}
  window.location.reload(true);
}, 15000);

// On annule le watchdog dès que React est prêt
window.__cancelBootWatchdog = () => clearTimeout(bootWatchdog);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)