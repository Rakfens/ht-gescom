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
      console.log('🔍 1. fetchUserCompanies - Début');
      
      // Récupérer la session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 2. Session:', session?.user?.email);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 3. Utilisateur:', user?.email);
      
      if (!user) {
        console.log('🔍 4. Aucun utilisateur connecté');
        setCompanies([]);
        setCurrentCompany(null);
        setLoading(false);
        return;
      }

      // Récupérer les sociétés de l'utilisateur
      console.log('🔍 5. Requête user_companies pour user_id:', user.id);
      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', user.id);

      if (error) {
        console.error('🔍 6. Erreur:', error);
        throw error;
      }

      console.log('🔍 7. Résultat user_companies:', data);
      
      const userCompanies = data?.map(uc => uc.company) || [];
      console.log('🔍 8. Sociétés trouvées:', userCompanies.length);
      console.log('🔍 9. Détails sociétés:', userCompanies);
      
      setCompanies(userCompanies);
      
      if (userCompanies.length > 0) {
        const stored = getCurrentCompany();
        if (stored && userCompanies.find(c => c.id === stored.id)) {
          console.log('🔍 10. Société stockée trouvée:', stored.name);
          setCurrentCompany(stored);
        } else {
          console.log('🔍 11. Première société sélectionnée:', userCompanies[0].name);
          setCurrentCompany(userCompanies[0]);
          setCompanyStorage(userCompanies[0]);
        }
      } else {
        console.log('🔍 12. Aucune société trouvée pour cet utilisateur');
      }
    } catch (error) {
      console.error('🔍 13. Erreur catch:', error);
    } finally {
      setLoading(false);
      console.log('🔍 14. Loading terminé');
    }
  }

  const switchCompany = (company) => {
    setCurrentCompany(company);
    setCompanyStorage(company);
    window.location.reload();
  };

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, loading, switchCompany }}>
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