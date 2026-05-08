import { supabase } from '../supabaseClient';

export const fetchRecuperations = async () => {
  const { data, error } = await supabase.from('recuperations').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data;
};

export const addRecuperation = async (recuperation) => {
  const { data, error } = await supabase.from('recuperations').insert([{
    date: recuperation.date,
    livreur_id: recuperation.livreur_id,
    livreur_nom: recuperation.livreur_nom,
    client_donneur: recuperation.client_donneur,
    frais_recuperation: recuperation.frais_recuperation || 1000
  }]).select();
  if (error) throw error;
  return data[0];
};

export const updateRecuperation = async (id, updates) => {
  const { error } = await supabase.from('recuperations').update(updates).eq('id', id);
  if (error) throw error;
};

export const deleteRecuperation = async (id) => {
  const { error } = await supabase.from('recuperations').delete().eq('id', id);
  if (error) throw error;
};

export const getRecuperationsByDate = async (date) => {
  const { data, error } = await supabase.from('recuperations').select('*').eq('date', date).order('livreur_nom');
  if (error) throw error;
  return data;
};

export const getRecuperationsByMonth = async (mois) => {
  // Pour debug : afficher le mois recherché
  console.log('Recherche récupérations pour le mois:', mois);
  
  const { data, error } = await supabase.from('recuperations').select('*').ilike('date', `${mois}%`).order('date', { ascending: false });
  
  console.log('Récupérations trouvées:', data?.length || 0);
  if (error) {
    console.error('Erreur getRecuperationsByMonth:', error);
    return [];
  }
  return data || [];
};

export const getRecuperationsByLivreur = async (livreurId, mois) => {
  console.log('Recherche pour livreur:', livreurId, 'mois:', mois);
  
  let query = supabase.from('recuperations').select('*').eq('livreur_id', livreurId);
  if (mois) {
    query = query.ilike('date', `${mois}%`);
  }
  const { data, error } = await query.order('date', { ascending: false });
  
  console.log('Récupérations trouvées pour livreur:', data?.length || 0);
  if (error) throw error;
  return data || [];
};