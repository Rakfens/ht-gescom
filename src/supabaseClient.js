// supabaseClient.js — v5 : propre, zéro complexité inutile
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://amdxzcgwmoodyxkasrqx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZHh6Y2d3bW9vZHl4a2FzcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQyNzksImV4cCI6MjA5Mzk0MDI3OX0.80NMxCPo88lUyKFazfGyJCgU-DiYoXRqhxmEGxihvC0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: false,   // évite le cookie __cf_bm (erreur Cloudflare)
    storageKey:        'ht_gescom_auth',
    storage:           window.localStorage,
  },
  realtime: {
    params: { eventsPerSecond: 5 },
  },
});

// ── Store mémoire (lu par tous les services) ──────────────────────────
let _company = null;
export const setCurrentCompany  = (c) => { _company = c; };
export const getCurrentCompany  = ()  => _company;
export const clearCurrentCompany = () => { _company = null; };
