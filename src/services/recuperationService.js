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
    nbr_colis: recuperation.nbr_colis || 1,
    gain: (recuperation.nbr_colis || 1) * 1000
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

export const getRecuperationsByLivreur = async (livreurId, mois) => {
  let query = supabase.from('recuperations').select('*').eq('livreur_id', livreurId);
  if (mois) {
    query = query.eq('date', mois);
  }
  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return data;
};