import { COLORS } from '../../utils/constants';
import { tag } from '../../utils/helpers';

const navItems = [
  { key: 'dashboard', icon: '📊', label: 'Accueil' },
  { key: 'livraison', icon: '📦', label: 'Livraison' },
  { key: 'historique', icon: '📋', label: 'Historique' },
  { key: 'gerant', icon: '🧑‍💼', label: 'Gérant' },
  { key: 'recap', icon: '📈', label: 'Récap' },
  { key: 'agents', icon: '👥', label: 'Agents' },
];

export const Sidebar = ({ page, onNavigate, enCours }) => {
  return (
    <aside style={{ width: 220, background: COLORS.card, borderRight: '1px solid ' + COLORS.border, flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 57, height: 'calc(100vh - 57px)', overflowY: 'auto' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 10px', flex: 1 }}>
        {navItems.map(item => (
          <button key={item.key} onClick={() => onNavigate(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', background: page === item.key ? '#1e3a5f' : 'transparent', color: page === item.key ? '#60a5fa' : COLORS.subtle, fontSize: 13, fontWeight: page === item.key ? 700 : 500, cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
            {item.key === 'historique' && enCours > 0 && <span style={{ marginLeft: 'auto', ...tag('#f59e0b', '#000'), fontSize: 10 }}>{enCours}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding: '10px 16px', borderTop: '1px solid ' + COLORS.border, fontSize: 10, color: COLORS.muted }}>💾 Données sécurisées</div>
    </aside>
  );
};