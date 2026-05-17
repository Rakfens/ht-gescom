// useAuth.js — v4 : timeout anti-blocage + fix session expirée
import { useState, useEffect, useRef } from 'react';
import { supabase, clearCurrentCompany } from '../../../supabaseClient';

const AUTH_TIMEOUT_MS = 6000; // 6s max pour résoudre l'auth

export const useAuth = () => {
  const [session, setSession]     = useState(undefined);
  const [loading, setLoading]     = useState(true);
  const [authError, setAuthError] = useState(null);
  const timeoutRef = useRef(null);

  const finishLoading = (sess) => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setSession(sess ?? null);
    setLoading(false);
  };

  useEffect(() => {
    // ── Timeout de sécurité : si Supabase ne répond pas en 6s → on débloque ──
    timeoutRef.current = setTimeout(() => {
      // Session toujours undefined = Supabase bloqué → forcer null (Login)
      setSession(prev => prev === undefined ? null : prev);
      setLoading(false);
    }, AUTH_TIMEOUT_MS);

    // ── Lire la session existante ──────────────────────────────────────
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) { finishLoading(null); return; }
      finishLoading(session);
    }).catch(() => finishLoading(null));

    // ── Écouter les changements (refresh token, signOut, etc.) ──────────
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED peut arriver après le timeout → mettre à jour quand même
      setSession(session ?? null);
      setLoading(false);
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
    } catch (_) {}
    // Forcer dans tous les cas
    setSession(null);
    setLoading(false);
  };

  return {
    session:         session === undefined ? null : session,
    loading:         loading || session === undefined,
    login,
    logout,
    authError,
    isAuthenticated: !!session,
  };
};
