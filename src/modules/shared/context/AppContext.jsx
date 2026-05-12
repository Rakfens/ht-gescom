// modules/shared/context/AppContext.jsx
import { createContext, useContext, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { useLivraisons } from '../hooks/useLivraisons';
import { useAvances } from '../hooks/useAvances';
import { useRecuperations } from '../hooks/useRecuperations';
import { useToast } from '../hooks/useToast';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { session, loading: authLoading, login, logout, currentCompany, companies, switchCompany } = useAuth();
  
  // Utilisation du nouveau hook multi-toasts
  const { toasts, showToast, hideToast, clearAll, success, error, warn, info } = useToast();
  
  // Ces hooks dépendent de currentCompany pour filtrer les données
  const { 
    agents, loading: agentsLoading, addAgent, updateAgent, deleteAgent, reloadAgents 
  } = useAgents(currentCompany?.id);
  
  const { 
    livraisons, loading: livraisonsLoading, addLivraison, updateLivraison, deleteLivraison, reloadLivraisons 
  } = useLivraisons(currentCompany?.id);
  
  const { 
    avances, loading: avancesLoading, addAvance, annulerAvance, deleteAvance, reloadAvances 
  } = useAvances(currentCompany?.id);
  
  const { 
    recuperations, loading: recuperationsLoading, addRecuperation, updateRecuperation, deleteRecuperation, reloadRecuperations 
  } = useRecuperations(currentCompany?.id);

  // Recharger les données quand la société change
  useEffect(() => {
    if (currentCompany?.id) {
      reloadAgents();
      reloadLivraisons();
      reloadAvances();
      reloadRecuperations();
    }
  }, [currentCompany?.id]);

  const loading = authLoading || agentsLoading || livraisonsLoading || avancesLoading || recuperationsLoading;

  const value = useMemo(() => ({
    // Auth
    session, loading, login, logout,
    currentCompany, companies, switchCompany,
    
    // Agents
    agents, addAgent, updateAgent, deleteAgent, reloadAgents,
    
    // Livraisons
    livraisons, addLivraison, updateLivraison, deleteLivraison, reloadLivraisons,
    
    // Avances
    avances, addAvance, annulerAvance, deleteAvance, reloadAvances,
    
    // Récupérations
    recuperations, addRecuperation, updateRecuperation, deleteRecuperation, reloadRecuperations,
    
    // UI - Multi-toasts
    toasts, showToast, hideToast, clearAll,
    success, error, warn, info  // Méthodes utilitaires pratiques
  }), [
    session, loading, login, logout,
    currentCompany, companies, switchCompany,
    agents, addAgent, updateAgent, deleteAgent, reloadAgents,
    livraisons, addLivraison, updateLivraison, deleteLivraison, reloadLivraisons,
    avances, addAvance, annulerAvance, deleteAvance, reloadAvances,
    recuperations, addRecuperation, updateRecuperation, deleteRecuperation, reloadRecuperations,
    toasts, showToast, hideToast, clearAll, success, error, warn, info
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};