// Depenses.jsx — FIX #1 getCurrentCompany→useCompany + FIX #2 confirm()→modal + FIX #3 console.log
import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { supabase } from '../../../supabaseClient';
import { formatAr } from '../../shared/utils/constants';
import { btn, inp, lbl, modalStyles } from '../../shared/utils/helpers';

// ─── Toast inline ─────────────────────────────────────────────────────
function useLocalToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type='success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return { toasts, success:m=>show(m,'success'), error:m=>show(m,'error'), warn:m=>show(m,'warn') };
}
function ToastStack({ toasts }) {
  const colors = { success:'var(--green)', error:'var(--red)', warn:'var(--yellow)' };
  const bgs    = { success:'var(--green-dim)', error:'var(--red-dim)', warn:'var(--yellow-dim)' };
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed', bottom:90, right:14, zIndex:999, display:'flex', flexDirection:'column', gap:8, maxWidth:280 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background:bgs[t.type], color:colors[t.type], border:`1px solid ${colors[t.type]}30`, padding:'10px 14px', borderRadius:12, fontSize:13, fontWeight:600, animation:'slideDown 0.3s ease', boxShadow:'var(--shadow)' }}>{t.msg}</div>
      ))}
    </div>
  );
}

// FIX #2 : Modal de confirmation (remplace confirm())
function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ ...modalStyles.overlay, zIndex:300 }}>
      <div style={{ ...modalStyles.box, maxWidth:340 }}>
        <div style={modalStyles.handle} />
        <div style={{ fontSize:28, textAlign:'center', marginBottom:10 }}>🗑️</div>
        <div style={{ ...modalStyles.title, textAlign:'center' }}>Supprimer la dépense ?</div>
        <div style={{ fontSize:13, color:'var(--text2)', textAlign:'center', marginBottom:24 }}>{message}</div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel}  style={{ ...btn('var(--card2)','var(--card2)'), flex:1, color:'var(--text2)', border:'1px solid var(--border2)' }}>Annuler</button>
          <button onClick={onConfirm} style={{ ...btn('var(--red)','var(--red2)'), flex:1 }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES_DEFAULT = ['Électricité','Eau','Transport','Fournitures','Communication','Loyer','Marketing','Salaires','Entretien','Impressions','Autres'];

export default function Depenses() {
  // FIX #1 : useCompany() uniquement — plus de getCurrentCompany()
  const { currentCompany } = useCompany();
  const toast = useLocalToast();

  const [depenses,       setDepenses]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [showModal,      setShowModal]      = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [filterCat,      setFilterCat]      = useState('');
  const [filterDebut,    setFilterDebut]    = useState('');
  const [filterFin,      setFilterFin]      = useState('');
  const [stats, setStats] = useState({ totalJour:0, totalSemaine:0, totalMois:0, totalAnnee:0 });
  const [form, setForm] = useState({ categorie:'', description:'', montant:0, date_depense:new Date().toISOString().split('T')[0] });

  // FIX #1 : currentCompany.id directement
  const loadDepenses = useCallback(async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      let q = supabase.from('depenses').select('*').eq('company_id', currentCompany.id).order('date_depense', { ascending:false });
      if (filterCat)   q = q.eq('categorie', filterCat);
      if (filterDebut) q = q.gte('date_depense', filterDebut);
      if (filterFin)   q = q.lte('date_depense', filterFin);
      const { data, error } = await q;
      if (error) throw error;
      const list = data || [];
      setDepenses(list);
      calcStats(list);
    } catch (_) {
      toast.error('Erreur chargement des dépenses');
    } finally { setLoading(false); }
  }, [currentCompany, filterCat, filterDebut, filterFin]);

  useEffect(() => { loadDepenses(); }, [loadDepenses]);

  const calcStats = (list) => {
    const t = new Date().toISOString().split('T')[0];
    const dow = new Date().getDay(); const diff = dow===0?6:dow-1;
    const sw  = new Date(); sw.setDate(sw.getDate()-diff);
    const swStr = sw.toISOString().split('T')[0];
    const sm  = new Date(); sm.setDate(1); const smStr = sm.toISOString().split('T')[0];
    const sy  = new Date(); sy.setMonth(0); sy.setDate(1); const syStr = sy.toISOString().split('T')[0];
    const sum = (arr) => arr.reduce((s,d)=>s+(d.montant||0),0);
    const d = (date) => (date||'').split('T')[0];
    setStats({
      totalJour:    sum(list.filter(x => d(x.date_depense)===t)),
      totalSemaine: sum(list.filter(x => d(x.date_depense)>=swStr)),
      totalMois:    sum(list.filter(x => d(x.date_depense)>=smStr)),
      totalAnnee:   sum(list.filter(x => d(x.date_depense)>=syStr)),
    });
  };

  // FIX #1 + FIX #2 (alert remplacé par toast)
  const handleSubmit = async () => {
    if (!form.categorie)     { toast.warn('Catégorie requise'); return; }
    if (!form.description)   { toast.warn('Description requise'); return; }
    if (form.montant <= 0)   { toast.warn('Montant doit être > 0'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('depenses').insert([{
        company_id:   currentCompany.id,
        categorie:    form.categorie,
        description:  form.description,
        montant:      form.montant,
        date_depense: form.date_depense,
        created_at:   new Date().toISOString(),
      }]);
      if (error) throw error;
      toast.success('Dépense enregistrée');
      setShowModal(false);
      setForm({ categorie:'', description:'', montant:0, date_depense:new Date().toISOString().split('T')[0] });
      loadDepenses();
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (_) { toast.error('Erreur lors de l\'enregistrement'); }
    finally { setSaving(false); }
  };

  // FIX #2 : confirm() → modal
  const handleDelete = (depense) => { setConfirmDelete(depense); };
  const executeDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    try {
      const { error } = await supabase.from('depenses').delete().eq('id', id).eq('company_id', currentCompany.id);
      if (error) throw error;
      toast.success('Dépense supprimée');
      loadDepenses();
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (_) { toast.error('Erreur suppression'); }
  };

  const categories     = [...new Set(depenses.map(d=>d.categorie))];
  const totalDepenses  = depenses.reduce((s,d)=>s+(d.montant||0),0);
  const byCategorie    = depenses.reduce((acc,d) => { acc[d.categorie]=(acc[d.categorie]||0)+d.montant; return acc; }, {});

  return (
    <div style={{ padding:'0 0 24px' }}>
      <ToastStack toasts={toast.toasts} />
      <ConfirmModal
        open={!!confirmDelete}
        message={`"${confirmDelete?.description}" · ${formatAr(confirmDelete?.montant||0)}`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* En-tête */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>Dépenses</h1>
          <p style={{ color:'var(--muted)', fontSize:12, marginTop:2 }}>{currentCompany?.name} · {depenses.length} enregistrement(s)</p>
        </div>
        <button style={{ ...btn('var(--red)','var(--red2)'), padding:'10px 16px', fontSize:13 }} onClick={() => setShowModal(true)}>+ Nouvelle dépense</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { label:"Aujourd'hui", value:stats.totalJour,    color:'var(--red)',    icon:'📅' },
          { label:'Semaine',     value:stats.totalSemaine, color:'var(--orange)', icon:'📆' },
          { label:'Mois',        value:stats.totalMois,    color:'var(--red)',    icon:'🗓️' },
          { label:'Année',       value:stats.totalAnnee,   color:'var(--pink)',   icon:'📊' },
          { label:'Total',       value:totalDepenses,      color:'var(--purple)', icon:'💰' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--card)', border:`1px solid ${s.color}20`, borderRadius:13, padding:'12px 14px', borderTop:`2px solid ${s.color}` }}>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4, fontWeight:600 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{formatAr(s.value)}</div>
          </div>
        ))}
      </div>

      {/* Répartition */}
      {Object.keys(byCategorie).length > 0 && (
        <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--border2)', padding:16, marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>📊 Répartition</div>
          {Object.entries(byCategorie).sort(([,a],[,b])=>b-a).map(([cat,total]) => {
            const pct = totalDepenses>0 ? (total/totalDepenses*100).toFixed(1) : 0;
            return (
              <div key={cat} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:13 }}>
                  <span style={{ fontWeight:600 }}>{cat}</span>
                  <span style={{ color:'var(--muted)' }}>{formatAr(total)} · {pct}%</span>
                </div>
                <div style={{ background:'var(--bg)', height:7, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, background:'var(--red)', height:'100%', borderRadius:4, transition:'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <select style={{ ...inp(), minWidth:150 }} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" style={inp()} value={filterDebut} onChange={e=>setFilterDebut(e.target.value)} />
        <span style={{ alignSelf:'center', color:'var(--muted)', fontSize:13 }}>→</span>
        <input type="date" style={inp()} value={filterFin}   onChange={e=>setFilterFin(e.target.value)} />
        {(filterCat||filterDebut||filterFin) && (
          <button style={{ ...btn('var(--card2)','var(--card2)'), color:'var(--muted)', border:'1px solid var(--border2)', padding:'0 12px' }} onClick={()=>{setFilterCat('');setFilterDebut('');setFilterFin('');}}>✕</button>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign:'center', color:'var(--muted)', padding:40 }}>Chargement...</div>
      ) : (
        <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--border2)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg)', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  <th style={{ padding:'10px 12px', textAlign:'left' }}>Date</th>
                  <th style={{ padding:'10px 12px', textAlign:'left' }}>Catégorie</th>
                  <th style={{ padding:'10px 12px', textAlign:'left' }}>Description</th>
                  <th style={{ padding:'10px 12px', textAlign:'right' }}>Montant</th>
                  <th style={{ padding:'10px 12px', textAlign:'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {depenses.length === 0
                  ? <tr><td colSpan={5} style={{ padding:48, textAlign:'center', color:'var(--muted)' }}><div style={{ fontSize:28, marginBottom:8 }}>💸</div>Aucune dépense</td></tr>
                  : depenses.map(d => (
                    <tr key={d.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'10px 12px', fontSize:13 }}>{new Date(d.date_depense+'T00:00:00').toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ background:'var(--blue-dim)', color:'var(--blue)', padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700 }}>{d.categorie}</span>
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:13 }}>{d.description}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, color:'var(--orange)', fontSize:13 }}>{formatAr(d.montant)}</td>
                      <td style={{ padding:'10px 12px', textAlign:'center' }}>
                        <button onClick={()=>handleDelete(d)} style={{ ...btn('var(--red-dim)','var(--red-dim)'), padding:'5px 10px', fontSize:12, color:'var(--red)', border:'1px solid rgba(248,113,113,0.2)' }}>🗑️</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
              {depenses.length > 0 && (
                <tfoot>
                  <tr style={{ background:'var(--bg)', borderTop:'2px solid var(--border2)' }}>
                    <td colSpan={3} style={{ padding:'10px 12px', fontWeight:700 }}>TOTAL</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:800, fontSize:16, color:'var(--red)' }}>{formatAr(totalDepenses)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.box, maxWidth:450 }}>
            <div style={modalStyles.handle} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={modalStyles.title}>Nouvelle dépense</h2>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:22, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'grid', gap:12 }}>
              <div>
                <label style={lbl()}>Catégorie *</label>
                <input style={inp()} list="cats-list" placeholder="Ex: Électricité, Transport..." value={form.categorie} onChange={e=>setForm({...form,categorie:e.target.value})} />
                <datalist id="cats-list">{[...CATEGORIES_DEFAULT,...categories.filter(c=>!CATEGORIES_DEFAULT.includes(c))].map(c=><option key={c} value={c}/>)}</datalist>
              </div>
              <div>
                <label style={lbl()}>Description *</label>
                <textarea style={{ ...inp(), minHeight:70 }} placeholder="Description détaillée..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lbl()}>Montant (Ar) *</label><input type="number" style={inp()} value={form.montant} onChange={e=>setForm({...form,montant:parseFloat(e.target.value)||0})} /></div>
                <div><label style={lbl()}>Date</label><input type="date" style={inp()} value={form.date_depense} onChange={e=>setForm({...form,date_depense:e.target.value})} /></div>
              </div>
              <button style={{ ...btn('var(--red)','var(--red2)'), padding:13, marginTop:8, opacity:saving?0.7:1 }} onClick={handleSubmit} disabled={saving}>
                {saving?'Enregistrement...':'Enregistrer la dépense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
