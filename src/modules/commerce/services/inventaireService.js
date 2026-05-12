// modules/commerce/services/inventaireService.js
import { supabase, getCurrentCompany } from '../../../supabaseClient';

// Récupérer l'inventaire en cours
export const getCurrentInventory = async () => {
  const company = getCurrentCompany();
  if (!company) return null;

  const { data, error } = await supabase
    .from('inventaires')
    .select('*')
    .eq('company_id', company.id)
    .eq('statut', 'en_cours')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Démarrer un nouvel inventaire
export const startInventory = async (notes = '') => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  // Vérifier s'il y a déjà un inventaire en cours
  const current = await getCurrentInventory();
  if (current) {
    throw new Error('Un inventaire est déjà en cours. Terminez-le avant d\'en commencer un nouveau.');
  }

  const { data, error } = await supabase
    .from('inventaires')
    .insert([{
      company_id: company.id,
      date_debut: new Date().toISOString(),
      statut: 'en_cours',
      notes: notes,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Récupérer tous les produits pour l'inventaire
export const getProductsForInventory = async (categorie = null) => {
  const company = getCurrentCompany();
  if (!company) return [];

  let query = supabase
    .from('produits')
    .select('*')
    .eq('company_id', company.id)
    .eq('is_active', true)
    .order('nom');

  if (categorie) {
    query = query.eq('categorie', categorie);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Enregistrer le comptage d'un produit
export const recordCount = async (inventoryId, productId, actualQuantity, notes = '') => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  // Récupérer la quantité théorique
  const { data: product, error: productError } = await supabase
    .from('produits')
    .select('quantite_stock, nom, reference')
    .eq('id', productId)
    .eq('company_id', company.id)
    .single();

  if (productError) throw productError;

  const theoreticalQuantity = product.quantite_stock;
  const difference = actualQuantity - theoreticalQuantity;

  // Vérifier si déjà compté
  const { data: existing, error: existingError } = await supabase
    .from('inventaire_details')
    .select('id')
    .eq('inventaire_id', inventoryId)
    .eq('produit_id', productId)
    .maybeSingle();

  let result;

  if (existing) {
    // Mettre à jour
    const { data, error } = await supabase
      .from('inventaire_details')
      .update({
        quantite_reelle: actualQuantity,
        ecart: difference,
        statut: difference === 0 ? 'ok' : 'ecart',
        notes: notes
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    // Créer
    const { data, error } = await supabase
      .from('inventaire_details')
      .insert([{
        inventaire_id: inventoryId,
        produit_id: productId,
        quantite_theorique: theoreticalQuantity,
        quantite_reelle: actualQuantity,
        ecart: difference,
        statut: difference === 0 ? 'ok' : 'ecart',
        notes: notes
      }])
      .select()
      .single();

    if (error) throw error;
    result = data;
  }

  return {
    ...result,
    product_name: product.nom,
    product_reference: product.reference,
    theoretical_quantity: theoreticalQuantity
  };
};

// Récupérer les produits déjà comptés
export const getCountedProducts = async (inventoryId) => {
  const company = getCurrentCompany();
  if (!company) return [];

  const { data, error } = await supabase
    .from('inventaire_details')
    .select(`
      *,
      produit:produits(id, nom, reference, categorie)
    `)
    .eq('inventaire_id', inventoryId);

  if (error) throw error;
  return data;
};

// Récupérer les produits non encore comptés
export const getUncountedProducts = async (inventoryId, categorie = null) => {
  const company = getCurrentCompany();
  if (!company) return [];

  // Récupérer les IDs des produits déjà comptés
  const { data: counted, error: countedError } = await supabase
    .from('inventaire_details')
    .select('produit_id')
    .eq('inventaire_id', inventoryId);

  if (countedError) throw countedError;

  const countedIds = counted.map(c => c.produit_id);

  // Récupérer les produits non comptés
  let query = supabase
    .from('produits')
    .select('*')
    .eq('company_id', company.id)
    .eq('is_active', true)
    .order('nom');

  if (countedIds.length > 0) {
    query = query.not('id', 'in', `(${countedIds.join(',')})`);
  }

  if (categorie) {
    query = query.eq('categorie', categorie);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Terminer l'inventaire et appliquer les corrections
export const finishInventory = async (inventoryId) => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  // Récupérer tous les écarts
  const { data: differences, error: diffError } = await supabase
    .from('inventaire_details')
    .select('*')
    .eq('inventaire_id', inventoryId)
    .neq('ecart', 0);

  if (diffError) throw diffError;

  // Appliquer les corrections
  for (const diff of differences) {
    // Mettre à jour le stock du produit
    await supabase
      .from('produits')
      .update({ 
        quantite_stock: diff.quantite_reelle,
        updated_at: new Date().toISOString()
      })
      .eq('id', diff.produit_id)
      .eq('company_id', company.id);

    // Créer un mouvement de stock
    await supabase
      .from('mouvements_stock')
      .insert([{
        company_id: company.id,
        produit_id: diff.produit_id,
        type: 'inventaire',
        quantite: Math.abs(diff.ecart),
        notes: `Correction inventaire - Écart de ${diff.ecart > 0 ? '+' : ''}${diff.ecart}`,
        date_mouvement: new Date().toISOString(),
        created_at: new Date().toISOString()
      }]);
  }

  // Terminer l'inventaire
  const { error } = await supabase
    .from('inventaires')
    .update({
      date_fin: new Date().toISOString(),
      statut: 'termine'
    })
    .eq('id', inventoryId)
    .eq('company_id', company.id);

  if (error) throw error;

  return {
    success: true,
    corrections_appliquees: differences.length
  };
};

// Annuler l'inventaire en cours
export const cancelInventory = async (inventoryId) => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  const { error } = await supabase
    .from('inventaires')
    .update({
      statut: 'annule',
      date_fin: new Date().toISOString()
    })
    .eq('id', inventoryId)
    .eq('company_id', company.id);

  if (error) throw error;
};

// Récupérer l'historique des inventaires
export const getInventoryHistory = async (limit = 50) => {
  const company = getCurrentCompany();
  if (!company) return [];

  const { data, error } = await supabase
    .from('inventaires')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Récupérer les détails d'un inventaire terminé
export const getInventoryDetails = async (inventoryId) => {
  const company = getCurrentCompany();
  if (!company) return null;

  const { data: inventory, error: invError } = await supabase
    .from('inventaires')
    .select('*')
    .eq('id', inventoryId)
    .eq('company_id', company.id)
    .single();

  if (invError) throw invError;

  const { data: details, error: detailsError } = await supabase
    .from('inventaire_details')
    .select(`
      *,
      produit:produits(id, nom, reference, categorie)
    `)
    .eq('inventaire_id', inventoryId)
    .order('produit_id');

  if (detailsError) throw detailsError;

  // Calculer les statistiques
  const totalProducts = details.length;
  const productsWithDifference = details.filter(d => d.ecart !== 0).length;
  const totalDifference = details.reduce((sum, d) => sum + Math.abs(d.ecart), 0);

  return {
    ...inventory,
    details,
    stats: {
      total_products: totalProducts,
      products_with_difference: productsWithDifference,
      total_difference: totalDifference,
      accuracy_rate: totalProducts > 0 ? ((totalProducts - productsWithDifference) / totalProducts * 100).toFixed(2) : 100
    }
  };
};