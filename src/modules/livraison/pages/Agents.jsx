import { useState, useEffect } from 'react';
import { COLORS, formatAr, currentMonth, monthLabel } from '../../shared/utils/constants';
import { btn, inp, inpSm, lbl } from '../../shared/utils/helpers'; 
import { getRecuperationsByLivreurNom, getTotalRecuperationsByLivreurNom } from '../services/recuperationService';

export const Agents = ({ agents, onAddAgent, onUpdateAgent, onDeleteAgent, showToast }) => {
  const [newAgentNom, setNewAgentNom] = useState('');
  const [newAgentSalaire, setNewAgentSalaire] = useState('');
  const [editAgentId, setEditAgentId] = useState(null);
  const [editAgentData, setEditAgentData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [recuperationsAgent, setRecuperationsAgent] = useState({});
  const [cumulAgent, setCumulAgent] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const months = [...new Set([...agents.map(() => currentMonth()), currentMonth()])].sort().reverse();
  const uniqueMonths = [...new Set(months)];

  // Fonction pour charger les récupérations en utilisant le NOM de l'agent
  const loadAllRecuperations = async () => {
    if (!agents.length) return;
    
    setLoading(true);
    console.log('=== CHARGEMENT DES RÉCUPÉRATIONS ===');
    
    const recupsMap = {};
    const cumulMap = {};
    
    for (const agent of agents) {
      try {
        // Récupérer les récupérations du mois par NOM
        const dataMois = await getRecuperationsByLivreurNom(agent.nom, selectedMonth);
        
        recupsMap[agent.id] = {
          total: dataMois.reduce((s, r) => s + (parseFloat(r.frais_recuperation) || 0), 0),
          count: dataMois.length,
          details: dataMois
        };
        
        console.log(`Agent ${agent.nom}: ${dataMois.length} récupérations ce mois-ci, total: ${recupsMap[agent.id].total} Ar`);
        
        // Récupérer le total cumulé (toutes périodes)
        const { total: totalCumul, count: countCumul } = await getTotalRecuperationsByLivreurNom(agent.nom);
        cumulMap[agent.id] = {
          total: totalCumul,
          count: countCumul
        };
        
        console.log(`Agent ${agent.nom}: Cumul total: ${countCumul} récupérations, ${totalCumul} Ar`);
        
      } catch (error) {
        console.error(`Erreur pour agent ${agent.nom}:`, error);
        recupsMap[agent.id] = { total: 0, count: 0, details: [] };
        cumulMap[agent.id] = { total: 0, count: 0 };
      }
    }
    
    setRecuperationsAgent(recupsMap);
    setCumulAgent(cumulMap);
    setLoading(false);
  };

  useEffect(() => {
    loadAllRecuperations();
  }, [agents, selectedMonth, refreshTrigger]);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    showToast('Données rafraîchies', 'success');
  };

  const handleAddAgent = async () => {
    if (!newAgentNom.trim() || !newAgentSalaire) {
      showToast('Nom et salaire requis', 'error');
      return;
    }
    await onAddAgent(newAgentNom, newAgentSalaire);
    setNewAgentNom('');
    setNewAgentSalaire('');
    showToast('Agent ajouté');
    refreshData();
  };

  const handleUpdateAgent = async () => {
    if (!editAgentData.nom || !editAgentData.salaire) return;
    await onUpdateAgent(editAgentId, { nom: editAgentData.nom, salaire: parseFloat(editAgentData.salaire) });
    setEditAgentId(null);
    showToast('Agent modifié');
    refreshData();
  };

  const handleDeleteAgent = async (id) => {
    if (window.confirm('Supprimer cet agent ?')) {
      await onDeleteAgent(id);
      showToast('Agent supprimé', 'warn');
      refreshData();
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 18 }}>Gestion des agents</h1>
      
      {/* Sélecteur de mois et boutons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ background: COLORS.card, padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#f59e0b' }}>📅 Afficher les récupérations du :</span>
          <select 
            style={{ ...inpSm(), width: 'auto', padding: '4px 8px' }} 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {uniqueMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        
        <button 
          onClick={refreshData}
          style={{ background: '#f59e0b', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#000', fontSize: 12, cursor: 'pointer' }}
        >
          🔄 Rafraîchir
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 20, color: COLORS.muted }}>
          Chargement des récupérations...
        </div>
      )}

      {/* Formulaire ajout agent */}
      <div style={{ background: COLORS.card, border: '1px solid ' + COLORS.border2, borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', marginTop: 0, marginBottom: 12 }}>Ajouter un agent</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={lbl()}>Nom</label>
            <input style={inp()} placeholder="Nom complet" value={newAgentNom} onChange={e => setNewAgentNom(e.target.value)} />
          </div>
          <div>
            <label style={lbl()}>Salaire (Ar)</label>
            <input type="number" style={inp()} placeholder="250000" value={newAgentSalaire} onChange={e => setNewAgentSalaire(e.target.value)} />
          </div>
        </div>
        <button style={{ ...btn(COLORS.blue, '#2563eb'), width: '100%', padding: 12 }} onClick={handleAddAgent}>+ Ajouter l'agent</button>
      </div>

      {/* Liste des agents */}
      <h2 style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 12 }}>
        Liste des agents ({agents.length})
      </h2>
      
      {agents.map(a => {
        const recupsMois = recuperationsAgent[a.id] || { total: 0, count: 0 };
        const recupsCumul = cumulAgent[a.id] || { total: 0, count: 0 };
        
        return (
          <div key={a.id} style={{ background: COLORS.card, border: '1px solid ' + COLORS.border, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
            {editAgentId === a.id ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={lbl()}>Nom</label>
                    <input style={inpSm()} value={editAgentData.nom} onChange={e => setEditAgentData({ ...editAgentData, nom: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl()}>Salaire (Ar)</label>
                    <input type="number" style={inpSm()} value={editAgentData.salaire} onChange={e => setEditAgentData({ ...editAgentData, salaire: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ ...btn(COLORS.green, '#047857'), flex: 1, padding: 10 }} onClick={handleUpdateAgent}>✓ Sauver</button>
                  <button style={{ ...btn('#475569', '#334155'), padding: 10 }} onClick={() => setEditAgentId(null)}>✕</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff', flexShrink: 0 }}>
                    {a.nom.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>{a.nom}</div>
                    <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>Salaire: {formatAr(parseFloat(a.salaire || 0))} / mois</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: '#1e3a5f', border: 'none', borderRadius: 7, padding: '7px 11px', color: '#60a5fa', fontSize: 13, cursor: 'pointer' }} onClick={() => { setEditAgentId(a.id); setEditAgentData({ nom: a.nom, salaire: a.salaire }); }}>✏️</button>
                    <button style={{ background: '#450a0a', border: 'none', borderRadius: 7, padding: '7px 11px', color: COLORS.red, fontSize: 13, cursor: 'pointer' }} onClick={() => handleDeleteAgent(a.id)}>🗑</button>
                  </div>
                </div>

                {/* Récupérations du mois sélectionné */}
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid ' + COLORS.border }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#f59e0b' }}>📦 Récupérations ({monthLabel(selectedMonth)})</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#f59e0b' }}>{recupsMois.count} récup.</span>
                      <span style={{ fontSize: 14, color: '#34d399', fontWeight: 700 }}>{formatAr(recupsMois.total)} Ar</span>
                    </div>
                  </div>
                  
                  {/* Afficher les détails des récupérations du mois */}
                  {recupsMois.details && recupsMois.details.length > 0 && (
                    <div style={{ marginTop: 8, background: COLORS.bg, borderRadius: 6, padding: 6 }}>
                      {recupsMois.details.map((r, idx) => (
                        <div key={idx} style={{ fontSize: 10, color: COLORS.muted, padding: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
                          <span>📅 {r.date}</span>
                          <span>🏪 {r.client_donneur}</span>
                          <span style={{ color: '#34d399' }}>{formatAr(r.frais_recuperation)} Ar</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* TOTAL CUMULÉ (toutes périodes) */}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid ' + COLORS.border2, background: COLORS.bg, borderRadius: 8, padding: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>💰 TOTAL CUMULÉ (toutes périodes)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#fbbf24' }}>{recupsCumul.count} récup.</span>
                      <span style={{ fontSize: 16, color: '#fbbf24', fontWeight: 800 }}>{formatAr(recupsCumul.total)} Ar</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};