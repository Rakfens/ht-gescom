// Header.jsx — Design Premium Mobile v2
import { useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useCompany } from '../../context/CompanyContext';
import { uploadLogoFile, updateLogo, fetchLogo } from '../../../livraison/services/configService';
import { CompanySwitcher } from '../common/CompanySwitcher';

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export const Header = ({ logoUrl, setLogoUrl, onLogout, onMenuToggle, menuOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentCompany, companies, switchCompany } = useCompany();
  const fileInputRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  const handleLogoUpload = async (file) => {
    if (!file) return;
    try {
      const url = await uploadLogoFile(file);
      await updateLogo(url);
      setLogoUrl(url);
      const newLogo = await fetchLogo();
      setLogoUrl(newLogo);
    } catch (error) {
      console.error('Erreur upload logo:', error);
    }
  };

  const getCompanyMeta = () => {
    if (!currentCompany) return { label: 'Gestion', color: 'var(--blue)', icon: '📦' };
    if (currentCompany.type === 'service') return { label: 'Livraison', color: 'var(--blue)', icon: '🚚' };
    if (currentCompany.slug === 'pomanay') return { label: 'Boutique', color: 'var(--purple)', icon: '📱' };
    if (currentCompany.slug === 'zazatiana') return { label: 'Bébé', color: 'var(--pink)', icon: '👶' };
    return { label: 'Gestion', color: 'var(--blue)', icon: '📦' };
  };

  const getLogoUrl = () => {
    if (logoUrl) return logoUrl;
    if (currentCompany?.slug === 'pomanay') return '/logo-pomanay.png';
    if (currentCompany?.slug === 'zazatiana') return '/logo-zazatiana.png';
    if (currentCompany?.type === 'service') return '/logo-aterinay.png';
    return '/logo.png';
  };

  const meta = getCompanyMeta();

  const iconBtn = {
    width: 36,
    height: 36,
    border: '1px solid var(--border2)',
    borderRadius: 10,
    background: 'var(--card2)',
    color: 'var(--text2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 14px',
      height: 'var(--header-h)',
      background: 'var(--glass)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      gap: 10,
    }}>
      {/* Logo + Société */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        {/* Avatar logo */}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          overflow: 'hidden',
          border: '1.5px solid var(--border2)',
          background: 'var(--card2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: 'pointer',
        }} onClick={() => fileInputRef.current?.click()}>
          {!imgError ? (
            <img
              src={getLogoUrl()}
              alt="logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
              onError={() => setImgError(true)}
            />
          ) : (
            <span style={{ fontSize: 20 }}>{meta.icon}</span>
          )}
        </div>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*"
          onChange={e => e.target.files && handleLogoUpload(e.target.files[0])} />

        {/* Nom + tag */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 120,
            }}>
              {currentCompany?.name || 'HT-GesCom'}
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: meta.color,
              background: `${meta.color}18`,
              padding: '2px 7px',
              borderRadius: 20,
              border: `1px solid ${meta.color}30`,
              flexShrink: 0,
            }}>
              {meta.label}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1, letterSpacing: '0.02em' }}>
            Aterinay Services
          </div>
        </div>

        {/* Switcher société */}
        {companies?.length > 1 && (
          <div style={{ marginLeft: 2 }}>
            <CompanySwitcher />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
        <button onClick={toggleTheme} style={iconBtn} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <button onClick={onLogout} style={{
          ...iconBtn,
          background: 'var(--red-dim)',
          border: '1px solid rgba(248,113,113,0.2)',
          color: 'var(--red)',
        }} title="Déconnexion">
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
};
