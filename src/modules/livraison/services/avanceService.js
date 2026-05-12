// src/services/avanceService.js
import { supabase, getCurrentCompany } from '../../../supabaseClient';

export const fetchAvances = async () => {
  try {
    const company = getCurrentCompany();
    if (!company) {
      console.warn('Aucune société sélectionnée pour fetchAvances');
      return [];
    }

    const { data, error } = await supabase
      .from('avances')
      .select('*')
      .eq('company_id', company.id)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('fetchAvances - Erreur:', error);
    throw error;
  }
};

export const addAvance = async (avance) => {
  try {
    const company = getCurrentCompany();
    if (!company) throw new Error('Aucune société sélectionnée');

    // Validation des données
    if (!avance.agent_id && !avance.agent_nom) {
      throw new Error('Agent requis');
    }
    if (!avance.montant || avance.montant <= 0) {
      throw new Error('Montant valide requis');
    }
    if (!avance.date) {
      throw new Error('Date requise');
    }

    const { data, error } = await supabase
      .from('avances')
      .insert([{
        agent_id: avance.agent_id,
        agent_nom: avance.agent_nom,
        montant: parseFloat(avance.montant),
        motif: avance.motif || null,
        date: avance.date,
        mois: avance.mois,
        annule: false,
        company_id: company.id
      }])
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('addAvance - Erreur:', error);
    throw error;
  }
};

export const annulerAvance = async (id) => {
  try {
    const company = getCurrentCompany();
    if (!company) throw new Error('Aucune société sélectionnée');

    const { error } = await supabase
      .from('avances')
      .update({ annule: true })
      .eq('id', id)
      .eq('company_id', company.id);
      
    if (error) throw error;
  } catch (error) {
    console.error('annulerAvance - Erreur:', error);
    throw error;
  }
};

export const deleteAvance = async (id) => {
  try {
    const company = getCurrentCompany();
    if (!company) throw new Error('Aucune société sélectionnée');

    const { error } = await supabase
      .from('avances')
      .delete()
      .eq('id', id)
      .eq('company_id', company.id);
      
    if (error) throw error;
  } catch (error) {
    console.error('deleteAvance - Erreur:', error);
    throw error;
  }
};