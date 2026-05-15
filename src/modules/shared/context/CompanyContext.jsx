// CompanyContext.jsx - VERSION OPTIMISÉE
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../../../supabaseClient';

const CompanyContext = createContext();

const STORAGE_KEY = 'ht_gescom_company';

function saveCompany(company) {
  try {
    if (company) localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}

function loadSavedCompany() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch (_) { return null; }
}

export function CompanyProvider({ children }) {
  const [currentCompany, setCurrentCompanyState] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUserCompanies = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setCompanies([]);
        setCurrentCompanyState(null);
        return;
      }

      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const list = data?.map(uc => uc.company).filter(Boolean) || [];
      setCompanies(list);

      const saved = loadSavedCompany();
      if (saved && list.find(c => c.id === saved.id)) {
        setCurrentCompanyState(saved);
      } else if (list.length >= 1) {
        setCurrentCompanyState(list[0]);
        saveCompany(list[0]);
      }
    } catch (err) {
      console.error('CompanyContext error:', err);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    // Écouter les changements d'auth pour recharger les companies
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserCompanies();
      } else {
        setCompanies([]);
        setCurrentCompanyState(null);
        saveCompany(null);
        setLoading(false);
        setInitialized(true);
      }
    });

    // Chargement initial
    fetchUserCompanies();

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  const switchCompany = (company) => {
    setCurrentCompanyState(company);
    saveCompany(company);
    window.dispatchEvent(new CustomEvent('companyChanged', { detail: company }));
  };

  return (
    <CompanyContext.Provider value={{
      currentCompany,
      companies,
      loading,
      initialized,
      switchCompany,
      refreshCompanies: fetchUserCompanies,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within CompanyProvider');
  return context;
};

// Compat exports
export const setCurrentCompany = saveCompany;
export const getCurrentCompany = loadSavedCompany;
