// modules/shared/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { supabase, setCurrentCompany, getCurrentCompany } from '../../../supabaseClient';

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [companies, setCompanies] = useState([]);      // NOUVEAU
  const [currentCompany, setCurrentCompanyState] = useState(null); // NOUVEAU

  // Récupérer les sociétés de l'utilisateur
  const fetchUserCompanies = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', userId);

      if (error) throw error;
      
      const userCompanies = data?.map(uc => uc.company) || [];
      setCompanies(userCompanies);
      
      // Vérifier s'il y a une société stockée dans localStorage
      const storedCompany = getCurrentCompany();
      
      // Si une société est stockée et que l'utilisateur y a accès
      if (storedCompany && userCompanies.some(c => c.id === storedCompany.id)) {
        setCurrentCompanyState(storedCompany);
      } 
      // Sinon, si une seule société, la sélectionner automatiquement
      else if (userCompanies.length === 1) {
        setCurrentCompanyState(userCompanies[0]);
        setCurrentCompany(userCompanies[0]);
      }
      // Sinon, pas de société sélectionnée (l'utilisateur devra choisir)
      else {
        setCurrentCompanyState(null);
      }
      
      return userCompanies;
    } catch (error) {
      console.error('Erreur chargement sociétés:', error);
      return [];
    }
  };

  // Changer de société
  const switchCompany = (company) => {
    setCurrentCompanyState(company);
    setCurrentCompany(company);
    // Optionnel: recharger la page ou déclencher un événement
    window.dispatchEvent(new CustomEvent('companyChanged', { detail: company }));
  };

  useEffect(() => {
    // Vérifier la session existante
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchUserCompanies(session.user.id);
      }
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserCompanies(session.user.id);
      } else {
        setCompanies([]);
        setCurrentCompanyState(null);
        setCurrentCompany(null);
      }
      setLoading(false);
    });

    return () => {
      if (listener && typeof listener.unsubscribe === 'function') {
        listener.unsubscribe();
      }
    };
  }, []);

  // Connexion avec support de la société
  const login = async (email, password, companyId = null) => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        throw error;
      }
      
      setSession(data.session);
      
      // Récupérer les sociétés de l'utilisateur
      if (data.session?.user) {
        const userCompanies = await fetchUserCompanies(data.session.user.id);
        
        // Si une société est spécifiée, la sélectionner
        if (companyId && userCompanies.some(c => c.id === companyId)) {
          const selectedCompany = userCompanies.find(c => c.id === companyId);
          switchCompany(selectedCompany);
        }
        // Sinon, si une seule société, elle est déjà sélectionnée par fetchUserCompanies
      }
      
      return data;
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setCompanies([]);
      setCurrentCompanyState(null);
      setCurrentCompany(null);
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  return { 
    session, 
    loading, 
    login, 
    logout, 
    authError,
    companies,           // NOUVEAU: liste des sociétés accessibles
    currentCompany,      // NOUVEAU: société actuellement sélectionnée
    switchCompany,       // NOUVEAU: fonction pour changer de société
    isAuthenticated: !!session,
    hasMultipleCompanies: companies.length > 1
  };
};