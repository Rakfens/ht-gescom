// useAuth.js — v3 : fix logout + session listener propre
import { useState, useEffect } from 'react';
import { supabase, clearCurrentCompany } from '../../../supabaseClient';

export const useAuth = () => {
  const [session, setSession] = useState(undefined); // undefined = pas encore vérifié
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // 1. Lire la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Écouter les changements (connexion / déconnexion / refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => { listener?.subscription?.unsubscribe?.(); };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError(error.message); throw error; }
    return data;
  };

  const logout = async () => {
    try {
      // 1. Nettoyer le store local AVANT signOut pour éviter les race conditions
      clearCurrentCompany();
      // 2. Déconnexion Supabase
      await supabase.auth.signOut();
      // 3. Forcer le state (onAuthStateChange le fera aussi, mais par sécurité)
      setSession(null);
    } catch (err) {
      console.error('logout error:', err);
      // Forcer quand même la déconnexion visuelle
      setSession(null);
    }
  };

  return {
    session: session === undefined ? null : session, // évite undefined pendant init
    loading: loading || session === undefined,
    login,
    logout,
    authError,
    isAuthenticated: !!session,
  };
};
