// CompanyContext.jsx — v5 : timeout anti-blocage + fix réouverture
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase, setCurrentCompany, clearCurrentCompany } from '../../../supabaseClient';

const CompanyContext = createContext();
const COMPANY_TIMEOUT_MS = 8000; // 8s max pour charger les sociétés

export { setCurrentCompany };
export const getCurrentCompany = () => {
  try { const s = localStorage.getItem('ht_gescom_company'); return s ? JSON.parse(s) : null; }
  catch (_) { return null; }
};

export function CompanyProvider({ children }) {
  const [currentCompany, setCurrentCompanyState] = useState(null);
  const [companies,      setCompanies]            = useState([]);
  const [loading,        setLoading]              = useState(true);
  const [initialized,    setInitialized]          = useState(false);
  const realtimeChannels = useRef([]);
  const isMounted        = useRef(true);
  const timeoutRef       = useRef(null);
  const fetchingRef      = useRef(false); // évite les doubles appels

  // ─── Terminer le chargement (avec ou sans résultat) ───────────────
  const finishLoading = () => {
    if (!isMounted.current) return;
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setLoading(false);
    setInitialized(true);
    fetchingRef.current = false;
  };

  // ─── Charger les sociétés ──────────────────────────────────────────
  const fetchUserCompanies = async (userId) => {
    if (!userId) { _resetState(); return []; }
    if (fetchingRef.current) return []; // déjà en cours
    fetchingRef.current = true;

    // Timeout de sécurité
    timeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      // Timeout → utiliser le localStorage comme fallback
      const saved = getCurrentCompany();
      if (saved) {
        setCurrentCompany(saved);
        setCurrentCompanyState(saved);
        setCompanies([saved]);
      }
      finishLoading();
    }, COMPANY_TIMEOUT_MS);

    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', userId);

      if (error) throw error;

      const list = data?.map(uc => uc.company).filter(Boolean) || [];

      if (!isMounted.current) return list;
      setCompanies(list);

      // Choisir la société active : priorité au localStorage (dernière utilisée)
      let active = null;
      try {
        const saved = JSON.parse(localStorage.getItem('ht_gescom_company') || 'null');
        active = (saved && list.find(c => c.id === saved.id)) ? saved : (list[0] || null);
      } catch (_) { active = list[0] || null; }

      setCurrentCompany(active);
      setCurrentCompanyState(active);
      setupRealtime(active?.id);

      return list;
    } catch (err) {
      // Fallback localStorage en cas d'erreur réseau
      const saved = getCurrentCompany();
      if (saved && isMounted.current) {
        setCurrentCompany(saved);
        setCurrentCompanyState(saved);
        setCompanies([saved]);
      }
      return [];
    } finally {
      finishLoading();
    }
  };

  const _resetState = () => {
    clearCurrentCompany();
    if (!isMounted.current) return;
    setCompanies([]);
    setCurrentCompanyState(null);
    realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    realtimeChannels.current = [];
    finishLoading();
  };

  // ─── Realtime ──────────────────────────────────────────────────────
  const setupRealtime = (companyId) => {
    realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    realtimeChannels.current = [];
    if (!companyId) return;

    const tables = ['livraisons', 'agents', 'avances', 'recuperations', 'ventes', 'achats', 'produits'];
    tables.forEach(table => {
      try {
        const ch = supabase
          .channel(`rt_${table}_${companyId}_${Date.now()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table, filter: `company_id=eq.${companyId}` },
            (payload) => window.dispatchEvent(new CustomEvent('supabase_realtime', { detail: { table, event: payload.eventType, payload } }))
          ).subscribe();
        realtimeChannels.current.push(ch);
      } catch (_) {}
    });
  };

  // ─── Auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      // Lecture de la session SANS attendre le refresh token
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted.current) return;
      if (session?.user?.id) {
        await fetchUserCompanies(session.user.id);
      } else {
        _resetState();
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;

      if (event === 'SIGNED_OUT' || !session) {
        _resetState();
        return;
      }

      // TOKEN_REFRESHED → pas besoin de recharger les companies
      if (event === 'TOKEN_REFRESHED') return;

      if (event === 'SIGNED_IN') {
        if (isMounted.current) setLoading(true);
        await fetchUserCompanies(session.user.id);
      }
    });

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      listener?.subscription?.unsubscribe?.();
      realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  const switchCompany = (company) => {
    setCurrentCompany(company);
    setCurrentCompanyState(company);
    setupRealtime(company?.id);
    window.dispatchEvent(new CustomEvent('companyChanged', { detail: company }));
  };

  const refreshCompanies = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) await fetchUserCompanies(session.user.id);
  };

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, loading, initialized, switchCompany, refreshCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
};
