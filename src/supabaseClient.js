// supabaseClient.js — v5 : fix Cloudflare __cf_bm + WebSocket bloqué
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://amdxzcgwmoodyxkasrqx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZHh6Y2d3bW9vZHl4a2FzcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQyNzksImV4cCI6MjA5Mzk0MDI3OX0.80NMxCPo88lUyKFazfGyJCgU-DiYoXRqhxmEGxihvC0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // ── CORRIGÉ : fix cookie __cf_bm Cloudflare + WebSocket bloqué ──
  realtime: {
    params: { eventsPerSecond: 10 },
    transport: typeof WebSocket !== 'undefined'
      ? WebSocket          // WebSocket natif si disponible
      : undefined,
    timeout: 30000,        // 30s timeout (défaut 10s trop court sur réseau Madagascar)
    heartbeatIntervalMs: 15000,   // ping toutes les 15s pour garder la connexion
    reconnectAfterMs: (tries) => {  // backoff exponentiel : 1s, 2s, 4s, 8s, max 30s
      return Math.min(1000 * Math.pow(2, tries), 30000);
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ht_gescom_auth',
  },
  // ── AJOUT : timeout global sur les requêtes fetch ────────────────
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000); // 20s max
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
    },
  },
});

// ══════════════════════════════════════════════════════════════════
// STORE MÉMOIRE — source de vérité pour la société active
// ══════════════════════════════════════════════════════════════════
let _currentCompany = null;

export const setCurrentCompany = (company) => {
  _currentCompany = company;
  try {
    if (company) localStorage.setItem('ht_gescom_company', JSON.stringify(company));
    else localStorage.removeItem('ht_gescom_company');
  } catch (_) {}
};

export const getCurrentCompany = () => {
  if (_currentCompany) return _currentCompany;
  try {
    const s = localStorage.getItem('ht_gescom_company');
    return s ? JSON.parse(s) : null;
  } catch (_) { return null; }
};

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