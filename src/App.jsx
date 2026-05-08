import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { COLORS, TODAY, COMMISSION_DEFAUT } from './utils/constants';
import { fetchAgents, addAgent, updateAgent, deleteAgent } from './services/agentService';
import { fetchLivraisons, addLivraison, updateLivraison, deleteLivraison } from './services/livraisonService';
import { fetchAvances, addAvance, annulerAvance, deleteAvance } from './services/avanceService';
import { fetchCommission, updateCommission, fetchLogo } from './services/configService';
import { fetchRecuperations, addRecuperation, updateRecuperation, deleteRecuperation, getRecuperationsByDate } from './services/recuperationService';
import { ThemeProvider } from './contexts/ThemeContext';

// Composants
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { BottomNav } from './components/Layout/BottomNav';
import { Login } from './components/Login';
import { Loader } from './components/Common/Loader';
import { Toast } from './components/Common/Toast';
import { Dashboard } from './components/Dashboard/Dashboard';
import { LivraisonForm } from './components/Livraison/LivraisonForm';
import { Historique } from './components/Historique/Historique';
import { Gerant } from './components/Gerant/Gerant';
import { Recap } from './components/Recap/Recap';
import { Agents } from './components/Agents/Agents';
import { Recuperation } from './components/Recuperation/Recuperation';

