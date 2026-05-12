// src/modules/commerce/pages/Ventes.jsx
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchProduits } from '../services/produitService';
import { fetchVentes, fetchVenteWithDetails, createVente, updateVente, deleteVente } from '../services/venteService';
import { printTicketVente } from '../services/impressionService';
import { COLORS, formatAr } from '../../shared/utils/constants';
import { btn, inp, lbl, modalStyles } from '../../shared/utils/helpers';

export default function Ventes() {
  const { currentCompany } = useCompany();
  const [ventes, setVentes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedVente, setSelectedVente] = useState(null);
  const [panier, setPanier] = useState([]);
  const [form, setForm] = useState({
    client_nom: '',
    client_telephone: '',
    type_paiement: 'especes',
    remise: 0,
    montant_paye: 0,
    date_vente: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ventesData, produitsData] = await Promise.all([
        fetchVentes(),
        fetchProduits({ isActive: true })
      ]);
      setVentes(ventesData);
      setProduits(produitsData);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (produit) => {
    const existing = panier.find(p => p.produit_id === produit.id);
    if (existing) {
      setPanier(panier.map(p => 
        p.produit_id === produit.id 
          ? { ...p, quantite: p.quantite + 1, sous_total: (p.quantite + 1) * p.prix_unitaire }
          : p
      ));
    } else {
      setPanier([...panier, {
        produit_id: produit.id,
        nom: produit.nom,
        quantite: 1,
        prix_unitaire: produit.prix_vente || 0,
        sous_total: produit.prix_vente || 0
      }]);
    }
  };

  const updateCartQuantity = (produitId, quantite) => {
    if (quantite <= 0) {
      setPanier(panier.filter(p => p.produit_id !== produitId));
    } else {
      setPanier(panier.map(p =>
        p.produit_id === produitId
          ? { ...p, quantite, sous_total: quantite * p.prix_unitaire }
          : p
      ));
    }
  };

  const updateCartPrice = (produitId, newPrice) => {
    setPanier(panier.map(p =>
      p.produit_id === produitId
        ? { ...p, prix_unitaire: newPrice, sous_total: p.quantite * newPrice }
        : p
    ));
  };

  const resetForm = () => {
    setEditMode(false);
    setSelectedVente(null);
    setPanier([]);
    setForm({
      client_nom: '',
      client_telephone: '',
      type_paiement: 'especes',
      remise: 0,
      montant_paye: 0,
      date_vente: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmitVente = async () => {
    if (panier.length === 0) {
      alert('Ajoutez au moins un produit');
      return;
    }

    const total = panier.reduce((sum, p) => sum + p.sous_total, 0);
    const montantFinal = total - form.remise;

    const venteData = {
      client_nom: form.client_nom,
      client_telephone: form.client_telephone,
      type_paiement: form.type_paiement,
      remise: form.remise,
      montant_paye: form.montant_paye,
      date_vente: form.date_vente
    };

    const details = panier.map(p => ({
      produit_id: p.produit_id,
      quantite: p.quantite,
      prix_unitaire: p.prix_unitaire,
      sous_total: p.sous_total
    }));

    try {
      let newVente;
      if (editMode && selectedVente) {
        await updateVente(selectedVente.id, venteData, details);
        alert('Vente modifiée avec succès');
      } else {
        newVente = await createVente(venteData, details);
        alert('Vente enregistrée avec succès');
        
        // Proposer l'impression après la création
        if (newVente && confirm('Voulez-vous imprimer le ticket de caisse ?')) {
          const venteWithDetails = await fetchVenteWithDetails(newVente.id);
          if (venteWithDetails) {
            printTicketVente(venteWithDetails, venteWithDetails.details, currentCompany);
          }
        }
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erreur sauvegarde vente:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleEditVente = async (vente) => {
    setEditMode(true);
    setSelectedVente(vente);
    setForm({
      client_nom: vente.client_nom || '',
      client_telephone: vente.client_telephone || '',
      type_paiement: vente.type_paiement || 'especes',
      remise: vente.remise || 0,
      montant_paye: vente.montant_paye || 0,
      date_vente: vente.date_vente?.split('T')[0] || new Date().toISOString().split('T')[0]
    });
    
    // Charger les détails de la vente
    try {
      const venteWithDetails = await fetchVenteWithDetails(vente.id);
      if (venteWithDetails && venteWithDetails.details) {
        setPanier(venteWithDetails.details.map(d => ({
          produit_id: d.produit_id,
          nom: d.produit?.nom || 'Produit',
          quantite: d.quantite,
          prix_unitaire: d.prix_unitaire,
          sous_total: d.sous_total
        })));
      }
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    }
    setShowModal(true);
  };

  const handleDeleteVente = async (id) => {
    if (confirm('⚠️ Supprimer cette vente ? Cette action est irréversible et restaurera le stock.')) {
      try {
        await deleteVente(id);
        alert('Vente supprimée avec succès');
        loadData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handlePrintTicket = async (venteId) => {
    try {
      const venteWithDetails = await fetchVenteWithDetails(venteId);
      if (venteWithDetails) {
        printTicketVente(venteWithDetails, venteWithDetails.details, currentCompany);
      } else {
        alert('Impossible de trouver les détails de la vente');
      }
    } catch (error) {
      console.error('Erreur impression:', error);
      alert('Erreur lors de l\'impression');
    }
  };

  const totalPanier = panier.reduce((sum, p) => sum + p.sous_total, 0);
  const totalApresRemise = totalPanier - form.remise;
  const resteAPayer = totalApresRemise - form.montant_paye;

  if (loading) return <div style={{ color: COLORS.muted, padding: 50, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>💵 Ventes - {currentCompany?.name}</h1>
          <p style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
            {currentCompany?.slug === 'pomanay' ? 'Boutique accessoires téléphones' : 'Boutique articles bébé'}
          </p>
        </div>
        <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '10px 20px' }} onClick={() => { resetForm(); setShowModal(true); }}>
          + Nouvelle vente
        </button>
      </div>

      {/* Liste des ventes */}
      <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                <th style={{ padding: 12, textAlign: 'left' }}>#Facture</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Client</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Montant</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Payé</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Reste</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Statut</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ventes.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: COLORS.muted }}>
                    Aucune vente enregistrée
                  </td>
                </tr>
              ) : (
                ventes.map(vente => (
                  <tr key={vente.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{vente.numero_facture}</td>
                    <td style={{ padding: 12 }}>{vente.client_nom || '-'}</td>
                    <td style={{ padding: 12 }}>{new Date(vente.date_vente).toLocaleDateString()}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{formatAr(vente.montant_total)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{formatAr(vente.montant_paye)}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: vente.reste_a_payer > 0 ? COLORS.orange : COLORS.green }}>
                      {formatAr(vente.reste_a_payer)}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <StatusBadge status={vente.statut} />
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <button 
                        onClick={() => handlePrintTicket(vente.id)} 
                        style={{ ...btn('#475569', '#334155'), marginRight: 8, padding: '4px 10px', fontSize: 11 }}
                        title="Imprimer le ticket"
                      >
                        🖨️
                      </button>
                      <button 
                        onClick={() => handleEditVente(vente)} 
                        style={{ ...btn('#475569', '#334155'), marginRight: 8, padding: '4px 10px', fontSize: 11 }}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteVente(vente.id)} 
                        style={{ ...btn(COLORS.red, '#b91c1c'), padding: '4px 10px', fontSize: 11 }}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: COLORS.bg, borderTop: `2px solid ${COLORS.border}` }}>
                <td colSpan={3} style={{ padding: 12, fontWeight: 700 }}>TOTAL GÉNÉRAL</td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 800, fontSize: 15, color: COLORS.green }}>
                  {formatAr(ventes.reduce((s, v) => s + (v.montant_total || 0), 0))}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle/Modification vente */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.container, maxWidth: 900 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{editMode ? 'Modifier la vente' : 'Nouvelle vente'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Section produits */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: COLORS.blue }}>🛒 Produits disponibles</h3>
                <div style={{ maxHeight: 400, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 8 }}>
                  {produits.map(produit => (
                    <div key={produit.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: 10, 
                      borderBottom: `1px solid ${COLORS.border}`,
                      marginBottom: 4
                    }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{produit.nom}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>
                          Stock: {produit.quantite_stock} | Prix: {formatAr(produit.prix_vente)}
                        </div>
                      </div>
                      <button 
                        style={{ ...btn(COLORS.blue, '#2563eb'), padding: '6px 12px', fontSize: 12 }} 
                        onClick={() => addToCart(produit)}
                      >
                        + Ajouter
                      </button>
                    </div>
                  ))}
                  {produits.length === 0 && (
                    <div style={{ textAlign: 'center', color: COLORS.muted, padding: 20 }}>
                      Aucun produit disponible
                    </div>
                  )}
                </div>
              </div>

              {/* Section panier */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: COLORS.green }}>📝 Panier</h3>
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 8 }}>
                  {panier.length === 0 ? (
                    <div style={{ textAlign: 'center', color: COLORS.muted, padding: 30 }}>
                      Panier vide
                    </div>
                  ) : (
                    panier.map(item => (
                      <div key={item.produit_id} style={{ 
                        padding: 10, 
                        borderBottom: `1px solid ${COLORS.border}`,
                        marginBottom: 8
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.nom}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button 
                              onClick={() => updateCartQuantity(item.produit_id, item.quantite - 1)} 
                              style={{ ...btn('#475569', '#334155'), padding: '4px 8px', fontSize: 12, minWidth: 30 }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 600, minWidth: 30, textAlign: 'center' }}>{item.quantite}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.produit_id, item.quantite + 1)} 
                              style={{ ...btn('#475569', '#334155'), padding: '4px 8px', fontSize: 12, minWidth: 30 }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11 }}>Prix unitaire:</span>
                            <input 
                              type="number" 
                              style={{ width: 100, padding: '4px 8px', borderRadius: 4, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                              value={item.prix_unitaire}
                              onChange={(e) => updateCartPrice(item.produit_id, parseFloat(e.target.value) || 0)}
                              step="100"
                            />
                          </div>
                          <span style={{ fontWeight: 700 }}>{formatAr(item.sous_total)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>📅 Date vente</label>
                  <input type="date" style={inp()} value={form.date_vente} onChange={e => setForm({ ...form, date_vente: e.target.value })} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>👤 Client</label>
                  <input style={inp()} placeholder="Nom du client" value={form.client_nom} onChange={e => setForm({ ...form, client_nom: e.target.value })} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>📞 Téléphone</label>
                  <input style={inp()} placeholder="Téléphone" value={form.client_telephone} onChange={e => setForm({ ...form, client_telephone: e.target.value })} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>💳 Mode de paiement</label>
                  <select style={inp()} value={form.type_paiement} onChange={e => setForm({ ...form, type_paiement: e.target.value })}>
                    <option value="especes">💰 Espèces</option>
                    <option value="mobile_money">📱 Mobile Money</option>
                    <option value="carte">💳 Carte bancaire</option>
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>🏷️ Remise (Ar)</label>
                  <input type="number" style={inp()} value={form.remise} onChange={e => setForm({ ...form, remise: parseFloat(e.target.value) || 0 })} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>💰 Montant payé</label>
                  <input type="number" style={inp()} value={form.montant_paye} onChange={e => setForm({ ...form, montant_paye: parseFloat(e.target.value) || 0 })} placeholder="0" />
                </div>

                {/* Récapitulatif */}
                <div style={{ background: COLORS.bg, padding: 15, borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Total HT</span>
                    <span>{formatAr(totalPanier)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Remise</span>
                    <span style={{ color: COLORS.red }}>-{formatAr(form.remise)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}` }}>
                    <span style={{ fontWeight: 700 }}>Total TTC</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.green }}>{formatAr(totalApresRemise)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Payé</span>
                    <span>{formatAr(form.montant_paye)}</span>
                  </div>
                  {resteAPayer > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}` }}>
                      <span style={{ fontWeight: 700, color: COLORS.orange }}>Reste à payer</span>
                      <span style={{ fontWeight: 700, color: COLORS.orange }}>{formatAr(resteAPayer)}</span>
                    </div>
                  )}
                  {resteAPayer === 0 && totalApresRemise > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 4 }}>
                      <span style={{ color: COLORS.green, fontSize: 12 }}>✅ Entièrement payé</span>
                    </div>
                  )}
                </div>

                <button style={{ ...btn(COLORS.green, '#047857'), width: '100%', padding: 14, fontSize: 15 }} onClick={handleSubmitVente}>
                  {editMode ? '✅ Mettre à jour la vente' : '✅ Enregistrer la vente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const config = {
    paye: { bg: '#064e3b', color: '#34d399', label: 'Payé' },
    credit: { bg: '#451a03', color: '#fbbf24', label: 'Crédit' },
    en_attente: { bg: '#1e3a5f', color: '#60a5fa', label: 'En attente' }
  };
  const c = config[status] || config.en_attente;
  return <span style={{ background: c.bg, color: c.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{c.label}</span>;
};