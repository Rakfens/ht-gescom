// src/modules/shared/context/CompanyContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, setCurrentCompany as setCompanyStorage, getCurrentCompany } from '../../../supabaseClient';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchUserCompanies();
  }, []);

  async function fetchUserCompanies() {
    setLoading(true);
    try {
      console.log('🔍 CompanyContext - Début chargement');
      
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Erreur utilisateur:', userError);
      }
      
      if (!user) {
        console.log('👤 Aucun utilisateur connecté');
        setCompanies([]);
        setCurrentCompany(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      console.log('👤 Utilisateur connecté:', user.email);

      // Récupérer les sociétés de l'utilisateur
      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erreur chargement sociétés:', error);
        throw error;
      }

      const userCompanies = data?.map(uc => uc.company) || [];
      console.log('🏢 Sociétés trouvées:', userCompanies.length);
      console.log('📋 Détails sociétés:', userCompanies.map(c => c.name));
      
      setCompanies(userCompanies);
      
      // Vérifier le localStorage pour une société stockée
      const stored = getCurrentCompany();
      console.log('💾 Société stockée localStorage:', stored?.name);
      
      if (stored && userCompanies.find(c => c.id === stored.id)) {
        console.log('✅ Utilisation société stockée:', stored.name);
        setCurrentCompany(stored);
      } 
      else if (userCompanies.length === 1) {
        // Une seule société : sélection automatique
        console.log('✅ Une seule société, sélection automatique:', userCompanies[0].name);
        setCurrentCompany(userCompanies[0]);
        setCompanyStorage(userCompanies[0]);
      } 
      else if (userCompanies.length > 1) {
        // Plusieurs sociétés : prendre la première par défaut
        console.log('✅ Plusieurs sociétés, prise de la première:', userCompanies[0].name);
        setCurrentCompany(userCompanies[0]);
        setCompanyStorage(userCompanies[0]);
      }
      else {
        console.log('⚠️ Aucune société trouvée pour cet utilisateur');
      }
    } catch (error) {
      console.error('❌ Erreur catch générale:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
      console.log('🏁 CompanyContext - Chargement terminé');
    }
  }

  const switchCompany = (company) => {
    console.log('🔄 Switch company vers:', company.name);
    setCurrentCompany(company);
    setCompanyStorage(company);
    // Déclencher un événement pour notifier le changement
    window.dispatchEvent(new CustomEvent('companyChanged', { detail: company }));
  };

  const refreshCompanies = async () => {
    console.log('🔄 Rafraîchissement des sociétés');
    await fetchUserCompanies();
  };

  return (
    <CompanyContext.Provider value={{ 
      currentCompany, 
      companies, 
      loading, 
      initialized,
      switchCompany,
      refreshCompanies
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