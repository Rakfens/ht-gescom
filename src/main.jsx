// main.jsx (version avec configuration optionnelle)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Désactiver les logs React en production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.error = () => {};
}

// Détecter si c'est un environnement mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (isMobile) {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);