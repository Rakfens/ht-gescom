// useAgents.js — avec Realtime sync
import { useState, useEffect, useCallback } from 'react';
import { fetchAgents, addAgent, updateAgent, deleteAgent } from '../../livraison/services/agentService';
import { useCompany } from '../context/CompanyContext';

export const useAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentCompany } = useCompany();

  const loadAgents = useCallback(async () => {
    if (!currentCompany?.id) { setAgents([]); setLoading(false); return; }
    try {
      setError(null);
      const data = await fetchAgents();
      setAgents(data);
    } catch (err) {
      console.error('useAgents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  // 🔄 Realtime : recharger si changement sur 'agents'
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.table === 'agents') loadAgents();
    };
    window.addEventListener('supabase_realtime', handler);
    return () => window.removeEventListener('supabase_realtime', handler);
  }, [loadAgents]);

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
    reloadAgents: loadAgents,
  };
};
