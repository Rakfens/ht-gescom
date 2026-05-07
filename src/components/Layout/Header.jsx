import { COLORS } from '../../utils/constants';
import { btn } from '../../utils/helpers';

export const Header = ({ onLogout, onMenuToggle, menuOpen }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '10px 16px', 
      background: COLORS.card, 
      borderBottom: '1px solid ' + COLORS.border, 
      position: 'sticky', 
      top: 0, 
      zIndex: 100 
    }}>
      {/* Logo + Nom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img 
          src="/logo.png" 
          alt="Logo Aterinay" 
          style={{ 
            width: 40, 
            height: 40, 
            objectFit: 'contain', 
            borderRadius: 8, 
            background: '#fff', 
            padding: 4 
          }} 
        />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            Aterinay Services
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted }}>
            Gestion livraisons
          </div>
        </div>
      </div>

      {/* Boutons à droite */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={onLogout} 
          style={{ 
            background: '#450a0a', 
            border: '1px solid #7f1d1d', 
            borderRadius: 7, 
            padding: '6px 10px', 
            color: COLORS.red, 
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
            background: COLORS.border, 
            border: '1px solid ' + COLORS.border2, 
            borderRadius: 8, 
            padding: '7px 11px', 
            color: COLORS.subtle, 
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