// Achats.jsx — FIX #1 (alert/confirm→toast/modal) + FIX #2 (console.log) + #4 autocomplete fournisseurs
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchProduits } from '../services/produitService';
import { fetchAchats, createAchat, updateAchat, deleteAchat } from '../services/achatService';
import { formatAr } from '../../shared/utils/constants';
import { btn, inp, lbl, modalStyles } from '../../shared/utils/helpers';

// ─── Toast inline ─────────────────────────────────────────────────────
function useLocalToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return { toasts, success: m => show(m, 'success'), error: m => show(m, 'error'), warn: m => show(m, 'warn') };
}

function ToastStack({ toasts }) {
  const colors = { success: 'var(--green)', error: 'var(--red)', warn: 'var(--yellow)' };
  const bgs = { success: 'var(--green-dim)', error: 'var(--red-dim)', warn: 'var(--yellow-dim)' };
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: bgs[t.type], color: colors[t.type], border: `1px solid ${colors[t.type]}30`, padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, animation: 'slideDown 0.3s ease', boxShadow: 'var(--shadow)', maxWidth: 300 }}>{t.msg}</div>
      ))}
    </div>
  );
}

// FIX #1 : Modal de confirmation
function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div style={{ ...modalStyles.overlay, zIndex: 300 }}>
      <div style={{ ...modalStyles.box, maxWidth: 360 }}>
        <div style={modalStyles.handle} />
        <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 10 }}>⚠️</div>
        <div style={{ ...modalStyles.title, textAlign: 'center' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...btn('var(--card2)', 'var(--card2)'), flex: 1, color: 'var(--text2)', border: '1px solid var(--border2)' }}>Annuler</button>
          <button onClick={onConfirm} style={{ ...btn('var(--red)', 'var(--red2)'), flex: 1 }}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}

