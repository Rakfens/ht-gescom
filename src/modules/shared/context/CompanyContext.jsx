// CompanyContext.jsx — v6 : zéro localStorage, directement Supabase, zéro race condition
import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { supabase, setCurrentCompany, clearCurrentCompany } from '../../../supabaseClient';

const CompanyContext = createContext();

// ── Exports de compatibilité ──────────────────────────────────────────
export { setCurrentCompany };
export const getCurrentCompany = () => {
  // Lecture depuis le store mémoire uniquement (pas localStorage)
  const { getCurrentCompany: get } = require('../../../supabaseClient');
  return get?.() ?? null;
};

export function CompanyProvider({ children }) {
  const [currentCompany, _setCurrentCompany] = useState(null);
  const [companies,       setCompanies]       = useState([]);
  const [loading,         setLoading]         = useState(false);
  const rtChannels = useRef([]);
  const mounted    = useRef(true);

  // ── Charger les sociétés depuis Supabase (jamais localStorage) ────────
  const loadCompanies = useCallback(async (userId) => {
    if (!userId || !mounted.current) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', userId);

      if (!mounted.current) return;
      if (error) throw error;

      const list = (data || []).map(r => r.company).filter(Boolean);
      setCompanies(list);

      // Choisir la première société par défaut
      const first = list[0] ?? null;
      setCurrentCompany(first);
      _setCurrentCompany(first);

      if (first) setupRealtime(first.id);
    } catch (_) {
      // Erreur réseau → laisser companies vide, ne pas bloquer
      if (mounted.current) { setCompanies([]); _setCurrentCompany(null); }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  // ── Realtime ──────────────────────────────────────────────────────────
  const setupRealtime = (companyId) => {
    rtChannels.current.forEach(ch => { try { supabase.removeChannel(ch); } catch (_) {} });
    rtChannels.current = [];
    if (!companyId) return;

    ['livraisons','agents','avances','recuperations','ventes','achats','produits'].forEach(table => {
      try {
        const ch = supabase
          .channel(`rt_${table}_${companyId}`)
          .on('postgres_changes',
            { event: '*', schema: 'public', table, filter: `company_id=eq.${companyId}` },
            payload => window.dispatchEvent(new CustomEvent('supabase_realtime', { detail: { table, payload } }))
          ).subscribe();
        rtChannels.current.push(ch);
      } catch (_) {}
    });
  };

  // ── Écouter les changements d'auth ────────────────────────────────────
  useEffect(() => {
    mounted.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted.current) return;

      if (!session || event === 'SIGNED_OUT') {
        // Déconnexion → tout nettoyer
        clearCurrentCompany();
        setCompanies([]);
        _setCurrentCompany(null);
        setLoading(false);
        rtChannels.current.forEach(ch => { try { supabase.removeChannel(ch); } catch (_) {} });
        rtChannels.current = [];
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        loadCompanies(session.user.id);
      }
      // TOKEN_REFRESHED → ne rien faire (session déjà chargée)
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
      rtChannels.current.forEach(ch => { try { supabase.removeChannel(ch); } catch (_) {} });
    };
  }, [loadCompanies]);

  // ── Changer de société ────────────────────────────────────────────────
  const switchCompany = useCallback((company) => {
    setCurrentCompany(company);
    _setCurrentCompany(company);
    setupRealtime(company?.id);
  }, []);

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, loading, switchCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany doit être dans CompanyProvider');
  return ctx;
};
