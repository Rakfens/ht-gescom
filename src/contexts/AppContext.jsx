import { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { useLivraisons } from '../hooks/useLivraisons';
import { useAvances } from '../hooks/useAvances';
import { useToast } from '../hooks/useToast';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { session, loading: authLoading, login, logout } = useAuth();
  const { agents, loading: agentsLoading, addAgent, updateAgent, deleteAgent, reloadAgents } = useAgents();
  const { livraisons, loading: livraisonsLoading, addLivraison, updateLivraison, deleteLivraison, reloadLivraisons } = useLivraisons();
  const { avances, loading: avancesLoading, addAvance, annulerAvance, deleteAvance, reloadAvances } = useAvances();
  const { toast, showToast } = useToast();

  const loading = authLoading || agentsLoading || livraisonsLoading || avancesLoading;

  const value = useMemo(() => ({
    session, loading,
    agents, addAgent, updateAgent, deleteAgent, reloadAgents,
    livraisons, addLivraison, updateLivraison, deleteLivraison, reloadLivraisons,
    avances, addAvance, annulerAvance, deleteAvance, reloadAvances,
    toast, showToast,
    login, logout
  }), [session, loading, agents, livraisons, avances, toast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};