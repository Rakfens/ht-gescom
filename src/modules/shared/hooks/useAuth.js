// modules/shared/hooks/useAuth.js - VERSION OPTIMISÉE (sans double fetch companies)
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Récupérer la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Écouter les changements d'auth
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setAuthError(error.message); throw error; }
      return data;
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
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
    isAuthenticated: !!session,
  };
};
