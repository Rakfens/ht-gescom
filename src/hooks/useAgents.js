import { useState, useEffect } from 'react';
import { fetchAgents, addAgent, updateAgent, deleteAgent } from '../services/agentService';

export const useAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAgents = async () => {
    try {
      const data = await fetchAgents();
      setAgents(data);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (nom, salaire) => {
    const newAgent = await addAgent(nom, salaire);
    setAgents([...agents, newAgent]);
    return newAgent;
  };

  const handleUpdateAgent = async (id, updates) => {
    await updateAgent(id, updates);
    setAgents(agents.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteAgent = async (id) => {
    await deleteAgent(id);
    setAgents(agents.filter(a => a.id !== id));
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return { agents, loading, addAgent: handleAddAgent, updateAgent: handleUpdateAgent, deleteAgent: handleDeleteAgent, reloadAgents: loadAgents };
};