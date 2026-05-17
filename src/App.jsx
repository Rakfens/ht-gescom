// App.jsx — v6 : loading découplé, jamais bloqué
import { useState, useEffect } from 'react';
import { ThemeProvider }                        from './modules/shared/context/ThemeContext';
import { CompanyProvider, useCompany }          from './modules/shared/context/CompanyContext';
import { AppProvider, useApp }                  from './modules/shared/context/AppContext';
import { ToastContainer }                       from './modules/shared/components/common/Toast';
import { Loader }                               from './modules/shared/components/common/Loader';
import { Login }                                from './modules/shared/components/Auth/Login';
import { Header }                               from './modules/shared/components/Layout/Header';
import { Sidebar }                              from './modules/shared/components/Layout/Sidebar';
import { BottomNav }                            from './modules/shared/components/Layout/BottomNav';

// Modules livraison
import { Dashboard as ServiceDashboard }        from './modules/livraison/pages/Dashboard';
import { LivraisonForm }                        from './modules/livraison/components/LivraisonForm';
import { Historique }                           from './modules/livraison/pages/Historique';
import { Gerant }                               from './modules/livraison/pages/Gerant';
import { Recap }                                from './modules/livraison/pages/Recap';
import { Agents }                               from './modules/livraison/pages/Agents';
import { Recuperation }                         from './modules/livraison/pages/Recuperation';
import Depenses                                 from './modules/commerce/pages/Depenses';

// Modules commerce
import CommerceDashboard                        from './modules/commerce/pages/Dashboard';
import Ventes                                   from './modules/commerce/pages/Ventes';
import Achats                                   from './modules/commerce/pages/Achats';
import Stock                                    from './modules/commerce/pages/Stock';
import Inventaire                               from './modules/commerce/pages/Inventaire';
import Rapports                                 from './modules/commerce/pages/Rapports';

// ─── Contenu principal ────────────────────────────────────────────────
function AppContent() {
  const {
    session, authLoading, dataLoading, logout,
    agents, livraisons, avances, recuperations,
    addAgent, updateAgent, deleteAgent,
    addLivraison, updateLivraison, deleteLivraison,
    addAvance, annulerAvance, deleteAvance,
    addRecuperation, updateRecuperation, deleteRecuperation,
    toasts, hideToast, success,
  } = useApp();

  const { currentCompany, companies, loading: companyLoading } = useCompany();

  const [page,     setPage]     = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [logoUrl,  setLogoUrl]  = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const nav      = (p) => { setPage(p); setMenuOpen(false); };
  const enCours  = livraisons?.filter(l => l.statut === 'en_cours').length || 0;
  const suggestions = {
    clients:   [...new Set(livraisons?.map(l => l.client_donneur).filter(Boolean) || [])],
    colisList: [...new Set(livraisons?.map(l => l.colis).filter(Boolean) || [])],
    lieux:     [...new Set(livraisons?.map(l => l.destinataire_lieu).filter(Boolean) || [])],
  };

  // ── ÉTAPE 1 : Auth en cours → loader court (max 6s) ─────────────────
  if (authLoading) {
    return <Loader message="Démarrage..." />;
  }

  // ── ÉTAPE 2 : Pas de session → Login (immédiat) ──────────────────────
  if (!session) {
    return <Login />;
  }

  // ── ÉTAPE 3 : Session OK, chargement société (max 8s) ───────────────
  if (companyLoading) {
    return <Loader message="Chargement des données..." />;
  }

  // ── ÉTAPE 4 : Aucune société assignée ───────────────────────────────
  if (!currentCompany && companies.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48 }}>🏢</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>Aucune société assignée</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>Contactez votre administrateur.</div>
        <button onClick={logout} style={{ marginTop: 8, padding: '11px 22px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          Déconnexion
        </button>
      </div>
    );
  }

  // ── ÉTAPE 5 : Rendu des pages ─────────────────────────────────────────
  const renderContent = () => {
    if (currentCompany?.type === 'service') {
      switch (page) {
        case 'dashboard':    return <ServiceDashboard agents={agents} livraisons={livraisons} commissionGerant={500} onNavigate={nav} />;
        case 'livraison':    return <LivraisonForm agents={agents} onAddLivraison={addLivraison} showToast={success} suggestions={suggestions} />;
        case 'historique':   return <Historique livraisons={livraisons} agents={agents} onUpdateLivraison={updateLivraison} onDeleteLivraison={deleteLivraison} showToast={success} logoUrl={logoUrl} />;
        case 'gerant':       return <Gerant livraisons={livraisons} commissionGerant={500} onUpdateCommission={async () => success('Commission mise à jour')} showToast={success} />;
        case 'recap':        return <Recap livraisons={livraisons} avances={avances} agents={agents} commissionGerant={500} onAddAvance={addAvance} onAnnulerAvance={annulerAvance} onDeleteAvance={deleteAvance} showToast={success} />;
        case 'agents':       return <Agents agents={agents} onAddAgent={addAgent} onUpdateAgent={updateAgent} onDeleteAgent={deleteAgent} showToast={success} />;
        case 'recuperation': return <Recuperation agents={agents} showToast={success} onAddRecuperation={addRecuperation} onUpdateRecuperation={updateRecuperation} onDeleteRecuperation={deleteRecuperation} recuperations={recuperations} setRecuperations={() => {}} />;
        case 'depenses':     return <Depenses />;
        default:             return <ServiceDashboard agents={agents} livraisons={livraisons} onNavigate={nav} />;
      }
    }
    switch (page) {
      case 'dashboard':  return <CommerceDashboard />;
      case 'ventes':     return <Ventes />;
      case 'achats':     return <Achats />;
      case 'stock':      return <Stock />;
      case 'inventaire': return <Inventaire />;
      case 'depenses':   return <Depenses />;
      case 'rapports':   return <Rapports />;
      default:           return <CommerceDashboard />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)' }}>
      <ToastContainer toasts={toasts} onClose={hideToast} />

      <Header logoUrl={logoUrl} setLogoUrl={setLogoUrl} onLogout={logout} onMenuToggle={() => setMenuOpen(!menuOpen)} menuOpen={menuOpen} />

      {menuOpen && !isMobile && (
        <div style={{ position: 'fixed', top: 'var(--header-h)', left: 0, right: 0, background: 'var(--card)', borderBottom: '1px solid var(--border)', zIndex: 99 }}>
          <Sidebar page={page} onNavigate={nav} enCours={enCours} />
        </div>
      )}

      <div style={{ display: 'flex', minHeight: `calc(100vh - var(--header-h))` }}>
        {!isMobile && <Sidebar page={page} onNavigate={nav} enCours={enCours} />}
        <main
          className={isMobile ? 'mobile-main' : ''}
          style={!isMobile ? { flex: 1, padding: 16, overflowY: 'auto', paddingBottom: 32 } : {}}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {renderContent()}
          </div>
        </main>
      </div>

      {isMobile && <BottomNav page={page} onNavigate={nav} enCours={enCours} currentCompany={currentCompany} />}
    </div>
  );
}

// ─── Racine ───────────────────────────────────────────────────────────
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
