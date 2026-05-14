// src/modules/shared/components/Layout/Header.jsx
import { useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useCompany } from '../../context/CompanyContext';
import { uploadLogoFile, updateLogo, fetchLogo } from '../../../livraison/services/configService';
import { CompanySwitcher } from '../common/CompanySwitcher';

export const Header = ({ logoUrl, setLogoUrl, onLogout, onMenuToggle, menuOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentCompany, companies, switchCompany } = useCompany();
  const fileInputRef = useRef(null);

  const handleLogoUpload = async (file) => {
    if (!file) return;
    try {
      const url = await uploadLogoFile(file);
      await updateLogo(url);
      setLogoUrl(url);
      const newLogo = await fetchLogo();
      setLogoUrl(newLogo);
      alert('Logo modifié avec succès !');
    } catch (error) {
      console.error('Erreur upload logo:', error);
      alert("Erreur lors de l'upload du logo");
    }
  };

  const getCompanySubtitle = () => {
    if (!currentCompany) return 'Gestion';
    if (currentCompany.type === 'service') return 'Service livraison';
    if (currentCompany.slug === 'pomanay') return 'Boutique accessoires';
    if (currentCompany.slug === 'zazatiana') return 'Boutique bébé';
    return 'Gestion';
  };

  const getCompanyIcon = () => {
    if (!currentCompany) return '📦';
    if (currentCompany.type === 'service') return '🚚';
    if (currentCompany.slug === 'pomanay') return '📱';
    if (currentCompany.slug === 'zazatiana') return '👶';
    return '📦';
  };

  // Fonction pour obtenir le logo de la société
  const getLogoUrl = () => {
    // Si un logo personnalisé est défini dans la base
    if (logoUrl) return logoUrl;
    
    // Logo par défaut selon la société
    if (currentCompany?.slug === 'pomanay') return '/logo-pomanay.png';
    if (currentCompany?.slug === 'zazatiana') return '/logo-zazatiana.png';
    if (currentCompany?.type === 'service') return '/logo-aterinay.png';
    
    // Logo par défaut
    return '/logo.png';
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '10px 16px', 
      background: 'var(--card)', 
      borderBottom: '1px solid var(--border)', 
      position: 'sticky', 
      top: 0, 
      zIndex: 100,
      flexWrap: 'wrap',
      gap: 10
    }}>
      {/* Logo + Nom + Sélecteur société */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Logo */}
        <div style={{ position: 'relative' }}>
          <img 
            src={getLogoUrl()} 
            alt={`Logo ${currentCompany?.name || 'Aterinay'}`} 
            style={{ 
              width: 40, 
              height: 40, 
              objectFit: 'contain', 
              borderRadius: 8, 
              background: '#fff', 
              padding: 4 
            }} 
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex';
              }
            }}
          />
          <div style={{ 
            width: 40, 
            height: 40, 
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
            borderRadius: 10, 
            display: 'none', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 20
          }}>
            {getCompanyIcon()}
          </div>
        </div>
        
        {/* Texte société */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
              Aterinay Services
            </div>
            {currentCompany && (
              <span style={{ 
                fontSize: 9, 
                background: 'var(--bg)', 
                padding: '2px 8px', 
                borderRadius: 20,
                color: 'var(--muted)'
              }}>
                {currentCompany.slug === 'pomanay' ? 'POMANAY' : 
                 currentCompany.slug === 'zazatiana' ? 'ZAZATIANA' : 'ATERINAY'}
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>
            {getCompanySubtitle()}
          </div>
        </div>
        
        {/* Sélecteur de société (si plusieurs) */}
        {companies?.length > 1 && (
          <div style={{ marginLeft: 4 }}>
            <CompanySwitcher />
          </div>
        )}
      </div>

      {/* Infos société active */}
      {currentCompany && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          padding: '4px 12px',
          background: 'var(--bg)',
          borderRadius: 20,
          fontSize: 11
        }}>
          <span>{getCompanyIcon()}</span>
          <span style={{ fontWeight: 500, color: 'var(--text)' }}>
            {currentCompany.name}
          </span>
        </div>
      )}

      {/* Boutons à droite */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* Thème clair/sombre */}
        <button 
          onClick={toggleTheme} 
          style={{ 
            background: '#1e3a5f', 
            border: 'none', 
            borderRadius: 7, 
            padding: '6px 10px', 
            color: '#60a5fa', 
            cursor: 'pointer', 
            fontSize: 14 
          }}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        
        {/* Changer logo (admin seulement) */}
        <button 
          onClick={() => fileInputRef.current?.click()} 
          style={{ 
            background: '#1e3a5f', 
            border: 'none', 
            borderRadius: 7, 
            padding: '6px 10px', 
            color: '#60a5fa', 
            cursor: 'pointer', 
            fontSize: 12 
          }}
          title="Changer le logo"
        >
          🖼️
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={e => e.target.files && handleLogoUpload(e.target.files[0])} 
        />
        
        {/* Déconnexion */}
        <button 
          onClick={onLogout} 
          style={{ 
            background: '#450a0a', 
            border: '1px solid #7f1d1d', 
            borderRadius: 7, 
            padding: '6px 10px', 
            color: 'var(--red)', 
            cursor: 'pointer', 
            fontSize: 12, 
            fontWeight: 600 
          }}
          title="Déconnexion"
        >
          🔒
        </button>
        
        {/* Menu mobile */}
        <button 
          onClick={onMenuToggle} 
          style={{ 
            background: 'var(--border)', 
            border: '1px solid var(--border2)', 
            borderRadius: 8, 
            padding: '7px 11px', 
            color: 'var(--subtle)', 
            cursor: 'pointer', 
            fontSize: 18 
          }}
          title="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </div>
  );
};