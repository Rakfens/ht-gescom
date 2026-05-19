// Agents.jsx — FIX #2 confirm()→modal + FIX #3 console.log + FIX performance Promise.all
import { useState, useEffect, useCallback } from 'react';
import { formatAr, currentMonth, monthLabel } from '../../shared/utils/constants';
import { btn, inp, inpSm, lbl, modalStyles } from '../../shared/utils/helpers';
import { getRecuperationsByLivreurNom, getTotalRecuperationsByLivreurNom } from '../services/recuperationService';

// FIX #2 : Modal de confirmation
function ConfirmModal({ open, name, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ ...modalStyles.overlay, zIndex:300 }}>
      <div style={{ ...modalStyles.box, maxWidth:340 }}>
        <div style={modalStyles.handle} />
        <div style={{ fontSize:28, textAlign:'center', marginBottom:10 }}>⚠️</div>
        <div style={{ ...modalStyles.title, textAlign:'center' }}>Supprimer l'agent ?</div>
        <div style={{ fontSize:13, color:'var(--text2)', textAlign:'center', marginBottom:24 }}>
          {name} et toutes ses données seront supprimés définitivement.
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel}  style={{ ...btn('var(--card2)','var(--card2)'), flex:1, color:'var(--text2)', border:'1px solid var(--border2)' }}>Annuler</button>
          <button onClick={onConfirm} style={{ ...btn('var(--red)','var(--red2)'), flex:1 }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export const Agents = ({ agents, onAddAgent, onUpdateAgent, onDeleteAgent, showToast }) => {
  const [newNom,     setNewNom]     = useState('');
  const [newSalaire, setNewSalaire] = useState('');
  const [editId,     setEditId]     = useState(null);
  const [editData,   setEditData]   = useState({});
  const [month,      setMonth]      = useState(currentMonth());
  const [recupsMois, setRecupsMois] = useState({});
  const [recupsCumul,setRecupsCumul]= useState({});
  const [loading,    setLoading]    = useState(false);
  // FIX #2 : plus de window.confirm()
  const [confirmDel, setConfirmDel] = useState(null); // { id, name }

  const uniqueMonths = [...new Set([currentMonth()])].sort().reverse();

  // FIX performance : Promise.all au lieu de boucle séquentielle
  // FIX #3 : tous les console.log supprimés
  const loadRecuperations = useCallback(async () => {
    if (!agents.length) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        agents.map(async (agent) => {
          const [dataMois, { total:totalCumul, count:countCumul }] = await Promise.all([
            getRecuperationsByLivreurNom(agent.nom, month),
            getTotalRecuperationsByLivreurNom(agent.nom),
          ]);
          return {
            id: agent.id,
            mois:  { total: dataMois.reduce((s,r) => s+(parseFloat(r.frais_recuperation)||0), 0), count:dataMois.length, details:dataMois },
            cumul: { total:totalCumul, count:countCumul },
          };
        })
      );
      const moisMap  = {};
      const cumulMap = {};
      results.forEach(r => { moisMap[r.id]=r.mois; cumulMap[r.id]=r.cumul; });
      setRecupsMois(moisMap);
      setRecupsCumul(cumulMap);
    } catch (_) {}
    finally { setLoading(false); }
  }, [agents, month]);

  useEffect(() => { loadRecuperations(); }, [loadRecuperations]);

  const handleAdd = async () => {
    if (!newNom.trim() || !newSalaire) { showToast('Nom et salaire requis', 'error'); return; }
    await onAddAgent(newNom, newSalaire);
    setNewNom(''); setNewSalaire('');
    showToast('Agent ajouté');
  };

  const handleUpdate = async () => {
    if (!editData.nom || !editData.salaire) return;
    await onUpdateAgent(editId, { nom:editData.nom, salaire:parseFloat(editData.salaire) });
    setEditId(null);
    showToast('Agent modifié');
  };

  // FIX #2 : confirm() → modal
  const handleDelete = (agent) => { setConfirmDel({ id:agent.id, name:agent.nom }); };
  const executeDelete = async () => {
    if (!confirmDel) return;
    const { id } = confirmDel;
    setConfirmDel(null);
    await onDeleteAgent(id);
    showToast('Agent supprimé', 'warn');
  };

  return (
    <div>
      <ConfirmModal open={!!confirmDel} name={confirmDel?.name} onConfirm={executeDelete} onCancel={()=>setConfirmDel(null)} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>Agents</h1>
          <p style={{ color:'var(--muted)', fontSize:12, marginTop:2 }}>{agents.length} agent(s) enregistré(s)</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <select style={{ ...inpSm(), width:'auto' }} value={month} onChange={e=>setMonth(e.target.value)}>
            {uniqueMonths.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button onClick={loadRecuperations} style={{ ...btn('var(--yellow-dim)','var(--yellow-dim)'), padding:'8px 12px', color:'var(--yellow)', border:'1px solid rgba(251,191,36,0.25)', fontSize:12 }}>
            🔄
          </button>
        </div>
      </div>

      {/* Formulaire ajout */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:14, padding:18, marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Ajouter un agent</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div><label style={lbl()}>Nom</label><input style={inp()} placeholder="Nom complet" value={newNom} onChange={e=>setNewNom(e.target.value)} /></div>
          <div><label style={lbl()}>Salaire (Ar)</label><input type="number" style={inp()} placeholder="250000" value={newSalaire} onChange={e=>setNewSalaire(e.target.value)} /></div>
        </div>
        <button style={{ ...btn('var(--blue)','var(--blue2)'), width:'100%', padding:12 }} onClick={handleAdd}>+ Ajouter l'agent</button>
      </div>

      {loading && <div style={{ textAlign:'center', color:'var(--muted)', padding:20, fontSize:13 }}>Chargement des récupérations...</div>}

      {/* Liste */}
      <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
        Liste des agents ({agents.length})
      </div>

      {agents.map(a => {
        const rm = recupsMois[a.id]  || { total:0, count:0, details:[] };
        const rc = recupsCumul[a.id] || { total:0, count:0 };
        return (
          <div key={a.id} style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:14, padding:16, marginBottom:10, animation:'fadeUp 0.3s ease both' }}>
            {editId === a.id ? (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                  <div><label style={lbl()}>Nom</label><input style={inpSm()} value={editData.nom} onChange={e=>setEditData({...editData,nom:e.target.value})} /></div>
                  <div><label style={lbl()}>Salaire (Ar)</label><input type="number" style={inpSm()} value={editData.salaire} onChange={e=>setEditData({...editData,salaire:e.target.value})} /></div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button style={{ ...btn('var(--green)','var(--green2)'), flex:1, padding:10 }} onClick={handleUpdate}>✓ Sauver</button>
                  <button style={{ ...btn('var(--card2)','var(--card2)'), padding:10, border:'1px solid var(--border2)', color:'var(--muted)' }} onClick={()=>setEditId(null)}>✕</button>
                </div>
              </div>
            ) : (
              <div>
                {/* Ligne principale */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--blue2))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'#fff', flexShrink:0 }}>
                    {a.nom.charAt(0)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:'var(--text)', fontSize:15 }}>{a.nom}</div>
                    <div style={{ fontSize:12, color:'var(--green)', fontWeight:600 }}>{formatAr(parseFloat(a.salaire||0))} / mois</div>
                  </div>
                  <div style={{ display:'flex', gap:7 }}>
                    <button onClick={()=>{setEditId(a.id);setEditData({nom:a.nom,salaire:a.salaire});}}
                      style={{ background:'var(--blue-dim)', border:'1px solid rgba(79,158,255,0.2)', borderRadius:8, padding:'7px 10px', color:'var(--blue)', fontSize:13, cursor:'pointer' }}>✏️</button>
                    <button onClick={()=>handleDelete(a)}
                      style={{ background:'var(--red-dim)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'7px 10px', color:'var(--red)', fontSize:13, cursor:'pointer' }}>🗑</button>
                  </div>
                </div>

                {/* Récupérations du mois */}
                <div style={{ background:'var(--bg)', borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: rm.details?.length ? 8 : 0 }}>
                    <span style={{ fontSize:11, color:'var(--yellow)', fontWeight:700 }}>📦 {monthLabel(month)}</span>
                    <div style={{ display:'flex', gap:10 }}>
                      <span style={{ fontSize:12, color:'var(--muted)' }}>{rm.count} récup.</span>
                      <span style={{ fontSize:13, color:'var(--green)', fontWeight:700 }}>{formatAr(rm.total)}</span>
                    </div>
                  </div>
                  {rm.details?.length > 0 && (
                    <div style={{ borderTop:'1px solid var(--border)', paddingTop:6 }}>
                      {rm.details.map((r,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', padding:'3px 0' }}>
                          <span>📅 {r.date}</span>
                          <span>🏪 {r.client_donneur}</span>
                          <span style={{ color:'var(--green)', fontWeight:600 }}>{formatAr(r.frais_recuperation)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cumul total */}
                <div style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'var(--yellow)', fontWeight:700 }}>💰 Cumul total</span>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ fontSize:12, color:'var(--muted)' }}>{rc.count} récup.</span>
                    <span style={{ fontSize:14, color:'var(--yellow)', fontWeight:800 }}>{formatAr(rc.total)}</span>
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
