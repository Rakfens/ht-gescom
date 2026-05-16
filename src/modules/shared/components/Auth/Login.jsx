// Login.jsx — v3 : bon logo + fix déconnexion
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../context/CompanyContext';

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

// Logo à afficher selon le slug de la société
const getLogoForCompany = (company) => {
  if (!company) return '/logo.png';
  if (company.logo_url) return company.logo_url;
  if (company.slug === 'pomanay') return '/logo-pomanay.png';
  if (company.slug === 'zazatiana') return '/logo-zazatiana.png';
  if (company.type === 'service') return '/logo-aterinay.png';
  return '/logo.png';
};

export const Login = ({ onLoginSuccess }) => {
  const { login, loading: authLoading, authError } = useAuth();
  // useCompany() peut retourner companies[] si l'utilisateur était déjà connecté,
  // mais ici on est sur l'écran Login donc companies sera vide (session = null).
  // On garde quand même la ref pour le sélecteur de société si nécessaire.
  const { companies: ctxCompanies } = useCompany();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  // Logo à montrer dans le formulaire :
  // - Si une société est sélectionnée dans le dropdown → son logo
  // - Sinon → logo.png générique (logo principal de l'application)
  const selectedCompany = ctxCompanies?.find(c => c.id === selectedCompanyId) || null;
  const logoSrc = getLogoForCompany(selectedCompany);

  // Reset logoError si logoSrc change
  useEffect(() => { setLogoError(false); }, [logoSrc]);

  const handleSubmit = async () => {
    if (!email || !password) { setLocalError('Email et mot de passe requis'); return; }
    if (ctxCompanies?.length > 1 && !selectedCompanyId) {
      setLocalError('Veuillez sélectionner votre société');
      return;
    }
    try {
      setLocalError('');
      setSubmitting(true);
      await login(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setLocalError(err.message || 'Identifiants incorrects');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = authError || localError;

  const inp = {
    width: '100%',
    padding: '13px 14px 13px 42px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border2)',
    borderRadius: 13,
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'var(--font)',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Orbs décoratifs */}
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,158,255,0.10) 0%, transparent 70%)',
        top: -60, right: -80, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        bottom: 0, left: -60, pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--glass)',
        border: '1px solid var(--border2)',
        borderRadius: 28,
        padding: '36px 28px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        position: 'relative',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Ligne gradient haut */}
        <div style={{
          position: 'absolute', top: 0, left: 28, right: 28, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(79,158,255,0.5), transparent)',
          borderRadius: 1,
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(79,158,255,0.15) 0%, rgba(99,102,241,0.15) 100%)',
            border: '1.5px solid rgba(79,158,255,0.25)',
            borderRadius: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(79,158,255,0.12)',
            overflow: 'hidden',
          }}>
            {!logoError ? (
              <img
                src={logoSrc}
                alt="Logo"
                style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 12 }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <span style={{ fontSize: 32 }}>📦</span>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            HT-GesCom
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.04em' }}>
            Aterinay Services · Connexion
          </div>
        </div>

        {/* Erreur */}
        {displayError && (
          <div style={{
            background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)',
            color: 'var(--red)', borderRadius: 12, padding: '11px 14px', marginBottom: 18,
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            animation: 'slideDown 0.3s ease',
          }}>
            <span>⚠️</span><span>{displayError}</span>
          </div>
        )}

        {/* Sélecteur société (si plusieurs disponibles) */}
        {ctxCompanies?.length > 1 && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
              Société
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', zIndex: 1 }}>
                <BuildingIcon />
              </div>
              <select style={{ ...inp, appearance: 'none', cursor: 'pointer' }}
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}>
                <option value="">Choisir votre société</option>
                {ctxCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
              <MailIcon />
            </div>
            <input style={inp} type="email" placeholder="admin@aterinay.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        </div>

        {/* Mot de passe */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
            Mot de passe
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
              <LockIcon />
            </div>
            <input type={showPwd ? 'text' : 'password'}
              style={{ ...inp, paddingRight: 46 }}
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            <button onClick={() => setShowPwd(!showPwd)} style={{
              position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4,
              display: 'flex', alignItems: 'center',
            }}>
              <EyeIcon open={showPwd} />
            </button>
          </div>
        </div>

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={submitting || authLoading}
          style={{
            width: '100%', padding: '15px',
            background: submitting ? 'var(--blue-dim)' : 'var(--grad-blue)',
            color: '#fff', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 700, fontFamily: 'var(--font)',
            cursor: submitting ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.01em',
            boxShadow: submitting ? 'none' : 'var(--shadow-blue)',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {submitting ? (
            <>
              <span style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block',
              }} />
              Connexion en cours...
            </>
          ) : 'Se connecter'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--muted)' }}>
          HT-GesCom v3.0 · Aterinay Services
        </div>
      </div>
    </div>
  );
};
