import { supabase } from '../supabaseClient';

export const fetchCommission = async () => {
  const { data, error } = await supabase.from('config').select('valeur').eq('cle', 'commission_gerant').single();
  if (error) throw error;
  return Number(data.valeur);
};

export const updateCommission = async (newVal) => {
  const { error } = await supabase.from('config').upsert({ cle: 'commission_gerant', valeur: String(newVal) }, { onConflict: 'cle' });
  if (error) throw error;
};

export const fetchLogo = async () => {
  const { data, error } = await supabase.from('config').select('valeur').eq('cle', 'logo_url').single();
  if (error && error.code !== 'PGRST116') throw error;
  return data?.valeur || null;
};

export const updateLogo = async (url) => {
  const { error } = await supabase.from('config').upsert({ cle: 'logo_url', valeur: url }, { onConflict: 'cle' });
  if (error) throw error;
};

export const uploadLogoFile = async (file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `logo_${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
  if (uploadError) throw uploadError;
  const { data: publicUrl } = supabase.storage.from('logos').getPublicUrl(fileName);
  return publicUrl.publicUrl;
};