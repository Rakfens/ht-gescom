// modules/shared/components/Layout/Layout.jsx
import { useCompany } from '../../context/CompanyContext';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout = ({ children, page, onNavigate, enCours }) => {
  const { currentCompany } = useCompany();
  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      <Header />
      
      <div style={{ display: 'flex' }}>
        {!isMobile && <Sidebar currentCompany={currentCompany} page={page} onNavigate={onNavigate} />}
        
        <main style={{ 
          flex: 1, 
          padding: '20px', 
          marginBottom: isMobile ? 70 : 0,
          marginLeft: !isMobile ? '260px' : 0
        }}>
          {children}
        </main>
      </div>
      
      {isMobile && (
        <BottomNav 
          page={page} 
          onNavigate={onNavigate} 
          enCours={enCours}
          currentCompany={currentCompany}
        />
      )}
    </div>
  );
};