export default function Achats() {
  const { currentCompany } = useCompany();
  const toast = useLocalToast();

  const [achats, setAchats] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAchat, setSelectedAchat] = useState(null);
  const [panier, setPanier] = useState([]);
  const [searchProduit, setSearchProduit] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isMobile,      setIsMobile]      = useState(window.innerWidth <= 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // #4 : mémoriser les fournisseurs déjà saisis pour autocomplete
  const [fournisseursConnus, setFournisseursConnus] = useState([]);

  const [form, setForm] = useState({
    fournisseur_nom: '',
    fournisseur_contact: '',
    tva: 0,
    montant_paye: 0,
    date_achat: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadData(); }, [currentCompany]);

  useEffect(() => {
    const handler = (e) => {
      if (['achats', 'achat_details'].includes(e.detail?.table)) loadData();
    };
    window.addEventListener('supabase_realtime', handler);
    return () => window.removeEventListener('supabase_realtime', handler);
  }, []);

  // FIX #2 : suppression console.log
  const loadData = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [achatsData, produitsData] = await Promise.all([fetchAchats(), fetchProduits()]);
      setAchats(achatsData);
      setProduits(produitsData);
      // #4 : extraire les fournisseurs uniques pour l'autocomplete
      const fournisseurs = [...new Set(achatsData.map(a => a.fournisseur_nom).filter(Boolean))];
      setFournisseursConnus(fournisseurs);
    } catch (err) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (produit) => {
    const existing = panier.find(p => p.produit_id === produit.id);
    if (existing) {
      setPanier(panier.map(p => p.produit_id === produit.id
        ? { ...p, quantite: p.quantite + 1, sous_total: (p.quantite + 1) * p.prix_unitaire } : p));
    } else {
      setPanier([...panier, { produit_id: produit.id, nom: produit.nom, quantite: 1, prix_unitaire: produit.prix_achat || 0, sous_total: produit.prix_achat || 0 }]);
    }
  };

  const updateCartQty = (produitId, quantite) => {
    if (quantite <= 0) { setPanier(panier.filter(p => p.produit_id !== produitId)); return; }
    setPanier(panier.map(p => p.produit_id === produitId ? { ...p, quantite, sous_total: quantite * p.prix_unitaire } : p));
  };

  const updateCartPrice = (produitId, newPrice) => {
    setPanier(panier.map(p => p.produit_id === produitId ? { ...p, prix_unitaire: newPrice, sous_total: p.quantite * newPrice } : p));
  };

  const resetForm = () => {
    setEditMode(false); setSelectedAchat(null); setPanier([]); setSearchProduit('');
    setForm({ fournisseur_nom: '', fournisseur_contact: '', tva: 0, montant_paye: 0, date_achat: new Date().toISOString().split('T')[0] });
  };

  // FIX #1 : alert() → toast
  const handleSubmitAchat = async () => {
    if (panier.length === 0) { toast.warn('Ajoutez au moins un produit'); return; }
    if (!form.fournisseur_nom.trim()) { toast.warn('Le nom du fournisseur est requis'); return; }
    const details = panier.map(p => ({ produit_id: p.produit_id, quantite: p.quantite, prix_unitaire: p.prix_unitaire, sous_total: p.sous_total }));
    const achatData = { fournisseur_nom: form.fournisseur_nom, fournisseur_contact: form.fournisseur_contact, tva: parseFloat(form.tva) || 0, montant_paye: parseFloat(form.montant_paye) || 0, date_achat: form.date_achat };

    setSaving(true);
    try {
      if (editMode && selectedAchat) {
        await updateAchat(selectedAchat.id, achatData, details);
        toast.success('Achat modifié avec succès');
      } else {
        await createAchat(achatData, details);
        toast.success('Achat enregistré, stock mis à jour');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error(`Erreur : ${err.message || 'Impossible d\'enregistrer'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditAchat = (achat) => {
    setEditMode(true); setSelectedAchat(achat);
    setForm({ fournisseur_nom: achat.fournisseur_nom || '', fournisseur_contact: achat.fournisseur_contact || '', tva: achat.tva || 0, montant_paye: achat.montant_paye || 0, date_achat: achat.date_achat?.split('T')[0] || new Date().toISOString().split('T')[0] });
    if (achat.details) setPanier(achat.details.map(d => ({ produit_id: d.produit_id, nom: d.produit?.nom || 'Produit', quantite: d.quantite, prix_unitaire: d.prix_unitaire, sous_total: d.sous_total })));
    setShowModal(true);
  };

  // FIX #1 : confirm() → modal
  const handleDeleteAchat = (id) => { setConfirmDelete({ id }); };
  const executeDelete = async () => {
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteAchat(id);
      toast.success('Achat supprimé, stock ajusté');
      loadData();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const totalPanier = panier.reduce((s, p) => s + p.sous_total, 0);
  const totalAvecTVA = totalPanier + (parseFloat(form.tva) || 0);

  const produitsFiltres = produits.filter(p =>
    !searchProduit || p.nom.toLowerCase().includes(searchProduit.toLowerCase()) || (p.reference || '').toLowerCase().includes(searchProduit.toLowerCase())
  );

  if (loading) return (
    <div style={{ color: 'var(--muted)', padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📥</div>Chargement des achats...
    </div>
  );

  return (
    <div style={{ padding: '0 0 20px' }}>
      <ToastStack toasts={toast.toasts} />

      <ConfirmModal
        open={!!confirmDelete}
        title="Supprimer cet achat ?"
        message="Cette action est irréversible. Le stock des produits sera ajusté en conséquence."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
        danger
      />

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Achats</h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>{currentCompany?.name} · {achats.length} commande(s)</p>
        </div>
        <button style={{ ...btn('var(--blue)', 'var(--blue2)'), padding: '10px 18px' }}
          onClick={() => { resetForm(); setShowModal(true); }}>
          + Nouvel achat
        </button>
      </div>

      {/* Mobile : cards / Desktop : tableau */}
      {isMobile ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {achats.length === 0
            ? <div style={{ textAlign:'center', color:'var(--muted)', padding:48 }}><div style={{ fontSize:28, marginBottom:8 }}>📥</div>Aucun achat</div>
            : achats.map(a => {
              const solde = (a.montant_total||0)-(a.montant_paye||0);
              return (
                <div key={a.id} style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:16, padding:16, animation:'fadeUp 0.3s ease both' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>{a.numero_commande}</div>
                      <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                        {a.fournisseur_nom} · {new Date(a.date_achat).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <span style={{ background: solde>0?'var(--orange-dim)':'var(--green-dim)', color: solde>0?'var(--orange)':'var(--green)', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                      {solde>0 ? 'Crédit' : '✓ Soldé'}
                    </span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                    <div style={{ background:'var(--bg)', borderRadius:10, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, color:'var(--muted)', marginBottom:3, fontWeight:600 }}>TOTAL</div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{formatAr(a.montant_total)}</div>
                    </div>
                    <div style={{ background:'var(--bg)', borderRadius:10, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, color:'var(--muted)', marginBottom:3, fontWeight:600 }}>PAYÉ</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>{formatAr(a.montant_paye)}</div>
                    </div>
                    <div style={{ background:'var(--bg)', borderRadius:10, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, color:'var(--muted)', marginBottom:3, fontWeight:600 }}>SOLDE</div>
                      <div style={{ fontSize:13, fontWeight:700, color:solde>0?'var(--orange)':'var(--green)' }}>{solde>0?formatAr(solde):'✓'}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                    <button onClick={()=>handleEditAchat(a)}     style={{ ...btn('var(--blue-dim)','var(--blue-dim)'), padding:'10px 0', fontSize:15, border:'1px solid rgba(79,158,255,0.2)', borderRadius:10 }}>✏️ Modifier</button>
                    <button onClick={()=>handleDeleteAchat(a.id)} style={{ ...btn('var(--red-dim)','var(--red-dim)'), padding:'10px 0', fontSize:15, color:'var(--red)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10 }}>🗑️ Supprimer</button>
                  </div>
                </div>
              );
            })
          }
          {achats.length > 0 && (
            <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--border2)', padding:'14px 16px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontWeight:700, fontSize:13 }}>TOTAL</span>
              <div style={{ display:'flex', gap:16 }}>
                <span style={{ color:'var(--orange)', fontWeight:800 }}>{formatAr(achats.reduce((s,a)=>s+(a.montant_total||0),0))}</span>
                <span style={{ color:'var(--orange)', fontWeight:700 }}>Solde: {formatAr(achats.reduce((s,a)=>s+Math.max(0,(a.montant_total||0)-(a.montant_paye||0)),0))}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--border2)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg)', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {['Commande','Fournisseur','Date','Montant','Payé','Solde','Actions'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px', textAlign:['Montant','Payé','Solde'].includes(h)?'right':h==='Actions'?'center':'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {achats.length===0
                  ? <tr><td colSpan={7} style={{ padding:48, textAlign:'center', color:'var(--muted)' }}><div style={{ fontSize:28, marginBottom:8 }}>📥</div>Aucun achat</td></tr>
                  : achats.map(a => {
                    const solde=(a.montant_total||0)-(a.montant_paye||0);
                    return (
                      <tr key={a.id} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'10px 12px', fontWeight:600, fontSize:13 }}>{a.numero_commande}</td>
                        <td style={{ padding:'10px 12px' }}>{a.fournisseur_nom}</td>
                        <td style={{ padding:'10px 12px', fontSize:13 }}>{new Date(a.date_achat).toLocaleDateString('fr-FR')}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:600 }}>{formatAr(a.montant_total)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right' }}>{formatAr(a.montant_paye)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, color:solde>0?'var(--orange)':'var(--green)' }}>{solde>0?formatAr(solde):'✓'}</td>
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>
                          <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                            <button onClick={()=>handleEditAchat(a)}     style={{ ...btn('var(--card2)','var(--card2)'), padding:'5px 9px', fontSize:13, border:'1px solid var(--border2)', color:'var(--muted)' }}>✏️</button>
                            <button onClick={()=>handleDeleteAchat(a.id)} style={{ ...btn('var(--red-dim)','var(--red-dim)'), padding:'5px 9px', fontSize:13, color:'var(--red)', border:'1px solid rgba(248,113,113,0.2)' }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr style={{ background:'var(--bg)', borderTop:'2px solid var(--border2)' }}>
                  <td colSpan={3} style={{ padding:'10px 12px', fontWeight:700, fontSize:13 }}>TOTAL</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:800, fontSize:15, color:'var(--orange)' }}>{formatAr(achats.reduce((s,a)=>s+(a.montant_total||0),0))}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700 }}>{formatAr(achats.reduce((s,a)=>s+(a.montant_paye||0),0))}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, color:'var(--orange)' }}>{formatAr(achats.reduce((s,a)=>s+Math.max(0,(a.montant_total||0)-(a.montant_paye||0)),0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.box, maxWidth: 820, borderRadius: 20, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={modalStyles.handle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={modalStyles.title}>{editMode ? 'Modifier l\'achat' : 'Nouvel achat'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Produits */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Produits</div>
                <input type="text" placeholder="🔍 Rechercher un produit..."
                  style={{ ...inp(), marginBottom: 10 }}
                  value={searchProduit}
                  onChange={e => setSearchProduit(e.target.value)} />
                <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 6 }}>
                  {produitsFiltres.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, marginBottom: 4 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nom}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Stock: {p.quantite_stock} · Prix achat: {formatAr(p.prix_achat)}</div>
                      </div>
                      <button style={{ ...btn('var(--blue)', 'var(--blue2)'), padding: '5px 11px', fontSize: 12 }} onClick={() => addToCart(p)}>+</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Panier ({panier.length} article{panier.length > 1 ? 's' : ''})
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 6, marginBottom: 14 }}>
                  {panier.length === 0
                    ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Panier vide</div>
                    : panier.map(item => (
                      <div key={item.produit_id} style={{ padding: '8px 6px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.nom}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => updateCartQty(item.produit_id, item.quantite - 1)} style={{ ...btn('var(--card2)', 'var(--card2)'), padding: '2px 8px', border: '1px solid var(--border2)', color: 'var(--text)' }}>−</button>
                            <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.quantite}</span>
                            <button onClick={() => updateCartQty(item.produit_id, item.quantite + 1)} style={{ ...btn('var(--card2)', 'var(--card2)'), padding: '2px 8px', border: '1px solid var(--border2)', color: 'var(--text)' }}>+</button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Prix:</span>
                            <input type="number" style={{ width: 90, padding: '3px 7px', borderRadius: 7, background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text)', fontSize: 12 }}
                              value={item.prix_unitaire} onChange={e => updateCartPrice(item.produit_id, parseFloat(e.target.value) || 0)} step="100" />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--orange)' }}>{formatAr(item.sous_total)}</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* #4 : Fournisseur avec datalist autocomplete */}
                <div style={{ marginBottom: 10 }}>
                  <label style={lbl()}>Fournisseur *</label>
                  <input list="fournisseurs-list" style={inp()} placeholder="Nom du fournisseur"
                    value={form.fournisseur_nom} onChange={e => setForm({ ...form, fournisseur_nom: e.target.value })} />
                  <datalist id="fournisseurs-list">
                    {fournisseursConnus.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={lbl()}>Contact</label><input style={inp()} placeholder="Téléphone" value={form.fournisseur_contact} onChange={e => setForm({ ...form, fournisseur_contact: e.target.value })} /></div>
                  <div><label style={lbl()}>Date</label><input type="date" style={inp()} value={form.date_achat} onChange={e => setForm({ ...form, date_achat: e.target.value })} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div><label style={lbl()}>TVA (Ar)</label><input type="number" style={inp()} value={form.tva} onChange={e => setForm({ ...form, tva: parseFloat(e.target.value) || 0 })} /></div>
                  <div><label style={lbl()}>Montant payé</label><input type="number" style={inp()} value={form.montant_paye} onChange={e => setForm({ ...form, montant_paye: parseFloat(e.target.value) || 0 })} /></div>
                </div>

                {/* Récap */}
                <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 12, marginBottom: 14 }}>
                  {[
                    { label: 'Sous-total', value: formatAr(totalPanier) },
                    { label: 'TVA', value: formatAr(form.tva) },
                    { label: 'Total', value: formatAr(totalAvecTVA), bold: true, big: true },
                    { label: 'Payé', value: formatAr(form.montant_paye) },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{r.label}</span>
                      <span style={{ fontWeight: r.bold ? 800 : 600, fontSize: r.big ? 16 : 13 }}>{r.value}</span>
                    </div>
                  ))}
                  {(totalAvecTVA - (parseFloat(form.montant_paye) || 0)) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border2)' }}>
                      <span style={{ color: 'var(--orange)', fontWeight: 700 }}>Reste à payer</span>
                      <span style={{ color: 'var(--orange)', fontWeight: 800, fontSize: 15 }}>{formatAr(totalAvecTVA - (parseFloat(form.montant_paye) || 0))}</span>
                    </div>
                  )}
                </div>

                <button style={{ ...btn('var(--orange)', '#d97706'), width: '100%', padding: 14, fontSize: 15, opacity: saving ? 0.7 : 1 }}
                  onClick={handleSubmitAchat} disabled={saving}>
                  {saving ? 'Enregistrement...' : (editMode ? '✓ Mettre à jour' : '✓ Enregistrer l\'achat')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
