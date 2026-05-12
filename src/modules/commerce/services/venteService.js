// src/modules/commerce/services/venteService.js
import { supabase, getCurrentCompany } from '../../../supabaseClient';
import { createMouvementStock } from './stockService';

// ============ CRUD VENTES ============

// Récupérer toutes les ventes
export const fetchVentes = async (filters = {}) => {
  const company = getCurrentCompany();
  if (!company) return [];

  let query = supabase
    .from('ventes')
    .select('*')
    .eq('company_id', company.id)
    .order('date_vente', { ascending: false });

  if (filters.dateDebut) {
    query = query.gte('date_vente', filters.dateDebut);
  }
  if (filters.dateFin) {
    query = query.lte('date_vente', filters.dateFin);
  }
  if (filters.statut) {
    query = query.eq('statut', filters.statut);
  }
  if (filters.client_nom) {
    query = query.ilike('client_nom', `%${filters.client_nom}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Récupérer une vente avec ses détails
export const fetchVenteWithDetails = async (id) => {
  const company = getCurrentCompany();
  if (!company) return null;

  // Récupérer la vente
  const { data: vente, error: venteError } = await supabase
    .from('ventes')
    .select('*')
    .eq('id', id)
    .eq('company_id', company.id)
    .single();

  if (venteError) throw venteError;

  // Récupérer les détails
  const { data: details, error: detailsError } = await supabase
    .from('vente_details')
    .select(`
      *,
      produit:produits(id, nom, reference)
    `)
    .eq('vente_id', id);

  if (detailsError) throw detailsError;

  return { ...vente, details };
};

// Créer une nouvelle vente
export const createVente = async (venteData, details) => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  // Calculer les totaux
  let montantTotal = 0;
  for (const item of details) {
    item.sous_total = item.quantite * item.prix_unitaire;
    montantTotal += item.sous_total;
  }

  const remise = venteData.remise || 0;
  const montantFinal = montantTotal - remise;
  const resteAPayer = montantFinal - (venteData.montant_paye || 0);

  // Générer un numéro de facture
  const numeroFacture = await generateNumeroFacture();

  // Créer la vente
  const { data: vente, error: venteError } = await supabase
    .from('ventes')
    .insert([{
      company_id: company.id,
      numero_facture: numeroFacture,
      date_vente: venteData.date_vente || new Date().toISOString(),
      client_nom: venteData.client_nom,
      client_telephone: venteData.client_telephone,
      client_email: venteData.client_email,
      montant_ht: montantTotal,
      remise: remise,
      montant_total: montantFinal,
      montant_paye: venteData.montant_paye || 0,
      reste_a_payer: resteAPayer,
      statut: resteAPayer === 0 ? 'paye' : (venteData.montant_paye > 0 ? 'credit' : 'en_attente'),
      type_paiement: venteData.type_paiement,
      notes: venteData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (venteError) throw venteError;

  // Créer les détails et mettre à jour le stock
  for (const item of details) {
    // Ajouter le détail
    const { error: detailError } = await supabase
      .from('vente_details')
      .insert([{
        vente_id: vente.id,
        produit_id: item.produit_id,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        remise_ligne: item.remise_ligne || 0,
        sous_total: item.sous_total
      }]);

    if (detailError) throw detailError;

    // Mettre à jour le stock (diminuer)
    await updateStockAfterSale(item.produit_id, item.quantite, vente.id);
  }

  return vente;
};

// Mettre à jour une vente
export const updateVente = async (id, venteData, details) => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  // Récupérer l'ancienne vente
  const oldVente = await fetchVenteWithDetails(id);
  if (!oldVente) throw new Error('Vente non trouvée');

  // Restaurer l'ancien stock (annuler l'ancienne vente)
  for (const item of oldVente.details) {
    await restoreStockAfterUpdate(item.produit_id, item.quantite, id);
  }

  // Supprimer les anciens détails
  const { error: deleteDetailsError } = await supabase
    .from('vente_details')
    .delete()
    .eq('vente_id', id);
  
  if (deleteDetailsError) throw deleteDetailsError;

  // Calculer les nouveaux totaux
  let montantTotal = 0;
  for (const item of details) {
    item.sous_total = item.quantite * item.prix_unitaire;
    montantTotal += item.sous_total;
  }

  const remise = venteData.remise || 0;
  const montantFinal = montantTotal - remise;
  const resteAPayer = montantFinal - (venteData.montant_paye || 0);

  // Mettre à jour la vente
  const { error: venteError } = await supabase
    .from('ventes')
    .update({
      date_vente: venteData.date_vente || new Date().toISOString(),
      client_nom: venteData.client_nom,
      client_telephone: venteData.client_telephone,
      client_email: venteData.client_email,
      montant_ht: montantTotal,
      remise: remise,
      montant_total: montantFinal,
      montant_paye: venteData.montant_paye || 0,
      reste_a_payer: resteAPayer,
      statut: resteAPayer === 0 ? 'paye' : (venteData.montant_paye > 0 ? 'credit' : 'en_attente'),
      type_paiement: venteData.type_paiement,
      notes: venteData.notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('company_id', company.id);

  if (venteError) throw venteError;

  // Créer les nouveaux détails et mettre à jour le stock
  for (const item of details) {
    const { error: detailError } = await supabase
      .from('vente_details')
      .insert([{
        vente_id: id,
        produit_id: item.produit_id,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        remise_ligne: item.remise_ligne || 0,
        sous_total: item.sous_total
      }]);

    if (detailError) throw detailError;

    // Mettre à jour le stock (diminuer)
    await updateStockAfterSale(item.produit_id, item.quantite, id);
  }

  return true;
};

// Supprimer une vente
export const deleteVente = async (id) => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  // Récupérer la vente avec ses détails
  const vente = await fetchVenteWithDetails(id);
  if (!vente) throw new Error('Vente non trouvée');

  // Restaurer le stock (annuler la vente)
  for (const item of vente.details) {
    await restoreStockAfterUpdate(item.produit_id, item.quantite, id);
  }

  // Supprimer les détails
  const { error: deleteDetailsError } = await supabase
    .from('vente_details')
    .delete()
    .eq('vente_id', id);
  
  if (deleteDetailsError) throw deleteDetailsError;

  // Supprimer la vente
  const { error } = await supabase
    .from('ventes')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id);

  if (error) throw error;
};

// Mettre à jour le stock après une vente
const updateStockAfterSale = async (produitId, quantite, venteId) => {
  const company = getCurrentCompany();
  
  const { data: produit, error: produitError } = await supabase
    .from('produits')
    .select('quantite_stock')
    .eq('id', produitId)
    .eq('company_id', company.id)
    .single();

  if (produitError) throw produitError;

  const nouvelleQuantite = produit.quantite_stock - quantite;

  if (nouvelleQuantite < 0) {
    throw new Error(`Stock insuffisant pour le produit ${produitId}`);
  }

  await supabase
    .from('produits')
    .update({ 
      quantite_stock: nouvelleQuantite,
      updated_at: new Date().toISOString()
    })
    .eq('id', produitId)
    .eq('company_id', company.id);

  await createMouvementStock({
    produit_id: produitId,
    type: 'vente',
    quantite: quantite,
    reference_type: 'vente',
    reference_id: venteId,
    notes: `Vente #${venteId}`,
    date_mouvement: new Date().toISOString()
  });
};

