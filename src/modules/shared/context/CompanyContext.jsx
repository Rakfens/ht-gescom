// src/modules/shared/context/CompanyContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../../../supabaseClient';

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
        return;
      }

      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const userCompanies = data?.map(uc => uc.company) || [];
      setCompanies(userCompanies);
      
      // Récupérer la société stockée
      const stored = localStorage.getItem('currentCompany');
      if (stored && userCompanies.find(c => c.id === JSON.parse(stored).id)) {
        setCurrentCompany(JSON.parse(stored));
      } else if (userCompanies.length > 0) {
        setCurrentCompany(userCompanies[0]);
        localStorage.setItem('currentCompany', JSON.stringify(userCompanies[0]));
      }
    } catch (error) {
      console.error('Erreur chargement sociétés:', error);
    } finally {
      setLoading(false);
    }
  }

  const switchCompany = (company) => {
    setCurrentCompany(company);
    localStorage.setItem('currentCompany', JSON.stringify(company));
    window.location.reload();
  };

  return (
    <CompanyContext.Provider value={{ 
      currentCompany, 
      companies, 
      loading, 
      switchCompany,
      setCurrentCompany  // ← EXPOSER cette fonction
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};