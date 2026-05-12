// modules/shared/components/Layout/BottomNav.jsx
import { useState, useEffect } from 'react';
import { COLORS } from '../../utils/constants';

// ============================================
// CONFIGURATION CENTRALISÉE DE LA NAVIGATION
// ============================================
const NAVIGATION_CONFIG = {
  // Aterinay Service (livraison)
  service: {
    items: [
      { key: 'dashboard', icon: '📊', label: 'Accueil' },
      { key: 'livraison', icon: '📦', label: 'Livraison' },
      { key: 'historique', icon: '📋', label: 'Historique' },
      { key: 'gerant', icon: '🧑‍💼', label: 'Gérant' },
      { key: 'recap', icon: '📈', label: 'Récap' },
      { key: 'agents', icon: '👥', label: 'Agents' },
      { key: 'recuperation', icon: '📦', label: 'Récupération' }
    ],
    defaultPage: 'dashboard'
  },
  
  // Pomanay (commerce avec dépenses)
  pomanay: {
    items: [
      { key: 'dashboard', icon: '📊', label: 'Accueil' },
      { key: 'ventes', icon: '💰', label: 'Ventes' },
      { key: 'achats', icon: '📥', label: 'Achats' },
      { key: 'stock', icon: '📦', label: 'Stock' },
      { key: 'inventaire', icon: '📋', label: 'Inventaire' },
      { key: 'depenses', icon: '💸', label: 'Dépenses' },
      { key: 'rapports', icon: '📈', label: 'Rapports' }
    ],
    defaultPage: 'dashboard'
  },
  
  // Zazatiana (commerce sans dépenses)
  zazatiana: {
    items: [
      { key: 'dashboard', icon: '📊', label: 'Accueil' },
      { key: 'ventes', icon: '💰', label: 'Ventes' },
      { key: 'achats', icon: '📥', label: 'Achats' },
      { key: 'stock', icon: '📦', label: 'Stock' },
      { key: 'inventaire', icon: '📋', label: 'Inventaire' },
      { key: 'depenses', icon: '💰', label: 'Dépenses' } ,
      { key: 'rapports', icon: '📈', label: 'Rapports' }
    ],
    defaultPage: 'dashboard'
  }
};

// Clé pour localStorage
const STORAGE_KEY = 'bottomNav_lastPages';

export const BottomNav = ({ page, onNavigate, enCours, currentCompany }) => {
  // État pour stocker la dernière page visitée par société
  const [lastPages, setLastPages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Obtenir la configuration pour la société actuelle
  const getConfig = () => {
    if (!currentCompany) return { items: [], defaultPage: 'dashboard' };
    
    if (currentCompany.type === 'service') {
      return NAVIGATION_CONFIG.service;
    }
    
    if (currentCompany.slug === 'pomanay') {
      return NAVIGATION_CONFIG.pomanay;
    }
    
    if (currentCompany.slug === 'zazatiana') {
      return NAVIGATION_CONFIG.zazatiana;
    }
    
    return { items: [], defaultPage: 'dashboard' };
  };

  const config = getConfig();
  const navItems = config.items;

  // Sauvegarder la dernière page visitée
  useEffect(() => {
    if (currentCompany && page && navItems.some(item => item.key === page)) {
      const newLastPages = {
        ...lastPages,
        [currentCompany.id]: page
      };
      setLastPages(newLastPages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLastPages));
    }
  }, [currentCompany, page]);

  // Déterminer la page active
  const isValidPage = navItems.some(item => item.key === page);
  const activePage = isValidPage 
    ? page 
    : (lastPages[currentCompany?.id] || config.defaultPage);

  // Si la page active a changé, notifier le parent
  useEffect(() => {
    if (activePage !== page && activePage !== config.defaultPage) {
      onNavigate(activePage);
    }
  }, [activePage]);

  if (!currentCompany || navItems.length === 0) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      background: COLORS.card, 
      borderTop: '1px solid ' + COLORS.border, 
      display: 'flex', 
      zIndex: 98, 
      paddingBottom: 'env(safe-area-inset-bottom)',
      WebkitBackdropFilter: 'blur(10px)',
      backdropFilter: 'blur(10px)'
    }}>
      {navItems.map(item => (
        <button 
          key={item.key} 
          onClick={() => onNavigate(item.key)} 
          style={{ 
            flex: 1, 
            padding: '8px 2px 6px', 
            border: 'none', 
            background: 'transparent', 
            color: activePage === item.key ? '#60a5fa' : '#475569', 
            cursor: 'pointer', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 2, 
            fontSize: 9, 
            fontWeight: activePage === item.key ? 700 : 400, 
            borderTop: activePage === item.key ? '2px solid #60a5fa' : '2px solid transparent', 
            position: 'relative' 
          }}
        >
          <span style={{ fontSize: 17 }}>{item.icon}</span>
          <span style={{ fontSize: 8 }}>{item.label}</span>
          {item.key === 'historique' && enCours > 0 && (
            <span style={{ 
              position: 'absolute', 
              top: 2, 
              right: 'calc(50% - 18px)', 
              background: '#f59e0b', 
              color: '#000', 
              borderRadius: 20, 
              fontSize: 8, 
              fontWeight: 800, 
              padding: '1px 4px' 
            }}>
              {enCours}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};