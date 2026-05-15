// modules/shared/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [companies, setCompanies] = useState([]); // ← AJOUTÉ

  // Charger les sociétés de l'utilisateur
  const fetchUserCompanies = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select('company:companies(*)')
        .eq('user_id', userId);

      if (error) throw error;
      const userCompanies = data?.map(uc => uc.company) || [];
      setCompanies(userCompanies);
      return userCompanies;
    } catch (error) {
      console.error('Erreur chargement sociétés:', error);
      return [];
    }
  };

  useEffect(() => {
    // Récupérer la session existante
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchUserCompanies(session.user.id);
      }
      setLoading(false);
    });

    // Écouter les changements d'auth
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserCompanies(session.user.id);
      } else {
        setCompanies([]);
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const login = async (email, password, companyId = null) => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Après connexion, charger les sociétés
      if (data.user) {
        const userCompanies = await fetchUserCompanies(data.user.id);
        
        // Si une société est spécifiée, la sauvegarder
        if (companyId && userCompanies.find(c => c.id === companyId)) {
          const selectedCompany = userCompanies.find(c => c.id === companyId);
          localStorage.setItem('currentCompany', JSON.stringify(selectedCompany));
        } else if (userCompanies.length === 1) {
          localStorage.setItem('currentCompany', JSON.stringify(userCompanies[0]));
        }
      }
      
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setCompanies([]);
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
    companies,           // ← AJOUTÉ
    isAuthenticated: !!session,
    hasMultipleCompanies: companies.length > 1
  };
};