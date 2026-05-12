// src/modules/commerce/pages/Stock.jsx
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchProduits, createProduit, updateProduit, deleteProduit, getAlertesStockBas, fetchCategories, updateStock } from '../services/produitService';
import { fetchMouvementsStock, createMouvementStockManuel } from '../services/stockService';
import { supabase, getCurrentCompany } from '../../../supabaseClient';
import { COLORS, formatAr } from '../../shared/utils/constants';
import { btn, inp, lbl, modalStyles } from '../../shared/utils/helpers';

// MODE TEST - Mettre à false en production
const IS_TEST_MODE = false;

export default function Stock() {
  const { currentCompany } = useCompany();
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    reference: '',
    categorie: '',
    prix_achat: 0,
    prix_vente: 0,
    quantite_stock: 0,
    stock_minimum: 0,
    unite: 'pièce'
  });
  const [movementForm, setMovementForm] = useState({
    type: 'entree',
    quantite: 0,
    notes: ''
  });
  const [filter, setFilter] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [produitsData, categoriesData] = await Promise.all([
        fetchProduits(),
        fetchCategories()
      ]);
      setProduits(produitsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMouvements = async (produitId) => {
    try {
      const company = getCurrentCompany();
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select(`
          *,
          produit:produits(id, nom)
        `)
        .eq('produit_id', produitId)
        .eq('company_id', company?.id)
        .order('date_mouvement', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setMouvements(data || []);
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editMode && selectedProduit) {
        await updateProduit(selectedProduit.id, form);
        alert('Produit modifié avec succès');
      } else {
        await createProduit(form);
        alert('Produit créé avec succès');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  // Fonction de suppression - Version MODE TEST
  const handleDeleteProduit = async (produit) => {
    if (IS_TEST_MODE) {
      // Mode TEST : Suppression directe sans vérification
      if (confirm(`⚠️ [MODE TEST] Supprimer "${produit.nom}" définitivement ?\n\nCette action supprimera aussi les historiques liés.`)) {
        try {
          const company = getCurrentCompany();
          
          // 1. Supprimer les mouvements de stock
          await supabase.from('mouvements_stock').delete().eq('produit_id', produit.id);
          
          // 2. Supprimer les détails de ventes
          await supabase.from('vente_details').delete().eq('produit_id', produit.id);
          
          // 3. Supprimer les détails d'achats
          await supabase.from('achat_details').delete().eq('produit_id', produit.id);
          
          // 4. Supprimer le produit
          await supabase.from('produits').delete().eq('id', produit.id).eq('company_id', company?.id);
          
          alert(`✅ Produit "${produit.nom}" supprimé avec succès !`);
          loadData();
        } catch (error) {
          console.error('Erreur suppression:', error);
          alert('Erreur lors de la suppression');
        }
      }
      return;
    }

    // Mode PRODUCTION : Vérification normale
    if (produit.quantite_stock > 0) {
      alert(`Impossible de supprimer "${produit.nom}" car il a encore ${produit.quantite_stock} unités en stock.`);
      return;
    }
    
    if (confirm(`⚠️ Supprimer définitivement "${produit.nom}" ?\nCette action est irréversible.`)) {
      try {
        await deleteProduit(produit.id);
        alert(`✅ Produit "${produit.nom}" supprimé avec succès`);
        loadData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Nettoyage complet des produits de test
  const handleClearAllTestProducts = async () => {
    if (!IS_TEST_MODE) {
      alert('Mode test désactivé. Activation requise pour cette action.');
      return;
    }
    
    if (confirm('⚠️⚠️⚠️ NETTOYAGE COMPLET ⚠️⚠️⚠️\n\nSupprimer TOUS les produits ?\nCette action est irréversible !')) {
      try {
        const company = getCurrentCompany();
        let deletedCount = 0;
        
        for (const produit of produits) {
          // Supprimer les dépendances
          await supabase.from('mouvements_stock').delete().eq('produit_id', produit.id);
          await supabase.from('vente_details').delete().eq('produit_id', produit.id);
          await supabase.from('achat_details').delete().eq('produit_id', produit.id);
          await supabase.from('produits').delete().eq('id', produit.id).eq('company_id', company?.id);
          deletedCount++;
        }
        
        alert(`✅ ${deletedCount} produits supprimés avec succès !`);
        loadData();
      } catch (error) {
        console.error('Erreur nettoyage:', error);
        alert('Erreur lors du nettoyage');
      }
    }
  };

  const handleMovement = async () => {
    if (!selectedProduit) return;
    if (movementForm.quantite <= 0) {
      alert('La quantité doit être supérieure à 0');
      return;
    }

    try {
      const nouvelleQuantite = movementForm.type === 'entree' 
        ? selectedProduit.quantite_stock + movementForm.quantite
        : selectedProduit.quantite_stock - movementForm.quantite;

      if (nouvelleQuantite < 0) {
        alert('Stock insuffisant pour cette sortie');
        return;
      }

      await updateStock(selectedProduit.id, nouvelleQuantite, movementForm.notes || movementForm.type);
      
      const message = movementForm.type === 'entree' 
        ? `✅ Entrée de ${movementForm.quantite} ${selectedProduit.unite}(s) ajoutée`
        : `✅ Sortie de ${movementForm.quantite} ${selectedProduit.unite}(s) enregistrée`;
      
      alert(message);
      setShowMovementModal(false);
      resetMovementForm();
      loadData();
    } catch (error) {
      console.error('Erreur mouvement:', error);
      alert('Erreur lors du mouvement de stock');
    }
  };

  const handleViewHistory = async (produit) => {
    setSelectedProduit(produit);
    await loadMouvements(produit.id);
    setShowHistoryModal(true);
  };

  const resetForm = () => {
    setForm({
      nom: '',
      reference: '',
      categorie: '',
      prix_achat: 0,
      prix_vente: 0,
      quantite_stock: 0,
      stock_minimum: 0,
      unite: 'pièce'
    });
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
      nom: produit.nom,
      reference: produit.reference || '',
      categorie: produit.categorie || '',
      prix_achat: produit.prix_achat,
      prix_vente: produit.prix_vente,
      quantite_stock: produit.quantite_stock,
      stock_minimum: produit.stock_minimum,
      unite: produit.unite
    });
    setEditMode(true);
    setShowModal(true);
  };

  const openMovementModal = (produit) => {
    setSelectedProduit(produit);
    setMovementForm({ type: 'entree', quantite: 0, notes: '' });
    setShowMovementModal(true);
  };

  const filteredProduits = produits.filter(p => {
    if (filter && !p.nom.toLowerCase().includes(filter.toLowerCase()) && !(p.reference || '').toLowerCase().includes(filter.toLowerCase())) return false;
    if (categorieFilter && p.categorie !== categorieFilter) return false;
    return true;
  });

  if (loading) return <div style={{ color: COLORS.muted, padding: 50, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>📦 Gestion des stocks - {currentCompany?.name}</h1>
          <p style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
            Gérez vos produits, suivez les mouvements de stock
            {IS_TEST_MODE && <span style={{ color: COLORS.orange, marginLeft: 10 }}>🔧 MODE TEST - Suppression directe autorisée</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {IS_TEST_MODE && produits.length > 0 && (
            <button 
              style={{ ...btn(COLORS.red, '#b91c1c'), padding: '10px 20px' }} 
              onClick={handleClearAllTestProducts}
            >
              🧹 Nettoyer tous les produits
            </button>
          )}
          <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '10px 20px' }} onClick={() => { resetForm(); setShowModal(true); }}>
            + Nouveau produit
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="🔍 Rechercher par nom ou référence..." 
          style={{ ...inp(), maxWidth: 300 }} 
          value={filter} 
          onChange={e => setFilter(e.target.value)} 
        />
        <select style={inp()} value={categorieFilter} onChange={e => setCategorieFilter(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button style={{ ...btn('#475569', '#334155') }} onClick={() => { setFilter(''); setCategorieFilter(''); }}>
          Réinitialiser
        </button>
      </div>

      {/* Liste des produits */}
      <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Produit</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Réf.</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Catégorie</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Prix achat</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Prix vente</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Stock</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Statut</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProduits.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: COLORS.muted }}>
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                filteredProduits.map(produit => {
                  const isLowStock = produit.quantite_stock <= produit.stock_minimum;
                  const isOutOfStock = produit.quantite_stock === 0;
                  return (
                    <tr key={produit.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: 12, fontWeight: 600 }}>{produit.nom}</td>
                      <td style={{ padding: 12 }}>{produit.reference || '-'}</td>
                      <td style={{ padding: 12 }}>{produit.categorie || '-'}</td>
                      <td style={{ padding: 12, textAlign: 'right' }}>{formatAr(produit.prix_achat)}</td>
                      <td style={{ padding: 12, textAlign: 'right' }}>{formatAr(produit.prix_vente)}</td>
                      <td style={{ padding: 12, textAlign: 'right', color: isLowStock ? COLORS.orange : '#fff', fontWeight: isLowStock ? 600 : 400 }}>
                        {produit.quantite_stock} {produit.unite}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {isOutOfStock ? (
                          <span style={{ background: '#450a0a', color: '#f87171', padding: '4px 8px', borderRadius: 20, fontSize: 11 }}>Rupture</span>
                        ) : isLowStock ? (
                          <span style={{ background: '#451a03', color: '#fbbf24', padding: '4px 8px', borderRadius: 20, fontSize: 11 }}>Stock bas</span>
                        ) : (
                          <span style={{ background: '#064e3b', color: '#34d399', padding: '4px 8px', borderRadius: 20, fontSize: 11 }}>OK</span>
                        )}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => editProduit(produit)} 
                            style={{ ...btn('#475569', '#334155'), padding: '5px 10px', fontSize: 12 }}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => openMovementModal(produit)} 
                            style={{ ...btn(COLORS.blue, '#2563eb'), padding: '5px 10px', fontSize: 12 }}
                            title="Mouvement de stock"
                          >
                            📊
                          </button>
                          <button 
                            onClick={() => handleViewHistory(produit)} 
                            style={{ ...btn(COLORS.purple, '#6d28d9'), padding: '5px 10px', fontSize: 12 }}
                            title="Historique"
                          >
                            📜
                          </button>
                          <button 
                            onClick={() => handleDeleteProduit(produit)} 
                            style={{ 
                              ...btn(COLORS.red, '#b91c1c'), 
                              padding: '5px 10px', 
                              fontSize: 12,
                              opacity: IS_TEST_MODE ? 0.9 : (produit.quantite_stock > 0 ? 0.5 : 0.9),
                              cursor: 'pointer'
                            }}
                            title={IS_TEST_MODE ? "Supprimer (mode test)" : (produit.quantite_stock > 0 ? "Stock non nul - Impossible" : "Supprimer")}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Produit */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.container, maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{editMode ? 'Modifier produit' : 'Nouveau produit'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={lbl()}>Nom du produit *</label>
                <input style={inp()} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div>
                <label style={lbl()}>Référence</label>
                <input style={inp()} value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
              </div>
              <div>
                <label style={lbl()}>Catégorie</label>
                <input style={inp()} list="categories" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} />
                <datalist id="categories">
                  {categories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl()}>Prix achat (Ar)</label>
                  <input type="number" style={inp()} value={form.prix_achat} onChange={e => setForm({ ...form, prix_achat: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label style={lbl()}>Prix vente (Ar)</label>
                  <input type="number" style={inp()} value={form.prix_vente} onChange={e => setForm({ ...form, prix_vente: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl()}>Stock initial</label>
                  <input type="number" style={inp()} value={form.quantite_stock} onChange={e => setForm({ ...form, quantite_stock: parseFloat(e.target.value) || 0 })} disabled={editMode} />
                </div>
                <div>
                  <label style={lbl()}>Stock minimum</label>
                  <input type="number" style={inp()} value={form.stock_minimum} onChange={e => setForm({ ...form, stock_minimum: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <label style={lbl()}>Unité</label>
                <select style={inp()} value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })}>
                  <option value="pièce">Pièce(s)</option>
                  <option value="kg">Kilogramme(s)</option>
                  <option value="g">Gramme(s)</option>
                  <option value="l">Litre(s)</option>
                  <option value="ml">Millilitre(s)</option>
                  <option value="m">Mètre(s)</option>
                  <option value="cm">Centimètre(s)</option>
                </select>
              </div>
              <button style={{ ...btn(COLORS.green, '#047857'), padding: 12, marginTop: 12 }} onClick={handleSubmit}>
                {editMode ? 'Mettre à jour' : 'Créer le produit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mouvement de stock */}
      {showMovementModal && selectedProduit && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.container, maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Mouvement stock - {selectedProduit.nom}</h2>
              <button onClick={() => setShowMovementModal(false)} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ background: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Stock actuel</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{selectedProduit.quantite_stock} {selectedProduit.unite}</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl()}>Type de mouvement</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button 
                  onClick={() => setMovementForm({ ...movementForm, type: 'entree' })} 
                  style={{ 
                    ...btn(movementForm.type === 'entree' ? COLORS.green : '#475569', 
                         movementForm.type === 'entree' ? '#047857' : '#334155'), 
                    padding: 10,
                    opacity: movementForm.type === 'entree' ? 1 : 0.7
                  }}
                >
                  📥 Entrée
                </button>
                <button 
                  onClick={() => setMovementForm({ ...movementForm, type: 'sortie' })} 
                  style={{ 
                    ...btn(movementForm.type === 'sortie' ? COLORS.red : '#475569', 
                         movementForm.type === 'sortie' ? '#b91c1c' : '#334155'), 
                    padding: 10,
                    opacity: movementForm.type === 'sortie' ? 1 : 0.7
                  }}
                >
                  📤 Sortie
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl()}>Quantité</label>
              <input 
                type="number" 
                style={inp()} 
                value={movementForm.quantite} 
                onChange={e => setMovementForm({ ...movementForm, quantite: parseFloat(e.target.value) || 0 })} 
                placeholder={`Quantité en ${selectedProduit.unite}`}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl()}>Notes / Motif (optionnel)</label>
              <textarea 
                style={{ ...inp(), minHeight: 60 }} 
                value={movementForm.notes} 
                onChange={e => setMovementForm({ ...movementForm, notes: e.target.value })}
                placeholder="Ex: Ajustement inventaire, Perte, Casse..."
              />
            </div>

            <div style={{ background: COLORS.bg, padding: 10, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Stock après opération:</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>
                  {movementForm.type === 'entree' 
                    ? selectedProduit.quantite_stock + movementForm.quantite
                    : selectedProduit.quantite_stock - movementForm.quantite} {selectedProduit.unite}
                </span>
              </div>
            </div>

            <button style={{ ...btn(COLORS.blue, '#2563eb'), width: '100%', padding: 12 }} onClick={handleMovement}>
              Valider le mouvement
            </button>
          </div>
        </div>
      )}

      {/* Modal Historique des mouvements */}
      {showHistoryModal && selectedProduit && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.container, maxWidth: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>📜 Historique - {selectedProduit.nom}</h2>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Stock actuel:</span>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{selectedProduit.quantite_stock} {selectedProduit.unite}</span>
              </div>
            </div>

            {mouvements.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.muted, padding: 40 }}>
                Aucun mouvement enregistré pour ce produit
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: COLORS.bg, position: 'sticky', top: 0 }}>
                      <th style={{ padding: 10, textAlign: 'left' }}>Date</th>
                      <th style={{ padding: 10, textAlign: 'center' }}>Type</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Quantité</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mouvements.map(m => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: 10 }}>{new Date(m.date_mouvement).toLocaleString()}</td>
                        <td style={{ padding: 10, textAlign: 'center' }}>
                          <span style={{
                            background: m.type === 'entree' || m.type === 'achat' ? '#064e3b' : '#450a0a',
                            color: m.type === 'entree' || m.type === 'achat' ? '#34d399' : '#f87171',
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontSize: 11
                          }}>
                            {m.type === 'entree' ? '📥 Entrée' : m.type === 'achat' ? '🛒 Achat' : m.type === 'vente' ? '💰 Vente' : '📤 Sortie'}
                          </span>
                        </td>
                        <td style={{ padding: 10, textAlign: 'right' }}>{m.quantite} {selectedProduit.unite}</td>
                        <td style={{ padding: 10 }}>{m.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '8px 16px' }} onClick={() => setShowHistoryModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}