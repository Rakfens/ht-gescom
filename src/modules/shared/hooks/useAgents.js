// modules/shared/hooks/useAgents.js (version cohérente)
import { useState, useEffect, useCallback } from 'react';
import { fetchAgents, addAgent, updateAgent, deleteAgent } from '../../livraison/services/agentService';
import { useCompany } from '../context/CompanyContext';

export const useAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentCompany } = useCompany();

  const loadAgents = useCallback(async () => {
    if (!currentCompany?.id) {
      setAgents([]);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const data = await fetchAgents();
      setAgents(data);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  const handleAddAgent = async (nom, salaire) => {
    try {
      setError(null);
      const newAgent = await addAgent(nom, salaire);
      setAgents(prev => [...prev, newAgent]);
      return newAgent;
    } catch (error) {
      console.error('Erreur ajout agent:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleUpdateAgent = async (id, updates) => {
    try {
      setError(null);
      await updateAgent(id, updates);
      setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (error) {
      console.error('Erreur modification agent:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleDeleteAgent = async (id) => {
    try {
      setError(null);
      await deleteAgent(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Erreur suppression agent:', error);
      setError(error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  return { 
    agents, 
    loading, 
    error,
    addAgent: handleAddAgent, 
    updateAgent: handleUpdateAgent, 
    deleteAgent: handleDeleteAgent, 
    reloadAgents: loadAgents 
  };
};