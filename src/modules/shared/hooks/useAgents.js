// useAgents.js — v2 : fix loading infini + setLoading(true) au rechargement
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAgents, addAgent, updateAgent, deleteAgent } from '../../livraison/services/agentService';
import { useCompany } from '../context/CompanyContext';

export const useAgents = () => {
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const { currentCompany, initialized } = useCompany();
  const lastCompanyId = useRef(null);

  const loadAgents = useCallback(async (companyId) => {
    if (!companyId) {
      setAgents([]);
      setLoading(false);
      return;
    }
    // ← AJOUT : setLoading(true) à chaque rechargement
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAgents();
      setAgents(data);
    } catch (err) {
      console.error('useAgents:', err);
      setError(err.message);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []); // ← pas de dépendance, on passe companyId en paramètre

  useEffect(() => {
    // ← CORRIGÉ : attendre que CompanyContext soit initialisé
    if (!initialized) return;

    const id = currentCompany?.id || null;

    // ← évite de recharger si même société
    if (id === lastCompanyId.current) return;
    lastCompanyId.current = id;

    loadAgents(id);
  }, [currentCompany?.id, initialized, loadAgents]);

  // Realtime
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.table === 'agents' && currentCompany?.id) {
        loadAgents(currentCompany.id);
      }
    };
    window.addEventListener('supabase_realtime', handler);
    return () => window.removeEventListener('supabase_realtime', handler);
  }, [currentCompany?.id, loadAgents]);

  const handleAddAgent = async (nom, salaire) => {
    try {
      setError(null);
      const newAgent = await addAgent(nom, salaire);
      setAgents(prev => [...prev, newAgent]);
      return newAgent;
    } catch (err) { setError(err.message); throw err; }
  };

  const handleUpdateAgent = async (id, updates) => {
    try {
      setError(null);
      await updateAgent(id, updates);
      setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (err) { setError(err.message); throw err; }
  };

  const handleDeleteAgent = async (id) => {
    try {
      setError(null);
      await deleteAgent(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (err) { setError(err.message); throw err; }
  };

  return {
    agents, loading, error,
    addAgent: handleAddAgent,
    updateAgent: handleUpdateAgent,
    deleteAgent: handleDeleteAgent,
    reloadAgents: () => loadAgents(currentCompany?.id),
  };
};