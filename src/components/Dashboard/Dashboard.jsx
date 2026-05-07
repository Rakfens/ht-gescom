import { useState, useEffect } from 'react';
import { COLORS, formatAr, TODAY, shouldCountGerantCommission, EXCLUDED_CLIENTS } from '../../utils/constants';
import { btn, tag } from '../../utils/helpers';

export const Dashboard = ({ agents, livraisons, commissionGerant, onNavigate }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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

  // Détection mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 18 }}>Tableau de bord</h1>
      
      {/* Cartes statistiques */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2,1fr)', 
        gap: 10, 
        marginBottom: 20 
      }}>
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
                ⚠️ {excludedToday.length} livraison(s) exclue(s)
              </div>
            )}
          </div>
          <button style={{ ...btn(COLORS.purple, '#7c3aed'), padding: '10px 16px', fontSize: 12 }} onClick={() => onNavigate('gerant')}>Voir détails →</button>
        </div>
      </div>

      {/* Récap par agent - Version responsive */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>👥 Récap par agent</span>
        <span style={{ fontSize: 10, background: COLORS.border, padding: '2px 8px', borderRadius: 20 }}>tous temps</span>
      </h2>
      
      {isMobile ? (
        // Version mobile : cartes
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agents.map(a => {
            const ls = livraisons.filter(l => l.agent_id === a.id);
            const totalFrais = ls.reduce((s, l) => s + parseFloat(l.frais || 0), 0);
            const livres = ls.filter(l => l.statut === 'livre').length;
            const retournes = ls.filter(l => l.statut === 'retourne').length;
            const reportes = ls.filter(l => l.statut === 'reporte').length;
            
            return (
              <div key={a.id} style={{ 
                background: COLORS.card, 
                border: '1px solid ' + COLORS.border, 
                borderRadius: 12, 
                padding: '14px',
                transition: 'all 0.2s'
              }}>
                {/* En-tête avec nom et icône */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 40, 
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 18,
                    color: '#fff'
                  }}>
                    {a.nom.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{a.nom}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>{ls.length} livraisons total</div>
                  </div>
                </div>
                
                {/* Statistiques en grille */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: 10, 
                  marginBottom: 12,
                  background: COLORS.bg,
                  borderRadius: 10,
                  padding: '10px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.green }}>{livres}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>Livrés</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.red }}>{retournes}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>Retournés</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.purple }}>{reportes}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>Reportés</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.orange }}>{formatAr(totalFrais)}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>Frais</div>
                  </div>
                </div>
                
                {/* Barre de progression */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 6, background: COLORS.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${ls.length ? (livres / ls.length) * 100 : 0}%`, 
                      height: '100%', 
                      background: COLORS.green,
                      borderRadius: 3
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Version desktop : tableau
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
      )}
    </div>
  );
};