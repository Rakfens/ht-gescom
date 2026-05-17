// CompanyContext.jsx — v5 : fix blocage démarrage + timeout sécurité
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase, setCurrentCompany, clearCurrentCompany } from '../../../supabaseClient';

const CompanyContext = createContext();

export { setCurrentCompany };
export const getCurrentCompany = () => {
  try {
    const s = localStorage.getItem('ht_gescom_company');
    return s ? JSON.parse(s) : null;
  } catch (_) { return null; }
};

export function CompanyProvider({ children }) {
  const [currentCompany, setCurrentCompanyState] = useState(null);
  const [companies, setCompanies]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [initialized, setInitialized] = useState(false);
  const realtimeChannels = useRef([]);
  const isMounted        = useRef(true);
  const fetchInProgress  = useRef(false); // ← empêche les doubles appels

  // ─── Reset état ───────────────────────────────────────────────────
  const _resetState = () => {
    clearCurrentCompany();
    if (!isMounted.current) return;
    setCompanies([]);
    setCurrentCompanyState(null);
    setLoading(false);
    setInitialized(true);
    realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    realtimeChannels.current = [];
  };

  // ─── Charger les sociétés ─────────────────────────────────────────
  const fetchUserCompanies = async (userId) => {
    if (!userId) { _resetState(); return []; }
    if (fetchInProgress.current) return []; // ← évite double appel
    fetchInProgress.current = true;

    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', userId);

      if (error) throw error;

      const list = data?.map(uc => uc.company).filter(Boolean) || [];
      if (!isMounted.current) return list;

      setCompanies(list);

      let active = null;
      try {
        const saved = JSON.parse(localStorage.getItem('ht_gescom_company') || 'null');
        active = saved && list.find(c => c.id === saved.id) ? saved : (list[0] || null);
      } catch (_) {
        active = list[0] || null;
      }

      setCurrentCompany(active);
      setCurrentCompanyState(active);
      if (active?.id) setupRealtime(active.id);
      return list;

    } catch (err) {
      console.error('fetchUserCompanies:', err);
      return [];
    } finally {
      fetchInProgress.current = false;
      if (isMounted.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  };

  // ─── Realtime ─────────────────────────────────────────────────────
  const setupRealtime = (companyId) => {
    realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    realtimeChannels.current = [];
    if (!companyId) return;

    const tables = ['livraisons', 'agents', 'avances', 'recuperations',
                    'ventes', 'achats', 'produits', 'mouvements_stock'];
    tables.forEach(table => {
      const ch = supabase
        .channel(`realtime_${table}_${companyId}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table,
          filter: `company_id=eq.${companyId}`,
        }, (payload) => {
          window.dispatchEvent(new CustomEvent('supabase_realtime', {
            detail: { table, event: payload.eventType, payload }
          }));
        })
        .subscribe();
      realtimeChannels.current.push(ch);
    });
  };

  // ─── Init au montage ──────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    // ← NOUVEAU : timeout de sécurité 10 secondes
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && loading) {
        console.warn('[CompanyContext] Timeout démarrage — forçage sortie loading');
        setLoading(false);
        setInitialized(true);
      }
    }, 10000);

    // ← NOUVEAU : on écoute onAuthStateChange UNIQUEMENT (plus de getSession séparé)
    // onAuthStateChange déclenche INITIAL_SESSION au premier appel — c'est notre init
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;

      if (event === 'SIGNED_OUT' || !session) {
        clearTimeout(safetyTimeout);
        _resetState();
        return;
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        clearTimeout(safetyTimeout);
        if (isMounted.current) setLoading(true);
        await fetchUserCompanies(session.user.id);
      }
    });

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      listener?.subscription?.unsubscribe?.();
      realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    };
  }, []); // eslint-disable-line

  // ─── Changer de société ───────────────────────────────────────────
  const switchCompany = (company) => {
    setCurrentCompany(company);
    setCurrentCompanyState(company);
    setupRealtime(company?.id);
    window.dispatchEvent(new CustomEvent('companyChanged', { detail: company }));
  };

  const refreshCompanies = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetchUserCompanies(session?.user?.id || null);
  };

  return (
    <CompanyContext.Provider value={{
      currentCompany, companies, loading,
      initialized, switchCompany, refreshCompanies,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
};