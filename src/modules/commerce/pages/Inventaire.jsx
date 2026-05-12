// src/modules/commerce/pages/Inventaire.jsx
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchProduits } from '../services/produitService';
import { 
  getCurrentInventory, 
  startInventory, 
  recordCount, 
  finishInventory, 
  getInventoryHistory,
  getInventoryDetails,
  getCountedProducts,
  getUncountedProducts
} from '../services/inventaireService';
import { supabase } from '../../../supabaseClient';
import { COLORS, formatAr } from '../../shared/utils/constants';
import { btn, inp, modalStyles } from '../../shared/utils/helpers';

export default function Inventaire() {
  const { currentCompany } = useCompany();
  const [currentInventory, setCurrentInventory] = useState(null);
  const [products, setProducts] = useState([]);
  const [countedProducts, setCountedProducts] = useState([]);
  const [uncountedProducts, setUncountedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCountModal, setShowCountModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [countValue, setCountValue] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [inventoryDetails, setInventoryDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Récupérer l'inventaire en cours
      const inventory = await getCurrentInventory();
      setCurrentInventory(inventory);

      // Récupérer tous les produits actifs
      const allProducts = await fetchProduits({ isActive: true });
      setProducts(allProducts || []);

      // Récupérer l'historique
      const historyData = await getInventoryHistory();
      setHistory(historyData || []);

      if (inventory) {
        // Récupérer les produits déjà comptés pour cet inventaire
        const counted = await getCountedProducts(inventory.id);
        setCountedProducts(counted || []);
        
        // Récupérer les produits non encore comptés
        const uncounted = await getUncountedProducts(inventory.id);
        setUncountedProducts(uncounted || []);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInventory = async () => {
    try {
      await startInventory();
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRecordCount = async () => {
    if (!selectedProduct || !countValue) {
      alert('Veuillez saisir une quantité');
      return;
    }
    
    try {
      await recordCount(currentInventory.id, selectedProduct.id, parseFloat(countValue));
      setShowCountModal(false);
      setSelectedProduct(null);
      setCountValue('');
      await loadData(); // Recharger pour mettre à jour les produits comptés
    } catch (error) {
      console.error('Erreur comptage:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleFinishInventory = async () => {
    if (confirm('Terminer l\'inventaire ? Les corrections seront appliquées au stock.')) {
      try {
        await finishInventory(currentInventory.id);
        await loadData();
        alert('Inventaire terminé avec succès !');
      } catch (error) {
        console.error('Erreur finalisation:', error);
        alert('Erreur lors de la finalisation');
      }
    }
  };

  const handleViewDetails = async (inventory) => {
    setSelectedInventory(inventory);
    setDetailsLoading(true);
    setShowDetailsModal(true);
    
    try {
      const details = await getInventoryDetails(inventory.id);
      setInventoryDetails(details);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      setInventoryDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Calculer l'avancement
  const totalProductsToCount = uncountedProducts.length + countedProducts.length;
  const progressPercent = totalProductsToCount > 0 
    ? (countedProducts.length / totalProductsToCount) * 100 
    : 0;

  if (loading) return <div style={{ color: COLORS.muted, padding: 50, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>📋 Inventaire - {currentCompany?.name}</h1>
          <p style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
            Comptez votre stock physique et corrigez les écarts
          </p>
        </div>
        {!currentInventory && (
          <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '10px 20px' }} onClick={handleStartInventory}>
            + Démarrer inventaire
          </button>
        )}
      </div>

      {/* Inventaire en cours */}
      {currentInventory ? (
        <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🔄 Inventaire en cours</h2>
              <p style={{ color: COLORS.muted, fontSize: 12 }}>Démarré le {new Date(currentInventory.date_debut).toLocaleString()}</p>
              {currentInventory.notes && <p style={{ color: COLORS.muted, fontSize: 11, marginTop: 4 }}>Note: {currentInventory.notes}</p>}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ textAlign: 'center', padding: '8px 16px', background: COLORS.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.blue }}>{countedProducts.length}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Comptés</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 16px', background: COLORS.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.orange }}>{uncountedProducts.length}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Restants</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 16px', background: COLORS.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.green }}>{totalProductsToCount}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Total</div>
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div style={{ marginTop: 16 }}>
            <div style={{ background: COLORS.bg, height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ 
                width: `${progressPercent}%`, 
                background: COLORS.green, 
                height: '100%',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: COLORS.muted }}>
              {Math.round(progressPercent)}% complété
            </div>
          </div>

          {/* Liste des produits à compter */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📦 Produits à compter ({uncountedProducts.length})</h3>
            {uncountedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: COLORS.bg, borderRadius: 8 }}>
                <span style={{ fontSize: 48 }}>✅</span>
                <p style={{ marginTop: 8, color: COLORS.green }}>Tous les produits ont été comptés !</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                {uncountedProducts.map(product => (
                  <div key={product.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: 12, 
                    background: COLORS.bg, 
                    borderRadius: 8,
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{product.nom}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>
                        Stock théorique: {product.quantite_stock} {product.unite}
                        {product.reference && <span> | Réf: {product.reference}</span>}
                      </div>
                    </div>
                    <button 
                      style={{ ...btn(COLORS.green, '#047857'), padding: '6px 16px', fontSize: 12 }} 
                      onClick={() => { setSelectedProduct(product); setShowCountModal(true); }}
                    >
                      📝 Compter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Liste des produits déjà comptés */}
          {countedProducts.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: COLORS.green }}>✅ Produits déjà comptés ({countedProducts.length})</h3>
              <div style={{ display: 'grid', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {countedProducts.slice(0, 20).map(item => (
                  <div key={item.produit_id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: 10, 
                    background: COLORS.bg, 
                    borderRadius: 8,
                    opacity: 0.8
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.produit?.nom || 'Produit'}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>
                        Théorique: {item.quantite_theorique} | Réel: {item.quantite_reelle}
                        {item.ecart !== 0 && (
                          <span style={{ color: item.ecart > 0 ? COLORS.red : COLORS.orange, marginLeft: 8 }}>
                            Écart: {item.ecart > 0 ? '+' : ''}{item.ecart}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ color: COLORS.green }}>✓ Compté</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button 
           onClick={handleFinishInventory}
           disabled={uncountedProducts.length > 0}
          style={{
            ...btn(COLORS.green, '#047857'),
          padding: '10px 20px',
          opacity: uncountedProducts.length > 0 ? 0.5 : 1,
          cursor: uncountedProducts.length > 0 ? 'not-allowed' : 'pointer'
          }}
           >
         ✅ Terminer l'inventaire
          </button>
          </div>
        </div>
      ) : (
        <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Aucun inventaire en cours</h3>
          <p style={{ color: COLORS.muted, marginBottom: 20 }}>Démarrez un nouvel inventaire pour vérifier votre stock</p>
          <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '10px 20px' }} onClick={handleStartInventory}>
            Démarrer un inventaire
          </button>
        </div>
      )}

      {/* Historique des inventaires */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📜 Historique des inventaires</h2>
        {history.length === 0 ? (
          <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, padding: 40, textAlign: 'center' }}>
            <p style={{ color: COLORS.muted }}>Aucun inventaire terminé</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {history.map(inv => (
              <div key={inv.id} style={{ 
                background: COLORS.card, 
                border: `1px solid ${COLORS.border2}`, 
                borderRadius: 8, 
                padding: 16, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: 12 
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    Inventaire du {new Date(inv.date_debut).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>
                    Terminé le {inv.date_fin ? new Date(inv.date_fin).toLocaleString() : '-'}
                  </div>
                  {inv.notes && (
                    <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
                      Note: {inv.notes}
                    </div>
                  )}
                </div>
                <button 
                  style={{ ...btn('#475569', '#334155'), padding: '6px 16px', fontSize: 12 }} 
                  onClick={() => handleViewDetails(inv)}
                >
                  📋 Voir détails
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de comptage */}
      {showCountModal && selectedProduct && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.container, maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Compter - {selectedProduct.nom}</h2>
              <button onClick={() => setShowCountModal(false)} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ background: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Stock théorique</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{selectedProduct.quantite_stock} {selectedProduct.unite}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600 }}>Quantité réelle</label>
              <input 
                type="number" 
                style={inp()} 
                value={countValue} 
                onChange={e => setCountValue(e.target.value)} 
                placeholder={`Quantité en ${selectedProduct.unite}`} 
                autoFocus 
              />
            </div>

            {countValue && (
              <div style={{ background: COLORS.bg, padding: 10, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Écart:</span>
                  <span style={{ 
                    fontWeight: 700,
                    color: parseFloat(countValue) > selectedProduct.quantite_stock ? COLORS.red : 
                           parseFloat(countValue) < selectedProduct.quantite_stock ? COLORS.orange : COLORS.green
                  }}>
                    {parseFloat(countValue) > selectedProduct.quantite_stock ? '+' : ''}
                    {parseFloat(countValue) - selectedProduct.quantite_stock} {selectedProduct.unite}
                  </span>
                </div>
              </div>
            )}

            <button style={{ ...btn(COLORS.green, '#047857'), width: '100%', padding: 12 }} onClick={handleRecordCount}>
              Enregistrer le comptage
            </button>
          </div>
        </div>
      )}

      {/* Modal des détails d'inventaire */}
      {showDetailsModal && selectedInventory && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.container, maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>
                Détails - Inventaire du {new Date(selectedInventory.date_debut).toLocaleDateString()}
              </h2>
              <button onClick={() => setShowDetailsModal(false)} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>

            {detailsLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Chargement des détails...</div>
            ) : !inventoryDetails ? (
              <div style={{ textAlign: 'center', padding: 40, color: COLORS.muted }}>
                Aucun détail disponible pour cet inventaire
              </div>
            ) : (
              <>
                {/* Informations générales */}
                <div style={{ background: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>Date début</div>
                      <div>{new Date(selectedInventory.date_debut).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>Date fin</div>
                      <div>{selectedInventory.date_fin ? new Date(selectedInventory.date_fin).toLocaleString() : '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>Statut</div>
                      <div style={{ color: COLORS.green }}>Terminé</div>
                    </div>
                  </div>
                  {selectedInventory.notes && (
                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>Note</div>
                      <div style={{ fontSize: 13 }}>{selectedInventory.notes}</div>
                    </div>
                  )}
                </div>

                {/* Résumé des écarts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: COLORS.bg, padding: 12, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.blue }}>{inventoryDetails.stats.total_products}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>Produits comptés</div>
                  </div>
                  <div style={{ background: COLORS.bg, padding: 12, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.orange }}>
                      {inventoryDetails.stats.products_with_difference}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>Produits avec écart</div>
                  </div>
                  <div style={{ background: COLORS.bg, padding: 12, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.green }}>
                      {inventoryDetails.stats.total_products - inventoryDetails.stats.products_with_difference}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>Produits conformes</div>
                  </div>
                </div>

                {/* Tableau des détails */}
                <div style={{ maxHeight: 400, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: COLORS.bg, position: 'sticky', top: 0 }}>
                        <th style={{ padding: 10, textAlign: 'left' }}>Produit</th>
                        <th style={{ padding: 10, textAlign: 'right' }}>Théorique</th>
                        <th style={{ padding: 10, textAlign: 'right' }}>Réel</th>
                        <th style={{ padding: 10, textAlign: 'right' }}>Écart</th>
                        <th style={{ padding: 10, textAlign: 'center' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryDetails.details.map(detail => (
                        <tr key={detail.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: 10 }}>
                            <div style={{ fontWeight: 600 }}>{detail.produit?.nom || 'Produit'}</div>
                            {detail.produit?.reference && <div style={{ fontSize: 10, color: COLORS.muted }}>Réf: {detail.produit.reference}</div>}
                           </td>
                          <td style={{ padding: 10, textAlign: 'right' }}>{detail.quantite_theorique} {detail.produit?.unite}</td>
                          <td style={{ padding: 10, textAlign: 'right' }}>{detail.quantite_reelle} {detail.produit?.unite}</td>
                          <td style={{ 
                            padding: 10, 
                            textAlign: 'right',
                            color: detail.ecart > 0 ? COLORS.red : detail.ecart < 0 ? COLORS.orange : COLORS.green,
                            fontWeight: detail.ecart !== 0 ? 600 : 400
                          }}>
                            {detail.ecart > 0 ? '+' : ''}{detail.ecart}
                          </td>
                          <td style={{ padding: 10, textAlign: 'center' }}>
                            {detail.ecart === 0 ? (
                              <span style={{ color: COLORS.green }}>✓ OK</span>
                            ) : (
                              <span style={{ color: COLORS.orange }}>⚠️ Écart</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Taux de précision */}
                <div style={{ marginTop: 16, textAlign: 'center', padding: 12, background: COLORS.bg, borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>Taux de précision: </span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.blue }}>
                    {inventoryDetails.stats.accuracy_rate}%
                  </span>
                </div>
              </>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '8px 20px' }} onClick={() => setShowDetailsModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}