// src/modules/shared/context/CompanyContext.jsx (version simplifiée)
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../../../supabaseClient';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer toutes les sociétés (sans filtre utilisateur pour test)
        const { data: allCompanies, error } = await supabase
          .from('companies')
          .select('*')
          .eq('is_active', true);
        
        console.log('Sociétés chargées:', allCompanies);
        
        if (error) throw error;
        
        setCompanies(allCompanies || []);
        if (allCompanies && allCompanies.length > 0) {
          setCurrentCompany(allCompanies[0]);
        }
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, loading, setCurrentCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within a CompanyProvider');
  return context;
};