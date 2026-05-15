// src/modules/shared/context/CompanyContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, setCurrentCompany as setCompanyStorage, getCurrentCompany } from '../../../supabaseClient';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCompanies();
  }, []);

  async function fetchUserCompanies() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCompanies([]);
        setCurrentCompany(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const userCompanies = data?.map(uc => uc.company) || [];
      setCompanies(userCompanies);
      
      const stored = getCurrentCompany();
      if (stored && userCompanies.find(c => c.id === stored.id)) {
        setCurrentCompany(stored);
      } else if (userCompanies.length > 0) {
        setCurrentCompany(userCompanies[0]);
        setCompanyStorage(userCompanies[0]);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  const switchCompany = (company) => {
    // Sauvegarder la société
    setCurrentCompany(company);
    setCompanyStorage(company);
    // Ne pas recharger la page, juste mettre à jour l'état
    window.dispatchEvent(new CustomEvent('companyChanged', { detail: company }));
  };

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, loading, switchCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within a CompanyProvider');
  return context;
};