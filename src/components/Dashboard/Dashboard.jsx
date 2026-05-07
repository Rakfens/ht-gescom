
import { COLORS, formatAr, TODAY, shouldCountGerantCommission, EXCLUDED_CLIENTS } from '../../utils/constants';
import { btn, tag } from '../../utils/helpers';

export const Dashboard = ({ agents, livraisons, commissionGerant, onNavigate }) => {
  const enCours = livraisons.filter(l => l.statut === 'en_cours').length;
  const todayLivs = livraisons.filter(l => l.date === TODAY());
  
  // Commission uniquement pour les clients non exclus
  const livsGerant = todayLivs.filter(l => shouldCountGerantCommission(l));
  const gerantGain = livsGerant.length * commissionGerant;
  
  // Livraisons exclues aujourd'hui
  const excludedToday = todayLivs.filter(l => 
    EXCLUDED_CLIENTS.includes(l.client_donneur?.toUpperCase() || '') &&
    parseFloat(l.frais || 0) > 0
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 18 }}>Tableau de bord</h1>
      
      {/* Cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: 'linear-gradient(135deg,' + COLORS.card + ',' + COLORS.bg + ')', border: '1px solid ' + COLORS.border, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.blue, marginBottom: 3 }}>{livraisons.length}</div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>Total livraisons</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,' + COLORS.card + ',' + COLORS.bg + ')', border: '1px solid ' + COLORS.border, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.yellow, marginBottom: 3 }}>{enCours}</div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>En cours</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,' + COLORS.card + ',' + COLORS.bg + ')', border: '1px solid ' + COLORS.border, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.green, marginBottom: 3 }}>{livraisons.filter(l => l.statut === 'livre').length}</div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>Livrés</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,' + COLORS.card + ',' + COLORS.bg + ')', border: '1px solid ' + COLORS.border, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.red, marginBottom: 3 }}>{livraisons.filter(l => l.statut === 'retourne').length}</div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>Retournés</div>
        </div>
      </div>

      {/* Carte gérant */}
      <div style={{ background: 'linear-gradient(135deg,#1e1060,#0b1120)', border: '1px solid ' + COLORS.purple, borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: COLORS.purple, fontWeight: 700, marginBottom: 4 }}>🧑‍💼 GÉRANT — Aujourd'hui ({TODAY()})</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9' }}>{formatAr(gerantGain)}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{livsGerant.length} livraisons × {formatAr(commissionGerant)}</div>
            {excludedToday.length > 0 && (
              <div style={{ fontSize: 10, color: COLORS.orange, marginTop: 2 }}>
                ⚠️ {excludedToday.length} livraison(s) exclue(s) (clients {EXCLUDED_CLIENTS.join(', ')})
              </div>
            )}
          </div>
          <button style={{ ...btn(COLORS.purple, '#7c3aed'), padding: '10px 16px', fontSize: 12 }} onClick={() => onNavigate('gerant')}>Voir détails →</button>
        </div>
      </div>

      <h2 style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 10 }}>Récap par agent (tous temps)</h2>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid ' + COLORS.border }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 500 }}>
          <thead>
            <tr style={{ background: COLORS.card }}>
              <th style={{ padding: '10px 12px', color: COLORS.muted, fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Agent</th>
              <th style={{ padding: '10px 12px', color: COLORS.muted, fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Total</th>
              <th style={{ padding: '10px 12px', color: COLORS.muted, fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Livrés</th>
              <th style={{ padding: '10px 12px', color: COLORS.muted, fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Retournés</th>
              <th style={{ padding: '10px 12px', color: COLORS.muted, fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Reportés</th>
              <th style={{ padding: '10px 12px', color: COLORS.muted, fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Frais</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => {
              const ls = livraisons.filter(l => l.agent_id === a.id);
              const totalFrais = ls.reduce((s, l) => s + parseFloat(l.frais || 0), 0);
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid ' + COLORS.border }}>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={tag('#1e3a5f', '#60a5fa')}>{a.nom}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{ls.length}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={tag('#14532d', COLORS.green)}>{ls.filter(l => l.statut === 'livre').length}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={tag('#450a0a', COLORS.red)}>{ls.filter(l => l.statut === 'retourne').length}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={tag('#2e1065', COLORS.purple)}>{ls.filter(l => l.statut === 'reporte').length}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: COLORS.orange, fontWeight: 600 }}>{formatAr(totalFrais)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};