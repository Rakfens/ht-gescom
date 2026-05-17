// Stock.jsx — FIX #1 (alert→toast/modal) + FIX #2 (console.log) + FIX #4 (useCompany) + FIX #5 (IS_TEST_MODE)
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchProduits, createProduit, updateProduit, deleteProduit, getAlertesStockBas, fetchCategories, updateStock } from '../services/produitService';
import { fetchMouvementsStock } from '../services/stockService';
import { supabase } from '../../../supabaseClient';
import { formatAr } from '../../shared/utils/constants';
import { btn, inp, lbl, modalStyles } from '../../shared/utils/helpers';

// ─── Toast inline léger (pour éviter la dépendance au contexte App) ──
function useLocalToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return { toasts, success: msg => show(msg, 'success'), error: msg => show(msg, 'error'), warn: msg => show(msg, 'warn') };
}

function ToastStack({ toasts }) {
  const colors = { success: 'var(--green)', error: 'var(--red)', warn: 'var(--yellow)' };
  const bgs    = { success: 'var(--green-dim)', error: 'var(--red-dim)', warn: 'var(--yellow-dim)' };
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: bgs[t.type], color: colors[t.type],
          border: `1px solid ${colors[t.type]}30`,
          padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          animation: 'slideDown 0.3s ease', boxShadow: 'var(--shadow)',
          maxWidth: 280,
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── Modal de confirmation réutilisable ──────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div style={{ ...modalStyles.overlay, zIndex: 300 }}>
      <div style={{ ...modalStyles.box, maxWidth: 360 }}>
        <div style={modalStyles.handle} />
        <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 10 }}>{danger ? '⚠️' : 'ℹ️'}</div>
        <div style={{ ...modalStyles.title, textAlign: 'center' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...btn('var(--card2)', 'var(--card2)'), flex: 1, color: 'var(--text2)', border: '1px solid var(--border2)' }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{ ...btn(danger ? 'var(--red)' : 'var(--blue)', danger ? 'var(--red2)' : 'var(--blue2)'), flex: 1 }}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Stock() {
  // FIX #4 : utiliser useCompany() au lieu de getCurrentCompany()
  const { currentCompany } = useCompany();
  const toast = useLocalToast();

  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // FIX #5 : IS_TEST_MODE supprimé
  const [confirmDelete, setConfirmDelete] = useState(null); // { produit } ou null

  const [form, setForm] = useState({
    nom: '', reference: '', categorie: '',
    prix_achat: 0, prix_vente: 0,
    quantite_stock: 0, stock_minimum: 0, unite: 'pièce'
  });
  const [movementForm, setMovementForm] = useState({ type: 'entree', quantite: 0, notes: '' });
  const [filter, setFilter] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');

  useEffect(() => { loadData(); }, [currentCompany]);

  // Realtime → recharger si changement sur produits ou mouvements
  useEffect(() => {
    const handler = (e) => {
      if (['produits', 'mouvements_stock'].includes(e.detail?.table)) loadData();
    };
    window.addEventListener('supabase_realtime', handler);
    return () => window.removeEventListener('supabase_realtime', handler);
  }, []);

  const loadData = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [produitsData, categoriesData] = await Promise.all([fetchProduits(), fetchCategories()]);
      setProduits(produitsData);
      setCategories(categoriesData);
    } catch (err) {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  // FIX #4 : utilise currentCompany directement (pas getCurrentCompany())
  const loadMouvements = async (produitId) => {
    if (!currentCompany) return;
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select('*, produit:produits(id, nom)')
        .eq('produit_id', produitId)
        .eq('company_id', currentCompany.id)
        .order('date_mouvement', { ascending: false })
        .limit(50);
      if (error) throw error;
      setMouvements(data || []);
    } catch (err) {
      toast.error('Erreur chargement historique');
    }
  };

  // FIX #1 : alert() → toast / FIX #2 : suppression console.log
  const handleSubmit = async () => {
    if (!form.nom.trim()) { toast.warn('Le nom du produit est requis'); return; }
    setSaving(true);
    try {
      if (editMode && selectedProduit) {
        await updateProduit(selectedProduit.id, form);
        toast.success('Produit modifié avec succès');
      } else {
        await createProduit(form);
        toast.success('Produit créé avec succès');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // FIX #1 : confirm() → modal de confirmation / FIX #4 : currentCompany
  const handleDeleteProduit = (produit) => {
    if (produit.quantite_stock > 0) {
      toast.warn(`Impossible : ${produit.nom} a encore ${produit.quantite_stock} unité(s) en stock`);
      return;
    }
    setConfirmDelete({ produit }); // ouvre le modal
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { produit } = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteProduit(produit.id);
      toast.success(`"${produit.nom}" supprimé avec succès`);
      loadData();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // FIX #1 : alert/confirm → toast / FIX #4 : currentCompany
  const handleMovement = async () => {
    if (!selectedProduit) return;
    if (movementForm.quantite <= 0) { toast.warn('La quantité doit être supérieure à 0'); return; }

    const nouvelleQuantite = movementForm.type === 'entree'
      ? selectedProduit.quantite_stock + movementForm.quantite
      : selectedProduit.quantite_stock - movementForm.quantite;

    if (nouvelleQuantite < 0) { toast.warn('Stock insuffisant pour cette sortie'); return; }

    setSaving(true);
    try {
      await updateStock(selectedProduit.id, nouvelleQuantite, movementForm.notes || movementForm.type);
      const msg = movementForm.type === 'entree'
        ? `Entrée de ${movementForm.quantite} ${selectedProduit.unite}(s) ajoutée`
        : `Sortie de ${movementForm.quantite} ${selectedProduit.unite}(s) enregistrée`;
      toast.success(msg);
      setShowMovementModal(false);
      resetMovementForm();
      loadData();
    } catch (err) {
      toast.error('Erreur lors du mouvement de stock');
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = async (produit) => {
    setSelectedProduit(produit);
    await loadMouvements(produit.id);
    setShowHistoryModal(true);
  };

  const resetForm = () => {
    setForm({ nom: '', reference: '', categorie: '', prix_achat: 0, prix_vente: 0, quantite_stock: 0, stock_minimum: 0, unite: 'pièce' });
    setEditMode(false);
    setSelectedProduit(null);
  };

  const resetMovementForm = () => {
    setMovementForm({ type: 'entree', quantite: 0, notes: '' });
    setSelectedProduit(null);
  };

  const editProduit = (produit) => {
    setSelectedProduit(produit);
    setForm({
      nom: produit.nom, reference: produit.reference || '',
      categorie: produit.categorie || '', prix_achat: produit.prix_achat,
      prix_vente: produit.prix_vente, quantite_stock: produit.quantite_stock,
      stock_minimum: produit.stock_minimum, unite: produit.unite
    });
    setEditMode(true);
    setShowModal(true);
  };

  const filteredProduits = produits.filter(p => {
    if (filter && !p.nom.toLowerCase().includes(filter.toLowerCase()) && !(p.reference || '').toLowerCase().includes(filter.toLowerCase())) return false;
    if (categorieFilter && p.categorie !== categorieFilter) return false;
    return true;
  });

  // ─── FIX #2 : indicateur de marge dans le tableau ───────────────
  const marge = (p) => p.prix_vente && p.prix_achat ? ((p.prix_vente - p.prix_achat) / p.prix_achat * 100).toFixed(0) : null;

  const C = {
    bg: 'var(--bg)', card: 'var(--card)', text: 'var(--text)',
    muted: 'var(--muted)', border: 'var(--border)', border2: 'var(--border2)',
    blue: 'var(--blue)', green: 'var(--green)', red: 'var(--red)',
    orange: 'var(--orange)', purple: 'var(--purple)',
  };

  if (loading) return (
    <div style={{ color: C.muted, padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
      Chargement des produits...
    </div>
  );

  return (
    <div style={{ padding: '0 0 20px' }}>
      <ToastStack toasts={toast.toasts} />

      {/* Confirmation suppression */}
      <ConfirmModal
        open={!!confirmDelete}
        title="Supprimer le produit ?"
        message={`"${confirmDelete?.produit?.nom}" sera supprimé définitivement. Cette action est irréversible.`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
        danger
      />

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Gestion des stocks</h1>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{currentCompany?.name} · {produits.length} produits</p>
        </div>
        <button style={{ ...btn(C.blue, 'var(--blue2)'), padding: '10px 18px' }} onClick={() => { resetForm(); setShowModal(true); }}>
          + Nouveau produit
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input type="text" placeholder="🔍 Rechercher..." style={{ ...inp(), maxWidth: 240 }}
          value={filter} onChange={e => setFilter(e.target.value)} />
        <select style={{ ...inp(), maxWidth: 180 }} value={categorieFilter} onChange={e => setCategorieFilter(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {(filter || categorieFilter) && (
          <button style={{ ...btn('var(--card2)', 'var(--card2)'), color: C.muted, border: '1px solid var(--border2)' }}
            onClick={() => { setFilter(''); setCategorieFilter(''); }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau produits */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid var(--border2)`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Produit</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Réf.</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Catégorie</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Prix achat</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Prix vente</th>
                {/* FIX #2 : colonne marge */}
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Marge</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Stock</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Statut</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProduits.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: C.muted }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : filteredProduits.map(p => {
                const isLow = p.quantite_stock <= p.stock_minimum;
                const isOut = p.quantite_stock === 0;
                const margeVal = marge(p);
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid var(--border)`, transition: 'background 0.15s' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.nom}</td>
                    <td style={{ padding: '10px 12px', color: C.muted, fontSize: 12 }}>{p.reference || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12 }}>{p.categorie || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>{formatAr(p.prix_achat)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>{formatAr(p.prix_vente)}</td>
                    {/* FIX #2 : marge affichée */}
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {margeVal !== null ? (
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: Number(margeVal) >= 20 ? 'var(--green-dim)' : Number(margeVal) >= 0 ? 'var(--yellow-dim)' : 'var(--red-dim)',
                          color: Number(margeVal) >= 20 ? 'var(--green)' : Number(margeVal) >= 0 ? 'var(--yellow)' : 'var(--red)',
                        }}>
                          {margeVal}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: isLow ? C.orange : C.text, fontWeight: isLow ? 700 : 400 }}>
                      {p.quantite_stock} {p.unite}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {isOut ? (
                        <span style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Rupture</span>
                      ) : isLow ? (
                        <span style={{ background: 'var(--yellow-dim)', color: 'var(--yellow)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Stock bas</span>
                      ) : (
                        <span style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>OK</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                        <button onClick={() => editProduit(p)} style={{ ...btn('var(--card2)', 'var(--card2)'), padding: '5px 9px', fontSize: 13, border: '1px solid var(--border2)', color: C.muted }} title="Modifier">✏️</button>
                        <button onClick={() => { setSelectedProduit(p); setMovementForm({ type: 'entree', quantite: 0, notes: '' }); setShowMovementModal(true); }} style={{ ...btn(C.blue, 'var(--blue2)'), padding: '5px 9px', fontSize: 13 }} title="Mouvement">📊</button>
                        <button onClick={() => handleViewHistory(p)} style={{ ...btn(C.purple, '#6d28d9'), padding: '5px 9px', fontSize: 13 }} title="Historique">📜</button>
                        <button onClick={() => handleDeleteProduit(p)} style={{ ...btn('var(--red-dim)', 'var(--red-dim)'), padding: '5px 9px', fontSize: 13, color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }} title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Produit */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.box, maxWidth: 500 }}>
            <div style={modalStyles.handle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={modalStyles.title}>{editMode ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={lbl()}>Nom du produit *</label><input style={inp()} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Coque iPhone 14" /></div>
              <div><label style={lbl()}>Référence</label><input style={inp()} value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="Ex: REF-001" /></div>
              <div>
                <label style={lbl()}>Catégorie</label>
                <input style={inp()} list="categories-list" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} placeholder="Choisir ou saisir..." />
                <datalist id="categories-list">{categories.map(cat => <option key={cat} value={cat} />)}</datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl()}>Prix achat (Ar)</label><input type="number" style={inp()} value={form.prix_achat} onChange={e => setForm({ ...form, prix_achat: parseFloat(e.target.value) || 0 })} /></div>
                <div>
                  <label style={lbl()}>Prix vente (Ar)
                    {form.prix_achat > 0 && form.prix_vente > 0 && (
                      <span style={{ marginLeft: 8, color: form.prix_vente > form.prix_achat ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        ({marge({ prix_achat: form.prix_achat, prix_vente: form.prix_vente })}%)
                      </span>
                    )}
                  </label>
                  <input type="number" style={inp()} value={form.prix_vente} onChange={e => setForm({ ...form, prix_vente: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><label style={lbl()}>Stock initial</label><input type="number" style={inp()} value={form.quantite_stock} onChange={e => setForm({ ...form, quantite_stock: parseFloat(e.target.value) || 0 })} disabled={editMode} /></div>
                <div><label style={lbl()}>Stock minimum</label><input type="number" style={inp()} value={form.stock_minimum} onChange={e => setForm({ ...form, stock_minimum: parseFloat(e.target.value) || 0 })} /></div>
                <div>
                  <label style={lbl()}>Unité</label>
                  <select style={inp()} value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })}>
                    <option value="pièce">Pièce</option><option value="kg">kg</option><option value="g">g</option>
                    <option value="l">Litre</option><option value="ml">ml</option><option value="m">Mètre</option>
                  </select>
                </div>
              </div>
              <button style={{ ...btn('var(--green)', 'var(--green2)'), padding: 13, marginTop: 8, opacity: saving ? 0.7 : 1 }} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Enregistrement...' : (editMode ? 'Mettre à jour' : 'Créer le produit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mouvement */}
      {showMovementModal && selectedProduit && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.box, maxWidth: 380 }}>
            <div style={modalStyles.handle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={modalStyles.title}>Mouvement de stock</h2>
              <button onClick={() => setShowMovementModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 12, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{selectedProduit.nom} · Stock actuel</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{selectedProduit.quantite_stock} <span style={{ fontSize: 14, color: 'var(--muted)' }}>{selectedProduit.unite}</span></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <button onClick={() => setMovementForm({ ...movementForm, type: 'entree' })} style={{ ...btn(movementForm.type === 'entree' ? 'var(--green)' : 'var(--card2)', movementForm.type === 'entree' ? 'var(--green2)' : 'var(--card2)'), padding: 11, color: movementForm.type === 'entree' ? '#fff' : 'var(--muted)', border: '1px solid var(--border2)' }}>📥 Entrée</button>
              <button onClick={() => setMovementForm({ ...movementForm, type: 'sortie' })} style={{ ...btn(movementForm.type === 'sortie' ? 'var(--red)' : 'var(--card2)', movementForm.type === 'sortie' ? 'var(--red2)' : 'var(--card2)'), padding: 11, color: movementForm.type === 'sortie' ? '#fff' : 'var(--muted)', border: '1px solid var(--border2)' }}>📤 Sortie</button>
            </div>
            <div style={{ marginBottom: 12 }}><label style={lbl()}>Quantité</label><input type="number" style={inp()} value={movementForm.quantite} onChange={e => setMovementForm({ ...movementForm, quantite: parseFloat(e.target.value) || 0 })} /></div>
            <div style={{ marginBottom: 14 }}><label style={lbl()}>Notes (optionnel)</label><textarea style={{ ...inp(), minHeight: 52 }} value={movementForm.notes} onChange={e => setMovementForm({ ...movementForm, notes: e.target.value })} placeholder="Ex: Ajustement, perte..." /></div>
            <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 10, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Stock après :</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: (movementForm.type === 'entree' ? selectedProduit.quantite_stock + movementForm.quantite : selectedProduit.quantite_stock - movementForm.quantite) < 0 ? 'var(--red)' : 'var(--text)' }}>
                {movementForm.type === 'entree' ? selectedProduit.quantite_stock + movementForm.quantite : selectedProduit.quantite_stock - movementForm.quantite} {selectedProduit.unite}
              </span>
            </div>
            <button style={{ ...btn('var(--blue)', 'var(--blue2)'), width: '100%', padding: 13, opacity: saving ? 0.7 : 1 }} onClick={handleMovement} disabled={saving}>
              {saving ? 'Validation...' : 'Valider le mouvement'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      {showHistoryModal && selectedProduit && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.box, maxWidth: 600 }}>
            <div style={modalStyles.handle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={modalStyles.title}>Historique — {selectedProduit.nom}</h2>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Stock actuel</span>
              <span style={{ fontWeight: 700 }}>{selectedProduit.quantite_stock} {selectedProduit.unite}</span>
            </div>
            {mouvements.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Aucun mouvement enregistré</div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {mouvements.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div>
                      <span style={{
                        background: ['entree','achat'].includes(m.type) ? 'var(--green-dim)' : 'var(--red-dim)',
                        color: ['entree','achat'].includes(m.type) ? 'var(--green)' : 'var(--red)',
                        padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginRight: 8
                      }}>
                        {m.type === 'entree' ? '📥 Entrée' : m.type === 'achat' ? '🛒 Achat' : m.type === 'vente' ? '💰 Vente' : '📤 Sortie'}
                      </span>
                      <span style={{ color: 'var(--muted)', fontSize: 11 }}>{new Date(m.date_mouvement).toLocaleString('fr-FR')}</span>
                      {m.notes && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, marginLeft: 2 }}>{m.notes}</div>}
                    </div>
                    <span style={{ fontWeight: 700 }}>{m.quantite} {selectedProduit.unite}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
