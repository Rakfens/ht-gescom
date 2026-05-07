import { useState } from 'react';
import { COLORS } from '../utils/constants';
import { btn, inp, lbl } from '../utils/helpers';

export const Login = ({ logoUrl, onLogin, error: externalError, email, setEmail, password, setPassword }) => {
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      setLocalError('Email et mot de passe requis');
      return;
    }
    try {
      setLocalError('');
      await onLogin(email, password);
    } catch (err) {
      setLocalError(err.message || 'Erreur de connexion');
    }
  };

  const displayError = externalError || localError;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: COLORS.card, border: '1px solid ' + COLORS.border2, borderRadius: 20, padding: 36, width: '100%', maxWidth: 380, textAlign: 'center' }}>
        {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: 14, background: '#fff', padding: 4, marginBottom: 16 }} /> : <div style={{ fontSize: 30, marginBottom: 16 }}>📦</div>}
        <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 }}>Aterinay Services</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 28 }}>Connexion</div>
        
        {displayError && (
          <div style={{ background: '#450a0a', color: COLORS.red, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            ❌ {displayError}
          </div>
        )}
        
        <div style={{ marginBottom: 14, textAlign: 'left' }}>
          <label style={lbl()}>Email</label>
          <input 
            style={inp()} 
            type="email" 
            placeholder="admin@aterinay.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} 
          />
        </div>
        <div style={{ marginBottom: 24, textAlign: 'left' }}>
          <label style={lbl()}>Mot de passe</label>
          <input 
            type="password" 
            style={inp()} 
            placeholder="••••••••" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} 
          />
        </div>
        <button style={{ ...btn(COLORS.blue, '#2563eb'), width: '100%', padding: 14, fontSize: 15 }} onClick={handleSubmit}>
          🔐 Se connecter
        </button>
      </div>
    </div>
  );
};