function AppContent() {
  // États d'authentification
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');

  // Données principales
  const [agents, setAgents] = useState([]);
  const [livraisons, setLivraisons] = useState([]);
  const [avances, setAvances] = useState([]);
  const [recuperations, setRecuperations] = useState([]);
  const [commissionGerant, setCommissionGerant] = useState(COMMISSION_DEFAUT);
  const [logoUrl, setLogoUrl] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Détection mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Chargement de l'authentification
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (listener && typeof listener.unsubscribe === 'function') {
        listener.unsubscribe();
      }
    };
  }, []);

  // Recharger les données quand la session change (connexion/déconnexion)
  useEffect(() => {
    if (session) {
      loadAllData();
    } else {
      setAgents([]);
      setLivraisons([]);
      setAvances([]);
      setRecuperations([]);
    }
  }, [session]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [agentsData, livraisonsData, avancesData, commissionData, logoData] = await Promise.all([
        fetchAgents(),
        fetchLivraisons(),
        fetchAvances(),
        fetchCommission(),
        fetchLogo()
      ]);
      setAgents(agentsData || []);
      setLivraisons(livraisonsData || []);
      setAvances(avancesData || []);
      setCommissionGerant(commissionData || COMMISSION_DEFAUT);
      setLogoUrl(logoData);
      
      // Charger les récupérations du jour
      const recupData = await getRecuperationsByDate(TODAY());
      setRecuperations(recupData || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showToast('Erreur de chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async () => {
    try {
      setLoginErr('');
      const { error } = await supabase.auth.signInWithPassword({ 
        email: loginEmail, 
        password: loginPass 
      });
      if (error) throw error;
    } catch (error) {
      setLoginErr(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const nav = (p) => {
    setPage(p);
    setMenuOpen(false);
  };

  // Gestion des agents
  const handleAddAgent = async (nom, salaire) => {
    try {
      const newAgent = await addAgent(nom, salaire);
      setAgents([...agents, newAgent]);
      showToast('Agent ajouté avec succès');
      return newAgent;
    } catch (error) {
      console.error('Erreur ajout agent:', error);
      showToast("Erreur lors de l'ajout de l'agent", 'error');
      throw error;
    }
  };

  const handleUpdateAgent = async (id, updates) => {
    try {
      await updateAgent(id, updates);
      setAgents(agents.map(a => a.id === id ? { ...a, ...updates } : a));
      showToast('Agent modifié avec succès');
    } catch (error) {
      console.error('Erreur modification agent:', error);
      showToast('Erreur lors de la modification', 'error');
      throw error;
    }
  };

  const handleDeleteAgent = async (id) => {
    try {
      await deleteAgent(id);
      setAgents(agents.filter(a => a.id !== id));
      showToast('Agent supprimé', 'warn');
    } catch (error) {
      console.error('Erreur suppression agent:', error);
      showToast('Impossible de supprimer cet agent', 'error');
      throw error;
    }
  };

  // Gestion des livraisons
  const handleAddLivraison = async (livraison) => {
    try {
      const newLiv = await addLivraison(livraison);
      setLivraisons([newLiv, ...livraisons]);
      showToast('Livraison enregistrée avec succès');
      return newLiv;
    } catch (error) {
      console.error('Erreur ajout livraison:', error);
      showToast('Erreur lors de l\'enregistrement', 'error');
      throw error;
    }
  };

  const handleUpdateLivraison = async (id, updates) => {
    try {
      await updateLivraison(id, updates);
      setLivraisons(livraisons.map(l => l.id === id ? { ...l, ...updates } : l));
      showToast('Livraison mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour livraison:', error);
      showToast('Erreur lors de la mise à jour', 'error');
      throw error;
    }
  };

  const handleDeleteLivraison = async (id) => {
    try {
      await deleteLivraison(id);
      setLivraisons(livraisons.filter(l => l.id !== id));
      showToast('Livraison supprimée', 'warn');
    } catch (error) {
      console.error('Erreur suppression livraison:', error);
      showToast('Erreur lors de la suppression', 'error');
      throw error;
    }
  };

  // Gestion des avances
  const handleAddAvance = async (avance) => {
    try {
      const newAvance = await addAvance(avance);
      setAvances([newAvance, ...avances]);
      showToast('Avance ajoutée avec succès');
      return newAvance;
    } catch (error) {
      console.error('Erreur ajout avance:', error);
      showToast('Erreur lors de l\'ajout de l\'avance', 'error');
      throw error;
    }
  };

  const handleAnnulerAvance = async (id) => {
    try {
      await annulerAvance(id);
      setAvances(avances.map(a => a.id === id ? { ...a, annule: true } : a));
      showToast('Avance annulée', 'warn');
    } catch (error) {
      console.error('Erreur annulation avance:', error);
      showToast('Erreur lors de l\'annulation', 'error');
      throw error;
    }
  };

  const handleDeleteAvance = async (id) => {
    try {
      await deleteAvance(id);
      setAvances(avances.filter(a => a.id !== id));
      showToast('Avance supprimée', 'warn');
    } catch (error) {
      console.error('Erreur suppression avance:', error);
      showToast('Erreur lors de la suppression', 'error');
      throw error;
    }
  };

  // Gestion commission gérant
  const handleUpdateCommission = async (newVal) => {
    try {
      await updateCommission(newVal);
      setCommissionGerant(newVal);
      showToast('Commission mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour commission:', error);
      showToast('Erreur lors de la mise à jour', 'error');
      throw error;
    }
  };

  // Gestion des récupérations
  const handleAddRecuperation = async (recup) => {
    try {
      const newRecup = await addRecuperation(recup);
      setRecuperations([newRecup, ...recuperations]);
      showToast('Récupération ajoutée');
      return newRecup;
    } catch (error) {
      console.error('Erreur ajout récupération:', error);
      showToast('Erreur lors de l\'ajout', 'error');
      throw error;
    }
  };

  const handleUpdateRecuperation = async (id, updates) => {
    try {
      await updateRecuperation(id, updates);
      setRecuperations(recuperations.map(r => r.id === id ? { ...r, ...updates } : r));
      showToast('Récupération modifiée');
    } catch (error) {
      console.error('Erreur modification récupération:', error);
      showToast('Erreur lors de la modification', 'error');
      throw error;
    }
  };

  const handleDeleteRecuperation = async (id) => {
    try {
      await deleteRecuperation(id);
      setRecuperations(recuperations.filter(r => r.id !== id));
      showToast('Récupération supprimée', 'warn');
    } catch (error) {
      console.error('Erreur suppression récupération:', error);
      showToast('Erreur lors de la suppression', 'error');
      throw error;
    }
  };

  const enCours = livraisons.filter(l => l.statut === 'en_cours').length;

  const suggestions = {
    clients: [...new Set(livraisons.map(l => l.client_donneur).filter(Boolean))],
    colisList: [...new Set(livraisons.map(l => l.colis).filter(Boolean))],
    lieux: [...new Set(livraisons.map(l => l.destinataire_lieu).filter(Boolean))]
  };

  if (loading) {
    return <Loader />;
  }

  if (!session) {
    return (
      <Login 
        logoUrl={logoUrl} 
        onLogin={handleLogin} 
        error={loginErr}
        email={loginEmail}
        setEmail={setLoginEmail}
        password={loginPass}
        setPassword={setLoginPass}
      />
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)', 
      fontFamily: "'Segoe UI', system-ui, sans-serif", 
      color: 'var(--text)'
    }}>
      <Header 
        logoUrl={logoUrl} 
        setLogoUrl={setLogoUrl} 
        onLogout={handleLogout} 
        onMenuToggle={() => setMenuOpen(!menuOpen)} 
        menuOpen={menuOpen} 
      />
      
      {menuOpen && !isMobile && (
        <div style={{ 
          position: 'fixed', 
          top: 57, 
          left: 0, 
          right: 0, 
          background: 'var(--card)', 
          borderBottom: '1px solid var(--border)', 
          zIndex: 99 
        }}>
          <Sidebar page={page} onNavigate={nav} enCours={enCours} />
        </div>
      )}

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>
        {!isMobile && <Sidebar page={page} onNavigate={nav} enCours={enCours} />}
        
        <main style={{ flex: 1, padding: '16px', overflowY: 'auto', paddingBottom: 90 }}>
          <Toast toast={toast} />
          
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            {page === 'dashboard' && (
              <Dashboard 
                agents={agents} 
                livraisons={livraisons} 
                commissionGerant={commissionGerant} 
                onNavigate={nav} 
              />
            )}
            
            {page === 'livraison' && (
              <LivraisonForm 
                agents={agents} 
                onAddLivraison={handleAddLivraison} 
                showToast={showToast} 
                suggestions={suggestions} 
              />
            )}
            
            {page === 'historique' && (
              <Historique 
                livraisons={livraisons} 
                agents={agents} 
                onUpdateLivraison={handleUpdateLivraison} 
                onDeleteLivraison={handleDeleteLivraison} 
                showToast={showToast}
                logoUrl={logoUrl}
              />
            )}
            
            {page === 'gerant' && (
              <Gerant 
                livraisons={livraisons} 
                commissionGerant={commissionGerant} 
                onUpdateCommission={handleUpdateCommission} 
                showToast={showToast} 
              />
            )}
            
            {page === 'recap' && (
              <Recap 
                livraisons={livraisons} 
                avances={avances} 
                agents={agents} 
                commissionGerant={commissionGerant}
                onAddAvance={handleAddAvance}
                onAnnulerAvance={handleAnnulerAvance}
                onDeleteAvance={handleDeleteAvance}
                showToast={showToast}
              />
            )}
            
            {page === 'agents' && (
              <Agents 
                agents={agents} 
                onAddAgent={handleAddAgent} 
                onUpdateAgent={handleUpdateAgent} 
                onDeleteAgent={handleDeleteAgent} 
                showToast={showToast} 
              />
            )}

            {page === 'recuperation' && (
              <Recuperation 
                agents={agents} 
                showToast={showToast}
                onAddRecuperation={handleAddRecuperation}
                onUpdateRecuperation={handleUpdateRecuperation}
                onDeleteRecuperation={handleDeleteRecuperation}
                recuperations={recuperations}
                setRecuperations={setRecuperations}
              />
            )}
          </div>
        </main>
      </div>

      <BottomNav page={page} onNavigate={nav} enCours={enCours} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}