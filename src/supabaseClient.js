// supabaseClient.js — v4 : store mémoire pour company_id (fix multi-appareils)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://amdxzcgwmoodyxkasrqx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZHh6Y2d3bW9vZHl4a2FzcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQyNzksImV4cCI6MjA5Mzk0MDI3OX0.80NMxCPo88lUyKFazfGyJCgU-DiYoXRqhxmEGxihvC0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ht_gescom_auth',
  },
});

// ══════════════════════════════════════════════════════════════════
// STORE MÉMOIRE — source de vérité pour la société active
// Mis à jour par CompanyContext, lu par tous les services.
// NE PAS lire depuis localStorage directement dans les services.
// ══════════════════════════════════════════════════════════════════

let _currentCompany = null;

/**
 * Appelé par CompanyContext quand la société change.
 * Aussi sauvegardé en localStorage pour restauration au prochain démarrage.
 */
export const setCurrentCompany = (company) => {
  _currentCompany = company;
  try {
    if (company) localStorage.setItem('ht_gescom_company', JSON.stringify(company));
    else localStorage.removeItem('ht_gescom_company');
  } catch (_) {}
};

/**
 * Utilisé par les services pour obtenir la société active.
 * Retourne le store mémoire (mis à jour par React Context),
 * puis fallback localStorage pour le tout premier chargement.
 */
export const getCurrentCompany = () => {
  if (_currentCompany) return _currentCompany;
  // Fallback uniquement au premier démarrage avant que Context s'initialise
  try {
    const s = localStorage.getItem('ht_gescom_company');
    return s ? JSON.parse(s) : null;
  } catch (_) { return null; }
};

/**
 * Réinitialiser le store (déconnexion)
 */
export const clearCurrentCompany = () => {
  _currentCompany = null;
  try { localStorage.removeItem('ht_gescom_company'); } catch (_) {}
};

// ══════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════

export const insertWithCompany = async (table, data, companyId) => {
  if (!companyId) throw new Error('Company ID requis pour l\'insertion');
  const { data: result, error } = await supabase
    .from(table)
    .insert({ ...data, company_id: companyId, created_at: new Date().toISOString() })
    .select();
  if (error) throw error;
  return result?.[0] || null;
};

export const updateWithCompany = async (table, id, data, companyId) => {
  if (!companyId) throw new Error('Company ID requis pour la mise à jour');
  const { data: result, error } = await supabase
    .from(table)
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select();
  if (error) throw error;
  return result?.[0] || null;
};

export const deleteWithCompany = async (table, id, companyId) => {
  if (!companyId) throw new Error('Company ID requis pour la suppression');
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('company_id', companyId);
  if (error) throw error;
};
