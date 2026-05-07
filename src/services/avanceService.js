import { supabase } from '../supabaseClient';

export const fetchAvances = async () => {
  const { data, error } = await supabase.from('avances').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data;
};

export const addAvance = async (avance) => {
  const { data, error } = await supabase.from('avances').insert([{
    agent_id: avance.agent_id,
    agent_nom: avance.agent_nom,
    montant: avance.montant,
    motif: avance.motif || null,
    date: avance.date,
    mois: avance.mois,
    annule: false
  }]).select();
  if (error) throw error;
  return data[0];
};

export const annulerAvance = async (id) => {
  const { error } = await supabase.from('avances').update({ annule: true }).eq('id', id);
  if (error) throw error;
};

export const deleteAvance = async (id) => {
  const { error } = await supabase.from('avances').delete().eq('id', id);
  if (error) throw error;
};