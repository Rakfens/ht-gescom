import { useState, useEffect } from 'react';
import { COLORS, formatAr, currentMonth, monthLabel } from '../../utils/constants';
import { btn, inp, inpSm, lbl } from '../../utils/helpers';
import { getRecuperationsByLivreur, getAllRecuperationsByLivreur } from '../../services/recuperationService';

export const Agents = ({ agents, onAddAgent, onUpdateAgent, onDeleteAgent, showToast }) => {
  const [newAgentNom, setNewAgentNom] = useState('');
  const [newAgentSalaire, setNewAgentSalaire] = useState('');
  const [editAgentId, setEditAgentId] = useState(null);
  const [editAgentData, setEditAgentData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [recuperationsAgent, setRecuperationsAgent] = useState({});
  const [loading, setLoading] = useState(false);

  const months = [...new Set([...agents.map(() => currentMonth()), currentMonth()])].sort().reverse();
  const uniqueMonths = [...new Set(months)];

  // Fonction pour charger les récupérations
  const loadAllRecuperations = async () => {
    if (!agents.length) return;
    
    setLoading(true);
    console.log('=== CHARGEMENT DES RÉCUPÉRATIONS ===');
    console.log('Mois sélectionné:', selectedMonth);
    console.log('Nombre d\'agents:', agents.length);
    
    const recupsMap = {};
    
    for (const agent of agents) {
      try {
        console.log(`\n--- Chargement pour: ${agent.nom} (ID: ${agent.id}) ---`);
        
        const data = await getRecuperationsByLivreur(agent.id, selectedMonth);
        
        recupsMap[agent.id] = {
          total: data.reduce((s, r) => s + (parseFloat(r.frais_recuperation) || 0), 0),
          count: data.length,
          details: data
        };
        
        console.log(`Résultat pour ${agent.nom}: ${data.length} récupération(s), total: ${recupsMap[agent.id].total}`);
        
      } catch (error) {
        console.error(`Erreur pour agent ${agent.id}:`, error);
        recupsMap[agent.id] = { total: 0, count: 0, details: [] };
      }
    }
    
    console.log('\n=== RÉCAPITULATIF FINAL ===');
    console.log(recupsMap);
    setRecuperationsAgent(recupsMap);
    setLoading(false);
  };

  // Charger au montage et quand les dépendances changent
  useEffect(() => {
    loadAllRecuperations();
  }, [agents, selectedMonth]);

  const handleAddAgent = async () => {
    if (!newAgentNom.trim() || !newAgentSalaire) {
      showToast('Nom et salaire requis', 'error');
      return;
    }
    await onAddAgent(newAgentNom, newAgentSalaire);
    setNewAgentNom('');
    setNewAgentSalaire('');
    showToast('Agent ajouté');
  };

  const handleUpdateAgent = async () => {
    if (!editAgentData.nom || !editAgentData.salaire) return;
    await onUpdateAgent(editAgentId, { nom: editAgentData.nom, salaire: parseFloat(editAgentData.salaire) });
    setEditAgentId(null);
    showToast('Agent modifié');
  };

  const handleDeleteAgent = async (id) => {
    if (window.confirm('Supprimer cet agent ?')) {
      await onDeleteAgent(id);
      showToast('Agent supprimé', 'warn');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 18 }}>Gestion des agents</h1>
      
      {/* Sélecteur de mois et boutons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ background: COLORS.card, padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#f59e0b' }}>📦 Récupérations du mois :</span>
          <select 
            style={{ ...inpSm(), width: 'auto', padding: '4px 8px' }} 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {uniqueMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        
        <button 
          onClick={() => loadAllRecuperations()}
          style={{ background: '#f59e0b', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#000', fontSize: 12, cursor: 'pointer' }}
        >
          🔄 Rafraîchir
        </button>
      </div>

      {/* Indicateur de chargement */}
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
        Liste ({agents.length})
      </h2>
      
      {agents.map(a => {
        const recups = recuperationsAgent[a.id] || { total: 0, count: 0 };
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
                    <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>{formatAr(parseFloat(a.salaire || 0))} / mois</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: '#1e3a5f', border: 'none', borderRadius: 7, padding: '7px 11px', color: '#60a5fa', fontSize: 13, cursor: 'pointer' }} onClick={() => { setEditAgentId(a.id); setEditAgentData({ nom: a.nom, salaire: a.salaire }); }}>✏️</button>
                    <button style={{ background: '#450a0a', border: 'none', borderRadius: 7, padding: '7px 11px', color: COLORS.red, fontSize: 13, cursor: 'pointer' }} onClick={() => handleDeleteAgent(a.id)}>🗑</button>
                  </div>
                </div>

                {/* Récapitulatif des récupérations */}
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid ' + COLORS.border }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#f59e0b' }}>📦 Récupérations</span>
                      <span style={{ fontSize: 11, color: COLORS.muted }}>({monthLabel(selectedMonth)})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: '#f59e0b' }}>{recups.count} récup.</span>
                      <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>💰 {formatAr(recups.total)}</span>
                    </div>
                  </div>
                  
                  {recups.count === 0 && !loading && (
                    <div style={{ fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 8 }}>
                      Aucune récupération pour ce mois
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};