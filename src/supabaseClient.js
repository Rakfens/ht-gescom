// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://amdxzcgwmoodyxkasrqx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZHh6Y2d3bW9vZHl4a2FzcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQyNzksImV4cCI6MjA5Mzk0MDI3OX0.80NMxCPo88lUyKFazfGyJCgU-DiYoXRqhxmEGxihvC0';

console.log('🔵 1. supabaseClient.js chargé');
console.log('🔵 2. URL Supabase:', SUPABASE_URL);
console.log('🔵 3. Clé Supabase existe:', !!SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('🔵 4. supabase créé');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== FONCTIONS MULTI-MAGASINS ====================

// Récupérer la société actuellement sélectionnée
export const getCurrentCompany = () => {
  try {
    const stored = localStorage.getItem('currentCompany');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (e) {
    console.error('Erreur lecture société:', e);
    return null;
  }
};

// Sauvegarder la société sélectionnée
export const setCurrentCompany = (company) => {
  if (company) {
    localStorage.setItem('currentCompany', JSON.stringify(company));
  } else {
    localStorage.removeItem('currentCompany');
  }
};

// Récupérer toutes les sociétés actives
export const getCompanies = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    console.error('Erreur chargement sociétés:', error);
    return [];
  }
  return data || [];
};

// Récupérer les sociétés d'un utilisateur
export const getUserCompanies = async (userId) => {
  const { data, error } = await supabase
    .from('user_companies')
    .select(`
      company:companies(*),
      role
    `)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Erreur chargement sociétés utilisateur:', error);
    return [];
  }
  
  return data?.map(item => ({
    ...item.company,
    userRole: item.role
  })) || [];
};

// Vérifier l'accès d'un utilisateur à une société
export const checkUserCompanyAccess = async (userId, companyId) => {
  const { data, error } = await supabase
    .from('user_companies')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();
  
  return { hasAccess: !!data, error };
};

// ==================== FONCTIONS SÉCURISÉES AVEC COMPANY_ID ====================

// Ajouter company_id à une requête
export const withCompanyFilter = (query, companyId) => {
  if (!companyId) return query;
  return query.eq('company_id', companyId);
};

// Insertion sécurisée avec company_id
export const insertWithCompany = async (table, data, companyId) => {
  if (!companyId) {
    throw new Error('Company ID requis pour l\'insertion');
  }
  
  const { data: result, error } = await supabase
    .from(table)
    .insert({
      ...data,
      company_id: companyId,
      created_at: new Date().toISOString()
    })
    .select();
    
  if (error) throw error;
  return result?.[0] || null;
};

// Mise à jour sécurisée avec vérification company_id
export const updateWithCompany = async (table, id, data, companyId) => {
  if (!companyId) {
    throw new Error('Company ID requis pour la mise à jour');
  }
  
  const { data: result, error } = await supabase
    .from(table)
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select();
    
  if (error) throw error;
  return result?.[0] || null;
};

// Suppression sécurisée avec vérification company_id
export const deleteWithCompany = async (table, id, companyId) => {
  if (!companyId) {
    throw new Error('Company ID requis pour la suppression');
  }
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('company_id', companyId);
    
  if (error) throw error;
};