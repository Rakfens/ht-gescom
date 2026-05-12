// src/services/agentService.js
import { supabase, getCurrentCompany } from '../../../supabaseClient';

export const fetchAgents = async () => {
  const company = getCurrentCompany();
  if (!company) return [];

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('company_id', company.id)
    .order('nom');
    
  if (error) throw error;
  return data || [];
};

export const addAgent = async (nom, salaire) => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  const { data, error } = await supabase
    .from('agents')
    .insert([{ 
      nom, 
      salaire: parseFloat(salaire),
      company_id: company.id  // ← AJOUT multi-sociétés
    }])
    .select();
    
  if (error) throw error;
  return data[0];
};

export const updateAgent = async (id, updates) => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  const { error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', id)
    .eq('company_id', company.id);  // ← AJOUT sécurité multi-sociétés
    
  if (error) throw error;
};

export const deleteAgent = async (id) => {
  const company = getCurrentCompany();
  if (!company) throw new Error('Aucune société sélectionnée');

  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id);  // ← AJOUT sécurité multi-sociétés
    
  if (error) throw error;
};