// Restaurer le stock après modification/suppression
const restoreStockAfterUpdate = async (produitId, quantite, venteId) => {
  const company = getCurrentCompany();
  
  const { data: produit, error: produitError } = await supabase
    .from('produits')
    .select('quantite_stock')
    .eq('id', produitId)
    .eq('company_id', company.id)
    .single();

  if (produitError) throw produitError;

  const nouvelleQuantite = produit.quantite_stock + quantite;

  await supabase
    .from('produits')
    .update({ 
      quantite_stock: nouvelleQuantite,
      updated_at: new Date().toISOString()
    })
    .eq('id', produitId)
    .eq('company_id', company.id);

  await createMouvementStock({
    produit_id: produitId,
    type: 'entree',
    quantite: quantite,
    reference_type: 'annulation_vente',
    reference_id: venteId,
    notes: `Annulation vente #${venteId}`,
    date_mouvement: new Date().toISOString()
  });
};

// Générer un numéro de facture unique
const generateNumeroFacture = async () => {
  const company = getCurrentCompany();
  const { data, error } = await supabase
    .from('ventes')
    .select('numero_facture')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    const year = new Date().getFullYear().toString().slice(-2);
    return `FACT-${year}-0001`;
  }

  const lastNum = data[0].numero_facture;
  const match = lastNum.match(/\d+$/);
  if (match) {
    const newNum = String(parseInt(match[0]) + 1).padStart(4, '0');
    const year = new Date().getFullYear().toString().slice(-2);
    return `FACT-${year}-${newNum}`;
  }
  
  const year = new Date().getFullYear().toString().slice(-2);
  return `FACT-${year}-0001`;
};

// ============ STATISTIQUES VENTES ============

// Chiffre d'affaires par période
export const getCA = async (dateDebut, dateFin) => {
  const company = getCurrentCompany();
  if (!company) return 0;

  let query = supabase
    .from('ventes')
    .select('montant_total')
    .eq('company_id', company.id)
    .eq('statut', 'paye');

  if (dateDebut) query = query.gte('date_vente', dateDebut);
  if (dateFin) query = query.lte('date_vente', dateFin);

  const { data, error } = await query;
  if (error) throw error;

  return data.reduce((sum, v) => sum + (v.montant_total || 0), 0);
};