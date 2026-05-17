// AppContext.jsx — v5 : loading découplé (auth séparé de company/data)
import { createContext, useContext, useMemo } from 'react';
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

  const { agents,       loading: agentsLoading,       addAgent,       updateAgent,       deleteAgent,       reloadAgents       } = useAgents();
  const { livraisons,   loading: livraisonsLoading,   addLivraison,   updateLivraison,   deleteLivraison,   reloadLivraisons   } = useLivraisons();
  const { avances,      loading: avancesLoading,      addAvance,      annulerAvance,     deleteAvance,      reloadAvances      } = useAvances();
  const { recuperations,loading: recuperationsLoading,addRecuperation,updateRecuperation,deleteRecuperation,reloadRecuperations} = useRecuperations();

  // ⚠️ IMPORTANT : authLoading est SÉPARÉ de dataLoading
  // App.jsx décide quand afficher Login vs Loader vs contenu
  const dataLoading = companyLoading || agentsLoading || livraisonsLoading || avancesLoading || recuperationsLoading;

  const value = useMemo(() => ({
    // Auth
    session, authLoading, dataLoading, login, logout,
    // Company
    currentCompany, companies, switchCompany,
    // Données
    agents,       addAgent,       updateAgent,       deleteAgent,       reloadAgents,
    livraisons,   addLivraison,   updateLivraison,   deleteLivraison,   reloadLivraisons,
    avances,      addAvance,      annulerAvance,     deleteAvance,      reloadAvances,
    recuperations,addRecuperation,updateRecuperation,deleteRecuperation,reloadRecuperations,
    // Toast
    toasts, showToast, hideToast, clearAll, success, error, warn, info,
  }), [
    session, authLoading, dataLoading, login, logout,
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
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
