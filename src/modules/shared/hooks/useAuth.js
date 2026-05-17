// useAuth.js — v4 : fix blocage démarrage + timeout + un seul point d'init
import { useState, useEffect } from 'react';
import { supabase, clearCurrentCompany } from '../../../supabaseClient';

export const useAuth = () => {
  const [session, setSession] = useState(undefined); // undefined = pas encore vérifié
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let ignore = false;

    // ── Timeout de sécurité : 10s max pour vérifier la session ──────
    // Si Supabase ne répond pas (réseau coupé, token corrompu),
    // on sort du loading au lieu de rester bloqué indéfiniment
    const safetyTimeout = setTimeout(() => {
      if (!ignore) {
        console.warn('[useAuth] Timeout session — forçage sortie loading');
        setSession(null);
        setLoading(false);
      }
    }, 10000);

    // ── CORRIGÉ : onAuthStateChange UNIQUEMENT comme point d'init ───
    // Il émet INITIAL_SESSION au premier appel — remplace getSession()
    // Évite le double appel qui causait des race conditions
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (ignore) return;

      if (event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN'       ||
          event === 'SIGNED_OUT'      ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED') {
        clearTimeout(safetyTimeout); // ← annuler le timeout si réponse reçue
        setSession(session ?? null);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
      clearTimeout(safetyTimeout);
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError(error.message); throw error; }
    return data;
  };

  const logout = async () => {
    try {
      clearCurrentCompany();
      await supabase.auth.signOut();
      setSession(null);
    } catch (err) {
      console.error('logout error:', err);
      setSession(null);
    }
  };

  return {
    session: session === undefined ? null : session,
    loading: loading || session === undefined,
    login,
    logout,
    authError,
    isAuthenticated: !!session,
  };
};