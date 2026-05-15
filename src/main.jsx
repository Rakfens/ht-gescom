// main.jsx
console.log('🟢 1. main.jsx chargé');

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

console.log('🟢 2. Imports chargés');

// Désactiver les logs React en production
if (import.meta.env.PROD) {
  console.log = () => {};
}

console.log('🟢 3. Avant rendu React');

// Rendu SANS StrictMode
ReactDOM.createRoot(document.getElementById('root')).render(<App />);

console.log('🟢 4. Après rendu React');