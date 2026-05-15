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
      console.log('🔍 1. Début fetchUserCompanies');
      
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔍 2. Utilisateur:', user?.email);
      console.log('🔍 3. Erreur user:', userError);
      
      if (!user) {
        console.log('🔍 4. Pas d\'utilisateur - fin');
        setCompanies([]);
        setCurrentCompany(null);
        setLoading(false);
        return;
      }

      // Test 1: Toutes les sociétés
      console.log('🔍 5. Test requête companies - sans filtre');
      const { data: allCompanies, error: companiesError } = await supabase
        .from('companies')
        .select('*');
      
      console.log('🔍 6. Toutes les sociétés:', allCompanies);
      console.log('🔍 7. Erreur companies:', companiesError);
      
      // Test 2: user_companies
      console.log('🔍 8. Requête user_companies pour user_id:', user.id);
      const { data: userCompaniesData, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('🔍 9. user_companies data:', userCompaniesData);
      console.log('🔍 10. user_companies error:', userCompaniesError);
      
      let userCompanies = [];
      
      // Si l'utilisateur a des sociétés liées
      if (userCompaniesData && userCompaniesData.length > 0) {
        const companyIds = userCompaniesData.map(uc => uc.company_id);
        console.log('🔍 11. companyIds:', companyIds);
        
        const { data: companiesData, error: companiesDataError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);
        
        console.log('🔍 12. Sociétés liées:', companiesData);
        console.log('🔍 13. Erreur sociétés liées:', companiesDataError);
        
        userCompanies = companiesData || [];
      } else {
        // Fallback: prendre toutes les sociétés actives
        console.log('🔍 14. Fallback: toutes les sociétés actives');
        const { data: activeCompanies, error: activeError } = await supabase
          .from('companies')
          .select('*')
          .eq('is_active', true);
        
        console.log('🔍 15. Sociétés actives:', activeCompanies);
        userCompanies = activeCompanies || [];
      }
      
      console.log('🔍 16. Sociétés finales:', userCompanies);
      setCompanies(userCompanies);
      
      // Sélectionner une société
      if (userCompanies.length > 0) {
        const stored = getCurrentCompany();
        console.log('🔍 17. Société stockée:', stored);
        
        if (stored && userCompanies.find(c => c.id === stored.id)) {
          console.log('🔍 18. Utilisation société stockée:', stored.name);
          setCurrentCompany(stored);
        } else {
          console.log('🔍 19. Utilisation première société:', userCompanies[0].name);
          setCurrentCompany(userCompanies[0]);
          setCompanyStorage(userCompanies[0]);
        }
      } else {
        console.log('🔍 20. AUCUNE SOCIÉTÉ TROUVÉE !');
      }
    } catch (error) {
      console.error('🔍 21. Erreur catch générale:', error);
    } finally {
      setLoading(false);
      console.log('🔍 22. Loading terminé, loading =', false);
    }
  }

  const switchCompany = (company) => {
    console.log('🔍 Switch company:', company);
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