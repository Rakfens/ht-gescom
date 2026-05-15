// App.jsx
console.log('🔴 1. App.jsx chargé');
import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';
console.log('🔴 2. supabase importé:', !!supabase);
import { ThemeProvider } from './modules/shared/context/ThemeContext';
import { CompanyProvider, useCompany } from './modules/shared/context/CompanyContext';
import { AppProvider, useApp } from './modules/shared/context/AppContext';
import { ToastContainer } from './modules/shared/components/common/Toast';
import { Loader } from './modules/shared/components/common/Loader';
import { Login } from './modules/shared/components/Auth/Login';

// Layout
import { Header } from './modules/shared/components/Layout/Header';
import { Sidebar } from './modules/shared/components/Layout/Sidebar';
import { BottomNav } from './modules/shared/components/Layout/BottomNav';

// Modules Aterinay (Service)
import { Dashboard as ServiceDashboard } from './modules/livraison/pages/Dashboard';
import { LivraisonForm } from './modules/livraison/components/LivraisonForm';
import { Historique } from './modules/livraison/pages/Historique';
import { Gerant } from './modules/livraison/pages/Gerant';
import { Recap } from './modules/livraison/pages/Recap';
import { Agents } from './modules/livraison/pages/Agents';
import { Recuperation } from './modules/livraison/pages/Recuperation';
import Depenses from './modules/commerce/pages/Depenses';  // ← AJOUTÉ

// Modules Commerce (Pomanay & Zazatiana)
import CommerceDashboard from './modules/commerce/pages/Dashboard';
import Ventes from './modules/commerce/pages/Ventes';
import Achats from './modules/commerce/pages/Achats';
import Stock from './modules/commerce/pages/Stock';
import Inventaire from './modules/commerce/pages/Inventaire';
import Rapports from './modules/commerce/pages/Rapports';

