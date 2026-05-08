import { useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadLogoFile, updateLogo } from '../../services/configService';

export const Header = ({ logoUrl, setLogoUrl, onLogout, onMenuToggle, menuOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);

  const handleLogoUpload = async (file) => {
    if (!file) return;
    try {
      const url = await uploadLogoFile(file);
      await updateLogo(url);
      setLogoUrl(url);
      alert('Logo modifié avec succès !');
    } catch (error) {
      console.error('Erreur upload logo:', error);
      alert("Erreur lors de l'upload du logo");
    }
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
      zIndex: 100 
    }}>
      {/* Logo + Nom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img 
          src={logoUrl || '/logo.png'} 
          alt="Logo Aterinay" 
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
          fontSize: 22
        }}>
          📦
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
            Aterinay Services
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>
            Gestion livraisons
          </div>
        </div>
      </div>

      {/* Boutons à droite */}
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Bouton thème clair/sombre */}
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
          🖼️ Logo
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={e => e.target.files && handleLogoUpload(e.target.files[0])} 
        />
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