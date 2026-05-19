// src/services/livraisonService.js
import { supabase, getCurrentCompany } from '../../../supabaseClient';

export const fetchLivraisons = async () => {
  try {
    const company = getCurrentCompany();
    if (!company) {
      return [];
    }

    const { data, error } = await supabase
      .from('livraisons')
      .select('*')
      .eq('company_id', company.id)
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const addLivraison = async (livraison) => {
  try {
    const company = getCurrentCompany();
    if (!company) throw new Error('Aucune société sélectionnée');

    // Validation des données
    if (!livraison.colis) throw new Error('Le colis est requis');
    if (!livraison.client_donneur) throw new Error('Le client donneur est requis');
    if (!livraison.destinataire) throw new Error('Le destinataire est requis');
    if (!livraison.agent_id && !livraison.agent_nom) throw new Error('Le livreur est requis');
    if (!livraison.date) throw new Error('La date est requis');

    const insertData = {
      colis: livraison.colis,
      client_donneur: livraison.client_donneur,
      destinataire: livraison.destinataire,
      destinataire_telephone: livraison.destinataire_telephone || '',
      destinataire_lieu: livraison.destinataire_lieu || '',
      agent_id: livraison.agent_id,
      agent_nom: livraison.agent_nom,
      montant: parseFloat(livraison.montant) || 0,
      frais: parseFloat(livraison.frais) || 0,
      paiement: livraison.paiement || 'espece',
      date: livraison.date,
      statut: livraison.statut || 'en_cours',
      company_id: company.id,
      created_at: new Date().toISOString()
    };


    const { data, error } = await supabase
      .from('livraisons')
      .insert([insertData])
      .select();
      
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    throw error;
  }
};

export const updateLivraison = async (id, updates) => {
  try {
    const company = getCurrentCompany();
    if (!company) throw new Error('Aucune société sélectionnée');


    const { error } = await supabase
      .from('livraisons')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', company.id);
      
    if (error) throw error;
    
  } catch (error) {
    throw error;
  }
};

export const deleteLivraison = async (id) => {
  try {
    const company = getCurrentCompany();
    if (!company) throw new Error('Aucune société sélectionnée');


    const { error } = await supabase
      .from('livraisons')
      .delete()
      .eq('id', id)
      .eq('company_id', company.id);
      
    if (error) throw error;
    
  } catch (error) {
    throw error;
  }
};

// Fonction supplémentaire : Récupérer les livraisons par statut
export const fetchLivraisonsByStatut = async (statut) => {
  const company = getCurrentCompany();
  if (!company) return [];

  const { data, error } = await supabase
    .from('livraisons')
    .select('*')
    .eq('company_id', company.id)
    .eq('statut', statut)
    .order('date', { ascending: false });
    
  if (error) throw error;
  return data || [];
};

// Fonction supplémentaire : Récupérer les livraisons par agent
export const fetchLivraisonsByAgent = async (agentId) => {
  const company = getCurrentCompany();
  if (!company) return [];

  const { data, error } = await supabase
    .from('livraisons')
    .select('*')
    .eq('company_id', company.id)
    .eq('agent_id', agentId)
    .order('date', { ascending: false });
    
  if (error) throw error;
  return data || [];
};

// Fonction supplémentaire : Récupérer les livraisons par date
export const fetchLivraisonsByDate = async (date) => {
  const company = getCurrentCompany();
  if (!company) return [];

  const { data, error } = await supabase
    .from('livraisons')
    .select('*')
    .eq('company_id', company.id)
    .eq('date', date)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
};