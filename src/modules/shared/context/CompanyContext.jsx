// CompanyContext.jsx — v6 : fix "Chargement des données..." bloqué
// Compatible tous appareils (iPad, Android, PC)
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
  const [companies, setCompanies]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [initialized, setInitialized] = useState(false);
  const realtimeChannels = useRef([]);
  const isMounted        = useRef(true);
  const fetchInProgress  = useRef(false);
  const lastUserId       = useRef(null); // ← anti-doublon par userId

  // ─── Reset ────────────────────────────────────────────────────────
  const _resetState = () => {
    clearCurrentCompany();
    lastUserId.current = null;
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

    // Évite les doubles appels pour le même utilisateur
    if (fetchInProgress.current) return [];
    if (lastUserId.current === userId && initialized) return [];

    fetchInProgress.current = true;
    lastUserId.current = userId;

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
      console.error('[CompanyContext] fetchUserCompanies:', err);
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

  // ─── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    // Timeout de sécurité : 12s max, tous appareils confondus
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && loading) {
        console.warn('[CompanyContext] Timeout — forçage sortie loading');
        setLoading(false);
        setInitialized(true);
      }
    }, 12000);

    // ── ÉTAPE 1 : getSession() pour les appareils qui ne reçoivent
    //             pas INITIAL_SESSION (iPad Safari, certains Android)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted.current) return;
      if (session?.user?.id) {
        fetchUserCompanies(session.user.id).then(() => {
          clearTimeout(safetyTimeout);
        });
      } else {
        // Pas de session → sortir du loading immédiatement
        clearTimeout(safetyTimeout);
        _resetState();
      }
    }).catch(() => {
      // getSession() échoue → on laisse onAuthStateChange prendre le relais
      console.warn('[CompanyContext] getSession() échoué, attente onAuthStateChange...');
    });

    // ── ÉTAPE 2 : onAuthStateChange pour les changements en cours de vie
    //             (login, logout, refresh token)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;

      if (event === 'SIGNED_OUT' || !session) {
        clearTimeout(safetyTimeout);
        _resetState();
        return;
      }

      // SIGNED_IN = nouvel appareil ou nouvelle connexion
      // TOKEN_REFRESHED = token expiré et renouvelé
      // On NE traite PAS INITIAL_SESSION ici pour éviter le doublon avec getSession()
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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
    lastUserId.current = null; // force le rechargement
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