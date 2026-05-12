// src/modules/commerce/pages/Achats.jsx (version simplifiée)
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchProduits } from '../services/produitService';
import { fetchAchats, createAchat, updateAchat, deleteAchat } from '../services/achatService';
import { COLORS, formatAr } from '../../shared/utils/constants';
import { btn, inp, lbl, modalStyles } from '../../shared/utils/helpers';

export default function Achats() {
  const { currentCompany } = useCompany();
  const [achats, setAchats] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAchat, setSelectedAchat] = useState(null);
  const [panier, setPanier] = useState([]);
  const [form, setForm] = useState({
    fournisseur_nom: '',
    fournisseur_contact: '',
    tva: 0,
    montant_paye: 0,
    date_achat: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [achatsData, produitsData] = await Promise.all([
        fetchAchats(),
        fetchProduits()
      ]);
      setAchats(achatsData);
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
        prix_unitaire: produit.prix_achat || 0,
        sous_total: produit.prix_achat || 0
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

  const handleSubmitAchat = async () => {
    if (panier.length === 0) {
      alert('Ajoutez au moins un produit');
      return;
    }

    const details = panier.map(p => ({
      produit_id: p.produit_id,
      quantite: p.quantite,
      prix_unitaire: p.prix_unitaire,
      sous_total: p.sous_total
    }));

    const achatData = {
      fournisseur_nom: form.fournisseur_nom,
      fournisseur_contact: form.fournisseur_contact,
      tva: form.tva,
      montant_paye: form.montant_paye,
      date_achat: form.date_achat
    };

    try {
      if (editMode && selectedAchat) {
        await updateAchat(selectedAchat.id, achatData, details);
      } else {
        await createAchat(achatData, details);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erreur sauvegarde achat:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleEditAchat = (achat) => {
    setEditMode(true);
    setSelectedAchat(achat);
    setForm({
      fournisseur_nom: achat.fournisseur_nom || '',
      fournisseur_contact: achat.fournisseur_contact || '',
      tva: achat.tva || 0,
      montant_paye: achat.montant_paye || 0,
      date_achat: achat.date_achat?.split('T')[0] || new Date().toISOString().split('T')[0]
    });
    if (achat.details) {
      setPanier(achat.details.map(d => ({
        produit_id: d.produit_id,
        nom: d.produit?.nom || 'Produit',
        quantite: d.quantite,
        prix_unitaire: d.prix_unitaire,
        sous_total: d.sous_total
      })));
    }
    setShowModal(true);
  };

  const handleDeleteAchat = async (id) => {
    if (confirm('⚠️ Supprimer cet achat ? Cette action est irréversible et ajustera le stock.')) {
      try {
        await deleteAchat(id);
        loadData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setSelectedAchat(null);
    setPanier([]);
    setForm({
      fournisseur_nom: '',
      fournisseur_contact: '',
      tva: 0,
      montant_paye: 0,
      date_achat: new Date().toISOString().split('T')[0]
    });
  };

  const totalPanier = panier.reduce((sum, p) => sum + p.sous_total, 0);
  const totalAvecTVA = totalPanier + form.tva;

  if (loading) return <div style={{ color: COLORS.muted, padding: 50, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>📥 Achats - {currentCompany?.name}</h1>
        <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '10px 20px' }} onClick={() => { resetForm(); setShowModal(true); }}>
          + Nouvel achat
        </button>
      </div>

      <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                <th style={{ padding: 12, textAlign: 'left' }}>#Commande</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Fournisseur</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Montant</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Payé</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {achats.map(achat => (
                <tr key={achat.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: 12 }}>{achat.numero_commande}</td>
                  <td style={{ padding: 12 }}>{achat.fournisseur_nom}</td>
                  <td style={{ padding: 12 }}>{new Date(achat.date_achat).toLocaleDateString()}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{formatAr(achat.montant_total)}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{formatAr(achat.montant_paye)}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <button 
                      onClick={() => handleEditAchat(achat)} 
                      style={{ ...btn('#475569', '#334155'), marginRight: 8, padding: '4px 12px', fontSize: 11 }}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteAchat(achat.id)} 
                      style={{ ...btn(COLORS.red, '#b91c1c'), padding: '4px 12px', fontSize: 11 }}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: COLORS.bg }}>
                <td colSpan={3} style={{ padding: 12, fontWeight: 700 }}>TOTAL</td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 700 }}>
                  {formatAr(achats.reduce((s, a) => s + (a.montant_total || 0), 0))}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Nouvel achat */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.container, maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{editMode ? 'Modifier l\'achat' : 'Nouvel achat'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🛒 Produits</h3>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {produits.map(produit => (
                    <div key={produit.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{produit.nom}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>Stock: {produit.quantite_stock}</div>
                      </div>
                      <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '4px 8px', fontSize: 11 }} onClick={() => addToCart(produit)}>
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📝 Détails achat</h3>
                <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                  {panier.map(item => (
                    <div key={item.produit_id} style={{ display: 'flex', flexDirection: 'column', padding: 8, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.nom}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => updateCartQuantity(item.produit_id, item.quantite - 1)} style={{ ...btn('#475569', '#334155'), padding: '2px 6px' }}>-</button>
                          <span style={{ fontWeight: 600 }}>{item.quantite}</span>
                          <button onClick={() => updateCartQuantity(item.produit_id, item.quantite + 1)} style={{ ...btn('#475569', '#334155'), padding: '2px 6px' }}>+</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11 }}>Prix unitaire:</span>
                          <input 
                            type="number" 
                            style={{ width: 100, padding: '4px', borderRadius: 4, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                            value={item.prix_unitaire}
                            onChange={(e) => updateCartPrice(item.produit_id, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <span style={{ fontWeight: 700 }}>{formatAr(item.sous_total)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>Date achat</label>
                  <input type="date" style={inp()} value={form.date_achat} onChange={e => setForm({ ...form, date_achat: e.target.value })} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>Fournisseur</label>
                  <input style={inp()} placeholder="Nom du fournisseur" value={form.fournisseur_nom} onChange={e => setForm({ ...form, fournisseur_nom: e.target.value })} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>Contact</label>
                  <input style={inp()} placeholder="Téléphone" value={form.fournisseur_contact} onChange={e => setForm({ ...form, fournisseur_contact: e.target.value })} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>TVA (Ar)</label>
                  <input type="number" style={inp()} value={form.tva} onChange={e => setForm({ ...form, tva: parseFloat(e.target.value) || 0 })} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl()}>Montant payé (Ar)</label>
                  <input type="number" style={inp()} value={form.montant_paye} onChange={e => setForm({ ...form, montant_paye: parseFloat(e.target.value) || 0 })} />
                </div>

                <div style={{ background: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Sous-total</span>
                    <span>{formatAr(totalPanier)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>TVA</span>
                    <span>{formatAr(form.tva)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Total</span>
                    <span>{formatAr(totalAvecTVA)}</span>
                  </div>
                </div>

                <button style={{ ...btn(COLORS.green, '#047857'), width: '100%', padding: 12 }} onClick={handleSubmitAchat}>
                  {editMode ? '✅ Mettre à jour' : '✅ Enregistrer l\'achat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}