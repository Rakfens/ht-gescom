// modules/shared/components/Auth/Login.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants'; 
import { btn, inp, lbl } from '../../utils/helpers';

export const Login = ({ onLoginSuccess }) => {
  const { login, companies, loading, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [localError, setLocalError] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);

  // Récupérer le logo de la société sélectionnée
  useEffect(() => {
    if (selectedCompany) {
      const company = companies.find(c => c.id === selectedCompany);
      if (company?.logo_url) {
        setLogoUrl(company.logo_url);
      } else {
        setLogoUrl(null);
      }
    }
  }, [selectedCompany, companies]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setLocalError('Email et mot de passe requis');
      return;
    }
    
    // Vérifier qu'une société est sélectionnée (si plusieurs)
    if (companies.length > 1 && !selectedCompany) {
      setLocalError('Veuillez sélectionner votre société');
      return;
    }
    
    try {
      setLocalError('');
      await login(email, password, selectedCompany);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setLocalError(err.message || 'Erreur de connexion');
    }
  };

  const displayError = authError || localError;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: COLORS.card, border: '1px solid ' + COLORS.border2, borderRadius: 20, padding: 36, width: '100%', maxWidth: 380, textAlign: 'center' }}>
        
        {/* Logo selon la société sélectionnée */}
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: 14, background: '#fff', padding: 4, marginBottom: 16 }} />
        ) : (
          <div style={{ fontSize: 30, marginBottom: 16 }}>📦</div>
        )}
        
        <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 }}>
          Aterinay Services
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 28 }}>
          Connexion
        </div>
        
        {displayError && (
          <div style={{ background: '#450a0a', color: COLORS.red, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            ❌ {displayError}
          </div>
        )}
        
        {/* Sélecteur de société (si plusieurs) */}
        {companies.length > 1 && (
          <div style={{ marginBottom: 14, textAlign: 'left' }}>
            <label style={lbl()}>🏢 Société</label>
            <select 
              style={inp()} 
              value={selectedCompany} 
              onChange={e => setSelectedCompany(e.target.value)}
            >
              <option value="">-- Choisir votre société --</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
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