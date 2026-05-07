import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lgldokwphyuyonighuzv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbGRva3dwaHl1eW9uaWdodXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODgxMzgsImV4cCI6MjA5MzU2NDEzOH0.KoR6-g1sMlYy5cOFq6TbXLfR_QtZhZCOtzCcQRDnDZ8';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
