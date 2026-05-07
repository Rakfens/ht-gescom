import { useState } from 'react';
import { COLORS, formatAr } from '../../utils/constants';
import { btn, inp, inpSm, lbl } from '../../utils/helpers';

export const Agents = ({ agents, onAddAgent, onUpdateAgent, onDeleteAgent, showToast }) => {
  const [newAgentNom, setNewAgentNom] = useState('');
  const [newAgentSalaire, setNewAgentSalaire] = useState('');
  const [editAgentId, setEditAgentId] = useState(null);
  const [editAgentData, setEditAgentData] = useState({});

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
    await onDeleteAgent(id);
    showToast('Agent supprimé', 'warn');
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 18 }}>Gestion des agents</h1>
      
      <div style={{ background: COLORS.card, border: '1px solid ' + COLORS.border2, borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', marginTop: 0, marginBottom: 12 }}>Ajouter un agent</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div><label style={lbl(COLORS)}>Nom</label><input style={inp(COLORS)} placeholder="Nom complet" value={newAgentNom} onChange={e => setNewAgentNom(e.target.value)} /></div>
          <div><label style={lbl(COLORS)}>Salaire (Ar)</label><input type="number" style={inp(COLORS)} placeholder="250000" value={newAgentSalaire} onChange={e => setNewAgentSalaire(e.target.value)} /></div>
        </div>
        <button style={{ ...btn(COLORS.blue, '#2563eb'), width: '100%', padding: 12 }} onClick={handleAddAgent}>+ Ajouter l'agent</button>
      </div>

      <h2 style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 12 }}>Liste ({agents.length})</h2>
      {agents.map(a => (
        <div key={a.id} style={{ background: COLORS.card, border: '1px solid ' + COLORS.border, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
          {editAgentId === a.id ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><label style={lbl(COLORS)}>Nom</label><input style={inpSm(COLORS)} value={editAgentData.nom} onChange={e => setEditAgentData({ ...editAgentData, nom: e.target.value })} /></div>
                <div><label style={lbl(COLORS)}>Salaire (Ar)</label><input type="number" style={inpSm(COLORS)} value={editAgentData.salaire} onChange={e => setEditAgentData({ ...editAgentData, salaire: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btn(COLORS.green, '#047857'), flex: 1, padding: 10 }} onClick={handleUpdateAgent}>✓ Sauver</button>
                <button style={{ ...btn('#475569', '#334155'), padding: 10 }} onClick={() => setEditAgentId(null)}>✕</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff', flexShrink: 0 }}>{a.nom.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>{a.nom}</div>
                <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>{formatAr(parseFloat(a.salaire || 0))} / mois</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: '#1e3a5f', border: 'none', borderRadius: 7, padding: '7px 11px', color: '#60a5fa', fontSize: 13, cursor: 'pointer' }} onClick={() => { setEditAgentId(a.id); setEditAgentData({ nom: a.nom, salaire: a.salaire }); }}>✏️</button>
                <button style={{ background: '#450a0a', border: 'none', borderRadius: 7, padding: '7px 11px', color: COLORS.red, fontSize: 13, cursor: 'pointer' }} onClick={() => handleDeleteAgent(a.id)}>🗑</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};