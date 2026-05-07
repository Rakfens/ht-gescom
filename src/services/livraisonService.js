import { supabase } from '../supabaseClient';

export const fetchLivraisons = async () => {
  const { data, error } = await supabase.from('livraisons').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data;
};

export const addLivraison = async (livraison) => {
  const { data, error } = await supabase.from('livraisons').insert([{
    colis: livraison.colis,
    client_donneur: livraison.client_donneur,
    destinataire: livraison.destinataire,
    destinataire_telephone: livraison.destinataire_telephone || '',
    destinataire_lieu: livraison.destinataire_lieu || '',
    agent_id: livraison.agent_id,
    agent_nom: livraison.agent_nom,
    montant: livraison.montant,
    frais: livraison.frais,
    paiement: livraison.paiement,
    date: livraison.date,
    statut: livraison.statut
  }]).select();
  if (error) throw error;
  return data[0];
};

export const updateLivraison = async (id, updates) => {
  const { error } = await supabase.from('livraisons').update(updates).eq('id', id);
  if (error) throw error;
};

export const deleteLivraison = async (id) => {
  const { error } = await supabase.from('livraisons').delete().eq('id', id);
  if (error) throw error;
};