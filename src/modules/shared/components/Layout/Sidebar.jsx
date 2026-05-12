// modules/shared/components/Layout/Sidebar.jsx
import { COLORS } from '../../utils/constants';
import { tag } from '../../utils/helpers';
import { useCompany } from '../../context/CompanyContext';

// Navigation pour Aterinay Service (livraison)
const serviceNavItems = [
  { key: 'dashboard', icon: '📊', label: 'Accueil' },
  { key: 'livraison', icon: '📦', label: 'Livraison' },
  { key: 'historique', icon: '📋', label: 'Historique' },
  { key: 'gerant', icon: '🧑‍💼', label: 'Gérant' },
  { key: 'recap', icon: '📈', label: 'Récap' },
  { key: 'agents', icon: '👥', label: 'Agents' },
  { key: 'recuperation', icon: '📦', label: 'Récupération' }
];

// Navigation pour Pomanay (commerce avec dépenses)
const pomanayNavItems = [
  { key: 'dashboard', icon: '📊', label: 'Accueil' },
  { key: 'ventes', icon: '💰', label: 'Ventes' },
  { key: 'achats', icon: '📥', label: 'Achats' },
  { key: 'stock', icon: '📦', label: 'Stock' },
  { key: 'inventaire', icon: '📋', label: 'Inventaire' },
  { key: 'depenses', icon: '💸', label: 'Dépenses' },
  { key: 'rapports', icon: '📈', label: 'Rapports' }
];

// Navigation pour Zazatiana (commerce sans dépenses)
const zazatianaNavItems = [
  { key: 'dashboard', icon: '📊', label: 'Accueil' },
  { key: 'ventes', icon: '💰', label: 'Ventes' },
  { key: 'achats', icon: '📥', label: 'Achats' },
  { key: 'stock', icon: '📦', label: 'Stock' },
  { key: 'inventaire', icon: '📋', label: 'Inventaire' },
  { key: 'depenses', icon: '💰', label: 'Dépenses' },
  { key: 'rapports', icon: '📈', label: 'Rapports' }
];

export const Sidebar = ({ page, onNavigate, enCours }) => {
  const { currentCompany } = useCompany();

  const getNavItems = () => {
    if (!currentCompany) return [];
    if (currentCompany.type === 'service') return serviceNavItems;
    if (currentCompany.slug === 'pomanay') return pomanayNavItems;
    if (currentCompany.slug === 'zazatiana') return zazatianaNavItems;
    return [];
  };

  const navItems = getNavItems();

  if (!currentCompany || navItems.length === 0) return null;

  return (
    <aside style={{ 
      width: 240, 
      background: COLORS.card, 
      borderRight: '1px solid ' + COLORS.border, 
      flexShrink: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'sticky', 
      top: 57, 
      height: 'calc(100vh - 57px)', 
      overflowY: 'auto' 
    }}>
      {/* En-tête avec le nom de la société */}
      <div style={{ 
        padding: '14px 16px', 
        borderBottom: '1px solid ' + COLORS.border,
        marginBottom: 8
      }}>
        <div style={{ 
          fontSize: 10, 
          fontWeight: 700, 
          color: COLORS.muted, 
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {currentCompany.type === 'service' ? '🚚 LIVRAISON' : 
           currentCompany.slug === 'pomanay' ? '📱 BOUTIQUE' : '👶 BOUTIQUE'}
        </div>
        <div style={{ 
          fontSize: 14, 
          fontWeight: 700, 
          color: '#f1f5f9',
          marginTop: 4
        }}>
          {currentCompany.name}
        </div>
      </div>

      <nav style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2, 
        padding: '8px 12px', 
        flex: 1 
      }}>
        {navItems.map(item => (
          <button 
            key={item.key} 
            onClick={() => onNavigate(item.key)} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '10px 14px', 
              borderRadius: 10, 
              border: 'none', 
              background: page === item.key ? '#1e3a5f' : 'transparent', 
              color: page === item.key ? '#60a5fa' : COLORS.subtle, 
              fontSize: 13, 
              fontWeight: page === item.key ? 600 : 400, 
              cursor: 'pointer', 
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.key === 'historique' && enCours > 0 && (
              <span style={{ marginLeft: 'auto', ...tag('#f59e0b', '#000'), fontSize: 10, borderRadius: 20 }}>
                {enCours}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      <div style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid ' + COLORS.border, 
        fontSize: 10, 
        color: COLORS.muted 
      }}>
        🔒 Données sécurisées
      </div>
    </aside>
  );
};