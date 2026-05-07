import { COLORS } from '../../utils/constants';

const navItems = [
  { key: 'dashboard', icon: '📊', label: 'Accueil' },
  { key: 'livraison', icon: '📦', label: 'Livraison' },
  { key: 'historique', icon: '📋', label: 'Historique' },
  { key: 'gerant', icon: '🧑‍💼', label: 'Gérant' },
  { key: 'recap', icon: '📈', label: 'Récap' },
  { key: 'agents', icon: '👥', label: 'Agents' },
];

export const BottomNav = ({ page, onNavigate, enCours }) => {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: COLORS.card, borderTop: '1px solid ' + COLORS.border, display: 'flex', zIndex: 98, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {navItems.map(item => (
        <button key={item.key} onClick={() => onNavigate(item.key)} style={{ flex: 1, padding: '8px 2px 6px', border: 'none', background: 'transparent', color: page === item.key ? '#60a5fa' : '#475569', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: page === item.key ? 700 : 400, borderTop: page === item.key ? '2px solid #60a5fa' : '2px solid transparent', position: 'relative' }}>
          <span style={{ fontSize: 17 }}>{item.icon}</span>
          <span style={{ fontSize: 8 }}>{item.label}</span>
          {item.key === 'historique' && enCours > 0 && <span style={{ position: 'absolute', top: 4, right: 'calc(50% - 18px)', background: '#f59e0b', color: '#000', borderRadius: 20, fontSize: 8, fontWeight: 800, padding: '1px 4px' }}>{enCours}</span>}
        </button>
      ))}
    </div>
  );
};