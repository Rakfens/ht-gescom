import { useState, useEffect } from 'react';
import { formatAr, TODAY, currentMonth, monthLabel, shouldCountGerantCommission, EXCLUDED_CLIENTS } from '../../utils/constants';
import { btn, tag, inpSm } from '../../utils/helpers';
import { getRecuperationsByMonth } from '../../services/recuperationService';

export const Dashboard = ({ agents, livraisons, commissionGerant, onNavigate }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedDate, setSelectedDate] = useState(TODAY());
  const [recuperationsJour, setRecuperationsJour] = useState([]);
  const [loadingRecup, setLoadingRecup] = useState(false);

  const enCours = livraisons.filter(l => l.statut === 'en_cours').length;
  const todayLivs = livraisons.filter(l => l.date === TODAY());
  
  const livsGerant = todayLivs.filter(l => shouldCountGerantCommission(l));
  const gerantGain = livsGerant.length * commissionGerant;
  
  const excludedToday = todayLivs.filter(l => 
    EXCLUDED_CLIENTS.includes(l.client_donneur?.toUpperCase() || '') &&
    parseFloat(l.frais || 0) > 0
  );

  // Charger les récupérations de la date sélectionnée
  useEffect(() => {
    const loadRecuperations = async () => {
      setLoadingRecup(true);
      try {
        const data = await getRecuperationsByDate(selectedDate);
        setRecuperationsJour(data || []);
      } catch (error) {
        console.error('Erreur chargement récupérations:', error);
      } finally {
        setLoadingRecup(false);
      }
    };
    loadRecuperations();
  }, [selectedDate]);

  // Calcul des totaux des récupérations
  const totalRecuperationsJour = recuperationsJour.reduce((s, r) => s + (r.frais_recuperation || 0), 0);
  const nbRecuperationsJour = recuperationsJour.length;

  // Regrouper par livreur
  const recuperationsParLivreur = recuperationsJour.reduce((acc, r) => {
    const nom = r.livreur_nom;
    if (!acc[nom]) acc[nom] = { livreur: nom, total: 0, nb: 0, details: [] };
    acc[nom].total += (r.frais_recuperation || 0);
    acc[nom].nb += 1;
    acc[nom].details.push({ client: r.client_donneur, frais: r.frais_recuperation });
    return acc;
  }, {});

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
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 18 }}>Tableau de bord</h1>
      
      {/* Cartes statistiques */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2,1fr)', 
        gap: 10, 
        marginBottom: 20 
      }}>
        <div style={{ background: 'linear-gradient(135deg, var(--card), var(--bg))', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)', marginBottom: 3 }}>{livraisons.length}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total livraisons</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, var(--card), var(--bg))', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--yellow)', marginBottom: 3 }}>{enCours}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>En cours</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, var(--card), var(--bg))', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', marginBottom: 3 }}>{livraisons.filter(l => l.statut === 'livre').length}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Livrés</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, var(--card), var(--bg))', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)', marginBottom: 3 }}>{livraisons.filter(l => l.statut === 'retourne').length}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Retournés</div>
        </div>
      </div>

      {/* Carte Récupérations par jour */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0b1120)', border: '1px solid #f59e0b', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>📦 RÉCUPÉRATIONS MATINALES</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9' }}>{formatAr(totalRecuperationsJour)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{nbRecuperationsJour} récupération(s)</div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4, display: 'block' }}>📅 Sélectionner une date</label>
            <input 
              type="date" 
              style={{ ...inpSm(), width: 'auto', background: '#0b1120', border: '1px solid #f59e0b' }} 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        
        {/* Détail par livreur */}
        {Object.keys(recuperationsParLivreur).length > 0 ? (
          <div style={{ marginTop: 12, borderTop: '1px solid #334155', paddingTop: 10 }}>
            {Object.values(recuperationsParLivreur).map(rl => (
              <div key={rl.livreur} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontWeight: 700, color: '#f1f5f9' }}>👨‍💼 {rl.livreur}</span>
                  <span style={{ color: '#f59e0b' }}>{rl.nb} récup. • {formatAr(rl.total)}</span>
                </div>
                <div style={{ background: '#0b1120', borderRadius: 8, overflow: 'hidden' }}>
                  {rl.details.map((d, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '6px 10px', 
                      borderBottom: idx < rl.details.length - 1 ? '1px solid #1e293b' : 'none',
                      fontSize: 11
                    }}>
                      <span style={{ color: '#94a3b8' }}>🏪 {d.client}</span>
                      <span style={{ color: '#34d399', fontWeight: 600 }}>{formatAr(d.frais)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
            Aucune récupération enregistrée pour cette date.
          </div>
        )}
      </div>

      {/* Carte gérant */}
      <div style={{ background: 'linear-gradient(135deg,#1e1060,#0b1120)', border: '1px solid var(--purple)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 700, marginBottom: 4 }}>🧑‍💼 GÉRANT — Aujourd'hui ({TODAY()})</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9' }}>{formatAr(gerantGain)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{livsGerant.length} livraisons × {formatAr(commissionGerant)}</div>
            {excludedToday.length > 0 && (
              <div style={{ fontSize: 10, color: 'var(--orange)', marginTop: 2 }}>
                ⚠️ {excludedToday.length} livraison(s) exclue(s)
              </div>
            )}
          </div>
          <button style={{ ...btn('var(--purple)', '#7c3aed'), padding: '10px 16px', fontSize: 12 }} onClick={() => onNavigate('gerant')}>Voir détails →</button>
        </div>
      </div>

      {/* Récap par agent */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>👥 Récap par agent</span>
        <span style={{ fontSize: 10, background: 'var(--border)', padding: '2px 8px', borderRadius: 20 }}>tous temps</span>
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
                background: 'var(--card)', 
                border: '1px solid var(--border)', 
                borderRadius: 12, 
                padding: '14px',
                transition: 'all 0.2s'
              }}>
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
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{a.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{ls.length} livraisons total</div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: 10, 
                  marginBottom: 12,
                  background: 'var(--bg)',
                  borderRadius: 10,
                  padding: '10px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{livres}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Livrés</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>{retournes}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Retournés</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--purple)' }}>{reportes}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Reportés</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--orange)' }}>{formatAr(totalFrais)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Frais</div>
                  </div>
                </div>
                
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${ls.length ? (livres / ls.length) * 100 : 0}%`, 
                      height: '100%', 
                      background: 'var(--green)',
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
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 500 }}>
            <thead>
              <tr style={{ background: 'var(--card)' }}>
                <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Agent</th>
                <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Total</th>
                <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Livrés</th>
                <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Retournés</th>
                <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Reportés</th>
                <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Frais</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(a => {
                const ls = livraisons.filter(l => l.agent_id === a.id);
                const totalFrais = ls.reduce((s, l) => s + parseFloat(l.frais || 0), 0);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={tag('#1e3a5f', '#60a5fa')}>{a.nom}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{ls.length}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={tag('#14532d', 'var(--green)')}>{ls.filter(l => l.statut === 'livre').length}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={tag('#450a0a', 'var(--red)')}>{ls.filter(l => l.statut === 'retourne').length}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={tag('#2e1065', 'var(--purple)')}>{ls.filter(l => l.statut === 'reporte').length}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--orange)', fontWeight: 600 }}>{formatAr(totalFrais)}</td>
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