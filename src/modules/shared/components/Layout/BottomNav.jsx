// BottomNav.jsx — Design Premium Mobile v2
import { useState, useEffect, useRef } from 'react';

// SVG Icons propres au lieu des emojis
const Icons = {
  dashboard: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  livraison: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
      <rect x="9" y="11" width="14" height="10" rx="2"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </svg>
  ),
  historique: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  gerant: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  recap: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  agents: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  recuperation: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.74"/>
    </svg>
  ),
  ventes: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  achats: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  stock: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  inventaire: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  depenses: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  rapports: ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
};

const NAVIGATION_CONFIG = {
  service: {
    items: [
      { key: 'dashboard',    label: 'Accueil' },
      { key: 'livraison',    label: 'Livraison' },
      { key: 'historique',   label: 'Historique' },
      { key: 'gerant',       label: 'Gérant' },
      { key: 'recap',        label: 'Récap' },
      { key: 'agents',       label: 'Agents' },
      { key: 'recuperation', label: 'Récup.' },
    ],
    defaultPage: 'dashboard'
  },
  pomanay: {
    items: [
      { key: 'dashboard',  label: 'Accueil' },
      { key: 'ventes',     label: 'Ventes' },
      { key: 'achats',     label: 'Achats' },
      { key: 'stock',      label: 'Stock' },
      { key: 'inventaire', label: 'Inventaire' },
      { key: 'depenses',   label: 'Dépenses' },
      { key: 'rapports',   label: 'Rapports' },
    ],
    defaultPage: 'dashboard'
  },
  zazatiana: {
    items: [
      { key: 'dashboard',  label: 'Accueil' },
      { key: 'ventes',     label: 'Ventes' },
      { key: 'achats',     label: 'Achats' },
      { key: 'stock',      label: 'Stock' },
      { key: 'inventaire', label: 'Inventaire' },
      { key: 'depenses',   label: 'Dépenses' },
      { key: 'rapports',   label: 'Rapports' },
    ],
    defaultPage: 'dashboard'
  }
};

const STORAGE_KEY = 'bottomNav_lastPages';

export const BottomNav = ({ page, onNavigate, enCours, currentCompany }) => {
  const [lastPages, setLastPages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  });
  const [ripple, setRipple] = useState(null);
  const prevPage = useRef(page);

  const getConfig = () => {
    if (!currentCompany) return { items: [], defaultPage: 'dashboard' };
    if (currentCompany.type === 'service') return NAVIGATION_CONFIG.service;
    if (currentCompany.slug === 'pomanay') return NAVIGATION_CONFIG.pomanay;
    if (currentCompany.slug === 'zazatiana') return NAVIGATION_CONFIG.zazatiana;
    return { items: [], defaultPage: 'dashboard' };
  };

  const config = getConfig();
  const navItems = config.items;

  useEffect(() => {
    if (currentCompany && page && navItems.some(i => i.key === page)) {
      const next = { ...lastPages, [currentCompany.id]: page };
      setLastPages(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [currentCompany, page]);

  const isValidPage = navItems.some(i => i.key === page);
  const activePage = isValidPage ? page : (lastPages[currentCompany?.id] || config.defaultPage);

  useEffect(() => {
    if (activePage !== page && activePage !== config.defaultPage) onNavigate(activePage);
  }, [activePage]);

  const handleNav = (key, idx) => {
    setRipple(idx);
    setTimeout(() => setRipple(null), 400);
    onNavigate(key);
  };

  if (!currentCompany || navItems.length === 0) return null;

  // Compter les items pour ajuster la taille de police
  const count = navItems.length;
  const labelSize = count >= 7 ? 8 : count >= 6 ? 9 : 10;
  const iconSize = count >= 7 ? 18 : 20;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 98,
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: 'var(--glass)',
      borderTop: '1px solid var(--border2)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
    }}>
      {/* Indicator line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        opacity: 0.5,
      }} />

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {navItems.map((item, idx) => {
          const isActive = activePage === item.key;
          const IconComp = Icons[item.key];
          const isBadge = item.key === 'historique' && enCours > 0;

          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key, idx)}
              style={{
                flex: 1,
                padding: '10px 2px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Active background pill */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 40,
                  height: 32,
                  background: 'var(--blue-dim)',
                  borderRadius: 10,
                  animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }} />
              )}

              {/* Top dot */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 2,
                  background: 'var(--accent)',
                  borderRadius: '0 0 4px 4px',
                  animation: 'fadeIn 0.2s ease',
                }} />
              )}

              {/* Ripple */}
              {ripple === idx && (
                <div style={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  background: 'rgba(79,158,255,0.35)',
                  borderRadius: '50%',
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%,-50%) scale(0)',
                  animation: 'ripple 0.45s ease-out forwards',
                }} />
              )}

              {/* Icon */}
              <div style={{
                position: 'relative',
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                zIndex: 1,
                width: iconSize,
                height: iconSize,
              }}>
                {IconComp ? (
                  <IconComp active={isActive} />
                ) : (
                  <span style={{ fontSize: iconSize - 2 }}>📦</span>
                )}

                {/* Badge */}
                {isBadge && (
                  <div style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    background: 'var(--yellow)',
                    color: '#000',
                    borderRadius: 10,
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '1px 4px',
                    lineHeight: 1.4,
                    minWidth: 14,
                    textAlign: 'center',
                    animation: 'popIn 0.3s ease',
                  }}>
                    {enCours > 9 ? '9+' : enCours}
                  </div>
                )}
              </div>

              {/* Label */}
              <span style={{
                fontSize: labelSize,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                letterSpacing: isActive ? '-0.01em' : '0',
                transition: 'all 0.2s ease',
                zIndex: 1,
                lineHeight: 1,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
