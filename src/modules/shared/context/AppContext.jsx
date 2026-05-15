// AppContext.jsx - VERSION OPTIMISÉE
import { createContext, useContext, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { useLivraisons } from '../hooks/useLivraisons';
import { useAvances } from '../hooks/useAvances';
import { useRecuperations } from '../hooks/useRecuperations';
import { useToast } from '../hooks/useToast';
import { useCompany } from './CompanyContext';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { session, loading: authLoading, login, logout } = useAuth();
  const { currentCompany, companies, loading: companyLoading, switchCompany } = useCompany();
  const { toasts, showToast, hideToast, clearAll, success, error, warn, info } = useToast();

  const { agents, loading: agentsLoading, addAgent, updateAgent, deleteAgent, reloadAgents } = useAgents();
  const { livraisons, loading: livraisonsLoading, addLivraison, updateLivraison, deleteLivraison, reloadLivraisons } = useLivraisons();
  const { avances, loading: avancesLoading, addAvance, annulerAvance, deleteAvance, reloadAvances } = useAvances();
  const { recuperations, loading: recuperationsLoading, addRecuperation, updateRecuperation, deleteRecuperation, reloadRecuperations } = useRecuperations();

  const loading = authLoading || companyLoading || agentsLoading || livraisonsLoading || avancesLoading || recuperationsLoading;

  const value = useMemo(() => ({
    session, loading, login, logout,
    currentCompany, companies, switchCompany,
    agents, addAgent, updateAgent, deleteAgent, reloadAgents,
    livraisons, addLivraison, updateLivraison, deleteLivraison, reloadLivraisons,
    avances, addAvance, annulerAvance, deleteAvance, reloadAvances,
    recuperations, addRecuperation, updateRecuperation, deleteRecuperation, reloadRecuperations,
    toasts, showToast, hideToast, clearAll, success, error, warn, info,
  }), [
    session, loading, login, logout,
    currentCompany, companies, switchCompany,
    agents, addAgent, updateAgent, deleteAgent, reloadAgents,
    livraisons, addLivraison, updateLivraison, deleteLivraison, reloadLivraisons,
    avances, addAvance, annulerAvance, deleteAvance, reloadAvances,
    recuperations, addRecuperation, updateRecuperation, deleteRecuperation, reloadRecuperations,
    toasts, showToast, hideToast, clearAll, success, error, warn, info,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