function AppContent() {
  console.log('🔴 3. AppContent rendu');
  const {
    session,
    loading: authLoading,
    login,
    logout,
    agents,
    livraisons,
    avances,
    recuperations,
    addAgent,
    updateAgent,
    deleteAgent,
    addLivraison,
    updateLivraison,
    deleteLivraison,
    addAvance,
    annulerAvance,
    deleteAvance,
    addRecuperation,
    updateRecuperation,
    deleteRecuperation,
    toasts,
    hideToast,
    success,
    error
  } = useApp();

  const { currentCompany, companies, loading: companyLoading } = useCompany();

  const [page, setPage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [logoUrl, setLogoUrl] = useState(null);

  // Détection mobile
  useEffect(() => {
    const testSupabase = async () => {
    console.log('🔍 Variables d\'environnement:');
    console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Key existe:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    
    // Test connexion Supabase
    const { data, error } = await supabase.from('companies').select('*');
    console.log('📊 Sociétés:', data);
    console.log('📊 Erreur:', error);
    };
  
    testSupabase();

    console.log('🟢 1. AppContent monté');
    console.log('🟢 2. authLoading:', authLoading);
    console.log('🟢 3. companyLoading:', companyLoading);
    console.log('🟢 4. session:', session);
    console.log('🟢 5. companies:', companies);
    console.log('🟢 6. currentCompany:', currentCompany);
    const checkEnv = async () => {
    console.log('🔍 Variables d\'environnement:');
    console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Key existe:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    
    // Tester directement Supabase
    const { data, error } = await supabase.from('companies').select('*');
    console.log('Sociétés:', data);
    console.log('Erreur:', error);
    };
    checkEnv();
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [authLoading, companyLoading, session, companies, currentCompany]);

  const nav = (p) => {
    setPage(p);
    setMenuOpen(false);
  };

  const enCours = livraisons?.filter(l => l.statut === 'en_cours').length || 0;

  const suggestions = {
    clients: [...new Set(livraisons?.map(l => l.client_donneur).filter(Boolean) || [])],
    colisList: [...new Set(livraisons?.map(l => l.colis).filter(Boolean) || [])],
    lieux: [...new Set(livraisons?.map(l => l.destinataire_lieu).filter(Boolean) || [])]
  };

  if (authLoading || companyLoading) {
    return <Loader />;
  }

  if (!session) {
    return <Login />;
  }

  // Si des sociétés existent mais aucune n'est sélectionnée - AFFICHER LE SÉLECTEUR
  if (companies.length > 0 && !currentCompany) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center', padding: 20, maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
          <h2 style={{ marginBottom: 20 }}>Sélectionnez une société</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => {
                  localStorage.setItem('currentCompany', JSON.stringify(company));
                  window.location.reload();
                }}
                style={{
                  padding: '14px 24px',
                  fontSize: 16,
                  background: '#1e3a5f',
                  border: 'none',
                  borderRadius: 10,
                  color: '#60a5fa',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2d4a6e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1e3a5f';
                }}
              >
                {company.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Si aucune société
  if (companies.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2>Aucune société trouvée</h2>
          <p style={{ marginTop: 8, color: 'var(--muted)' }}>
            Veuillez contacter l'administrateur
          </p>
        </div>
      </div>
    );
  }

  // Rendu selon le type de société
  const renderContent = () => {
    // Aterinay Service (type: service)
    if (currentCompany.type === 'service') {
      switch (page) {
        case 'dashboard':
          return (
            <ServiceDashboard 
              agents={agents} 
              livraisons={livraisons} 
              commissionGerant={500}
              onNavigate={nav} 
            />
          );
        case 'livraison':
          return (
            <LivraisonForm 
              agents={agents} 
              onAddLivraison={addLivraison} 
              showToast={success} 
              suggestions={suggestions} 
            />
          );
        case 'historique':
          return (
            <Historique 
              livraisons={livraisons} 
              agents={agents} 
              onUpdateLivraison={updateLivraison} 
              onDeleteLivraison={deleteLivraison} 
              showToast={success}
              logoUrl={logoUrl}
            />
          );
        case 'gerant':
          return (
            <Gerant 
              livraisons={livraisons} 
              commissionGerant={500}
              onUpdateCommission={async (val) => {
                success('Commission mise à jour');
              }} 
              showToast={success} 
            />
          );
        case 'recap':
          return (
            <Recap 
              livraisons={livraisons} 
              avances={avances} 
              agents={agents} 
              commissionGerant={500}
              onAddAvance={addAvance}
              onAnnulerAvance={annulerAvance}
              onDeleteAvance={deleteAvance}
              showToast={success}
            />
          );
        case 'agents':
          return (
            <Agents 
              agents={agents} 
              onAddAgent={addAgent} 
              onUpdateAgent={updateAgent} 
              onDeleteAgent={deleteAgent} 
              showToast={success} 
            />
          );
        case 'recuperation':
          return (
            <Recuperation 
              agents={agents} 
              showToast={success}
              onAddRecuperation={addRecuperation}
              onUpdateRecuperation={updateRecuperation}
              onDeleteRecuperation={deleteRecuperation}
              recuperations={recuperations}
              setRecuperations={() => {}}
            />
          );
        case 'depenses':  // ← AJOUTÉ pour Aterinay Service
          return <Depenses />;
        default:
          return <ServiceDashboard agents={agents} livraisons={livraisons} onNavigate={nav} />;
      }
    }

    // Pomanay ou Zazatiana (type: commerce)
    switch (page) {
      case 'dashboard':
        return <CommerceDashboard />;
      case 'ventes':
        return <Ventes />;
      case 'achats':
        return <Achats />;
      case 'stock':
        return <Stock />;
      case 'inventaire':
        return <Inventaire />;
      case 'depenses':
        // Les dépenses sont uniquement pour Pomanay
        if (currentCompany.slug === 'pomanay') {
          return <Depenses />;
        }
        return <CommerceDashboard />;
      case 'rapports':
        return <Rapports />;
      default:
        return <CommerceDashboard />;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)', 
      fontFamily: "'Segoe UI', system-ui, sans-serif", 
      color: 'var(--text)'
    }}>
      <ToastContainer toasts={toasts} onClose={hideToast} />
      
      <Header 
        logoUrl={logoUrl} 
        setLogoUrl={setLogoUrl} 
        onLogout={logout} 
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
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {renderContent()}
          </div>
        </main>
      </div>

      {isMobile && <BottomNav page={page} onNavigate={nav} enCours={enCours} currentCompany={currentCompany} />}
    </div>
  );
}

// Composant principal avec tous les providers
export default function App() {
  return (
    <ThemeProvider>
      <CompanyProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </CompanyProvider>
    </ThemeProvider>
  );
}