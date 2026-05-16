// CompanyContext.jsx — v4 : source de vérité unique, fix logout + sync multi-appareils
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase, setCurrentCompany, clearCurrentCompany } from '../../../supabaseClient';

const CompanyContext = createContext();

// Re-export pour compatibilité
export { setCurrentCompany };
export const getCurrentCompany = () => {
  try { const s = localStorage.getItem('ht_gescom_company'); return s ? JSON.parse(s) : null; }
  catch (_) { return null; }
};

export function CompanyProvider({ children }) {
  const [currentCompany, setCurrentCompanyState] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const realtimeChannels = useRef([]);
  const isMounted = useRef(true);

  // ─── Charger les sociétés ──────────────────────────────────────────
  const fetchUserCompanies = async (userId) => {
    if (!userId) {
      _resetState();
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', userId);

      if (error) throw error;

      const list = data?.map(uc => uc.company).filter(Boolean) || [];

      if (!isMounted.current) return list;
      setCompanies(list);

      // Choisir la société active
      let active = null;
      try {
        const saved = JSON.parse(localStorage.getItem('ht_gescom_company') || 'null');
        active = saved && list.find(c => c.id === saved.id) ? saved : (list[0] || null);
      } catch (_) {
        active = list[0] || null;
      }

      // Mettre à jour le store mémoire ET le state React
      setCurrentCompany(active);
      setCurrentCompanyState(active);

      return list;
    } catch (err) {
      console.error('fetchUserCompanies:', err);
      if (isMounted.current) { setLoading(false); setInitialized(true); }
      return [];
    } finally {
      if (isMounted.current) { setLoading(false); setInitialized(true); }
    }
  };

  const _resetState = () => {
    clearCurrentCompany();
    if (!isMounted.current) return;
    setCompanies([]);
    setCurrentCompanyState(null);
    setLoading(false);
    setInitialized(true);
    // Nettoyer Realtime
    realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    realtimeChannels.current = [];
  };

  // ─── Realtime ──────────────────────────────────────────────────────
  const setupRealtime = (companyId) => {
    realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    realtimeChannels.current = [];
    if (!companyId) return;

    const tables = ['livraisons', 'agents', 'avances', 'recuperations', 'ventes', 'achats', 'produits', 'mouvements_stock'];
    tables.forEach(table => {
      const ch = supabase
        .channel(`realtime_${table}_${companyId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table,
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

  // ─── Auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted.current) return;
      const list = await fetchUserCompanies(session?.user?.id || null);
      if (isMounted.current && list.length > 0) {
        const saved = JSON.parse(localStorage.getItem('ht_gescom_company') || 'null');
        const active = (saved && list.find(c => c.id === saved.id)) || list[0];
        setupRealtime(active?.id);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;

      if (event === 'SIGNED_OUT' || !session) {
        _resetState();
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (isMounted.current) setLoading(true);
        const list = await fetchUserCompanies(session.user.id);
        if (isMounted.current && list.length > 0) {
          const saved = JSON.parse(localStorage.getItem('ht_gescom_company') || 'null');
          const active = (saved && list.find(c => c.id === saved.id)) || list[0];
          setupRealtime(active?.id);
        }
      }
    });

    return () => {
      isMounted.current = false;
      listener?.subscription?.unsubscribe?.();
      realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  // ─── Changer de société ────────────────────────────────────────────
  const switchCompany = (company) => {
    setCurrentCompany(company);   // store mémoire + localStorage
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
      currentCompany,
      companies,
      loading,
      initialized,
      switchCompany,
      refreshCompanies,
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
