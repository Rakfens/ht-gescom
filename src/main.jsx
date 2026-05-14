// main.jsx - Version robuste
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Désactiver les logs React en production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.error = () => {};
}

// Rendu avec gestion des erreurs
const rootElement = document.getElementById('root');

if (rootElement) {
  // Vider le contenu pour éviter l'erreur #418
  rootElement.innerHTML = '';
  
  ReactDOM.createRoot(rootElement).render(<App />);
}