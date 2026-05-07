import { supabase } from '../supabaseClient';

export const fetchAgents = async () => {
  const { data, error } = await supabase.from('agents').select('*').order('nom');
  if (error) throw error;
  return data;
};

export const addAgent = async (nom, salaire) => {
  const { data, error } = await supabase.from('agents').insert([{ nom, salaire: parseFloat(salaire) }]).select();
  if (error) throw error;
  return data[0];
};

export const updateAgent = async (id, updates) => {
  const { error } = await supabase.from('agents').update(updates).eq('id', id);
  if (error) throw error;
};

export const deleteAgent = async (id) => {
  const { error } = await supabase.from('agents').delete().eq('id', id);
  if (error) throw error;
};